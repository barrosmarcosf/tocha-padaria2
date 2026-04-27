const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const QRCode = require('qrcode');
const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
const { getUnifiedAvailableStock } = require('../services/stockService');
const { getUnifiedStoreStatus } = require('../services/storeStatusService');

module.exports = function (supabase) {
    
    // Configuração do Mercado Pago
    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        options: { timeout: 5000 }
    });
    const payment = new Payment(client);

    // 1. CRIAR PAGAMENTO PIX
    router.post('/create-pix-payment', async (req, res) => {
        try {
            const { customer, cart, totalAmount } = req.body;

            if (!customer || !cart || cart.length === 0) {
                return res.status(400).json({ error: 'Dados incompletos.' });
            }

            // Validar status da loja e estoque (mesma lógica do Stripe)
            const storeStatusResult = await getUnifiedStoreStatus(supabase);
            if (!storeStatusResult.isOpen && !storeStatusResult.allowNextBatch) {
                return res.status(403).json({ error: storeStatusResult.message || 'Loja fechada.' });
            }

            const batchDate = storeStatusResult.batchDate || storeStatusResult.nextBatchDate;
            if (batchDate) {
                for (const item of cart) {
                    const available = await getUnifiedAvailableStock(supabase, item.id);
                    if (available < item.qty) {
                        return res.status(400).json({ error: `Estoque insuficiente para ${item.name}.` });
                    }
                }
            }

            // Registrar/Atualizar Cliente
            let customerId;
            const { data: existingCustomer } = await supabase.from('clientes').select('id').eq('email', customer.email).maybeSingle();
            if (existingCustomer) {
                customerId = existingCustomer.id;
                await supabase.from('clientes').update({ name: customer.name, whatsapp: customer.whatsapp }).eq('id', customerId);
            } else {
                const { data: newCustomer } = await supabase.from('clientes').insert([{ name: customer.name, email: customer.email, whatsapp: customer.whatsapp }]).select().single();
                customerId = newCustomer.id;
            }

            // Criar Pagamento no Mercado Pago
            const paymentData = {
                body: {
                    transaction_amount: Number(totalAmount),
                    description: 'Pedido Tocha Padaria',
                    payment_method_id: 'pix',
                    payer: {
                        email: customer.email,
                        first_name: customer.name.split(' ')[0],
                        last_name: customer.name.split(' ').slice(1).join(' ') || 'Cliente',
                    },
                    notification_url: `${process.env.BASE_URL || req.headers.origin}/webhook/mercadopago`
                }
            };

            const mpResponse = await payment.create(paymentData);
            const mpId = String(mpResponse.id);
            const qrCode = mpResponse.point_of_interaction.transaction_data.qr_code;
            const qrCodeBase64 = await QRCode.toDataURL(qrCode);

            // Registrar Pedido Pendente no Banco
            // Usamos stripe_session_id para guardar o ID do MP para manter compatibilidade com o esquema atual
            const { data: newOrder, error: orderError } = await supabase.from('pedidos').insert([{
                customer_id: customerId,
                stripe_session_id: `mp_${mpId}`, // Prefixo para identificar que é Mercado Pago
                total_amount: totalAmount,
                status: 'pending',
                items: JSON.stringify({ 
                    actual_items: cart, 
                    order_type: storeStatusResult.orderType, 
                    batch_date: batchDate,
                    payment_method: 'Pix (Mercado Pago)',
                    mp_id: mpId
                })
            }]).select().single();

            if (orderError) throw orderError;

            res.json({
                payment_id: mpId,
                qr_code: qrCode,
                qr_code_base64: qrCodeBase64,
                order_id: newOrder.id
            });

        } catch (error) {
            console.error('Erro ao criar Pix:', error);
            res.status(500).json({ error: 'Erro ao gerar pagamento Pix.' });
        }
    });

    // 2. VERIFICAR STATUS DO PAGAMENTO (Polling)
    router.get('/check-payment/:id', async (req, res) => {
        try {
            const mpId = req.params.id;
            const mpStatus = await payment.get({ id: mpId });
            
            // Mapeamento de status: approved, pending, cancelled
            let status = 'pending';
            if (mpStatus.status === 'approved') status = 'approved';
            if (['cancelled', 'rejected'].includes(mpStatus.status)) status = 'cancelled';

            // Se aprovado via polling, já processamos o pedido (redundância ao webhook)
            if (status === 'approved') {
                await processPaidMPOrder(supabase, mpId, mpStatus);
            }

            res.json({ status });
        } catch (error) {
            console.error('Erro ao checar Pix:', error);
            res.status(500).json({ error: 'Erro ao verificar status.' });
        }
    });

    // 3. WEBHOOK MERCADO PAGO
    router.post('/webhook/mercadopago', async (req, res) => {
        try {
            const { action, data } = req.body;
            
            console.log(`[MP Webhook] Action: ${action}`, data);

            if (action === 'payment.updated' || req.query.type === 'payment') {
                const mpId = data?.id || req.query['data.id'];
                if (mpId) {
                    const mpStatus = await payment.get({ id: mpId });
                    if (mpStatus.status === 'approved') {
                        await processPaidMPOrder(supabase, mpId, mpStatus);
                    }
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Erro no Webhook MP:', error);
            res.status(500).send('Error');
        }
    });

    return router;
};

// Lógica de processamento de pedido pago (MP)
async function processPaidMPOrder(supabase, mpId, mpStatus) {
    const externalId = `mp_${mpId}`;
    
    // Idempotência
    const { data: order, error: checkErr } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .eq('stripe_session_id', externalId)
        .maybeSingle();

    if (!order || order.status !== 'pending') return;

    console.log(`✅ [MP] Processando pagamento aprovado: ${mpId}`);

    // Atualizar para Pago
    await supabase.from('pedidos').update({ status: 'paid' }).eq('id', order.id);

    // Notificações e Estoque (Lógica similar ao checkout.js)
    const itemsData = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const cart = itemsData.actual_items || [];
    const batchDate = itemsData.batch_date;

    // Reduzir estoque
    if (batchDate) {
        for (const item of cart) {
            await supabase.rpc('processar_venda_estoque', { 
                p_id: String(item.id), 
                f_date: String(batchDate),
                amount: parseInt(item.qty) 
            });
        }
    }

    // Enviar Mensagens
    const notificationCustomer = {
        ...order.clientes,
        name: order.clientes.name || 'Cliente',
        whatsapp: order.clientes.whatsapp,
        email: order.clientes.email
    };

    await Promise.allSettled([
        sendOrderEmails(supabase, order, notificationCustomer, 'Pix (Mercado Pago)'),
        sendOrderWhatsApp(supabase, order, notificationCustomer, 'Pix (Mercado Pago)')
    ]);
}
