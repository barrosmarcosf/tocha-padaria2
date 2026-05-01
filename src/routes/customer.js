const express = require('express');

module.exports = function (supabase) {
    const router = express.Router();

    // POST /api/customer/save — upsert cliente + vincula sessão
    router.post('/save', async (req, res) => {
        try {
            const { name, email, whatsapp } = req.body;
            if (!name || !email || !whatsapp) {
                return res.status(400).json({ error: 'name, email e whatsapp são obrigatórios.' });
            }

            const { data: existing } = await supabase
                .from('clientes')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existing) {
                await supabase.from('clientes').update({ name, whatsapp }).eq('id', existing.id);
            } else {
                await supabase.from('clientes').insert([{ name, email, whatsapp }]);
            }
            console.log('[CLIENT SAVED]', { email, name });

            const sid = req.cookies?.session_id || req.session_id;
            if (sid) {
                const { error: sessionErr } = await supabase
                    .from('customer_sessions')
                    .upsert(
                        { session_id: sid, customer_email: email, updated_at: new Date().toISOString() },
                        { onConflict: 'session_id' }
                    );
                if (sessionErr) {
                    console.warn('[SESSION LINK WARN]', sessionErr.message);
                } else {
                    console.log('[SESSION LINKED]', { session_id: sid, email });
                }
            }

            res.json({ ok: true });
        } catch (e) {
            console.error('[CLIENT SAVE ERROR]', e.message);
            res.status(500).json({ error: e.message });
        }
    });

    // GET /api/customer/me — retorna dados do cliente associado à sessão atual
    router.get('/me', async (req, res) => {
        try {
            const sid = req.cookies?.session_id || req.session_id;
            if (!sid) return res.json(null);

            const { data: session } = await supabase
                .from('customer_sessions')
                .select('customer_email')
                .eq('session_id', sid)
                .maybeSingle();

            if (!session?.customer_email) return res.json(null);

            const { data: customer } = await supabase
                .from('clientes')
                .select('name, email, whatsapp')
                .eq('email', session.customer_email)
                .maybeSingle();

            if (!customer) return res.json(null);

            console.log('[CUSTOMER LOADED]', { email: customer.email });
            res.json(customer);
        } catch (e) {
            console.error('[CUSTOMER ME ERROR]', e.message);
            res.json(null);
        }
    });

    return router;
};
