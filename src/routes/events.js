'use strict';
const express = require('express');
const router  = express.Router();

const ALLOWED_EVENTS = new Set([
    'site_enter', 'view_page',
    'cart_created', 'add_to_cart',
    'checkout_started', 'start_checkout',
    'payment_attempted', 'payment_attempt',
    'payment_success', 'payment_failed',
]);

const FUNNEL_NORM = {
    'site_enter':        'site_enter',
    'view_page':         'site_enter',
    'cart_created':      'cart_created',
    'add_to_cart':       'cart_created',
    'checkout_started':  'checkout_started',
    'start_checkout':    'checkout_started',
    'payment_attempted': 'payment_attempted',
    'payment_attempt':   'payment_attempted',
    'payment_success':   'payment_success',
    'payment_failed':    'payment_failed',
};

// Rate limiter: 60 req/min por IP
const _eventsRateMap = new Map();
setInterval(() => {
    const cutoff = Date.now() - 60_000;
    _eventsRateMap.forEach((rec, ip) => { if (rec.first < cutoff) _eventsRateMap.delete(ip); });
}, 5 * 60_000).unref();

function rateLimitEvents(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    const now = Date.now();
    const rec = _eventsRateMap.get(ip);
    if (!rec || now - rec.first > 60_000) {
        _eventsRateMap.set(ip, { count: 1, first: now });
        return next();
    }
    if (rec.count >= 60) return res.status(429).json({ error: 'Muitas requisições.' });
    rec.count++;
    next();
}

module.exports = function (supabase) {
    router.post('/events', rateLimitEvents, async (req, res) => {
        // Responde antes de processar — tracking nunca pode bloquear o cliente
        res.json({ ok: true });

        try {
            const { event, session_id, metadata } = req.body || {};
            if (!event || typeof event !== 'string') return;

            const eventName = event.slice(0, 64);

            // Rejeita eventos desconhecidos — não são salvos nem parcialmente processados
            if (!ALLOWED_EVENTS.has(eventName)) return;

            const sid  = session_id ? String(session_id).slice(0, 128) : null;
            const meta = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
                ? metadata
                : {};

            await supabase.from('events').insert({
                event_name: eventName,
                session_id: sid,
                metadata:   meta,
            });

            const canonical = FUNNEL_NORM[eventName];
            if (canonical) {
                await supabase.from('funnel_events').insert({
                    event_type: canonical,
                    session_id: sid,
                    metadata:   meta,
                });
            }
        } catch (_) {}
    });

    return router;
};
