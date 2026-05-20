'use strict';

const Redis = require('ioredis');

let _client = null;
let _ok     = false;

// Returns the shared Redis client, or null if REDIS_URL is not configured.
function getRedis() {
    if (_client) return _client;
    const url = process.env.REDIS_URL;
    if (!url) return null;
    _client = new Redis(url, {
        lazyConnect:           false,
        enableOfflineQueue:    false,
        retryStrategy:         () => null, // fail fast → in-memory fallback takes over
        maxRetriesPerRequest:  0,
        connectTimeout:        3000,
    });
    _client.on('connect', () => {
        _ok = true;
        console.log(JSON.stringify({ tag: 'REDIS_CONNECTED', timestamp: new Date().toISOString() }));
    });
    _client.on('error', () => { _ok = false; });
    return _client;
}

// In-memory fallback: windowMs -> Map<key, {count, first}>
const _maps = new Map();
function _getMap(windowMs) {
    if (_maps.has(windowMs)) return _maps.get(windowMs);
    const m = new Map();
    _maps.set(windowMs, m);
    setInterval(() => {
        const cut = Date.now() - windowMs;
        for (const [k, r] of m) if (r.first < cut) m.delete(k);
    }, windowMs).unref();
    return m;
}

// Returns true if the request is allowed, false if rate limited.
// Falls back to in-memory when Redis is unavailable.
async function checkRateLimit(key, windowMs, max) {
    const r = getRedis();
    if (r && _ok) {
        try {
            const count = await r.incr(key);
            if (count === 1) await r.pexpire(key, windowMs);
            return count <= max;
        } catch (_) { /* fall through to in-memory */ }
    }
    const map = _getMap(windowMs);
    const now = Date.now();
    const rec = map.get(key);
    if (!rec || now - rec.first > windowMs) { map.set(key, { count: 1, first: now }); return true; }
    if (rec.count >= max) return false;
    rec.count++;
    return true;
}

// Express middleware factory — IP-based rate limiting.
function makeRateLimiter(windowMs, max, msg) {
    _getMap(windowMs); // pre-init fallback map
    return async function (req, res, next) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
        const allowed = await checkRateLimit(`rl:${windowMs}:${max}:${ip}`, windowMs, max);
        if (!allowed) return res.status(429).json({ error: msg });
        next();
    };
}

module.exports = { makeRateLimiter, checkRateLimit, getRedis };
