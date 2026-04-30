const express = require('express');
const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
const { getUnifiedAvailableStock } = require('../services/stockService');

module.exports = function (supabase, stripe) {
    const router = express.Router();

    const PORT = process.env.PORT || 3333;

    // ──────────────────────────────────────────────────
    // CHECKOUT (Cria a sessão no Stripe e o pedido no Supabase)
    // ──────────────────────────────────────────────────
    router.post('/checkout', async (req, res) => {
        try {
            const { customer, cart, totalAmount } = req.body;

            if (!customer || !cart || cart.length === 0) {
                return res.status(400).json({ error: 'Dados incompletos do carrinho ou cliente.' });
            }

            // 🔒 IDEMPOTÊNCIA: Evita duplicidade em cliques múltiplos ou refresh
            const idemKey = req.headers['x-idempotency-key'] || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            try {
                const { data: existing, error: idemErr } = await supabase
                    .from('pedidos')
                    .select('id, stripe_session_id, items')
                    .eq('idempotency_key', idemKey)
                    .maybeSingle();

                if (!idemErr && existing) {
                    const items = typeof existing.items === 'string' ? JSON.parse(existing.items) : existing.items;
                    if (items.client_session_id && items.client_session_id !== req.session_id) {
                        return res.status(403).json({ error: 'Acesso negado: ID de sessão inválido.' });
                    }
                    return res.json({ url: `https://checkout.stripe.com/pay/${existing.stripe_session_id}` }); 
                }
            } catch (e) {
                console.warn('⚠️ [Idempotency] Erro ao verificar chave. Continuando.', e.message);
            }

            // 🔒 VALIDAÇÃO DE MÉTODOS ATIVOS (BACKEND É A FONTE DA VERDADE)
            const { data: paySettings } = await supabase.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
            const s = paySettings?.value || {};
            
            // O frontend do Stripe sempre manda session.payment_method_types = ['card', 'pix'] ou similar
            // Aqui validamos se a configuração global permite Stripe (card)
            if (s.mp_card === true || !s.card) {
                return res.status(403).json({ error: 'Stripe desabilitado' });
            }

            // 0. AVALIAR STATUS DA LOJA ANTES DO CHECKOUT
            const { getUnifiedStoreStatus } = require('../services/storeStatusService');
            const storeStatusResult = await getUnifiedStoreStatus(supabase);
            
            // Rejeita a criação se fechada (exceto se permitir encomendas p/ próxima fornada)
            if (!storeStatusResult.isOpen && !storeStatusResult.allowNextBatch) {
                return res.status(403).json({ error: storeStatusResult.message || 'Loja fechada temporariamente e não aceitando encomendas.' });
            }

            // 0.5 VALIDAR ESTOQUE POR CICLO DE FORNADA
            const productIds = cart.map(item => item.id);
            const batchDate = storeStatusResult.batchDate || storeStatusResult.nextBatchDate;

            if (batchDate) {
                // VALIDAR ESTOQUE USANDO A FONTE ÚNICA DE VERDADE
                for (const item of cart) {
                    const available = await getUnifiedAvailableStock(supabase, item.id);
                    console.log(`📦 [StockCheck] Produto: ${item.id}, Solicitado: ${item.qty}, Disponível: ${available}`);

                    if (available < item.qty) {
                         const { data: pInfo } = await supabase.from('produtos').select('name').eq('id', item.id).maybeSingle();
                         console.warn(`⚠️ [StockCheck] Falha: Estoque insuficiente para ${pInfo?.name || item.id}`);
                         return res.status(400).json({ 
                             error: `Estoque insuficiente para "${pInfo?.name || item.id}". Disponível agora: ${available}` 
                         });
                    }
                }
            }

            // 1. REGISTRAR/ATUALIZAR CLIENTE
            console.log("📝 [Checkout] Cliente:", customer);
            let customerId;
            const { data: existingCustomer } = await supabase
                .from('clientes')
                .select('id')
                .eq('email', customer.email)
                .maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;
                console.log("📝 [Checkout] Atualizando cliente existente:", customerId);
                await supabase
                    .from('clientes')
                    .update({ name: customer.name, whatsapp: customer.whatsapp })
                    .eq('id', customerId);
            } else {
                console.log("📝 [Checkout] Criando novo cliente...");
                const { data: newCustomer, error: insertError } = await supabase
                    .from('clientes')
                    .insert([{ name: customer.name, email: customer.email, whatsapp: customer.whatsapp }])
                    .select()
                    .single();

                if (insertError) {
                    console.error("❌ [Checkout] Erro ao criar cliente:", insertError);
                    throw insertError;
                }
                customerId = newCustomer.id;
            }

            // 2. MONTAR LINHAS DE PRODUTOS
            const line_items = cart.map(item => ({
                price_data: {
                    currency: 'brl',
                    product_data: { name: item.name },
                    unit_amount: Math.round(Number(item.price) * 100),
                },
                quantity: parseInt(item.qty),
            }));

            console.log("🛒 [Checkout] Itens formatados:", line_items.length);

            // 2.5 BUSCAR MÉTODOS ATIVOS
            const { data: payContent } = await supabase.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
            let payment_settings = payContent ? payContent.value : { card: true, pix: false }; // Default seguro: apenas cartão
            let active_methods = [];
            if (payment_settings.card) active_methods.push('card');
            if (payment_settings.pix) active_methods.push('pix');
            
            if (active_methods.length === 0) {
                active_methods = ['card']; // Fallback absoluto
            }

            // 3. CRIAR SESSÃO DE CHECKOUT
            const origin = req.headers.origin || `http://localhost:${PORT}`;
            let session;
            try {
                session = await stripe.checkout.sessions.create({
                    payment_method_types: active_methods,
                    line_items,
                    mode: 'payment',
                    success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${origin}/?status=cancel`,
                    customer_email: customer.email,
                    metadata: {
                        whatsapp: customer.whatsapp,
                        customerName: customer.name,
                        sessionId: req.body.sessionId
                    }
                });
            } catch (stripeErr) {
                console.error("⚠️ Falha ao criar sessão com métodos:", active_methods, stripeErr.message);
                // Se falhou (geralmente por causa do PIX), tenta o fallback apenas com cartão
                if (active_methods.includes('pix')) {
                    console.log("🔄 Tentando fallback automático: apenas 'card'...");
                    session = await stripe.checkout.sessions.create({
                        payment_method_types: ['card'],
                        line_items,
                        mode: 'payment',
                        success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
                        cancel_url: `${origin}/?status=cancel`,
                        customer_email: customer.email,
                        metadata: {
                            whatsapp: customer.whatsapp,
                            customerName: customer.name,
                            sessionId: req.body.sessionId
                        }
                    });
                } else {
                    throw stripeErr;
                }
            }

            console.log(`Checkout iniciado para ${customer.name}: ${session.id}`);

            // 4. REGISTRAR PEDIDO PENDENTE
            let newOrder;
            try {
                const orderData = {
                    customer_id: customerId,
                    stripe_session_id: session.id,
                    total_amount: totalAmount,
                    status: 'pending',
                    items: JSON.stringify({ 
                        actual_items: cart, 
                        order_type: storeStatusResult.orderType, 
                        cycle_type: storeStatusResult.cycleType,
                        batch_date: storeStatusResult.batchDate || storeStatusResult.nextBatchDate,
                        batch_label: storeStatusResult.batchLabel || storeStatusResult.nextBatchLabel,
                        client_session_id: req.session_id 
                    })
                };

                if (idemKey && !idemKey.startsWith('fallback_')) {
                    orderData.idempotency_key = idemKey;
                }

                const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
                
                if (error) {
                    if (error.message.includes('idempotency_key')) {
                        console.warn('⚠️ [DB] Coluna idempotency_key ausente no Stripe checkout. Inserindo sem ela.');
                        delete orderData.idempotency_key;
                        const { data: retryData, error: retryErr } = await supabase.from('pedidos').insert([orderData]).select().single();
                        if (retryErr) throw retryErr;
                        newOrder = retryData;
                    } else {
                        throw error;
                    }
                } else {
                    newOrder = data;
                }
            } catch (err) {
                if (err.code === '23505' || err.message?.includes('duplicate key')) {
                    const { data: existing } = await supabase.from('pedidos').select('id, stripe_session_id').eq('idempotency_key', idemKey).single();
                    return res.json({ url: `https://checkout.stripe.com/pay/${existing.stripe_session_id}` }); 
                }
                throw err;
            }

            if (!newOrder) throw new Error('Falha ao registrar pedido.');

            // 5. RETORNO PARA O FRONTEND
            res.json({ url: session.url });

        } catch (error) {
            console.error('❌ [Checkout] Erro fatal:', error);
            res.status(500).json({ error: error.message || 'Ocorreu um erro interno ao processar o checkout.' });
        }
    });

    // ──────────────────────────────────────────────────
    // WEBHOOK DO STRIPE (com verificação de assinatura)
    // ──────────────────────────────────────────────────
    // NOTA: O body do webhook precisa ser raw (buffer), não JSON parsed.
    // O middleware de raw body é configurado no server.js antes desta rota.
    router.post('/webhook', async (req, res) => {
        let event;

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret) {
            // PRODUÇÃO: Validar assinatura do Stripe
            const sig = req.headers['stripe-signature'];
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                console.error(`⚠️ Webhook signature verification failed:`, err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        } else {
            // DESENVOLVIMENTO: Aceitar sem verificação (com aviso)
            console.warn("⚠️ STRIPE_WEBHOOK_SECRET não configurado no .env. Webhook aceito sem verificação de assinatura.");
            try {
                // Como usamos express.raw({ type: 'application/json' }), o body é um Buffer.
                event = JSON.parse(req.body.toString());
            } catch (err) {
                console.error("❌ Falha crítica ao processar o payload bruto do webhook:", err.message);
                return res.status(400).send(`Webhook Error: Malformed JSON`);
            }
        }

        console.log(`\n🔔 WEBHOOK RECEBIDO: ${event.type}`);
        res.json({ received: true });

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            // Processa em background e captura erros para não derrubar o servidor
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
                // Dispara o processamento em background (Async)
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
// Lógica compartilhada para processar a sessão paga
// Idempotência via banco de dados (não mais em memória)
// ──────────────────────────────────────────────────
async function processPaidSession(supabase, stripe, session) {
    console.log(`\n--- 💳 INICIANDO PROCESSAMENTO DE SESSÃO PAGA: ${session.id} ---`);
    try {
        const paymentMethod = session.payment_method_types?.[0] === 'card' ? 'Crédito' :
            session.payment_method_types?.[0] === 'pix' ? 'Pix' : 'Cartão/Stripe';

        console.log(`📝 [INFO] Método detectado: ${paymentMethod} | Cliente: ${session.customer_email || 'N/A'}`);

        // Buscar itens do pedido para incluí-los no UPDATE (SELECT só para dados, não para guarda)
        const { data: existingOrder, error: checkErr } = await supabase
            .from('pedidos')
            .select('items')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

        if (checkErr) {
            console.error("❌ [CHECK] Erro ao buscar pedido no Supabase:", checkErr.message);
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

        // UPDATE atômico com condição: só atualiza se status ainda for 'pending'.
        // Equivale a: UPDATE pedidos SET ... WHERE stripe_session_id=X AND status='pending' RETURNING *
        // PostgreSQL serializa chamadas concorrentes — apenas uma vence o lock da linha.
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
                // UNIQUE violation em stripe_payment_intent: outro processo já processou
                console.log(`⚠️ [UPDATE] Sessão ${session.id} ignorada — UNIQUE violation (já processada).`);
            } else {
                console.error("❌ [UPDATE] Erro fatal ao atualizar status no Supabase:", updateErr.message);
            }
            return;
        }

        if (!orderUpdate) {
            // 0 linhas atualizadas: já estava paid (segunda chamada do webhook ou polling)
            console.log(`⚠️ [UPDATE] Sessão ${session.id} ignorada — pedido já processado.`);
            return;
        }

        // 🔒 VALIDAÇÃO DE VALOR (Tarefa 5 - Robusta)
        const diff = Math.abs((session.amount_total / 100) - orderUpdate.total_amount);
        if (diff > 0.01) {
            console.error('❌ [STRIPE] Valor divergente detectado! Esperado:', orderUpdate.total_amount, 'Recebido:', session.amount_total / 100);
            await supabase.from('pedidos').update({ status: 'error' }).eq('id', orderUpdate.id);
            return;
        }

        console.log(`✅ [UPDATE] Pedido ${orderUpdate.id} marcado como pago.`);

        // Buscar dados do cliente para notificações
        console.log(`[Supabase] Buscando dados do cliente ID: ${orderUpdate.customer_id}...`);
        const { data: customer, error: custErr } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', orderUpdate.customer_id)
            .single();

        if (custErr || !customer) {
            console.error("❌ [CUSTOMER] Dados do cliente não encontrados. Notificações abortadas.");
            return;
        }

        // Montar objeto unificado para o serviço de notificação
        const notificationCustomer = {
            ...customer,
            name: session.metadata?.customerName || customer?.name || customer?.nome || 'Cliente',
            whatsapp: session.metadata?.whatsapp || customer?.whatsapp,
            email: session.customer_email || customer?.email
        };

        // 🚀 REDUZIR ESTOQUE POR CICLO DE FORNADA (DEFINITIVO)
        try {
            const itemsToReduce = originalItems.actual_items || [];
            const orderBakeDate = originalItems.batch_date || originalItems.fornada_date;

            console.log(`[Estoque] Iniciando redução p/ ${itemsToReduce.length} itens na fornada ${orderBakeDate}...`);
            
            if (orderBakeDate) {
                for (const item of itemsToReduce) {
                    // Tentativa 1: Função Atômica 'processar_venda_estoque'
                    const { error: rpcError } = await supabase.rpc('processar_venda_estoque', { 
                        p_id: String(item.id), 
                        f_date: String(orderBakeDate),
                        amount: parseInt(item.qty) 
                    });

                    if (!rpcError) {
                        console.log(`✅ [Estoque] Redução OK (RPC): ${item.name} (${orderBakeDate})`);
                    } else {
                        console.warn(`⚠️ [Estoque] RPC falhou, tentando fallback manual:`, rpcError.message);
                        
                        // Fallback Manual p/ Ciclo (Produto + Fornada)
                        const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', orderBakeDate).maybeSingle();
                        if (fornada) {
                            const { data: cycle } = await supabase
                                .from('produto_estoque_fornada')
                                .select('estoque_disponivel, vendas_confirmadas')
                                .eq('produto_id', item.id)
                                .eq('fornada_id', fornada.id)
                                .maybeSingle();

                            if (cycle) {
                                const newDisp = Math.max(0, cycle.estoque_disponivel - item.qty);
                                const newSold = (cycle.vendas_confirmadas || 0) + item.qty;
                                await supabase.from('produto_estoque_fornada')
                                    .update({ estoque_disponivel: newDisp, vendas_confirmadas: newSold })
                                    .eq('id', cycle.id);
                                console.log(`[Estoque] Fallback Manual OK: ${item.name} -> Disp: ${newDisp}`);
                            }
                        }
                    }
                }
            } else {
                console.warn("⚠️ [Estoque] Pedido sem data de fornada vinculada. Redução ignorada.");
            }
        } catch (stockErr) {
            console.error("❌ [ESTOQUE] Erro fatal:", stockErr.message);
        }

        console.log(`🚀 Disparando notificações para ${notificationCustomer.name}...`);

        // MARCAR CARRINHO COMO CONCLUÍDO
        if (session.metadata?.sessionId) {
            await supabase.from('carrinhos')
                .update({ status: 'completed' })
                .eq('session_id', session.metadata.sessionId);
        }

        const results = await Promise.allSettled([
            sendOrderEmails(supabase, orderUpdate, notificationCustomer, paymentMethod),
            sendOrderWhatsApp(supabase, orderUpdate, notificationCustomer, paymentMethod)
        ]);

        results.forEach((res, idx) => {
            const type = idx === 0 ? "E-MAIL" : "WHATSAPP";
            if (res.status === 'fulfilled') {
                console.log(`✨ ${type}: Sucesso.`);
            } else {
                console.error(`❌ ${type} FALHOU:`, res.reason);
            }
        });
    } catch (err) {
        console.error('💣 ERRO AO PROCESSAR SESSÃO PAGA:', err.message);
    }
}
