const crypto = require('crypto');

// Token CSRF stateless: HMAC-SHA256(secret, "csrf:<session_id>")
// Não requer banco — basta o cookie session_id existir
function generateCsrfToken(sessionId, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(`csrf:${sessionId}`)
        .digest('hex');
}

function csrfProtection(secret) {
    return (req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
        if (req.path === '/login') return next();

        const token = req.headers['x-csrf-token'];
        const sid = req.session_id;
        let valid = false;

        if (token && sid) {
            const expected = generateCsrfToken(sid, secret);
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
            console.warn(`[SECURITY] ${new Date().toISOString()} | CSRF_REJEITADO | IP: ${ip} | ${req.method} ${req.path}`);
            return res.status(403).json({ error: 'Token CSRF inválido ou ausente.' });
        }
        next();
    };
}

module.exports = { generateCsrfToken, csrfProtection };
