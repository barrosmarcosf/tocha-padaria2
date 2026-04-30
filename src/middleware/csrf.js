const crypto = require('crypto');
const { secLog } = require('../utils/secLogger');

// Token CSRF stateless: HMAC-SHA256(secret, session_id + "|" + user-agent)
// Vincula o token ao navegador — impossível de forjar de outra origem
function generateCsrfToken(sessionId, userAgent, secret) {
    const ua = typeof userAgent === 'string' ? userAgent : '';
    return crypto
        .createHmac('sha256', secret)
        .update(`${sessionId}|${ua}`)
        .digest('hex');
}

function csrfProtection(secret) {
    return (req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
        if (req.path === '/login') return next();

        const token = req.headers['x-csrf-token'];
        const sid = req.session_id;
        const ua = req.headers['user-agent'] || '';
        let valid = false;

        if (token && sid) {
            const expected = generateCsrfToken(sid, ua, secret);
            if (token.length === expected.length) {
                try {
                    valid = crypto.timingSafeEqual(
                        Buffer.from(token, 'hex'),
                        Buffer.from(expected, 'hex')
                    );
                } catch (_) {}
            }
        }

        if (!valid) {
            const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
            secLog('CSRF_REJEITADO', ip, `${req.method} ${req.path}`);
            return res.status(403).json({ error: 'Token CSRF inválido ou ausente.' });
        }
        next();
    };
}

module.exports = { generateCsrfToken, csrfProtection };
