const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
    const fallback = require('crypto').randomBytes(32).toString('hex');
    console.warn('⚠️  [AUTH] JWT_SECRET não definido no .env — usando chave temporária. Todas as sessões expirarão no próximo restart.');
    return fallback;
})();

/**
 * Middleware de Autenticação Admin
 * Verifica o token JWT no header Authorization
 */
const adminAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.warn(">>> [AUTH] Token ausente.");
        return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error(">>> [AUTH] JWT Error:", err.message);
            return res.status(403).json({ error: 'Sessão expirada. Faça login novamente.' });
        }
        req.user = decoded;
        next();
    });
};

/**
 * Middleware para verificar Roles
 * @param {string[]} allowedRoles - Roles permitidas (ex: ['admin'])
 */
const authorize = (allowedRoles = ['admin']) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Seu nível de acesso não permite esta ação.' });
        }
        next();
    };
};

module.exports = { adminAuth, authorize, JWT_SECRET, jwt, bcrypt };
