const fs = require('fs');
const envPath = __dirname + '/.env';

// startup path check removed (debug only)

require('dotenv').config({ path: envPath });

// Default seguro: se NODE_ENV não definido, assume 'production' (cookies secure, auth estrita)
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.warn(JSON.stringify({ tag: 'ENV_WARNING', message: 'NODE_ENV não definido — assumindo production', timestamp: new Date().toISOString() }));
}

const REQUIRED_ALWAYS = ['BASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'INTERNAL_WEBHOOK_SECRET'];
const REQUIRED_PRODUCTION = ['JWT_SECRET', 'STRIPE_WEBHOOK_SECRET', 'MERCADOPAGO_WEBHOOK_SECRET', 'ADMIN_PASS'];

const missingEnv = [
    ...REQUIRED_ALWAYS.filter(k => !process.env[k]),
    ...(process.env.NODE_ENV === 'production' ? REQUIRED_PRODUCTION.filter(k => !process.env[k]) : [])
];

if (missingEnv.length) {
    missingEnv.forEach(k => console.error(`[ENV ERROR] ${k} não definido`));
    process.exit(1);
}

console.log(JSON.stringify({ tag: 'ENV_OK', BASE_URL: process.env.BASE_URL, NODE_ENV: process.env.NODE_ENV, timestamp: new Date().toISOString() }));
console.log(JSON.stringify({ tag: 'SERVER_BOOT', pid: process.pid, timestamp: new Date().toISOString() }));

// SEC-02: SUPABASE_ANON_KEY ausente significa RLS inativo em rotas públicas
if (!process.env.SUPABASE_ANON_KEY) {
    console.error(JSON.stringify({ tag: 'SEC_CONFIG_MISSING', variable: 'SUPABASE_ANON_KEY', impact: 'RLS bypassed on public routes — service_key used instead of anon_key', action: 'Add SUPABASE_ANON_KEY to .env and restart', timestamp: new Date().toISOString() }));
}

// SEC-07: Telegram não configurado = alertas financeiros silenciosos
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error(JSON.stringify({ tag: 'SEC_CONFIG_MISSING', variable: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID', impact: 'Critical financial alerts (CHARGEBACK, STOCK_FAILED, DLQ_MAX_RETRIES) will not reach operators', action: 'Configure Telegram bot in .env for real-time incident alerts', timestamp: new Date().toISOString() }));
}

process.on('uncaughtException', (err) => {
    console.error(JSON.stringify({ tag: 'UNCAUGHT_EXCEPTION', error: err.message, stack: err.stack, timestamp: new Date().toISOString() }));
    process.exit(1); // heap pode estar corrompido — PM2 reinicia automaticamente
});
process.on('unhandledRejection', (reason) => {
    console.error(JSON.stringify({ tag: 'UNHANDLED_REJECTION', error: String(reason), timestamp: new Date().toISOString() }));
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3333;

// ──────────────────────────────────────────────────
// SUPABASE
// ──────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente público (anon key) — usado em rotas de leitura sem dados de usuário.
// Se SUPABASE_ANON_KEY não estiver definida, cai back para service key (sem RLS).
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || supabaseKey;
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
// SUPABASE_ANON_KEY: warning já emitido como SEC_CONFIG_MISSING no startup (ver acima)

console.log(JSON.stringify({ tag: 'SUPABASE_INIT', url_prefix: (supabaseUrl || 'NÃO DEFINIDO').slice(0, 30), timestamp: new Date().toISOString() }));

// Injeta supabase no systemAlert para persistência de incidentes no banco
const { initSystemAlert } = require('./src/utils/systemAlert');
initSystemAlert(supabase);

// Diagnóstico de conexão na subida
(async () => {
    const { error } = await supabase.from('clientes').select('id').limit(1);
    if (error) {
        console.error("❌ ERRO CRÍTICO DE CONEXÃO SUPABASE:", error.message);
        console.error("👉 Verifique se a URL e a Service Role Key no .env estão corretas.");
    } else {
        console.log("✅ CONEXÃO SUPABASE: OK.");
    }
})();

// ──────────────────────────────────────────────────
// MIDDLEWARES GLOBAIS
// ──────────────────────────────────────────────────

// correlation_id: propaga header do cliente ou gera novo UUID por requisição
app.use((req, _res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || require('crypto').randomUUID();
    next();
});

// Log de requisições — path apenas, sem query string (evita PII/tokens em logs)
app.use((req, _res, next) => {
    console.log(JSON.stringify({ tag: 'HTTP_REQUEST', method: req.method, path: req.path, correlation_id: req.correlationId, timestamp: new Date().toISOString() }));
    next();
});

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://tochapadaria.com,https://www.tochapadaria.com').split(',');
app.use(cors({
    origin: (origin, cb) => {
        // Sem origin = request direto (curl, Postman, servidor interno) — permitir
        if (!origin) return cb(null, true);
        // Em dev, permite localhost
        if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error('CORS: origem não permitida'));
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Idempotency-Key', 'X-Internal-Secret']
}));

// Security headers via helmet (HSTS, noSniff, frameguard, referrer-policy, CSP, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "https://sdk.mercadopago.com", "https://http2.mlstatic.com", "https://cdn.jsdelivr.net"],
            connectSrc:  ["'self'", "https://api.mercadopago.com", "https://api.mercadolibre.com", "https://*.mercadolibre.com", "https://http2.mlstatic.com", "https://secure-fields.mercadopago.com", "https://api-static.mercadopago.com"],
            frameSrc:    ["'self'", "https://sdk.mercadopago.com", "https://www.mercadopago.com", "https://www.mercadolibre.com", "https://secure-fields.mercadopago.com"],
            imgSrc:      ["'self'", "data:", "https:"],
            styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc:     ["'self'", "https://fonts.gstatic.com", "data:"],
            baseUri:     ["'self'"],
            formAction:  ["'self'"],
            workerSrc:   ["'none'"],
        }
    },
    // crossOriginEmbedderPolicy desativado: MP SDK carrega recursos cross-origin
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Middleware de Cache-Busting para área administrativa PREMIUM V2
app.use((req, res, next) => {
    // Aplica a regra a qualquer recurso dentro da /admin/ ou arquivos admin antigos
    if (req.url.startsWith('/admin') || req.url.includes('admin.html') || req.url.includes('admin.js')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
});

// Webhook do Stripe precisa do body RAW — deve vir ANTES do express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Todas as outras rotas usam JSON
app.use(express.json({ limit: '1mb' }));

// Cookie parser seguro (sem dependência extra)
app.use((req, _res, next) => {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const idx = cookie.indexOf('=');
            if (idx < 1) return;
            const key = cookie.slice(0, idx).trim();
            const val = cookie.slice(idx + 1).trim();
            try { list[key] = decodeURIComponent(val); } catch (_) { list[key] = val; }
        });
    }
    req.cookies = list;
    next();
});

// Middleware de SESSÃO SEGURA (Cookie HttpOnly + Secure em produção)
app.use((req, res, next) => {
    let sid = req.cookies.session_id;
    if (!sid) {
        sid = require('crypto').randomUUID();
        res.cookie('session_id', sid, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/',
            maxAge: 3600000 * 24 // 24h
        });
    }
    req.session_id = sid;
    next();
});

