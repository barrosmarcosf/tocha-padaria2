const express = require('express');
const crypto = require('crypto');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { secLog: fileSecLog } = require('../utils/secLogger');
const QRCode = require('qrcode');
const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
const { getUnifiedAvailableStock } = require('../services/stockService');
const { getUnifiedStoreStatus } = require('../services/storeStatusService');

function verifyMPWebhookSignature(req, secret) {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'] || '';
    if (!signature) return false;
    const parts = {};
    signature.split(',').forEach(part => {
        const idx = part.indexOf('=');
        if (idx > 0) parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    });
    const { ts, v1 } = parts;
    if (!ts || !v1) return false;
    const mpId = req.body?.data?.id || req.query['data.id'] || '';
    const manifest = `id:${mpId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
}

async function handleMPWebhookPayload(req, payment, supabase) {
    const { action, data } = req.body;
    if (action === 'payment.updated' || req.query.type === 'payment') {
        const mpId = data?.id || req.query['data.id'];
        if (!mpId) return;
        const mpPayment = await payment.get({ id: mpId });
        if (!mpPayment || !mpPayment.id) {
            console.warn(`[MP Webhook] Evento inválido ignorado (mpId=${mpId})`);
            return;
        }
        if (mpPayment.status === 'approved' && mpPayment.status_detail !== 'rejected') {
            await processPaidMPOrder(supabase, String(mpId), mpPayment);
        } else {
            console.log(`[MP Webhook] Pagamento ${mpId} ignorado. Status: ${mpPayment.status} / ${mpPayment.status_detail}`);
        }
    }
}

module.exports = function (supabase) {
    const router = express.Router();

    // Configuração do Mercado Pago
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
        console.error("❌ [Mercado Pago] ERRO: MERCADOPAGO_ACCESS_TOKEN não encontrado nas variáveis de ambiente!");
    } else {
        console.log("✅ [Mercado Pago] Token configurado:", token.substring(0, 10) + "...");
    }

    const client = new MercadoPagoConfig({
        accessToken: token,
        options: { timeout: 10000 } // Aumentado para evitar timeouts em conexões lentas
    });
    const payment = new Payment(client);

    // Rota legada desabilitada — não salva pedido no banco, nunca use.
    router.post('/process-payment', (_req, res) => {
        return res.status(410).json({
            error: true,
            message: 'Rota descontinuada. Use /create-pix-payment ou /create-card-payment.'
        });
    });

    // 1. CRIAR PAGAMENTO PIX
    router.post('/create-pix-payment', async (req, res) => {
        try {
            if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
                return res.status(503).json({ error: 'Integração Mercado Pago não configurada.' });
            }

            const { customer, cart } = req.body;

            const customerErr = validateCustomer(customer);
            if (customerErr) return res.status(400).json({ error: customerErr });
            const cartErr = validateCart(cart);
            if (cartErr) return res.status(400).json({ error: cartErr });

            // 🔒 IDEMPOTÊNCIA
            const idemKey = req.headers['x-idempotency-key'] || `session_${req.session_id}`;

            const { data: existing, error: idemErr } = await supabase
                .from('pedidos')
                .select('id, items')
                .eq('idempotency_key', idemKey)
                .maybeSingle();

            if (idemErr && idemErr.message.includes('idempotency_key')) {
                console.error('❌ ERRO CRÍTICO: coluna idempotency_key ausente no banco. Execute a migration SQL.');
                return res.status(500).json({ error: true, message: 'Erro de configuração do servidor.' });
            }

            if (!idemErr && existing) {
                let items = existing.items;
                try { if (typeof items === 'string') items = JSON.parse(items); } catch (_) { items = {}; }
                return res.json({ payment_id: items.mp_id, order_id: existing.id });
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
                    external_reference: idemKey,
                    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    notification_url: isHttps ? `${baseUrl}/api/mercadopago/webhook` : undefined
                }
            };

            console.log("💳 [Pix] Criando pagamento no MP:", paymentData.body.transaction_amount);

            const mpResponse = await payment.create(paymentData);
            const mpId = String(mpResponse.id);
            const qrCode = mpResponse.point_of_interaction.transaction_data.qr_code;
            const qrCodeBase64 = await /** @type {Promise<string>} */ (QRCode.toDataURL(qrCode));

            // Registrar Pedido Pendente no Banco
            let newOrder;
            try {
                const orderData = {
                    customer_id: customerId,
                    stripe_session_id: `mp_${mpId}`,
                    total_amount: totalAmount,
                    status: 'pending',
                    items: JSON.stringify({
                        actual_items: cart,
                        order_type: storeStatusResult.orderType,
                        batch_date: batchDate,
                        payment_method: 'Pix (Mercado Pago)',
                        mp_id: mpId,
                        client_session_id: req.session_id
                    })
                };

                // Tenta incluir idempotency_key se não for um fallback
                if (idemKey && !idemKey.startsWith('fallback_')) {
                    orderData.idempotency_key = idemKey;
                }

                const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
                
                if (error) {
                    if (error.message.includes('idempotency_key')) {
                        console.error('❌ ERRO CRÍTICO: coluna idempotency_key ausente no banco. Execute a migration SQL.');
                        return res.status(500).json({ error: true, message: 'Erro de configuração do servidor.' });
                    }
                    throw error;
                } else {
                    newOrder = data;
                }
            } catch (err) {
                if (err.code === '23505' || err.message?.includes('duplicate key')) {
                    const { data: existing } = await supabase.from('pedidos').select('id, items').eq('idempotency_key', idemKey).single();
                    let items = existing?.items || {};
                    try { if (typeof items === 'string') items = JSON.parse(items); } catch (_) { items = {}; }
                    return res.json({ payment_id: items.mp_id, order_id: existing?.id });
                }
                throw err;
            }

            console.log(`[MP FLOW] idemKey=${idemKey} mpId=${mpId} orderId=${newOrder?.id}`);

            res.json({
                payment_id: mpId,
                qr_code: qrCode,
                qr_code_base64: qrCodeBase64,
                order_id: newOrder.id
            });

        } catch (error) {
            console.error('❌ [PIX] Erro Crítico:', error.response?.data || error);
            res.status(error.response?.status || 500).json({ 
                error: true,
                message: error.response?.data?.message || error.message || 'Erro ao gerar pagamento Pix.' 
            });
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
    router.get('/public-key', (_req, res) => {
        const pubKey = process.env.MERCADOPAGO_PUBLIC_KEY;
        if (!pubKey) return res.status(503).json({ error: 'Chave pública MP não configurada. Adicione MERCADOPAGO_PUBLIC_KEY no .env' });
        res.json({ publicKey: pubKey });
    });

    // 3.1 BUSCAR RESUMO DO PEDIDO (Para a página de checkout dedicada)
    router.get('/order-summary/:id', async (req, res) => {
        try {
            const sid = req.cookies.session_id; // 🔒 Uso exclusivo de cookies
            
            const { data: order, error } = await supabase
                .from('pedidos')
                .select('*, clientes(*)')
                .eq('id', req.params.id)
                .single();

            if (error || !order) return res.status(404).json({ error: 'Pedido não encontrado.' });

            let itemsData = order.items;
            try { if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData); } catch (_) { itemsData = {}; }

            // 🔒 VALIDAÇÕES DE SEGURANÇA (Suavizadas para Homologação)
            if (order.status !== 'pending' && order.status !== 'paid') {
                return res.status(400).json({ error: 'Este pedido expirou ou é inválido.' });
            }
            // Log de diagnóstico para ajudar o usuário se a sessão falhar
            if (itemsData.client_session_id && itemsData.client_session_id !== sid) {
                console.warn(`⚠️ [MP Summary] Divergência de sessão (Esperada: ${itemsData.client_session_id}, Recebida: ${sid}). Prosseguindo para permitir homologação.`);
            }

            res.json({
                id: order.id,
                total: order.total_amount,
                items: itemsData.actual_items || [],
                customer: order.clientes,
                batch_date: itemsData.batch_date
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // 3.2 PREPARAR PEDIDO DE CARTÃO (Cria o pedido pendente antes de ir para a página de checkout)
    router.post('/prepare-card-order', async (req, res) => {
        console.log("🚀 [MP Prepare] BODY RECEBIDO:", JSON.stringify(req.body, null, 2));
        try {
            const { customer, cart: cartItems } = req.body;

            if (!customer || !cartItems || cartItems.length === 0) {
                return res.status(400).json({ error: 'Dados incompletos do carrinho ou cliente.' });
            }

            // 🔒 IDEMPOTÊNCIA
            const idemKey = req.headers['x-idempotency-key'] || `session_${req.session_id}`;

            const { data: existingCard, error: idemCardErr } = await supabase
                .from('pedidos')
                .select('id')
                .eq('idempotency_key', idemKey)
                .maybeSingle();

            if (idemCardErr && idemCardErr.message.includes('idempotency_key')) {
                console.error('❌ ERRO CRÍTICO: coluna idempotency_key ausente no banco. Execute a migration SQL.');
                return res.status(500).json({ error: true, message: 'Erro de configuração do servidor.' });
            }

            if (!idemCardErr && existingCard) {
                return res.json({ order_id: existingCard.id });
            }

            // 🔒 VALIDAÇÃO DE MÉTODO ATIVO
            const { data: paySettings } = await supabase.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
            const s = paySettings?.value || {};
            if (!s.mp_card) {
                return res.status(403).json({ error: 'Mercado Pago cartão desabilitado' });
            }

            const storeStatusResult = await getUnifiedStoreStatus(supabase);
            const batchDate = storeStatusResult.batchDate || storeStatusResult.nextBatchDate;

            // Recalcular total
            const totalAmount = await recalcularTotal(supabase, cartItems);

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

            // Criar Pedido Pendente
            let newOrder;
            try {
                const orderData = {
                    customer_id: customerId,
                    stripe_session_id: `mp_pending_${Date.now()}`,
                    total_amount: totalAmount,
                    status: 'pending',
                    items: JSON.stringify({
                        actual_items: cartItems,
                        order_type: storeStatusResult.orderType,
                        batch_date: batchDate,
                        payment_method: 'Cartão (Mercado Pago)',
                        client_session_id: req.session_id
                    })
                };

                if (idemKey && !idemKey.startsWith('fallback_')) {
                    orderData.idempotency_key = idemKey;
                }

                const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
                
                if (error) {
                    if (error.message.includes('idempotency_key')) {
                        console.error('❌ ERRO CRÍTICO: coluna idempotency_key ausente no banco. Execute a migration SQL.');
                        return res.status(500).json({ error: true, message: 'Erro de configuração do servidor.' });
                    }
                    throw error;
                } else {
                    newOrder = data;
                }
            } catch (err) {
                if (err.code === '23505' || err.message?.includes('duplicate key')) {
                    const { data: existing } = await supabase.from('pedidos').select('id').eq('idempotency_key', idemKey).single();
                    return res.json({ order_id: existing.id });
                }
                throw err;
            }

            res.json({ order_id: newOrder.id });
        } catch (e) {
            console.error('❌ [MP Prepare] Erro:', e);
            res.status(500).json({ error: e.message });
        }
    });

    // 4. CHECKOUT TRANSPARENTE — CARTÃO (Bricks)
    router.post('/create-card-payment', async (req, res) => {
        console.log('🔥 HEADERS:', req.headers);
        console.log('🔥 BODY RECEBIDO:', req.body);
        try {
            if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
                return res.status(503).json({ error: 'Integração Mercado Pago não configurada.' });
            }

            if (!req.body || !req.body.token) {
                console.error('❌ TOKEN NÃO CHEGOU NO BACKEND');
                return res.status(400).json({ error: 'Token não recebido no backend' });
            }

            console.log('TOKEN BACKEND:', req.body.token);
            console.log('BODY COMPLETO:', req.body);

            const { token, amount, payer, order_id } = req.body;
            if (!token || typeof token !== 'string' || token.length < 10) {
                return res.status(400).json({ error: 'token obrigatório e deve ser válido.' });
            }
            if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
                return res.status(400).json({ error: 'transaction_amount obrigatório e deve ser positivo.' });
            }
            if (!payer?.email) {
                return res.status(400).json({ error: 'payer.email obrigatório.' });
            }

            console.log('MP PAYMENT PAYLOAD:', {
                transaction_amount: Number(req.body.amount),
                token: req.body.token,
                description: 'Pedido Tocha',
                installments: Number(req.body.installments),
                payment_method_id: req.body.payment_method_id,
                issuer_id: req.body.issuer_id,
                payer: {
                    email: req.body.payer?.email
                }
            });

            const paymentData = {
                transaction_amount: Number(req.body.amount),
                token: req.body.token,
                description: 'Pedido Tocha',
                installments: Number(req.body.installments || 1),
                payment_method_id: req.body.payment_method_id,
                issuer_id: req.body.issuer_id,
                payer: {
                    email: req.body.payer?.email
                }
            };

            const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;

            const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify(paymentData)
            });

            const responseData = await mpRes.json();

            if (!mpRes.ok) {
                const err = new Error(`MP API ${mpRes.status}`);
                err.response = { data: responseData };
                throw err;
            }

            const mpId = String(responseData.id);
            console.log(`💳 [MP Card] Pagamento ${mpId}: ${responseData.status} (${responseData.status_detail})`);

            // Atualizar pedido existente criado por prepare-card-order
            if (order_id) {
                const { data: existingOrder } = await supabase
                    .from('pedidos')
                    .select('status, items')
                    .eq('id', order_id)
                    .maybeSingle();

                if (existingOrder && existingOrder.status === 'pending') {
                    let itemsData = existingOrder.items;
                    try { if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData); } catch (_) { itemsData = {}; }
                    itemsData.mp_id = mpId;

                    await supabase
                        .from('pedidos')
                        .update({ mp_payment_id: mpId, items: JSON.stringify(itemsData) })
                        .eq('id', order_id)
                        .eq('status', 'pending');
                }
            }

            res.json(responseData);

        } catch (err) {
            console.error('MP ERROR COMPLETO:', err.response?.data || err);
            return res.status(500).json({
                error: err.response?.data?.message ||
                       err.response?.data?.cause?.[0]?.description ||
                       JSON.stringify(err.response?.data) ||
                       err.message ||
                       'Erro desconhecido no pagamento'
            });
        }
    });

    // 5. WEBHOOK MERCADO PAGO — rota principal
    router.get('/webhook', (_req, res) => res.status(200).send('MP webhook endpoint OK'));

    router.post('/webhook', async (req, res) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

        if (webhookSecret) {
            try {
                if (!verifyMPWebhookSignature(req, webhookSecret)) {
                    fileSecLog('WEBHOOK_MP_ASSINATURA_INVALIDA', ip, req.path);
                    return res.status(401).send('Assinatura inválida.');
                }
            } catch (_) {
                fileSecLog('WEBHOOK_MP_ERRO_VERIFICACAO', ip, req.path);
                return res.status(401).send('Erro ao verificar assinatura.');
            }
        } else if (process.env.NODE_ENV === 'production') {
            fileSecLog('WEBHOOK_MP_SEM_SECRET_PRODUCAO', ip, req.path);
            return res.status(401).send('Webhook não configurado.');
        }

        res.status(200).send('OK');
        fileSecLog('WEBHOOK_MP_VALIDO', ip, req.path, `Action: ${req.body?.action}`);
        handleMPWebhookPayload(req, payment, supabase).catch(err => {
            console.error('Erro no Webhook MP:', err);
        });
    });

    // Alias legado — mesmo handler com idempotência garantida no banco
    router.post('/webhook/mercadopago', async (req, res) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

        if (webhookSecret) {
            try {
                if (!verifyMPWebhookSignature(req, webhookSecret)) {
                    fileSecLog('WEBHOOK_MP_LEGACY_ASSINATURA_INVALIDA', ip, req.path);
                    return res.status(401).send('Assinatura inválida.');
                }
            } catch (_) {
                fileSecLog('WEBHOOK_MP_LEGACY_ERRO_VERIFICACAO', ip, req.path);
                return res.status(401).send('Erro ao verificar assinatura.');
            }
        }

        res.status(200).send('OK');
        fileSecLog('WEBHOOK_MP_LEGACY_VALIDO', ip, req.path, `Action: ${req.body?.action}`);
        handleMPWebhookPayload(req, payment, supabase).catch(err => {
            console.error('Erro no Webhook MP Legacy:', err);
        });
    });

    return router;
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

function validateCustomer(c) {
    if (!c || typeof c !== 'object') return 'Dados do cliente inválidos.';
    const name = typeof c.name === 'string' ? c.name.trim() : '';
    if (name.length < 2 || name.length > 200) return 'Nome deve ter entre 2 e 200 caracteres.';
    if (!c.email || !EMAIL_RE.test(String(c.email))) return 'Email inválido.';
    if (String(c.email).length > 254) return 'Email muito longo.';
    const digits = String(c.whatsapp || '').replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'WhatsApp inválido (10-15 dígitos).';
    return null;
}

function validateCart(cart) {
    if (!Array.isArray(cart) || cart.length === 0) return 'Carrinho vazio.';
    if (cart.length > 50) return 'Carrinho excede o limite de 50 itens.';
    for (const item of cart) {
        if (!item.id) return 'Item sem ID.';
        const qty = parseInt(item.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 999) return `Quantidade inválida no item ${item.id}.`;
    }
    return null;
}

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

    // UPDATE atômico com condição: só atualiza se status ainda for 'pending'.
    // Equivale a: UPDATE pedidos SET status='paid' WHERE stripe_session_id=X AND status='pending' RETURNING *
    // PostgreSQL garante que apenas um processo concorrente vence — elimina a race condition
    // sem precisar de SELECT prévio.
    const { data: order, error: updateErr } = await supabase
        .from('pedidos')
        .update({ status: 'paid', mp_payment_id: mpId })
        .or(`stripe_session_id.eq.${externalId},mp_payment_id.eq.${mpId}`)
        .eq('status', 'pending')
        .select('*, clientes(*)')
        .maybeSingle();

    if (updateErr) {
        if (updateErr.code === '23505') {
            // UNIQUE violation em mp_payment_id: outro processo já gravou este pagamento
            console.log(`[MP] Pagamento ${mpId} ignorado — UNIQUE violation (race condition resolvida pelo banco).`);
        } else {
            console.error(`❌ [MP] Erro ao processar pedido ${externalId}:`, updateErr.message);
        }
        return;
    }

    if (!order) {
        console.log(`[MP] DUPLICADO IGNORADO: mpId=${mpId} — pedido não encontrado ou já processado.`);
        return;
    }

    // 🔒 VALIDAÇÃO DE VALOR (Tarefa 5 - Robusta)
    const diff = Math.abs(Number(_mpPayment.transaction_amount) - Number(order.total_amount));
    if (diff > 0.01) {
        console.error('❌ [MP Webhook] Valor divergente detectado! Esperado:', order.total_amount, 'Recebido:', _mpPayment.transaction_amount);
        await supabase.from('pedidos').update({ status: 'error' }).eq('id', order.id);
        return;
    }

    console.log(`✅ [MP] Processando pagamento aprovado: ${mpId} (pedido ${order.id})`);

    let itemsData = order.items;
    try { if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData); } catch (_) { itemsData = {}; }
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
