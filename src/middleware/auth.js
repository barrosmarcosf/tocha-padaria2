const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { secLog: _fileLog } = require('../utils/secLogger');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ [AUTH] JWT_SECRET obrigatório em produção. Configure no .env e reinicie o servidor.');
        process.exit(1);
    }
    const fallback = require('crypto').randomBytes(32).toString('hex');
    console.warn('⚠️  [AUTH] JWT_SECRET não definido — usando chave temporária (somente desenvolvimento).');
    return fallback;
})();

// Incrementar para invalidar todas as sessões ativas (ex: após troca de senha)
const SESSION_VERSION = process.env.SESSION_VERSION || '1';

function secLog(event, req, extra = '') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    _fileLog(event, ip, req.path, extra);
}

const adminAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        secLog('AUTH_REJEITADO', req, 'Token ausente');
        return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            secLog('AUTH_REJEITADO', req, err.message);
            return res.status(403).json({ error: 'Sessão expirada. Faça login novamente.' });
        }
        if (decoded.sv !== SESSION_VERSION) {
            secLog('SESSION_INVALIDADA', req, `sv=${decoded.sv} esperado=${SESSION_VERSION}`);
            return res.status(403).json({ error: 'Sessão invalidada. Faça login novamente.' });
        }
        req.user = decoded;
        next();
    });
};

const authorize = (allowedRoles = ['admin']) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Seu nível de acesso não permite esta ação.' });
        }
        next();
    };
};

module.exports = { adminAuth, authorize, JWT_SECRET, SESSION_VERSION, secLog, jwt, bcrypt };