// ──────────────────────────────────────────────────
// ROTAS MODULARES (Priorizadas para evitar 404)
// ──────────────────────────────────────────────────
const adminRoutes = require('./src/routes/admin')(supabase);
const checkoutRoutes = require('./src/routes/checkout')(supabase, stripe);
const mercadopagoRoutes = require('./src/routes/mercadopago')(supabase);
const publicRoutes = require('./src/routes/public')(supabase, supabasePublic);
const customerRoutes = require('./src/routes/customer')(supabase);
const { startBot } = require('./src/notification-service');
const { perfLog } = require('./src/utils/perf-logger');

app.use('/api/admin', adminRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', publicRoutes);
app.use('/api', require('./src/routes/events')(supabase));

// ──────────────────────────────────────────────────
// MIDDLEWARES GLOBAIS (Arquivos Estáticos após API)
// ──────────────────────────────────────────────────
const _homeV2HtmlPath = path.join(__dirname, 'public', 'home-v2', 'index.html');

app.get('/', (_req, res) => {
    res.status(200).sendFile(_homeV2HtmlPath);
});
app.get('/nossa-historia.html', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'home-v2', 'nossa-historia.html')));
app.get('/fale-conosco.html', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'home-v2', 'fale-conosco.html')));
app.get('/food-service.html', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'home-v2', 'food-service.html')));

// Redireciona entry points do /home-v2 → / preservando query params (UTM, tracking)
// app.use não é usado aqui pois interceptaria assets (/home-v2/style.css etc.)
function _redirectRoot(req, res) {
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    res.redirect(301, '/' + qs);
}
app.get('/home-v2',            _redirectRoot);
app.get('/home-v2/',           _redirectRoot);
app.get('/home-v2/index.html', _redirectRoot);
// Bloqueia acesso direto à home antiga
app.get('/index.html', (_req, res) => res.redirect(301, '/'));

app.get('/checkout-mp.html', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '30d', etag: true }));

