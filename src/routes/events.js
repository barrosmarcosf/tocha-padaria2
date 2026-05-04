const express = require('express');
const router = express.Router();

module.exports = function (supabase) {
    router.post('/events', async (req, res) => {
        // Responde antes de processar — tracking nunca pode bloquear o cliente
        res.json({ ok: true });

        try {
            const { event, session_id, metadata } = req.body || {};
            if (!event || typeof event !== 'string') return;

            await supabase.from('events').insert({
                event_name:  event.slice(0, 64),
                session_id:  session_id ? String(session_id).slice(0, 128) : null,
                metadata:    metadata && typeof metadata === 'object' ? metadata : {},
            });
        } catch (_) {
            // Silencioso: tracking não pode derrubar o servidor
        }
    });

    return router;
};
