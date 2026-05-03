const express = require('express');
const { sendContactEmail } = require('../notification-service');
const { getCurrentStoreStatus } = require('../services/storeStatusService');
const { getUnifiedProductList } = require('../services/stockService');

module.exports = function (supabase) {
    const router = express.Router();

    // ──────────────────────────────────────────────────
    // CONFIGURAÇÃO PÚBLICA (Categorias, Produtos, Conteúdo)
    // ──────────────────────────────────────────────────
    router.get('/config', async (req, res) => {
        try {
            const { data: categorias, error: catErr } = await supabase.from('categorias').select('*').eq('is_active', true).order('display_order', { ascending: true });
            const { data: produtosRaw, error: prodErr } = await supabase.from('produtos').select('*').eq('is_active', true).order('display_order', { ascending: true });
            const { data: content, error: contErr } = await supabase.from('site_content').select('*');

            if (catErr || prodErr || contErr) throw new Error("Erro ao carregar configurações do banco.");

            const siteContent = {};
            content.forEach(c => siteContent[c.key] = c.value);

            // APLICA LÓGICA UNIFICADA DE ESTOQUE (FONTE ÚNICA DE VERDADE)
            const produtos = await getUnifiedProductList(supabase, produtosRaw);

            res.json({ categorias, produtos, siteContent });
        } catch (e) {
            console.error("❌ Erro ao carregar /api/config:", e.message);
            res.status(500).json({ error: e.message });
        }
    });

    // ──────────────────────────────────────────────────
    // STATUS DA LOJA (Sincronizado)
    // ──────────────────────────────────────────────────
    router.get('/store-status', async (req, res) => {
        try {
            const { data, error } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').single();
            const config = data ? data.value : null;
            const status = getCurrentStoreStatus(config);
            res.json(status);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // ──────────────────────────────────────────────────
    // SINCRONIZAÇÃO DO CARRINHO (Prevenção de Abandono)
    // ──────────────────────────────────────────────────
    router.post('/cart/sync', async (req, res) => {
        try {
            const sessionId = req.cookies.session_id || req.session_id;
            const { customer, cart, totalAmount, order_id } = req.body;

            if (!sessionId || !cart) return res.status(400).json({ error: 'Dados incompletos.' });

            const isUUID = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

            console.log(`[SESSION COOKIE] ${sessionId}`);
            console.log(`[CART SYNC SESSION] session_id=${sessionId} order_id=${order_id || 'none'}`);

            const record = {
                session_id: sessionId,
                customer_data: customer,
                items: JSON.stringify(cart),
                total_amount: totalAmount,
                status: 'active',
                last_activity_at: new Date().toISOString(),
                recovery_sent: false,
                recovery_token: require('crypto').randomBytes(24).toString('hex')
            };

            if (order_id) {
                if (isUUID(order_id)) {
                    record.order_id = order_id;
                } else {
                    console.warn('[CART DEBUG] order_id inválido ignorado (não é UUID):', order_id);
                }
            }

            if (customer?.email) {
                try {
                    const { data: clienteRow } = await supabase
                        .from('clientes').select('id').eq('email', customer.email).maybeSingle();
                    if (clienteRow?.id && isUUID(clienteRow.id)) record.customer_id = clienteRow.id;
                } catch (_) {}
            }

            console.log('[CART SAVE TRACE] origem: public.js /cart/sync upsert');
            console.log('[CART DEBUG]', JSON.stringify(record));

            const { error } = await supabase.from('carrinhos').upsert([record], { onConflict: 'session_id' });
            if (error) {
                console.error('[CART DEBUG] upsert error:', error.message, '| payload:', JSON.stringify(record));
                if (record.customer_id !== undefined) {
                    delete record.customer_id;
                    console.log('[CART SAVE TRACE] origem: public.js /cart/sync upsert retry (sem customer_id)');
                    const { error: e2 } = await supabase.from('carrinhos').upsert([record], { onConflict: 'session_id' });
                    if (e2) console.error("❌ Erro ao salvar carrinho:", e2.message);
                } else {
                    console.error("❌ Erro ao salvar carrinho:", error.message);
                }
            }
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // ──────────────────────────────────────────────────
    // RECUPERAÇÃO DE CARRINHO ABANDONADO
    // ──────────────────────────────────────────────────
    router.get('/recover/:token', async (req, res) => {
        try {
            const { token } = req.params;
            const { data: cartData, error } = await supabase
                .from('carrinhos')
                .select('*')
                .eq('recovery_token', token)
                .single();

            if (error || !cartData) return res.status(404).json({ error: 'Carrinho não encontrado.' });

            let cartItems;
            try { cartItems = typeof cartData.items === 'string' ? JSON.parse(cartData.items) : cartData.items; }
            catch (_) { return res.status(500).json({ error: 'Dados do carrinho corrompidos.' }); }
            res.json({ cart: cartItems, customer: cartData.customer_data });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // ──────────────────────────────────────────────────
    // STATUS DO PEDIDO (usado pelo checkout-mp.html)
    // ──────────────────────────────────────────────────
    router.get('/orders/:id', async (req, res) => {
        const { id } = req.params;
        console.log('[ORDER FETCH HIT]', id);
        try {
            const { data: pedido, error } = await supabase
                .from('pedidos')
                .select('id, status, mp_payment_id, created_at')
                .eq('id', id)
                .single();

            if (error || !pedido) {
                console.warn('[ORDER NOT FOUND]', { id });
                return res.status(404).json({ error: 'Pedido não encontrado.' });
            }

            res.json({
                id: pedido.id,
                status: pedido.status,
                mp_payment_id: pedido.mp_payment_id,
                created_at: pedido.created_at
            });
        } catch (e) {
            console.error('[ORDER GET ERROR]', { id, error: e.message });
            res.status(500).json({ error: e.message });
        }
    });

    // ──────────────────────────────────────────────────
    // MÉTODOS DE PAGAMENTO ATIVOS (público)
    // ──────────────────────────────────────────────────
    router.get('/payment-methods', async (req, res) => {
        try {
            const { data } = await supabase.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
            res.json(data?.value || { card: true, pix: true, mp_card: false, mp_pix: true });
        } catch (e) {
            res.json({ card: true, pix: true, mp_card: false, mp_pix: true });
        }
    });

    // ──────────────────────────────────────────────────
    // FALE CONOSCO
    // ──────────────────────────────────────────────────
    router.post('/contact', async (req, res) => {
        try {
            const { name, email, phone, message } = req.body;
            if (!name || !email || !message) {
                return res.status(400).json({ error: 'Os campos Nome, E-mail e Mensagem são obrigatórios.' });
            }
            await sendContactEmail({ name, email, phone, message });
            res.json({ success: true });
        } catch (error) {
            console.error('Erro no contato:', error);
            res.status(500).json({ error: 'Erro ao enviar mensagem.' });
        }
    });

    return router;
};