// ──────────────────────────────────────────────────
// SISTEMA DE ATUALIZAÇÃO EM TEMPO REAL (SSE)
// ──────────────────────────────────────────────────
const SSE_MAX_CLIENTS = 200;
let sseClients = [];

app.get('/api/stock-stream', (req, res) => {
    if (!req.cookies.session_id) {
        return res.status(401).json({ error: 'Sessão inválida.' });
    }
    if (sseClients.length >= SSE_MAX_CLIENTS) {
        return res.status(503).json({ error: 'Limite de conexões SSE atingido' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now() + Math.random();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    console.log(JSON.stringify({ tag: 'SSE_CONNECT', client_id: clientId, total: sseClients.length, timestamp: new Date().toISOString() }));

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
        console.log(JSON.stringify({ tag: 'SSE_DISCONNECT', client_id: clientId, remaining: sseClients.length, timestamp: new Date().toISOString() }));
    });
});

// Broadcast para todos os clientes conectados — remove conexões mortas ao detectar erro
function broadcastStockUpdate(data) {
    const payload = JSON.stringify({ type: 'stock_update', ...data });
    const dead = [];
    sseClients.forEach(client => {
        try { client.res.write(`data: ${payload}\n\n`); }
        catch (_) { dead.push(client.id); }
    });
    if (dead.length > 0) sseClients = sseClients.filter(c => !dead.includes(c.id));
}

function _localBroadcastMenuUpdate(data) {
    const payload = JSON.stringify({ type: 'menu_update', ...(data || {}) });
    sseClients.forEach(client => {
        try { client.res.write(`data: ${payload}\n\n`); } catch (_) {}
    });
}

function _localBroadcastStoreStatus(data) {
    const payload = JSON.stringify({ type: 'store_status', ...(data || {}) });
    sseClients.forEach(client => {
        try { client.res.write(`data: ${payload}\n\n`); } catch (_) {}
    });
}

// Redis pub/sub: propaga eventos de menu/loja para todos os workers em cluster mode.
// broadcastStockUpdate não precisa disso — cada worker tem sua própria subscrição Supabase.
const { getRedis: _getRlRedis } = require('./src/utils/rateLimiter');
if (process.env.REDIS_URL) {
    const _RedisCls = require('ioredis');
    const _sseSub = new _RedisCls(process.env.REDIS_URL, {
        lazyConnect:        false,
        enableOfflineQueue: false,
        retryStrategy:      (times) => Math.min(times * 2000, 30000),
        connectTimeout:     3000,
    });
    _sseSub.subscribe('menu-updates', 'store-status', (err) => {
        if (err) console.error(JSON.stringify({ tag: 'REDIS_SSE_SUB_ERROR', error: err.message, timestamp: new Date().toISOString() }));
        else     console.log(JSON.stringify({ tag: 'REDIS_SSE_READY', channels: ['menu-updates', 'store-status'], timestamp: new Date().toISOString() }));
    });
    _sseSub.on('message', (channel, message) => {
        try {
            const _d = JSON.parse(message);
            if (channel === 'menu-updates')  _localBroadcastMenuUpdate(_d);
            else if (channel === 'store-status') _localBroadcastStoreStatus(_d);
        } catch (_) {}
    });
    _sseSub.on('error', (err) => {
        console.error(JSON.stringify({ tag: 'REDIS_SSE_SUB_ERROR', error: err.message, timestamp: new Date().toISOString() }));
    });
}

function broadcastMenuUpdate(data) {
    const _r = _getRlRedis();
    if (_r) { _r.publish('menu-updates',  JSON.stringify(data || {})).catch(() => _localBroadcastMenuUpdate(data)); }
    else    { _localBroadcastMenuUpdate(data); }
}

function broadcastStoreStatus(data) {
    const _r = _getRlRedis();
    if (_r) { _r.publish('store-status', JSON.stringify(data || {})).catch(() => _localBroadcastStoreStatus(data)); }
    else    { _localBroadcastStoreStatus(data); }
}

app.locals.broadcastMenuUpdate = broadcastMenuUpdate;
app.locals.broadcastStoreStatus = broadcastStoreStatus;

// Subscrição em tempo real no Supabase (Backend -> Frontend via SSE)
supabase
  .channel('stock-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'produto_estoque_fornada' }, payload => {
    const data = payload.new || payload.old;
    console.log('🔄 [REALTIME] Mudança no estoque de fornada detectada:', data.produto_id, data.estoque_disponivel);
    broadcastStockUpdate({
        productId: data.produto_id,
        newStock: data.estoque_disponivel,
        initialStock: data.estoque_base
        // vendas_confirmadas removido do SSE público (SEC-04 — dado de BI interno)
    });
  })
  .subscribe();

