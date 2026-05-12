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
        // JWT já protege upload — session_id via proxy pode ser inconsistente
        if (req.path === '/upload') return next();

        const token = req.headers['x-csrf-token'];
        const sid = req.session_id;
        const ua = req.headers['user-agent'] || '';
        let valid = false;

        // DEBUG temporário — remover após confirmar root cause
        console.log(`[CSRF-DEBUG] ${req.method} ${req.path} | sid=${sid} | cookie=${req.headers.cookie || '(vazio)'} | token=${token ? token.slice(0, 8) + '...' : '(ausente)'}`);

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
            console.log(`[CSRF-DEBUG] REJEITADO — sid=${sid} | token_present=${!!token} | cookies_raw=${req.headers.cookie || '(vazio)'}`);
            return res.status(403).json({ error: 'Token CSRF inválido ou ausente.' });
        }
        next();
    };
}

module.exports = { generateCsrfToken, csrfProtection };
