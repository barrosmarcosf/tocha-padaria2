'use strict';

const { sendAlert } = require('../../monitor/alert-dispatcher');

// Supabase injetado via initSystemAlert() no boot do server.js
let _supabase = null;
function initSystemAlert(supabase) { _supabase = supabase; }

// Throttle: no máximo 1 alerta por tag+order_id por hora
const _alertThrottle = new Map();
setInterval(() => {
    const cutoff = Date.now() - 3_600_000;
    for (const [k, ts] of _alertThrottle) if (ts < cutoff) _alertThrottle.delete(k);
}, 3_600_000).unref();

function systemAlert(tag, data = {}) {
    const ts = new Date().toISOString();
    const payload = { tag, ...data, timestamp: ts };
    console.error(JSON.stringify({ tag: 'SYSTEM_ALERT', ...payload }));

    const throttleKey = `${tag}:${data.order_id || ''}`;
    const throttled = _alertThrottle.has(throttleKey);
    if (!throttled) _alertThrottle.set(throttleKey, Date.now());

    // Persiste incidente no banco (fire-and-forget, não bloqueia)
    if (_supabase) {
        _supabase.from('system_incidents').insert({ type: tag, payload }).then(({ error }) => {
            if (error) console.error(JSON.stringify({ tag: 'SYSTEM_ALERT_DB_FAIL', error: error.message, original_tag: tag, timestamp: new Date().toISOString() }));
        }, e => console.error(JSON.stringify({ tag: 'SYSTEM_ALERT_DB_FAIL', error: e.message, original_tag: tag, timestamp: new Date().toISOString() })));
    }

    if (throttled) return;

    const detail = data.error || data.orders
        ? (data.error || `${data.orders?.length} pedidos afetados`)
        : undefined;

    sendAlert({ tipo: tag, order_id: data.order_id, detail, timestamp: ts })
        .catch(e => console.error(JSON.stringify({ tag: 'SYSTEM_ALERT_DISPATCH_FAILED', error: e.message, original_tag: tag, timestamp: new Date().toISOString() })));
}

module.exports = { systemAlert, initSystemAlert };
