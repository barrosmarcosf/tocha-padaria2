const express = require('express');
const router  = express.Router();

const FUNNEL_NORM = {
    'site_enter':       'site_enter',
    'view_page':        'site_enter',
    'cart_created':     'cart_created',
    'add_to_cart':      'cart_created',
    'checkout_started': 'checkout_started',
    'start_checkout':   'checkout_started',
    'payment_attempted':'payment_attempted',
    'payment_attempt':  'payment_attempted',
    'payment_success':  'payment_success',
    'payment_failed':   'payment_failed',
};

module.exports = function (supabase) {
    router.post('/events', async (req, res) => {
        // Responde antes de processar — tracking nunca pode bloquear o cliente
        res.json({ ok: true });

        try {
            const { event, session_id, metadata } = req.body || {};
            if (!event || typeof event !== 'string') return;

            const sid  = session_id ? String(session_id).slice(0, 128) : null;
            const meta = metadata && typeof metadata === 'object' ? metadata : {};

            // Sempre grava na tabela events (backward compat)
            await supabase.from('events').insert({
                event_name: event.slice(0, 64),
                session_id: sid,
                metadata:   meta,
            });

            // Se for evento de funil, também grava em funnel_events
            const canonical = FUNNEL_NORM[event.slice(0, 64)];
            if (canonical) {
                supabase.from('funnel_events').insert({
                    event_type: canonical,
                    session_id: sid,
                    metadata:   meta,
                }).catch(() => {});
            }
        } catch (_) {}
    });

    return router;
};
