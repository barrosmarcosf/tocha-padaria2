'use strict';

const https = require('https');

async function sendAlert({ tipo, order_id, timestamp, ambiente, detail }) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const ts     = timestamp || new Date().toISOString();
    const env    = ambiente || process.env.NODE_ENV || 'production';

    if (!token || !chatId) {
        console.log(JSON.stringify({
            tag: 'ALERT_DISPATCHER_SKIP',
            reason: 'TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados — configure no .env para receber alertas',
            tipo, order_id, timestamp: ts
        }));
        return false;
    }

    const text = [
        `🚨 *ALERTA PAGAMENTO*`,
        `*Tipo:* \`${tipo}\``,
        `*Pedido:* ${order_id || 'N/A'}`,
        `*Ambiente:* ${env}`,
        `*Hora:* ${ts}`,
        detail ? `*Detalhe:* ${String(detail).slice(0, 300)}` : null
    ].filter(Boolean).join('\n');

    return new Promise((resolve) => {
        const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(JSON.stringify({ tag: 'ALERT_SENT', channel: 'telegram', tipo, order_id, timestamp: ts }));
                    resolve(true);
                } else {
                    console.error(JSON.stringify({ tag: 'ALERT_DISPATCH_ERROR', channel: 'telegram', status: res.statusCode, body: data.slice(0, 200), timestamp: ts }));
                    resolve(false);
                }
            });
        });
        req.on('error', e => {
            console.error(JSON.stringify({ tag: 'ALERT_DISPATCH_ERROR', channel: 'telegram', error: e.message, timestamp: ts }));
            resolve(false);
        });
        req.write(body);
        req.end();
    });
}

module.exports = { sendAlert };
