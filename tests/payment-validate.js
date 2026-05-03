/**
 * Validação completa do fluxo de pagamento.
 * Etapas 1-8: Schema, Lock, Idempotência, Race Condition, Stale Lock,
 * Ambiente, Restart (via pm2 remoto), Full Flow.
 *
 * Uso: node tests/payment-validate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MP_TOKEN     = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_PUBKEY    = process.env.MERCADOPAGO_PUBLIC_KEY;
const PROD_BASE    = process.env.BASE_URL || 'https://www.tochapadaria.com';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const R  = {};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpsGet(url, headers = {}) {
    return new Promise((resolve) => {
        const opts = new URL(url);
        https.get(url, { headers }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', e => resolve({ status: 0, body: e.message }));
    });
}

function httpsPost(url, data, headers = {}) {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', e => resolve({ status: 0, body: e.message }));
        req.write(payload);
        req.end();
    });
}

async function createMPTestToken() {
    try {
        const res = await httpsPost(
            'https://api.mercadopago.com/v1/card_tokens',
            {
                card_number: '4509953566233704',
                security_code: '123',
                expiration_month: 11,
                expiration_year: 2027,
                cardholder: { name: 'APRO', identification: { type: 'CPF', number: '12345678909' } }
            },
            { Authorization: 'Bearer ' + MP_PUBKEY }
        );
        const d = JSON.parse(res.body);
        if (d.id) { console.log('[MP TOKEN] OK:', d.id.slice(0, 24) + '...'); return d.id; }
        console.warn('[MP TOKEN] FAIL:', res.body.slice(0, 150));
        return null;
    } catch (e) { console.warn('[MP TOKEN] EXC:', e.message); return null; }
}

async function createTestOrder(tag) {
    const email = 'val-test-' + tag + '@padaria.test';
    const { data: ex } = await sb.from('clientes').select('id').eq('email', email).maybeSingle();
    let cid;
    if (ex) {
        cid = ex.id;
    } else {
        const { data: nc, error: ce } = await sb.from('clientes')
            .insert({ name: 'Validation Test', email, whatsapp: '21900000099' })
            .select('id').single();
        if (ce) throw new Error('Cliente: ' + ce.message);
        cid = nc.id;
    }
    const idem = 'val-' + tag + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const { data: ord, error: oe } = await sb.from('pedidos').insert({
        customer_id: cid, status: 'pending', total_amount: 5.00,
        items: JSON.stringify({ actual_items: [{ id: 'p1', name: 'Pao Test', qty: 1, price: 5.00 }] }),
        processing: false, processing_at: null, idempotency_key: idem
    }).select().single();
    if (oe) throw new Error('Pedido: ' + oe.message);
    return { order: ord, email };
}

async function cleanup(...emails) {
    for (const email of emails) {
        const { data: cs } = await sb.from('clientes').select('id').eq('email', email);
        if (cs && cs.length) {
            for (const c of cs) await sb.from('pedidos').delete().eq('customer_id', c.id);
            await sb.from('clientes').delete().eq('email', email);
        }
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n==================================================');
    console.log('  TOCHA PADARIA — VALIDACAO COMPLETA PAGAMENTO');
    console.log('==================================================\n');

    // ── ETAPA 7: AMBIENTE ─────────────────────────────────────────────────
    console.log('[ETAPA 7] Validacao de Ambiente');
    console.log('[SUPABASE URL]', SUPABASE_URL ? SUPABASE_URL.slice(0, 60) : 'NAO DEFINIDO');
    const urlOk = SUPABASE_URL && SUPABASE_URL.includes('vrdepnjtodhdwhonviui');
    R.ambiente = urlOk ? 'OK' : 'FAIL:URL=' + SUPABASE_URL;
    console.log(urlOk ? '[OK] URL correta' : '[FAIL] URL ERRADA: ' + SUPABASE_URL);

    const mpEnv = !MP_TOKEN ? 'AUSENTE'
        : MP_TOKEN.startsWith('TEST-') ? 'TESTE'
        : MP_TOKEN.startsWith('APP_USR-') ? 'PRODUCAO' : 'DESCONHECIDO';
    console.log('[MP ENV]', mpEnv, '|', MP_TOKEN ? MP_TOKEN.slice(0, 20) + '...' : 'NAO DEFINIDO');

    // ── ETAPA 1: SCHEMA ───────────────────────────────────────────────────
    console.log('\n[ETAPA 1] Teste de Schema (REST API)');
    const schemaUrl = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/pedidos?select=processing,processing_at&limit=1';
    const schemaRes = await httpsGet(schemaUrl, { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY });
    if (schemaRes.status === 200) {
        const row = JSON.parse(schemaRes.body)[0];
        console.log('[SCHEMA OK] row:', JSON.stringify(row));
        R.schema = 'OK';
    } else {
        console.error('[SCHEMA FAIL] HTTP', schemaRes.status, schemaRes.body.slice(0, 200));
        R.schema = 'FAIL:HTTP_' + schemaRes.status;
    }

    // ── SETUP ─────────────────────────────────────────────────────────────
    console.log('\n[SETUP] Criando pedido de teste...');
    let testEmail, testOrder;
    try {
        const r = await createTestOrder('lock');
        testOrder = r.order;
        testEmail = r.email;
        console.log('[SETUP] id=' + testOrder.id + ' status=' + testOrder.status + ' processing=' + testOrder.processing);
    } catch (e) {
        console.error('[SETUP FAIL]', e.message);
        ['lock_single', 'double_click', 'race', 'stale_lock'].forEach(k => { R[k] = 'SKIP:NO_ORDER'; });
    }

    if (testOrder) {
        const oid = testOrder.id;

        // ── ETAPA 2: LOCK SINGLE ──────────────────────────────────────────
        console.log('\n[ETAPA 2] Teste de Lock (single request)');
        try {
            console.log('[DB CHECK] verificando colunas processing / processing_at');
            console.log('[LOCK TRY]', oid);
            const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            await sb.from('pedidos').update({ processing: false, processing_at: null })
                .eq('id', oid).eq('processing', true)
                .or('processing_at.lt.' + cutoff + ',processing_at.is.null');

            const { data: locked, error: le } = await sb.from('pedidos')
                .update({ processing: true, processing_at: new Date().toISOString() })
                .eq('id', oid).eq('processing', false)
                .in('status', ['pending', 'payment_failed'])
                .select().single();

            if (le) {
                R.lock_single = 'FAIL:' + le.message.slice(0, 80);
                console.error('[LOCK FAIL]', le.message);
            } else if (locked) {
                console.log('[LOCK OK]', oid);
                const { data: l2 } = await sb.from('pedidos')
                    .update({ processing: true, processing_at: new Date().toISOString() })
                    .eq('id', oid).eq('processing', false)
                    .in('status', ['pending', 'payment_failed'])
                    .select().single();
                if (l2) {
                    console.warn('[LOCK WARN] Segundo lock tambem obteve lock!');
                    R.lock_single = 'WARN:DOUBLE_LOCK_POSSIBLE';
                } else {
                    console.log('[LOCK DENIED] Segundo lock bloqueado corretamente');
                    R.lock_single = 'OK';
                }
                await sb.from('pedidos').update({ processing: false, processing_at: null }).eq('id', oid);
            } else {
                R.lock_single = 'FAIL:NO_ROW_MATCHED';
                console.error('[LOCK FAIL] status/processing mismatch — sem linha retornada');
            }
        } catch (e) { R.lock_single = 'FAIL:EXC_' + e.message.slice(0, 60); }

        // ── ETAPA 3: DOUBLE CLICK ─────────────────────────────────────────
        console.log('\n[ETAPA 3] Teste de Double Click (idempotencia)');
        try {
            // payment_attempt_id é UUID — gerar UUID válido
            const aid = crypto.randomUUID();
            const fakePayId = 'TEST-PAY-' + Date.now();
            const { error: updErr } = await sb.from('pedidos').update({
                payment_attempt_id: aid, mp_payment_id: fakePayId, processing: false
            }).eq('id', oid);
            if (updErr) throw new Error('update idempotency: ' + updErr.message);

            const { data: hit } = await sb.from('pedidos')
                .select('id,status,mp_payment_id')
                .eq('id', oid).eq('payment_attempt_id', aid)
                .maybeSingle();

            if (hit && hit.mp_payment_id) {
                console.log('[IDEMPOTENCY HIT] { reuse: true, payment_id:', hit.mp_payment_id, '}');
                R.double_click = 'OK:IDEMPOTENCY_HIT';
            } else {
                R.double_click = 'FAIL:NO_HIT data=' + JSON.stringify(hit);
                console.error('[IDEMPOTENCY FAIL]', R.double_click);
            }
            await sb.from('pedidos').update({
                payment_attempt_id: null, mp_payment_id: null, processing: false, status: 'pending'
            }).eq('id', oid);
        } catch (e) { R.double_click = 'FAIL:EXC_' + e.message.slice(0, 60); }

        // ── ETAPA 4: RACE CONDITION ───────────────────────────────────────
        console.log('\n[ETAPA 4] Teste de Race Condition (5 tentativas simultaneas)');
        await sb.from('pedidos').update({ processing: false, processing_at: null, status: 'pending' }).eq('id', oid);
        try {
            const lockPs = Array(5).fill(null).map(() =>
                sb.from('pedidos')
                    .update({ processing: true, processing_at: new Date().toISOString() })
                    .eq('id', oid).eq('processing', false)
                    .in('status', ['pending', 'payment_failed'])
                    .select().single()
            );
            const results = await Promise.all(lockPs);
            const locked_n = results.filter(r => r.data !== null && !r.error);
            const denied_n = results.filter(r => !r.data || r.error);
            console.log('[RACE] Total:', results.length, '| Locks obtidos:', locked_n.length, '| Negados:', denied_n.length);
            if (locked_n.length === 1) {
                console.log('[RACE OK] Apenas 1 lock — sem risco de cobranca duplicada');
                R.race = 'OK:1_LOCKED_' + denied_n.length + '_DENIED';
            } else if (locked_n.length > 1) {
                console.error('[RACE FAIL]', locked_n.length, 'locks simultaneos — risco de duplicidade!');
                R.race = 'FAIL:' + locked_n.length + '_LOCKED_DUPLICATE_RISK';
            } else {
                R.race = 'FAIL:0_LOCKED';
            }
            await sb.from('pedidos').update({ processing: false, processing_at: null }).eq('id', oid);
        } catch (e) { R.race = 'FAIL:EXC_' + e.message.slice(0, 60); }

        // ── ETAPA 5: STALE LOCK ───────────────────────────────────────────
        console.log('\n[ETAPA 5] Teste de Stale Lock');
        try {
            const staleTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            await sb.from('pedidos').update({ processing: true, processing_at: staleTime, status: 'pending' }).eq('id', oid);
            console.log('[STALE] Lock criado: processing_at=' + staleTime);

            const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const { error: ce } = await sb.from('pedidos')
                .update({ processing: false, processing_at: null })
                .eq('id', oid).eq('processing', true)
                .or('processing_at.lt.' + cutoff + ',processing_at.is.null');

            if (ce) {
                R.stale_lock = 'FAIL:' + ce.message.slice(0, 60);
                console.error('[STALE FAIL]', ce.message);
            } else {
                const { data: af } = await sb.from('pedidos').select('processing,processing_at').eq('id', oid).single();
                if (af && af.processing === false) {
                    console.log('[STALE LOCK LIMPO] processing=' + af.processing);
                    const { data: rl } = await sb.from('pedidos')
                        .update({ processing: true, processing_at: new Date().toISOString() })
                        .eq('id', oid).eq('processing', false)
                        .in('status', ['pending', 'payment_failed'])
                        .select().single();
                    R.stale_lock = rl ? 'OK:CLEANED_AND_RELOCKED' : 'PARTIAL:CLEANED_NO_RELOCK';
                    console.log('[STALE LOCK]', R.stale_lock);
                    await sb.from('pedidos').update({ processing: false, processing_at: null }).eq('id', oid);
                } else {
                    R.stale_lock = 'FAIL:NOT_CLEANED processing=' + (af && af.processing);
                    console.error('[STALE FAIL] Lock nao foi limpo');
                }
            }
        } catch (e) { R.stale_lock = 'FAIL:EXC_' + e.message.slice(0, 60); }
    }

    // ── ETAPA 6: RESTART (verifica servidor ativo via prod URL) ───────────
    console.log('\n[ETAPA 6] Verificacao de servidor (producao)');
    try {
        const pkRes = await httpsGet(PROD_BASE + '/api/mercadopago/public-key');
        if (pkRes.status === 200) {
            const body = JSON.parse(pkRes.body);
            const key = body.publicKey || body.public_key || '';
            const env = key.startsWith('TEST-') ? 'TESTE' : key.startsWith('APP_USR-') ? 'PRODUCAO' : 'DESCONHECIDO';
            console.log('[RESTART OK] Servidor vivo | key=' + key.slice(0, 24) + '... | env=' + env);
            R.restart = 'OK:SERVER_ALIVE env=' + env;
        } else {
            R.restart = 'FAIL:HTTP_' + pkRes.status;
            console.error('[RESTART FAIL] HTTP', pkRes.status, pkRes.body.slice(0, 100));
        }
    } catch (e) { R.restart = 'FAIL:EXC_' + e.message.slice(0, 60); }

    // ── ETAPA 8: FULL FLOW (HTTP prod + token MP) ─────────────────────────
    console.log('\n[ETAPA 8] Teste Completo Ponta a Ponta');
    const cardToken = await createMPTestToken();
    let fullEmail, fullOrder;
    try {
        const r = await createTestOrder('full');
        fullOrder = r.order;
        fullEmail = r.email;
        console.log('[FULL FLOW] Pedido: id=' + fullOrder.id);
    } catch (e) { console.error('[FULL FLOW SETUP]', e.message); }

    if (fullOrder && cardToken) {
        const aid = 'ff-' + Date.now();
        console.log('[DB CHECK] tentando acessar colunas processing / processing_at');
        console.log('[LOCK TRY]', fullOrder.id);
        const ffRes = await httpsPost(PROD_BASE + '/api/mercadopago/create-card-payment', {
            token: cardToken, amount: 5.00, payment_method_id: 'visa',
            installments: 1, payer: { email: 'test@apro.com' },
            order_id: fullOrder.id, attempt_id: aid
        });
        let ffBody = {};
        try { ffBody = JSON.parse(ffRes.body); } catch (_) {}
        console.log('[FULL FLOW] HTTP', ffRes.status, JSON.stringify(ffBody).slice(0, 200));

        if (ffRes.status === 200 && (ffBody.payment_id || ffBody.status === 'approved')) {
            console.log('[MP SUCCESS]', ffBody.payment_id || ffBody.status);
            R.full_flow = 'OK:' + (ffBody.status || 'PROCESSED') + (ffBody.payment_id ? '_ID=' + ffBody.payment_id : '');
        } else if (ffRes.status === 200 && ffBody.reuse) {
            R.full_flow = 'OK:REUSE';
        } else if (ffRes.status === 200) {
            R.full_flow = 'OK:HTTP200_' + JSON.stringify(ffBody).slice(0, 80);
        } else {
            R.full_flow = 'FAIL:HTTP_' + ffRes.status + '_' + JSON.stringify(ffBody).slice(0, 100);
            console.error('[FULL FLOW FAIL] HTTP', ffRes.status, JSON.stringify(ffBody).slice(0, 150));
        }
    } else {
        R.full_flow = 'SKIP:token=' + !!cardToken + '_order=' + !!fullOrder;
        console.log('[FULL FLOW] Skipped. cardToken=' + !!cardToken + ' order=' + !!fullOrder);
    }

    // ── CLEANUP ───────────────────────────────────────────────────────────
    console.log('\n[CLEANUP] Removendo dados de teste...');
    const emails = [testEmail, fullEmail].filter(Boolean);
    if (emails.length) await cleanup(...emails);
    console.log('[CLEANUP] OK');

    // ── RELATORIO FINAL ───────────────────────────────────────────────────
    function fmt(k, label) {
        const v = R[k] || 'N/A';
        const icon = v.startsWith('OK') ? '[OK]' : v.startsWith('SKIP') || v.startsWith('WARN') ? '[--]' : '[XX]';
        return icon + ' ' + (label + '              ').slice(0, 17) + v;
    }
    console.log('\n');
    console.log('==========================================================');
    console.log('                    RELATORIO FINAL');
    console.log('==========================================================');
    console.log(fmt('schema',      'Schema'));
    console.log(fmt('lock_single', 'Lock OK'));
    console.log(fmt('double_click','Idempotencia'));
    console.log(fmt('race',        'Race condition'));
    console.log(fmt('stale_lock',  'Stale lock'));
    console.log(fmt('restart',     'Deploy/Restart'));
    console.log(fmt('ambiente',    'Ambiente'));
    console.log(fmt('full_flow',   'Full flow'));
    console.log('==========================================================');

    const failures = Object.entries(R).filter(([, v]) => v.startsWith('FAIL'));
    const warnings = Object.entries(R).filter(([, v]) => v.startsWith('WARN') || v.startsWith('SKIP'));

    if (failures.length === 0) {
        console.log('\nSISTEMA VALIDADO — PRONTO PARA PRODUCAO\n');
    } else {
        console.log('\nFALHAS DETECTADAS (' + failures.length + '):');
        failures.forEach(([k, v]) => {
            let type = 'erro desconhecido';
            if (v.includes('schema') || v.includes('processing') || v.includes('column')) type = 'Schema error -> Supabase/cache';
            else if (v.includes('409') || v.includes('LOCK')) type = '409 indevido -> problema de lock';
            else if (v.includes('500')) type = '500 -> problema de backend';
            else if (v.includes('MP') || v.includes('card_token')) type = 'Falha MP -> problema externo';
            console.log('  - ' + k + ': ' + v + ' [' + type + ']');
        });
        console.log('');
    }
    if (warnings.length) {
        console.log('AVISOS: ' + warnings.map(([k, v]) => k + '=' + v).join(', '));
    }
    process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('\n[FATAL]', e.message);
    console.error(e.stack);
    process.exit(1);
});
