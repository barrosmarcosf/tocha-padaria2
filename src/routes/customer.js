const express = require('express');

// Rate limiter: máx 10 req/min por IP em /save (previne spam de inserções)
const _rlSaveMap = new Map();
setInterval(() => { const c = Date.now() - 60_000; for (const [k, r] of _rlSaveMap) if (r.first < c) _rlSaveMap.delete(k); }, 60_000).unref();
function rlSave(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const r = _rlSaveMap.get(ip);
    if (!r || now - r.first > 60_000) { _rlSaveMap.set(ip, { count: 1, first: now }); return next(); }
    if (r.count >= 10) return res.status(429).json({ error: 'Muitas requisições. Aguarde 1 minuto.' });
    r.count++;
    next();
}

module.exports = function (supabase) {
    const router = express.Router();

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // POST /api/customer/save — upsert cliente + vincula sessão
    router.post('/save', rlSave, async (req, res) => {
        try {
            const { name, email, whatsapp } = req.body;
            if (!name || !email || !whatsapp) {
                return res.status(400).json({ error: 'name, email e whatsapp são obrigatórios.' });
            }
            if (typeof name !== 'string' || name.length > 120) return res.status(400).json({ error: 'name inválido.' });
            if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'email inválido.' });
            if (typeof whatsapp !== 'string' || whatsapp.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'whatsapp inválido.' });

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
            console.log(JSON.stringify({ tag: 'CLIENT_SAVED', timestamp: new Date().toISOString() }));

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
                    console.log(JSON.stringify({ tag: 'SESSION_LINKED', timestamp: new Date().toISOString() }));
                }
            }

            res.json({ ok: true });
        } catch (e) {
            console.error(JSON.stringify({ tag: 'CUSTOMER_SAVE_ERROR', error: e.message, timestamp: new Date().toISOString() }));
            res.status(500).json({ error: 'Erro interno.' });
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

            res.json(customer);
        } catch (e) {
            console.error('[CUSTOMER ME ERROR]', e.message);
            res.json(null);
        }
    });

    return router;
};
