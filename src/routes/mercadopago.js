const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const QRCode = require('qrcode');
const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
const { getUnifiedAvailableStock } = require('../services/stockService');
const { getUnifiedStoreStatus } = require('../services/storeStatusService');

module.exports = function (supabase) {

    // Configuração do Mercado Pago
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
        console.error("❌ [Mercado Pago] ERRO: MERCADOPAGO_ACCESS_TOKEN não encontrado nas variáveis de ambiente!");
    } else {
        console.log("✅ [Mercado Pago] Token configurado:", token.substring(0, 10) + "...");
    }

    const client = new MercadoPagoConfig({
        accessToken: token,
        options: { timeout: 5000 }
    });
    const payment = new Payment(client);

    // 1. CRIAR PAGAMENTO PIX
    router.post('/create-pix-payment', async (req, res) => {
        try {
            if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
                return res.status(503).json({ error: 'Integração Mercado Pago não configurada.' });
            }

            const { customer, cart } = req.body;

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
                    console.log(`📦 [StockCheck-MP] Produto: ${item.id}, Solicitado: ${item.qty}, Disponível: ${available}`);
                    if (available < item.qty) {
                        return res.status(400).json({ error: `Estoque insuficiente para ${item.name}.` });
                    }
                }
            }

            // Recalcular total no backend — nunca confiar no valor do frontend
            const totalAmount = await recalcularTotal(supabase, cart);
            console.log(`💰 [PIX] Total recalculado no backend: R$ ${totalAmount}`);

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
            const baseUrl = process.env.BASE_URL || "";
            const isHttps = baseUrl.startsWith('https://');

            const paymentData = {
                body: {
                    transaction_amount: totalAmount,
                    description: 'Pedido Tocha Padaria',
                    payment_method_id: 'pix',
                    payer: {
                        email: customer.email,
                        first_name: customer.name.split(' ')[0],
                        last_name: customer.name.split(' ').slice(1).join(' ') || 'Cliente',
                    },
                    notification_url: isHttps ? `${baseUrl}/api/mercadopago/webhook` : undefined
                }
            };

            console.log("💳 [Pix] Criando pagamento no MP:", paymentData.body.transaction_amount);

            const mpResponse = await payment.create(paymentData);
            const mpId = String(mpResponse.id);
            const qrCode = mpResponse.point_of_interaction.transaction_data.qr_code;
            const qrCodeBase64 = await QRCode.toDataURL(qrCode);

            // Registrar Pedido Pendente no Banco
            const { data: newOrder, error: orderError } = await supabase.from('pedidos').insert([{
                customer_id: customerId,
                stripe_session_id: `mp_${mpId}`,
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

    // 2. VERIFICAR STATUS DO PAGAMENTO (Polling — fallback para ambientes sem webhook)
    router.get('/check-payment/:id', async (req, res) => {
        try {
            const mpId = req.params.id;
            const mpStatus = await payment.get({ id: mpId });

            let status = 'pending';
            if (mpStatus.status === 'approved') status = 'approved';
            if (['cancelled', 'rejected'].includes(mpStatus.status)) status = 'cancelled';

            // Idempotência garante que processPaidMPOrder não execute duas vezes
            if (status === 'approved') {
                await processPaidMPOrder(supabase, mpId, mpStatus);
            }

            res.json({ status });
        } catch (error) {
            console.error('Erro ao checar Pix:', error);
            res.status(500).json({ error: 'Erro ao verificar status.' });
        }
    });

    // 3. CHAVE PÚBLICA (para o Bricks no frontend)
    router.get('/mercadopago/public-key', (_req, res) => {
        const pubKey = process.env.MERCADOPAGO_PUBLIC_KEY;
        if (!pubKey) return res.status(503).json({ error: 'Chave pública MP não configurada. Adicione MERCADOPAGO_PUBLIC_KEY no .env' });
        res.json({ publicKey: pubKey });
    });

    // 4. CHECKOUT TRANSPARENTE — CARTÃO (Bricks)
    // Cria pagamento e pedido pendente. Confirmação acontece SOMENTE via webhook.
    router.post('/mercadopago/create-card-payment', async (req, res) => {
        try {
            if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
                return res.status(503).json({ error: 'Integração Mercado Pago não configurada.' });
            }

            const { customer, cart: cartItems, token: cardToken, issuer_id, payment_method_id, installments } = req.body;

            if (!customer?.email || !cartItems?.length || !cardToken) {
                return res.status(400).json({ error: 'Dados incompletos.' });
            }

            const storeStatusResult = await getUnifiedStoreStatus(supabase);
            if (!storeStatusResult.isOpen && !storeStatusResult.allowNextBatch) {
                return res.status(403).json({ error: storeStatusResult.message || 'Loja fechada.' });
            }

            const batchDate = storeStatusResult.batchDate || storeStatusResult.nextBatchDate;
            if (batchDate) {
                for (const item of cartItems) {
                    const available = await getUnifiedAvailableStock(supabase, item.id);
                    if (available < item.qty) {
                        return res.status(400).json({ error: `Estoque insuficiente para ${item.name}.` });
                    }
                }
            }

            // Recalcular total no backend — nunca confiar no valor do frontend
            const totalAmount = await recalcularTotal(supabase, cartItems);
            console.log(`💰 [Card] Total recalculado no backend: R$ ${totalAmount}`);

            // Registrar/Atualizar Cliente
            let customerId;
            const { data: existingCustomer } = await supabase.from('clientes').select('id').eq('email', customer.email).maybeSingle();
            if (existingCustomer) {
                customerId = existingCustomer.id;
                await supabase.from('clientes').update({ name: customer.name, whatsapp: customer.whatsapp }).eq('id', customerId);
            } else {
                const { data: newCustomer, error: insertErr } = await supabase.from('clientes').insert([{ name: customer.name, email: customer.email, whatsapp: customer.whatsapp }]).select().single();
                if (insertErr) throw insertErr;
                customerId = newCustomer.id;
            }

            // Criar pagamento no Mercado Pago
            const nameParts = (customer.name || '').split(' ');
            const mpResponse = await payment.create({
                body: {
                    transaction_amount: totalAmount,
                    token: cardToken,
                    description: 'Pedido Tocha Padaria',
                    installments: Number(installments) || 1,
                    payment_method_id,
                    issuer_id,
                    payer: {
                        email: customer.email,
                        first_name: nameParts[0] || 'Cliente',
                        last_name: nameParts.slice(1).join(' ') || 'Cliente'
                    }
                }
            });

            const mpId = String(mpResponse.id);
            const mpStatus = mpResponse.status;
            console.log(`💳 [MP Card] Pagamento ${mpId}: ${mpStatus} (${mpResponse.status_detail})`);

            // Pedido sempre salvo como 'pending'. Confirmação ocorre somente no webhook.
            const { data: newOrder, error: orderError } = await supabase.from('pedidos').insert([{
                customer_id: customerId,
                stripe_session_id: `mp_${mpId}`,
                total_amount: totalAmount,
                status: 'pending',
                items: JSON.stringify({
                    actual_items: cartItems,
                    order_type: storeStatusResult.orderType,
                    batch_date: batchDate,
                    payment_method: 'Cartão (Mercado Pago)',
                    mp_id: mpId
                })
            }]).select().single();

            if (orderError) throw orderError;

            if (mpStatus === 'approved' || mpStatus === 'in_process' || mpStatus === 'pending') {
                return res.json({ success: true, status: mpStatus, order_id: newOrder.id });
            }

            res.status(400).json({ error: `Pagamento recusado: ${mpResponse.status_detail || mpStatus}` });

        } catch (error) {
            console.error('❌ [MP Card] Erro:', error);
            res.status(500).json({ error: error.message || 'Erro ao processar pagamento.' });
        }
    });

    // 5. WEBHOOK MERCADO PAGO — rota principal
    // Único ponto onde pagamentos são confirmados, estoque é baixado e notificações são enviadas.
    router.post('/mercadopago/webhook', async (req, res) => {
        try {
            const { action, data } = req.body;
            console.log(`[MP Webhook] Action: ${action}`, data);

            if (action === 'payment.updated' || req.query.type === 'payment') {
                const mpId = data?.id || req.query['data.id'];
                if (mpId) {
                    const mpPayment = await payment.get({ id: mpId });
                    if (mpPayment.status === 'approved') {
                        await processPaidMPOrder(supabase, String(mpId), mpPayment);
                    } else {
                        console.log(`[MP Webhook] Pagamento ${mpId} ignorado. Status: ${mpPayment.status}`);
                    }
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Erro no Webhook MP:', error);
            res.status(500).send('Error');
        }
    });

    // Alias para compatibilidade com pagamentos PIX criados antes da mudança de rota
    router.post('/webhook/mercadopago', async (req, res) => {
        try {
            const { action, data } = req.body;
            console.log(`[MP Webhook Legacy] Action: ${action}`, data);

            if (action === 'payment.updated' || req.query.type === 'payment') {
                const mpId = data?.id || req.query['data.id'];
                if (mpId) {
                    const mpPayment = await payment.get({ id: mpId });
                    if (mpPayment.status === 'approved') {
                        await processPaidMPOrder(supabase, String(mpId), mpPayment);
                    }
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Erro no Webhook MP Legacy:', error);
            res.status(500).send('Error');
        }
    });

    return router;
};

// Recalcula o total do pedido buscando preços no banco — nunca confia no frontend
async function recalcularTotal(supabase, cart) {
    let total = 0;
    for (const item of cart) {
        const { data: product, error } = await supabase
            .from('produtos')
            .select('price')
            .eq('id', item.id)
            .maybeSingle();

        if (error || !product) {
            throw new Error(`Produto ${item.id} não encontrado no banco.`);
        }

        total += Number(product.price) * parseInt(item.qty);
    }
    return Math.round(total * 100) / 100;
}

// Processamento de pedido pago via Mercado Pago
// Executado pelo webhook (e pelo polling como fallback com idempotência)
async function processPaidMPOrder(supabase, mpId, _mpPayment) {
    const externalId = `mp_${mpId}`;

    // Idempotência — ignora se já processado
    const { data: order } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .eq('stripe_session_id', externalId)
        .maybeSingle();

    if (!order) {
        console.warn(`[MP] Pedido não encontrado para ${externalId}. Ignorando.`);
        return;
    }

    if (order.status !== 'pending') {
        console.log(`[MP] Pedido ${order.id} já processado (status: ${order.status}). Ignorando.`);
        return;
    }

    console.log(`✅ [MP] Processando pagamento aprovado: ${mpId}`);

    // Atualizar para Pago
    const { error: updateErr } = await supabase.from('pedidos').update({ status: 'paid' }).eq('id', order.id);
    if (updateErr) {
        console.error(`❌ [MP] Erro ao atualizar pedido ${order.id}:`, updateErr.message);
        return;
    }

    const itemsData = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const cart = itemsData.actual_items || [];
    const batchDate = itemsData.batch_date;
    const paymentMethod = itemsData.payment_method || 'Mercado Pago';

    // Reduzir estoque — com revalidação antes de cada item
    if (batchDate && cart.length > 0) {
        for (const item of cart) {
            // Revalidar disponibilidade antes de dar baixa
            const available = await getUnifiedAvailableStock(supabase, item.id);
            if (available < item.qty) {
                console.warn(`⚠️ [MP Estoque] Estoque insuficiente para ${item.name} no webhook. Disponível: ${available}, Solicitado: ${item.qty}`);
            }

            const { error: rpcError } = await supabase.rpc('processar_venda_estoque', {
                p_id: String(item.id),
                f_date: String(batchDate),
                amount: parseInt(item.qty)
            });

            if (rpcError) {
                console.warn(`⚠️ [MP Estoque] RPC falhou para ${item.name}:`, rpcError.message);
            } else {
                console.log(`✅ [MP Estoque] Baixa OK: ${item.name} (${item.qty}x) na fornada ${batchDate}`);
            }
        }
    }

    // Enviar notificações
    const notificationCustomer = {
        ...order.clientes,
        name: order.clientes?.name || 'Cliente',
        whatsapp: order.clientes?.whatsapp,
        email: order.clientes?.email
    };

    await Promise.allSettled([
        sendOrderEmails(supabase, order, notificationCustomer, paymentMethod),
        sendOrderWhatsApp(supabase, order, notificationCustomer, paymentMethod)
    ]);

    console.log(`✅ [MP] Pedido ${order.id} processado com sucesso.`);
}
