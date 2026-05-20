const express = require('express');
const { sendContactEmail } = require('../notification-service');
const { getCurrentStoreStatus } = require('../services/storeStatusService');
const { getUnifiedProductList } = require('../services/stockService');

// Rate limiter genérico em memória
function makeRateLimiter(windowMs, max, msg) {
    const map = new Map();
    setInterval(() => {
        const cut = Date.now() - windowMs;
        for (const [k, r] of map) if (r.first < cut) map.delete(k);
    }, windowMs).unref();
    return function (req, res, next) {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const r = map.get(ip);
        if (!r || now - r.first > windowMs) { map.set(ip, { count: 1, first: now }); return next(); }
        if (r.count >= max) return res.status(429).json({ error: msg });
        r.count++;
        next();
    };
}
const rlContact  = makeRateLimiter(5 * 60_000, 5,  'Muitas mensagens. Aguarde 5 minutos.');
const rlCartSync = makeRateLimiter(60_000,      60, 'Muitas requisições de carrinho. Aguarde 1 minuto.');

// supabasePublic = cliente com anon key (respeita RLS em tabelas públicas de config)
// supabase = service key, usado para operações com dados de usuário (carrinhos, pedidos, clientes)
module.exports = function (supabase, supabasePublic = supabase) {
    const router = express.Router();

    // ──────────────────────────────────────────────────
    // CONFIGURAÇÃO PÚBLICA (Categorias, Produtos, Conteúdo)
    // ──────────────────────────────────────────────────
    router.get('/config', async (req, res) => {
        try {
            const { data: categorias, error: catErr } = await supabasePublic.from('categorias').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(500);
            const { data: produtosRaw, error: prodErr } = await supabasePublic.from('produtos').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(500);
            const { data: content, error: contErr } = await supabasePublic.from('site_content').select('*');

            if (catErr || prodErr || contErr) throw new Error("Erro ao carregar configurações do banco.");

            const siteContent = {};
            content.forEach(c => siteContent[c.key] = c.value);

            // APLICA LÓGICA UNIFICADA DE ESTOQUE (FONTE ÚNICA DE VERDADE)
            const produtos = await getUnifiedProductList(supabase, produtosRaw);

            res.json({ categorias, produtos, siteContent });
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/config', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro ao carregar configurações.' });
        }
    });

    // ──────────────────────────────────────────────────
    // STATUS DA LOJA (Sincronizado)
    // ──────────────────────────────────────────────────
    // Config pública leve (telefone + email de contato) — sem autenticação
    router.get('/site-config', async (req, res) => {
        try {
            const { data } = await supabasePublic
                .from('site_content')
                .select('key, value')
                .in('key', ['contact_phone', 'contact_email']);
            const config = { phone: '5521966278965', contactEmail: 'contato@tochapadaria.com' };
            (data || []).forEach(row => {
                if (row.key === 'contact_phone' && row.value)  config.phone        = row.value;
                if (row.key === 'contact_email' && row.value)  config.contactEmail = row.value;
            });
            res.set('Cache-Control', 'public, max-age=60');
            res.json(config);
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/site-config', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro interno.' });
        }
    });

    router.get('/store-status', async (req, res) => {
        try {
            const { data, error } = await supabasePublic.from('site_content').select('value').eq('key', 'opening_hours').single();
            const config = data ? data.value : null;
            const status = getCurrentStoreStatus(config);
            res.json(status);
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/store-status', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro interno.' });
        }
    });

    // ──────────────────────────────────────────────────
    // SINCRONIZAÇÃO DO CARRINHO (Prevenção de Abandono)
    // ──────────────────────────────────────────────────
    function validateCartItems(cart) {
        if (!Array.isArray(cart) || cart.length === 0) return 'Carrinho inválido ou vazio.';
        if (cart.length > 50) return 'Carrinho excede o limite de 50 itens.';
        for (const item of cart) {
            if (!item || typeof item !== 'object') return 'Item do carrinho inválido.';
            if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') return 'Item sem identificador válido.';
            const qty = parseInt(item.qty);
            if (!Number.isInteger(qty) || qty < 1 || qty > 50) return `Quantidade inválida para o item "${item.id}".`;
        }
        return null;
    }

    router.post('/cart/sync', rlCartSync, async (req, res) => {
        try {
            const sessionId = req.cookies.session_id || req.session_id;
            const { customer, cart, totalAmount, order_id } = req.body;

            if (!sessionId || !cart) return res.status(400).json({ error: 'Dados incompletos.' });

            const cartError = validateCartItems(cart);
            if (cartError) return res.status(400).json({ error: cartError });

            const isUUID = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

            console.log(JSON.stringify({ tag: 'CART_SYNC', session_id: sessionId, order_id: order_id || null, timestamp: new Date().toISOString() }));

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

            const { error } = await supabase.from('carrinhos').upsert([record], { onConflict: 'session_id' });
            if (error) {
                console.error('[CART SYNC] upsert error:', error.message);
                if (record.customer_id !== undefined) {
                    delete record.customer_id;
                    const { error: e2 } = await supabase.from('carrinhos').upsert([record], { onConflict: 'session_id' });
                    if (e2) console.error("❌ Erro ao salvar carrinho:", e2.message);
                } else {
                    console.error("❌ Erro ao salvar carrinho:", error.message);
                }
            }
            res.json({ success: true });
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/cart/sync', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro ao sincronizar carrinho.' });
        }
    });

    // ──────────────────────────────────────────────────
    // RECUPERAÇÃO DE CARRINHO ABANDONADO
    // ──────────────────────────────────────────────────
    router.get('/recover/:token', async (req, res) => {
        try {
            const { token } = req.params;
            if (!token || token.length > 128) return res.status(400).json({ error: 'Token inválido.' });

            const { data: cartData, error } = await supabase
                .from('carrinhos')
                .select('items, customer_data, last_activity_at, status')
                .eq('recovery_token', token)
                .single();

            if (error || !cartData) return res.status(404).json({ error: 'Carrinho não encontrado.' });

            // Tokens expiram após 72h de inatividade
            const EXPIRY_MS = 72 * 60 * 60 * 1000;
            const lastActivity = new Date(cartData.last_activity_at || 0).getTime();
            if (Date.now() - lastActivity > EXPIRY_MS) {
                return res.status(410).json({ error: 'Link expirado.' });
            }

            let cartItems;
            try { cartItems = typeof cartData.items === 'string' ? JSON.parse(cartData.items) : cartData.items; }
            catch (_) { return res.status(500).json({ error: 'Dados do carrinho corrompidos.' }); }

            // Retorna apenas o nome do cliente (não email/whatsapp) — suficiente para UI
            const customerData = cartData.customer_data || {};
            res.json({ cart: cartItems, customer: { name: customerData.name || '' } });
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/recover', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro interno.' });
        }
    });

    // ──────────────────────────────────────────────────
    // STATUS DO PEDIDO (usado pelo checkout-mp.html)
    // ──────────────────────────────────────────────────
    router.get('/orders/:id', async (req, res) => {
        const { id } = req.params;
        const sid = req.cookies?.session_id || req.session_id;
        try {
            const { data: pedido, error } = await supabase
                .from('pedidos')
                .select('id, status, mp_payment_id, created_at, customer_id, items')
                .eq('id', id)
                .single();

            if (error || !pedido) {
                console.warn('[ORDER NOT FOUND]', { id });
                return res.status(404).json({ error: 'Pedido não encontrado.' });
            }

            // Verificação de propriedade: session deve estar vinculada a este pedido
            let authorized = false;
            let itemsData = {};
            try { itemsData = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || {}); } catch (_) {}

            // Check 1: client_session_id direto nos items (caso PIX polling — zero queries extras)
            if (sid && itemsData.client_session_id && itemsData.client_session_id === sid) {
                authorized = true;
            }

            // Check 2: sessão vinculada ao cliente dono do pedido (fallback para pedidos antigos)
            if (!authorized && sid && pedido.customer_id) {
                const { data: sess } = await supabase
                    .from('customer_sessions')
                    .select('customer_email')
                    .eq('session_id', sid)
                    .maybeSingle();
                if (sess?.customer_email) {
                    const { data: cust } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('email', sess.customer_email)
                        .eq('id', pedido.customer_id)
                        .maybeSingle();
                    if (cust) authorized = true;
                }
            }

            if (!authorized) {
                console.warn(JSON.stringify({ tag: 'ORDER_ACCESS_DENIED', order_id: id, timestamp: new Date().toISOString() }));
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            res.json({
                id: pedido.id,
                status: pedido.status,
                mp_payment_id: pedido.mp_payment_id,
                created_at: pedido.created_at
            });
        } catch (e) {
            console.error(JSON.stringify({ tag: 'API_ERROR', route: '/api/orders', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro interno.' });
        }
    });

    // ──────────────────────────────────────────────────
    // MÉTODOS DE PAGAMENTO ATIVOS (público)
    // ──────────────────────────────────────────────────
    router.get('/payment-methods', async (req, res) => {
        try {
            const { data } = await supabasePublic.from('site_content').select('value').eq('key', 'payment_methods').maybeSingle();
            res.json(data?.value || { card: true, pix: true, mp_card: false, mp_pix: true });
        } catch (e) {
            res.json({ card: true, pix: true, mp_card: false, mp_pix: true });
        }
    });

    // ──────────────────────────────────────────────────
    // FALE CONOSCO
    // ──────────────────────────────────────────────────
    router.post('/contact', rlContact, async (req, res) => {
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