supabase
  .channel('menu-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => {
    broadcastMenuUpdate({ table: 'categorias' });
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
    broadcastMenuUpdate({ table: 'produtos' });
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload) => {
    const key = (payload.new || payload.old || {}).key;
    if (key === 'opening_hours') broadcastStoreStatus({});
  })
  .subscribe();

// --- ROTA DE DIAGNÓSTICO COMPARATIVO (requer autenticação admin) ---
const { adminAuth } = require('./src/middleware/auth');
app.get('/comparative-audit', adminAuth, async (_req, res) => {
    const { client, botStatus } = require('./src/notification-service');
    const auditNumbers = (process.env.AUDIT_PHONES || '').split(',').map(n => n.trim()).filter(Boolean);
    const numbers = auditNumbers.length ? auditNumbers : [process.env.OWNER_WHATSAPP].filter(Boolean);

    if (!client) return res.status(500).send("Client não inicializado.");

    const results = {
        botStatus,
        state: null,
        auditoria: []
    };

    try {
        results.state = await client.getState();
        console.log(`\n[RAW-AUDIT] client.getState(): ${results.state}`);
    } catch (e) {
        console.error(`[RAW-AUDIT] Erro no getState():`, e.message);
        results.state_error = e.message;
    }

    for (const num of numbers) {
        const jid = num + "@c.us";
        const entry = { numero: num, jid };
        
        console.log(`\n[RAW-AUDIT] Analisando: ${num} ---------`);

        try {
            entry.getNumberId = await client.getNumberId(num);
            console.log(`[RAW-AUDIT] getNumberId: ${JSON.stringify(entry.getNumberId)}`);
        } catch (e) { entry.getNumberId_error = e.message; }

        try {
            entry.isRegisteredUser = await client.isRegisteredUser(jid);
            console.log(`[RAW-AUDIT] isRegisteredUser: ${entry.isRegisteredUser}`);
        } catch (e) { entry.isRegisteredUser_error = e.message; }

        try {
            entry.getFormattedNumber = await client.getFormattedNumber(jid);
            console.log(`[RAW-AUDIT] getFormattedNumber: ${entry.getFormattedNumber}`);
        } catch (e) { entry.getFormattedNumber_error = e.message; }

        results.auditoria.push(entry);
    }

    res.json(results);
});


