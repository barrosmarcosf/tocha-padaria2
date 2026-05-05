const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const QRCode = require('qrcode');
const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
const { getUnifiedAvailableStock } = require('../services/stockService');
const { getUnifiedStoreStatus } = require('../services/storeStatusService');
const { processPaidMPOrder } = require('./mercadopago');

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;
const VALID_METHODS = new Set(['stripe_card', 'mp_pix', 'mp_card']);

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

// Busca preços do banco em um único query — nunca confia no valor do frontend
async function recalcularTotal(supabase, cart) {
    const ids = cart.map(i => String(i.id));
    const { data: products, error } = await supabase
        .from('produtos').select('id, price').in('id', ids);
    if (error) throw new Error('Erro ao buscar preços dos produtos.');
    const priceMap = Object.fromEntries(products.map(p => [String(p.id), Number(p.price)]));
    let total = 0;
    for (const item of cart) {
        const price = priceMap[String(item.id)];
        if (price == null) throw new Error(`Produto ${item.id} não encontrado.`);
        total += price * parseInt(item.qty);
    }
    return Math.round(total * 100) / 100;
}

function mapCartToMPItems(cart) {
    return cart.map(item => ({
        id: String(item.id), title: item.name,
        quantity: item.qty, unit_price: item.price, category_id: 'food'
    }));
}

function buildPendingOrder(customerId, sessionId, totalAmount, storeStatus, batchDate, cart, paymentMethod) {
    return {
        customer_id: customerId,
        stripe_session_id: sessionId,
        total_amount: totalAmount,
        status: 'pending',
        items: JSON.stringify({
            actual_items: cart,
            order_type: storeStatus.orderType,
            cycle_type: storeStatus.cycleType,
            batch_date: batchDate,
            batch_label: storeStatus.batchLabel || storeStatus.nextBatchLabel,
            payment_method: paymentMethod
        })
    };
}

