'use strict';

const { sendAlert } = require('../../monitor/alert-dispatcher');

// Throttle: no máximo 1 alerta por tag+order_id por hora
const _alertThrottle = new Map();
setInterval(() => {
    const cutoff = Date.now() - 3_600_000;
    for (const [k, ts] of _alertThrottle) if (ts < cutoff) _alertThrottle.delete(k);
}, 3_600_000).unref();

function systemAlert(tag, data = {}) {
    const payload = JSON.stringify({ tag, ...data, timestamp: new Date().toISOString() });
    console.error(payload);

    const throttleKey = `${tag}:${data.order_id || ''}`;
    if (_alertThrottle.has(throttleKey)) return;
    _alertThrottle.set(throttleKey, Date.now());

    const detail = data.error || data.orders
        ? (data.error || `${data.orders?.length} pedidos afetados`)
        : undefined;

    sendAlert({ tipo: tag, order_id: data.order_id, detail, timestamp: new Date().toISOString() })
        .catch(e => console.error(JSON.stringify({ tag: 'SYSTEM_ALERT_DISPATCH_FAILED', error: e.message, original_tag: tag, timestamp: new Date().toISOString() })));
}

module.exports = { systemAlert };
