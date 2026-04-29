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
            const { sessionId, customer, cart, totalAmount } = req.body;
            if (!sessionId || !cart) return res.status(400).json({ error: 'Dados incompletos.' });

            console.log(`[ABANDONO] Sincronizando sessão: ${sessionId}`);

            const { error } = await supabase.from('carrinhos').upsert([{
                session_id: sessionId,
                customer_data: customer,
                items: JSON.stringify(cart),
                total_amount: totalAmount,
                status: 'active',
                last_activity_at: new Date().toISOString(),
                recovery_sent: false,
                recovery_token: `rec-${sessionId}-${Date.now()}`
            }], { onConflict: 'session_id' });

            if (error) console.error("❌ Erro ao salvar carrinho:", error.message);
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

            res.json({
                cart: JSON.parse(cartData.items),
                customer: cartData.customer_data
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
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