module.exports = function (supabase, stripe) {
    const router = express.Router();
    const PORT = process.env.PORT || 3333;

    // MP Payment client — inicializado uma vez por processo
    let _mpPayment = null;
    function getMPPayment() {
        if (_mpPayment) return _mpPayment;
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
        const client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 15000 } });
        _mpPayment = new Payment(client);
        return _mpPayment;
    }

    // ──────────────────────────────────────────────────
    // CHECKOUT UNIFICADO
    // Suporta: stripe_card | mp_pix | mp_card
    // ──────────────────────────────────────────────────
    router.post('/checkout', async (req, res) => {
        const { customer, method = 'stripe_card' } = req.body;
        const cart = req.body.cart || req.body.items;

        try {
            if (!VALID_METHODS.has(method)) {
                return res.status(400).json({ tipo: 'error_generic', error: `Método inválido: ${method}` });
            }

            const customerErr = validateCustomer(customer);
            if (customerErr) return res.status(400).json({ error: customerErr });
            const cartErr = validateCart(cart);
            if (cartErr) return res.status(400).json({ error: cartErr });

            // ── Status da loja ───────────────────────────────────────
            const storeStatusResult = await getUnifiedStoreStatus(supabase);
            if (!storeStatusResult.isOpen && !storeStatusResult.allowNextBatch) {
                return res.status(403).json({ error: storeStatusResult.message || 'Loja fechada.' });
            }

            // ── Validação de estoque ─────────────────────────────────
            const batchDate = storeStatusResult.batchDate || storeStatusResult.nextBatchDate;
            if (batchDate) {
                for (const item of cart) {
                    const available = await getUnifiedAvailableStock(supabase, item.id);
                    if (available < item.qty) {
                        const { data: pInfo } = await supabase.from('produtos').select('name').eq('id', item.id).maybeSingle();
                        return res.status(400).json({
                            error: `Estoque insuficiente para "${pInfo?.name || item.id}". Disponível: ${available}`
                        });
                    }
                }
            }

            // ── Upsert de cliente ────────────────────────────────────
            let customerId;
            const { data: existingCustomer } = await supabase
                .from('clientes').select('id').eq('email', customer.email).maybeSingle();
            if (existingCustomer) {
                customerId = existingCustomer.id;
                await supabase.from('clientes')
                    .update({ name: customer.name, whatsapp: customer.whatsapp })
                    .eq('id', customerId);
            } else {
                const { data: newCustomer, error: insErr } = await supabase
                    .from('clientes')
                    .insert([{ name: customer.name, email: customer.email, whatsapp: customer.whatsapp }])
                    .select().single();
                if (insErr) throw insErr;
                customerId = newCustomer.id;
            }

            // ── Roteamento por método ────────────────────────────────
            if (method === 'mp_pix') {
                return await handleMpPix(req, res, supabase, cart, customer, customerId, storeStatusResult, batchDate);
            }
            if (method === 'mp_card') {
                return await handleMpCard(req, res, supabase, cart, customer, customerId, storeStatusResult, batchDate);
            }
            return await handleStripeCard(req, res, supabase, stripe, cart, customer, customerId, storeStatusResult, batchDate, PORT);

        } catch (err) {
            console.error('❌ [Checkout] Erro fatal:', err);
            return res.status(500).json({ tipo: 'error_generic', error: err.message || 'Erro interno.' });
        }
    });

    // ──────────────────────────────────────────────────
    // HANDLER: PIX via Mercado Pago
    // ──────────────────────────────────────────────────
    async function handleMpPix(req, res, supabase, cart, customer, customerId, storeStatus, batchDate) {
        const mpPayment = getMPPayment();
        const totalAmount = await recalcularTotal(supabase, cart);

        const { data: newOrder, error: orderErr } = await supabase.from('pedidos').insert([
            buildPendingOrder(customerId, `mp_pix_pending_${Date.now()}`, totalAmount, storeStatus, batchDate, cart, 'Pix (Mercado Pago)')
        ]).select().single();
        if (orderErr) throw orderErr;

        const baseUrl = process.env.BASE_URL || '';
        const notificationUrl = baseUrl ? `${baseUrl}/api/mercadopago/webhook` : undefined;
        if (!notificationUrl) {
            console.warn('⚠️ [PIX] BASE_URL não configurado — webhook MP desabilitado.');
        }

        const mpResponse = await mpPayment.create({
            body: {
                transaction_amount: totalAmount,
                description: 'Pedido Tocha Padaria',
                payment_method_id: 'pix',
                payer: {
                    email: customer.email,
                    first_name: customer.name.split(' ')[0],
                    last_name: customer.name.split(' ').slice(1).join(' ') || 'Cliente',
                    ...(customer.whatsapp ? {
                        phone: {
                            area_code: String(customer.whatsapp).replace(/\D/g, '').slice(0, 2),
                            number: String(customer.whatsapp).replace(/\D/g, '').slice(2)
                        }
                    } : {})
                },
                external_reference: String(newOrder.id),
                date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                notification_url: notificationUrl,
                additional_info: { items: mapCartToMPItems(cart) }
            }
        });

        const mpId = String(mpResponse.id);
        const pixString = mpResponse.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = await QRCode.toDataURL(pixString);

        await supabase.from('pedidos').update({
            mp_payment_id: mpId,
            stripe_session_id: `mp_${mpId}`
        }).eq('id', newOrder.id);

        console.log(`[Checkout PIX] order_id=${newOrder.id} payment_id=${mpId} status=pending`);
        return res.json({ tipo: 'pix', qr_code: qrCodeBase64, copia_e_cola: pixString });
    }

    // ──────────────────────────────────────────────────
    // HANDLER: Cartão via Mercado Pago (Bricks token)
    // ──────────────────────────────────────────────────
    async function handleMpCard(req, res, supabase, cart, customer, customerId, storeStatus, batchDate) {
        const { card_token, payment_method_id, installments = 1, issuer_id, payer } = req.body;
        if (!card_token) {
            return res.status(400).json({ error: 'card_token obrigatório para mp_card.' });
        }

        const totalAmount = await recalcularTotal(supabase, cart);

        const { data: newOrder, error: orderErr } = await supabase.from('pedidos').insert([
            buildPendingOrder(customerId, `mp_card_pending_${Date.now()}`, totalAmount, storeStatus, batchDate, cart, 'Cartão (Mercado Pago)')
        ]).select().single();
        if (orderErr) throw orderErr;

        const idempotencyKey = `co_${newOrder.id}_${Date.now()}`;
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                transaction_amount: totalAmount,
                token: card_token,
                description: 'Pedido Tocha Padaria',
                installments: Number(installments),
                payment_method_id,
                issuer_id,
                external_reference: String(newOrder.id),
                payer: { ...payer, email: payer?.email || customer.email },
                additional_info: { items: mapCartToMPItems(cart) }
            })
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
            console.error('[Checkout Card] MP API error:', mpRes.status, mpData);
            await supabase.from('pedidos').update({ status: 'payment_failed' }).eq('id', newOrder.id);
            return res.json({ tipo: 'error_generic' });
        }

        const mpId = String(mpData.id);
        console.log(`[Checkout Card] order_id=${newOrder.id} payment_id=${mpId} status=${mpData.status} detail=${mpData.status_detail}`);

        if (mpData.status === 'approved') {
            await supabase.from('pedidos').update({
                mp_payment_id: mpId,
                stripe_session_id: `mp_${mpId}`
            }).eq('id', newOrder.id);
            processPaidMPOrder(supabase, mpId, mpData).catch(err =>
                console.error('[Checkout Card] processPaidMPOrder error:', err.message)
            );
            return res.json({ tipo: 'success' });
        }

        if (mpData.status === 'rejected' || mpData.status === 'cancelled') {
            await supabase.from('pedidos').update({
                mp_payment_id: mpId,
                stripe_session_id: `mp_${mpId}`,
                status: 'payment_failed'
            }).eq('id', newOrder.id);
            return res.json({ tipo: 'error_card_mp' });
        }

        // in_process / pending — status ainda indeterminado
        console.warn('[Checkout Card] Status inesperado:', mpData.status, mpData.status_detail);
        await supabase.from('pedidos').update({
            mp_payment_id: mpId,
            stripe_session_id: `mp_${mpId}`
        }).eq('id', newOrder.id);
        return res.json({ tipo: 'error_generic' });
    }

    // ──────────────────────────────────────────────────
    // HANDLER: Stripe (redireciona para Stripe Checkout)
    // ──────────────────────────────────────────────────
    async function handleStripeCard(req, res, supabase, stripe, cart, customer, customerId, storeStatus, batchDate, PORT) {
        const totalAmount = req.body.totalAmount;
        const idemKey = req.headers['x-idempotency-key'] || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Idempotência
        try {
            const { data: existing, error: idemErr } = await supabase
                .from('pedidos').select('id, stripe_session_id, items').eq('idempotency_key', idemKey).maybeSingle();
            if (!idemErr && existing) {
                const items = typeof existing.items === 'string' ? JSON.parse(existing.items) : existing.items;
                if (items.client_session_id && items.client_session_id !== req.session_id) {
                    return res.status(403).json({ error: 'Acesso negado: ID de sessão inválido.' });
                }
                return res.json({ tipo: 'stripe_redirect', url: `https://checkout.stripe.com/pay/${existing.stripe_session_id}` });
            }
        } catch (e) {
            console.warn('⚠️ [Idempotency Stripe] Erro ao verificar chave.', e.message);
        }

        // Métodos ativos — query única reutilizada para validação e construção
        const { data: paySettings } = await supabase.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
        const s = paySettings?.value || {};
        if (s.mp_card === true || !s.card) {
            return res.status(403).json({ error: 'Stripe desabilitado' });
        }
        let active_methods = [];
        if (s.card) active_methods.push('card');
        if (s.pix) active_methods.push('pix');
        if (active_methods.length === 0) active_methods = ['card'];

        const line_items = cart.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: { name: item.name },
                unit_amount: Math.round(Number(item.price) * 100),
            },
            quantity: parseInt(item.qty),
        }));

        const origin = req.headers.origin || `http://localhost:${PORT}`;
        const sessionParams = {
            payment_method_types: active_methods,
            line_items,
            mode: 'payment',
            success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/?status=cancel`,
            customer_email: customer.email,
            metadata: { whatsapp: customer.whatsapp, customerName: customer.name, sessionId: req.session_id }
        };

        let session;
        try {
            session = await stripe.checkout.sessions.create(sessionParams);
        } catch (stripeErr) {
            console.error('⚠️ Falha ao criar sessão Stripe:', stripeErr.message);
            if (active_methods.includes('pix')) {
                session = await stripe.checkout.sessions.create({ ...sessionParams, payment_method_types: ['card'] });
            } else {
                throw stripeErr;
            }
        }

        console.log(`Checkout Stripe iniciado para ${customer.name}: ${session.id}`);

        let newOrder;
        try {
            const orderData = {
                ...buildPendingOrder(customerId, session.id, totalAmount, storeStatus, batchDate, cart, 'Stripe'),
                items: JSON.stringify({
                    actual_items: cart,
                    order_type: storeStatus.orderType,
                    cycle_type: storeStatus.cycleType,
                    batch_date: storeStatus.batchDate || storeStatus.nextBatchDate,
                    batch_label: storeStatus.batchLabel || storeStatus.nextBatchLabel,
                    client_session_id: req.session_id
                })
            };
            if (idemKey && !idemKey.startsWith('fallback_')) orderData.idempotency_key = idemKey;

            const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
            if (error) {
                if (error.message.includes('idempotency_key')) {
                    console.warn('⚠️ [DB] Coluna idempotency_key ausente. Inserindo sem ela.');
                    delete orderData.idempotency_key;
                    const { data: r2, error: e2 } = await supabase.from('pedidos').insert([orderData]).select().single();
                    if (e2) throw e2;
                    newOrder = r2;
                } else throw error;
            } else newOrder = data;
        } catch (err) {
            if (err.code === '23505' || err.message?.includes('duplicate key')) {
                const { data: dup } = await supabase.from('pedidos').select('id, stripe_session_id').eq('idempotency_key', idemKey).single();
                return res.json({ tipo: 'stripe_redirect', url: `https://checkout.stripe.com/pay/${dup.stripe_session_id}` });
            }
            throw err;
        }

        if (!newOrder) throw new Error('Falha ao registrar pedido.');
        return res.json({ tipo: 'stripe_redirect', url: session.url });
    }

    // ──────────────────────────────────────────────────
    // WEBHOOK DO STRIPE (com verificação de assinatura)
    // ──────────────────────────────────────────────────
    router.post('/webhook', async (req, res) => {
        let event;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret) {
            const sig = req.headers['stripe-signature'];
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                console.error(`⚠️ Webhook signature verification failed:`, err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        } else if (process.env.NODE_ENV === 'production') {
            console.error("❌ STRIPE_WEBHOOK_SECRET não configurado em produção — webhook rejeitado.");
            return res.status(400).send('Webhook Error: Secret não configurado.');
        } else {
            console.warn("⚠️ STRIPE_WEBHOOK_SECRET não configurado. Webhook aceito sem verificação (somente desenvolvimento).");
            try {
                event = JSON.parse(req.body.toString());
            } catch (err) {
                console.error("❌ Falha ao processar payload do webhook:", err.message);
                return res.status(400).send(`Webhook Error: Malformed JSON`);
            }
        }

        console.log(`\n🔔 WEBHOOK RECEBIDO: ${event.type}`);
        res.json({ received: true });

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            processPaidSession(supabase, stripe, session).catch(err => {
                console.error("❌ [FATAL] Erro em segundo plano no Webhook:", err.message);
            });
        }
    });

    // ──────────────────────────────────────────────────
    // CONFIRMAÇÃO VIA FRONTEND (Fallback para ambiente local)
    // ──────────────────────────────────────────────────
    router.post('/confirm-session', async (req, res) => {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ error: 'Session ID obrigatório.' });
            console.log(`\n🔗 CONFIRMAÇÃO VIA FRONTEND: ${sessionId}`);
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                processPaidSession(supabase, stripe, session).catch(err => {
                    console.error("❌ [FATAL] Erro em segundo plano na Confirmação:", err.message);
                });
                res.json({ success: true, message: 'Processamento iniciado.' });
            } else {
                console.warn(`⚠️ Tentativa de confirmação para sessão não paga: ${sessionId}`);
                res.status(400).json({ error: 'Sessão ainda não paga.' });
            }
        } catch (error) {
            console.error("❌ Erro ao confirmar sessão:", error.message);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

// ──────────────────────────────────────────────────
// Lógica de processamento da sessão Stripe paga
// ──────────────────────────────────────────────────
async function processPaidSession(supabase, stripe, session) {
    console.log(`\n--- 💳 INICIANDO PROCESSAMENTO DE SESSÃO PAGA: ${session.id} ---`);
    try {
        const paymentMethod = session.payment_method_types?.[0] === 'card' ? 'Crédito' :
            session.payment_method_types?.[0] === 'pix' ? 'Pix' : 'Cartão/Stripe';

        console.log(`📝 [INFO] Método: ${paymentMethod} | Cliente: ${session.customer_email || 'N/A'}`);

        const { data: existingOrder, error: checkErr } = await supabase
            .from('pedidos').select('items').eq('stripe_session_id', session.id).maybeSingle();

        if (checkErr) {
            console.error("❌ [CHECK] Erro ao buscar pedido:", checkErr.message);
            return;
        }
        if (!existingOrder) {
            console.warn(`⚠️ [CHECK] Pedido não encontrado para sessão ${session.id}. Ignorando.`);
            return;
        }

        let originalItems = {};
        try {
            originalItems = typeof existingOrder.items === 'string'
                ? JSON.parse(existingOrder.items)
                : (existingOrder.items || {});
        } catch (e) {
            console.warn("⚠️ [PARSE] Erro ao parsear itens:", e.message);
            originalItems = { raw: existingOrder.items };
        }

        const { data: orderUpdate, error: updateErr } = await supabase
            .from('pedidos')
            .update({
                status: 'paid',
                stripe_payment_intent: session.payment_intent || null,
                items: JSON.stringify({ ...originalItems, payment_method: paymentMethod })
            })
            .eq('stripe_session_id', session.id)
            .eq('status', 'pending')
            .select()
            .maybeSingle();

        if (updateErr) {
            if (updateErr.code === '23505') {
                console.log(`⚠️ [UPDATE] Sessão ${session.id} ignorada — UNIQUE violation (já processada).`);
            } else {
                console.error("❌ [UPDATE] Erro fatal ao atualizar status:", updateErr.message);
            }
            return;
        }
        if (!orderUpdate) {
            console.log(`⚠️ [UPDATE] Sessão ${session.id} ignorada — pedido já processado.`);
            return;
        }

        const diff = Math.abs((session.amount_total / 100) - orderUpdate.total_amount);
        if (diff > 0.01) {
            console.error('❌ [STRIPE] Valor divergente! Esperado:', orderUpdate.total_amount, 'Recebido:', session.amount_total / 100);
            await supabase.from('pedidos').update({ status: 'error' }).eq('id', orderUpdate.id);
            return;
        }

        console.log(`✅ [UPDATE] Pedido ${orderUpdate.id} marcado como pago.`);

        const { data: customer, error: custErr } = await supabase
            .from('clientes').select('*').eq('id', orderUpdate.customer_id).single();

        if (custErr || !customer) {
            console.error("❌ [CUSTOMER] Dados do cliente não encontrados. Notificações abortadas.");
            return;
        }

        const notificationCustomer = {
            ...customer,
            name: session.metadata?.customerName || customer?.name || 'Cliente',
            whatsapp: session.metadata?.whatsapp || customer?.whatsapp,
            email: session.customer_email || customer?.email
        };

        // Reduzir estoque
        try {
            const itemsToReduce = originalItems.actual_items || [];
            const orderBakeDate = originalItems.batch_date || originalItems.fornada_date;
            if (orderBakeDate && itemsToReduce.length > 0) {
                for (const item of itemsToReduce) {
                    const { error: rpcError } = await supabase.rpc('processar_venda_estoque', {
                        p_id: String(item.id),
                        f_date: String(orderBakeDate),
                        amount: parseInt(item.qty)
                    });
                    if (!rpcError) {
                        console.log(`✅ [Estoque] RPC OK: ${item.name} (${orderBakeDate})`);
                    } else {
                        console.warn(`⚠️ [Estoque] RPC falhou, tentando fallback manual:`, rpcError.message);
                        const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', orderBakeDate).maybeSingle();
                        if (fornada) {
                            const { data: cycle } = await supabase
                                .from('produto_estoque_fornada')
                                .select('estoque_disponivel, vendas_confirmadas')
                                .eq('produto_id', item.id)
                                .eq('fornada_id', fornada.id)
                                .maybeSingle();
                            if (cycle) {
                                await supabase.from('produto_estoque_fornada')
                                    .update({
                                        estoque_disponivel: Math.max(0, cycle.estoque_disponivel - item.qty),
                                        vendas_confirmadas: (cycle.vendas_confirmadas || 0) + item.qty
                                    })
                                    .eq('id', cycle.id);
                                console.log(`[Estoque] Fallback Manual OK: ${item.name}`);
                            }
                        }
                    }
                }
            } else {
                console.warn("⚠️ [Estoque] Pedido sem data de fornada. Redução ignorada.");
            }
        } catch (stockErr) {
            console.error("❌ [ESTOQUE] Erro fatal:", stockErr.message);
        }

        if (session.metadata?.sessionId) {
            await supabase.from('carrinhos')
                .update({ status: 'completed' })
                .eq('session_id', session.metadata.sessionId);
        }

        const results = await Promise.allSettled([
            sendOrderEmails(supabase, orderUpdate, notificationCustomer, paymentMethod),
            sendOrderWhatsApp(supabase, orderUpdate, notificationCustomer, paymentMethod)
        ]);
        results.forEach((r, idx) => {
            const type = idx === 0 ? 'E-MAIL' : 'WHATSAPP';
            if (r.status === 'fulfilled') console.log(`✨ ${type}: Sucesso.`);
            else console.error(`❌ ${type} FALHOU:`, r.reason);
        });
    } catch (err) {
        console.error('💣 ERRO AO PROCESSAR SESSÃO PAGA:', err.message);
    }
}