// ──────────────────────────────────────────────────
// ENDPOINT DE DIAGNÓSTICO — /api/health
// Verifica o status de todas as integrações em tempo real
// ──────────────────────────────────────────────────
app.get('/api/health', adminAuth, async (_req, res) => {
    const checks = {};
    const _withTimeout = (promise, ms = 5000) =>
        Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

    // 1. Supabase
    try {
        const { error } = await _withTimeout(supabase.from('clientes').select('id').limit(1));
        checks.supabase = error ? { ok: false, error: error.message } : { ok: true };
    } catch (e) {
        checks.supabase = { ok: false, error: e.message };
    }

    // 2. Stripe
    try {
        await _withTimeout(stripe.balance.retrieve());
        checks.stripe = { ok: true };
    } catch (e) {
        checks.stripe = { ok: false, error: e.message };
    }

    // 3. Mercado Pago
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken || mpToken === 'SEU_TOKEN_AQUI') {
        checks.mercadopago = { ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN não configurado (placeholder)' };
    } else {
        checks.mercadopago = { ok: true, env: mpToken.startsWith('APP_USR-') ? 'production' : 'sandbox' };
    }

    // 4. Webhooks
    const baseUrl = process.env.BASE_URL || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    checks.webhooks = {
        base_url: baseUrl || '⚠️ BASE_URL não configurado',
        stripe_endpoint: baseUrl ? `${baseUrl}/api/webhook` : '⚠️ indisponível',
        mercadopago_endpoint: baseUrl ? `${baseUrl}/api/mercadopago/webhook` : '⚠️ indisponível',
        stripe_secret_configured: !!webhookSecret,
        warning: !webhookSecret ? 'STRIPE_WEBHOOK_SECRET ausente — webhook aceito sem validação de assinatura' : null,
        localtunnel_warning: baseUrl.includes('loca.lt') ? '⚠️ URL do localtunnel detectada — expira a cada sessão. Use uma URL permanente.' : null
    };

    // 5. Email (SMTP)
    const smtpOk = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    checks.email = { ok: smtpOk, host: process.env.SMTP_HOST || 'não configurado' };

    // 6. WhatsApp Bot
    try {
        const { botStatus } = require('./src/notification-service');
        checks.whatsapp_bot = { ok: botStatus === 'READY', status: botStatus };
    } catch (e) {
        checks.whatsapp_bot = { ok: false, error: e.message };
    }

    const allOk = checks.supabase.ok && checks.stripe.ok && checks.mercadopago.ok && checks.email.ok;
    res.status(allOk ? 200 : 207).json({ healthy: allOk, checks, timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────────────
// WEBHOOK INTERNO DE PAGAMENTOS — webhook-first + worker fallback
//
// Recebe eventos de pagamento para executar health checks imediatos.
// O worker de 5min permanece como fallback para eventos perdidos.
// ──────────────────────────────────────────────────
const { systemAlert } = require('./src/utils/systemAlert');

// Idempotência em memória: event_id → timestamp de processamento
// Evita reprocessamento duplo (webhook retry, network blip, etc.)
const _processedWebhookEvents = new Map();

// Limpa entradas com mais de 1h para evitar memory leak em uptime longo
setInterval(() => {
    const cutoff = Date.now() - 3_600_000;
    for (const [id, ts] of _processedWebhookEvents) {
        if (ts < cutoff) _processedWebhookEvents.delete(id);
    }
}, 3_600_000).unref(); // .unref() não impede shutdown limpo do processo

// Cache TTL de 5 minutos: proteção contra duplicidade na janela de falha do banco (cenário fail-open)
const _processedEventsTTL = new Map();
const _TTL_MS = 5 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [id, ts] of _processedEventsTTL) {
        if (now - ts > _TTL_MS) _processedEventsTTL.delete(id);
    }
}, 60_000).unref();

// Fila de persistência assíncrona: eventos processados durante falha do banco aguardam retry
const _pendingDbWrites = [];

async function retryPendingWrites() {
    if (_pendingDbWrites.length === 0) return;

    // Batch dinâmico: 1 item para filas pequenas, até 10 para filas grandes
    // Fórmula: floor(tamanho/10), clamped em [1, 10]
    // Ex: 5 itens → batch=1 | 50 itens → batch=5 | 100+ itens → batch=10
    const batchSize = Math.min(10, Math.max(1, Math.floor(_pendingDbWrites.length / 10)));
    let processed = 0;

    while (processed < batchSize && _pendingDbWrites.length > 0) {
        const item = _pendingDbWrites[0];
        const err = await markEventProcessed(item.id, item.type);

        if (!err || err.code === '23505') {
            // Sucesso ou PK conflict (já persistido por outra via) → remove da fila
            _pendingDbWrites.shift();
            if (!err) {
                console.log(JSON.stringify({
                    tag: 'WEBHOOK_DB_RECOVERY_SUCCESS',
                    event_id: item.id,
                    type: item.type,
                    queued_at: new Date(item.queued_at).toISOString(),
                    batch_index: processed,
                    timestamp: new Date().toISOString()
                }));
            }
            processed++;
        } else {
            console.error(JSON.stringify({
                tag: 'WEBHOOK_DB_RETRY_FAILED',
                event_id: item.id,
                error: err.message,
                queue_size: _pendingDbWrites.length,
                timestamp: new Date().toISOString()
            }));
            break; // banco ainda indisponível — interrompe o batch, tenta no próximo ciclo
        }
    }

    if (processed > 0) {
        console.log(JSON.stringify({
            tag: 'WEBHOOK_DB_BATCH_SUMMARY',
            processed,
            batch_size: batchSize,
            remaining: _pendingDbWrites.length,
            timestamp: new Date().toISOString()
        }));
    }
}

setInterval(retryPendingWrites, 10_000).unref();

// Tenta registrar o evento no banco. Retorna o objeto de erro (ou null em caso de sucesso).
// Erro code '23505' = PK conflict = evento já processado.
// Outros erros = falha de infra (não deve bloquear o processamento).
async function markEventProcessed(eventId, type) {
    const { error } = await supabase
        .from('webhook_events')
        .insert([{ id: eventId, type }]);
    return error;
}

async function handlePaymentWebhook(event) {
    const start = Date.now();

    // ── Idempotência — camada 1: memória (fast path, zero latência) ───────────
    if (_processedWebhookEvents.has(event.id)) {
        console.log(JSON.stringify({
            tag: 'WEBHOOK_DUPLICATE',
            event_id: event.id,
            type: event.type,
            layer: 'memory',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // ── Idempotência — camada 2: TTL (proteção janela de falha do banco) ────────
    if (_processedEventsTTL.has(event.id)) {
        console.log(JSON.stringify({
            tag: 'WEBHOOK_DUPLICATE',
            event_id: event.id,
            type: event.type,
            layer: 'memory_ttl',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // ── Idempotência — camada 3: banco (persiste entre restarts e instâncias) ─
    const insertErr = await markEventProcessed(event.id, event.type);
    if (insertErr) {
        if (insertErr.code === '23505') {
            // PK conflict = evento já foi processado antes
            _processedWebhookEvents.set(event.id, Date.now()); // aquece cache local
            console.log(JSON.stringify({
                tag: 'WEBHOOK_DUPLICATE',
                event_id: event.id,
                type: event.type,
                layer: 'db',
                timestamp: new Date().toISOString()
            }));
            return;
        }
        // Falha de infra (rede, timeout) — fail-open: melhor processar duas vezes
        // do que silenciosamente descartar um evento de pagamento
        console.error(JSON.stringify({
            tag: 'WEBHOOK_IDEMPOTENCY_DB_ERROR',
            event_id: event.id,
            error: insertErr.message,
            timestamp: new Date().toISOString()
        }));
        // Enfileira para persistência eventual — retry a cada 10s até o banco voltar
        if (_pendingDbWrites.length >= 1000) {
            console.warn(JSON.stringify({
                tag: 'WEBHOOK_QUEUE_OVERFLOW',
                queue_size: _pendingDbWrites.length,
                timestamp: new Date().toISOString()
            }));
            _pendingDbWrites.splice(0, 500);
        }
        _pendingDbWrites.push({ id: event.id, type: event.type, queued_at: Date.now() });
        console.log(JSON.stringify({
            tag: 'WEBHOOK_DB_QUEUED',
            event_id: event.id,
            queue_size: _pendingDbWrites.length,
            timestamp: new Date().toISOString()
        }));
    }

    // Aquece cache local para evitar round-trip ao DB em retries imediatos
    _processedWebhookEvents.set(event.id, Date.now());

    console.log(JSON.stringify({
        tag: 'WEBHOOK_PROCESSING',
        event_id: event.id,
        type: event.type,
        timestamp: new Date().toISOString()
    }));

    try {
        if (event.type === 'payment.approved') {
            // ── Check 1: Stale locks ──────────────────────────────────────────
            const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const { data: stale, error: e1 } = await supabase
                .from('pedidos')
                .select('id, processing_at')
                .eq('status', 'pending')
                .eq('processing', true)
                .lt('processing_at', cutoff);

            if (e1) {
                console.error(JSON.stringify({ tag: 'WEBHOOK_DB_ERROR', context: 'stale_locks', error: e1.message }));
            } else if (stale && stale.length > 0) {
                for (const row of stale) {
                    systemAlert('ALERT_STALE_LOCK', { order_id: row.id, processing_at: row.processing_at });
                    const { error: fixErr } = await supabase
                        .from('pedidos')
                        .update({ processing: false, processing_at: null })
                        .eq('id', row.id)
                        .eq('processing', true);

                    if (!fixErr) {
                        console.log(JSON.stringify({
                            tag: 'PAYMENT_PROCESSED',
                            source: 'webhook',
                            action: 'stale_lock_fixed',
                            order_id: row.id,
                            timestamp: new Date().toISOString()
                        }));
                    }
                }
            }

            // ── Check 2: Pagamentos não finalizados (age > 10min, throttle 1h) ─
            const _minAge = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const _alertCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { data: unfinalized, error: e2 } = await supabase
                .from('pedidos')
                .select('id, mp_payment_id, created_at')
                .eq('status', 'pending')
                .not('mp_payment_id', 'is', null)
                .lt('created_at', _minAge)
                .or(`alerted_at.is.null,alerted_at.lt.${_alertCutoff}`);

            if (e2) {
                console.error(JSON.stringify({ tag: 'WEBHOOK_DB_ERROR', context: 'unfinalized', error: e2.message }));
            } else if (unfinalized && unfinalized.length > 0) {
                const ids = [];
                for (const row of unfinalized) {
                    systemAlert('ALERT_PAYMENT_NOT_FINALIZED', {
                        order_id: row.id,
                        mp_payment_id: row.mp_payment_id,
                        created_at: row.created_at
                    });
                    ids.push(row.id);
                }
                if (ids.length > 0) {
                    supabase.from('pedidos').update({ alerted_at: new Date().toISOString() }).in('id', ids).catch(() => {});
                }
                console.log(JSON.stringify({
                    tag: 'PAYMENT_PROCESSED',
                    source: 'webhook',
                    action: 'unfinalized_detected',
                    count: unfinalized.length,
                    timestamp: new Date().toISOString()
                }));
            }
        }

        _processedEventsTTL.set(event.id, Date.now());
        perfLog(`webhook:handlePaymentWebhook:${event.type}`, start);
        console.log(JSON.stringify({
            tag: 'WEBHOOK_PROCESSED',
            event_id: event.id,
            type: event.type,
            duration_ms: Date.now() - start,
            timestamp: new Date().toISOString()
        }));

    } catch (err) {
        console.error(JSON.stringify({
            tag: 'WEBHOOK_HANDLER_ERROR',
            event_id: event.id,
            error: err.message,
            timestamp: new Date().toISOString()
        }));
        throw err;
    }
}

app.post('/webhook/payment', (req, res) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (!internalSecret || internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    const event = req.body;

    if (!event || !event.id || !event.type) {
        return res.status(400).json({ error: 'event.id e event.type são obrigatórios' });
    }

    console.log(JSON.stringify({
        tag: 'WEBHOOK_RECEIVED',
        event_id: event.id,
        type: event.type,
        timestamp: new Date().toISOString()
    }));

    // Responde imediatamente — processa em background para não bloquear o gateway
    res.status(200).json({ ok: true, event_id: event.id });

    handlePaymentWebhook(event).catch(err =>
        console.error(JSON.stringify({ tag: 'WEBHOOK_BG_ERROR', error: err.message, timestamp: new Date().toISOString() }))
    );
});

// ──────────────────────────────────────────────────
// MIDDLEWARE 404 — Fallback para SPA (Público e Admin)
// ──────────────────────────────────────────────────
app.use((req, res) => {
    console.warn(`⚠️ [404] ${req.url}`);

    // Rotas de API nunca devem receber HTML — evita mascarar erros de rota inexistente
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota não encontrada.' });
    }

    // Se for uma rota dentro do admin, serve o admin/index.html
    if (req.url.startsWith('/admin')) {
        return res.status(200).sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
    }

    // HTML (browser) → serve home-v2; outros (JS/CSS/API perdida) → 404 limpo
    if (req.accepts('html')) {
        res.set('Vary', 'Accept');
        return res.status(200).sendFile(path.join(__dirname, 'public', 'home-v2', 'index.html'));
    }
    res.status(404).send('Not Found');
});

// ──────────────────────────────────────────────────
// INICIAR SERVIDOR
// ──────────────────────────────────────────────────
console.log('[ROUTES LOADED]');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nTOCHA PADARIA: Sistema Ativo e Protegido!`);
    console.log(`PORTA: ${PORT}`);
    console.log(`ACESSE: http://localhost:${PORT}`);
    console.log(`-------------------------------------------\n`);

    // Monitor de lag do event loop — só loga se acima do threshold crítico (>200ms)
    setInterval(() => {
        const _loopStart = Date.now();
        setImmediate(() => {
            const lag = Date.now() - _loopStart;
            if (lag > 200) console.warn(JSON.stringify({ tag: 'EVENT_LOOP_LAG', lag_ms: lag, timestamp: new Date().toISOString() }));
        });
    }, 5000);

    // Worker de Abandono: verificar carrinhos a cada 5 minutos
    const { checkAbandonedCarts } = require('./src/workers/cart-abandonment');
    const WORKER_INTERVAL = 5 * 60 * 1000; // 5 minutos
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'cart-abandonment', interval_ms: WORKER_INTERVAL, timestamp: new Date().toISOString() }));
    let _abandonmentRunning = false;
    setInterval(async () => {
        if (_abandonmentRunning) return;
        _abandonmentRunning = true;
        try {
            const _t = Date.now();
            await checkAbandonedCarts(supabase);
            perfLog('worker:cart-abandonment', _t);
        } finally {
            _abandonmentRunning = false;
        }
    }, WORKER_INTERVAL);
    checkAbandonedCarts(supabase);

    // Worker de Pagamento Pendente: verificar pedidos a cada 5 minutos
    const { checkPendingPayments } = require('./src/workers/payment-recovery');
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'payment-recovery', interval_ms: WORKER_INTERVAL, timestamp: new Date().toISOString() }));
    let _paymentRecoveryRunning = false;
    setInterval(async () => {
        if (_paymentRecoveryRunning) return;
        _paymentRecoveryRunning = true;
        try {
            const _t = Date.now();
            await checkPendingPayments(supabase);
            perfLog('worker:payment-recovery', _t);
        } finally {
            _paymentRecoveryRunning = false;
        }
    }, WORKER_INTERVAL);
    checkPendingPayments(supabase);

    // Worker DLQ: reprocessar pagamentos que falharam (a cada 2 min)
    const { retryFailedPayments } = require('./src/workers/retry-failed-payments');
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'retry-failed-payments', interval_ms: 120000, timestamp: new Date().toISOString() }));
    let _dlqRunning = false;
    setInterval(async () => {
        if (_dlqRunning) return;
        _dlqRunning = true;
        try {
            const _t = Date.now();
            await retryFailedPayments(supabase);
            perfLog('worker:retry-failed-payments', _t);
        } finally {
            _dlqRunning = false;
        }
    }, 2 * 60 * 1000);

    // Worker de Reconciliação MP: corrigir pagamentos aprovados não processados (a cada 5 min)
    const { reconcileMPPayments } = require('./src/workers/mp-reconciliation');
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'mp-reconciliation', interval_ms: WORKER_INTERVAL, timestamp: new Date().toISOString() }));
    let _reconcileRunning = false;
    setInterval(async () => {
        if (_reconcileRunning) return;
        _reconcileRunning = true;
        try {
            const _t = Date.now();
            await reconcileMPPayments(supabase);
            perfLog('worker:mp-reconciliation', _t);
        } finally {
            _reconcileRunning = false;
        }
    }, WORKER_INTERVAL);

    // Worker de monitoramento: pedidos com falha de dedução de estoque (a cada 15 min)
    const { checkStockDeductionFailures, retryStockDeduction } = require('./src/workers/stock-monitor');
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'stock-monitor', interval_ms: 900000, timestamp: new Date().toISOString() }));
    let _stockMonitorRunning = false;
    setInterval(async () => {
        if (_stockMonitorRunning) return;
        _stockMonitorRunning = true;
        try {
            const _t = Date.now();
            await checkStockDeductionFailures(supabase);
            perfLog('worker:stock-monitor', _t);
        } finally {
            _stockMonitorRunning = false;
        }
    }, 15 * 60 * 1000);

    // Worker de retry: re-tenta dedução de estoque para pedidos com falha (a cada 10 min, máx 3x)
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'stock-retry', interval_ms: 600000, timestamp: new Date().toISOString() }));
    let _stockRetryRunning = false;
    setInterval(async () => {
        if (_stockRetryRunning) return;
        _stockRetryRunning = true;
        try {
            const _t = Date.now();
            await retryStockDeduction(supabase);
            perfLog('worker:stock-retry', _t);
        } finally {
            _stockRetryRunning = false;
        }
    }, 10 * 60 * 1000);

    // Worker: backup da sessão WhatsApp a cada 6h → Supabase Storage (bucket: whatsapp-sessions)
    const { exec: _execBackup } = require('child_process');
    const _waAuthDir = path.resolve(__dirname, '.wwebjs_auth');
    setInterval(() => {
        if (!fs.existsSync(_waAuthDir)) return;
        const _tmpFile = `/tmp/wa-session-${Date.now()}.tar.gz`;
        _execBackup(`tar czf "${_tmpFile}" -C "${__dirname}" .wwebjs_auth`, (tarErr) => {
            if (tarErr) {
                console.error(JSON.stringify({ tag: 'WA_BACKUP_ERROR', step: 'tar', error: tarErr.message, timestamp: new Date().toISOString() }));
                return;
            }
            fs.readFile(_tmpFile, async (readErr, buf) => {
                try { fs.unlinkSync(_tmpFile); } catch (_) {}
                if (readErr) {
                    console.error(JSON.stringify({ tag: 'WA_BACKUP_ERROR', step: 'read', error: readErr.message, timestamp: new Date().toISOString() }));
                    return;
                }
                try {
                    const { error: _uploadErr } = await supabase.storage
                        .from('whatsapp-sessions')
                        .upload('session-latest.tar.gz', buf, { contentType: 'application/gzip', upsert: true });
                    if (_uploadErr) throw new Error(_uploadErr.message);
                    console.log(JSON.stringify({ tag: 'WA_BACKUP_OK', size_kb: Math.round(buf.length / 1024), timestamp: new Date().toISOString() }));
                } catch (_uploadCatch) {
                    console.error(JSON.stringify({ tag: 'WA_BACKUP_ERROR', step: 'upload', error: _uploadCatch.message, timestamp: new Date().toISOString() }));
                }
            });
        });
    }, 6 * 60 * 60 * 1000);
    console.log(JSON.stringify({ tag: 'WORKER_STARTED', worker: 'wa-session-backup', interval_ms: 21600000, timestamp: new Date().toISOString() }));

    // Iniciar o WhatsApp Bot com um pequeno delay para não impactar o boot
    setTimeout(() => {
        console.log("🤖 [SERVER] Iniciando Tocha Bot (WhatsApp)...");
        startBot();
    }, 2000);
});

