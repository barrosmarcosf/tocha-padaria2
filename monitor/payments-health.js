'use strict';
const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_PATH || path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const { systemAlert } = require('../src/utils/systemAlert');
const { perfLog } = require('../src/utils/perf-logger');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(JSON.stringify({
        tag: 'MONITOR_ERROR',
        error: 'SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes',
        timestamp: new Date().toISOString()
    }));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CYCLE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const MIN_DELAY_MS      = 10 * 1000;     // 10 segundos — anti-loop agressivo
const CYCLE_TIMEOUT_MS  = 4 * 60 * 1000; // 4 minutos — timeout por ciclo
const MAX_CYCLES        = 100;            // reinício preventivo após 100 ciclos (~8h)
const SLOW_THRESHOLD_MS      = 2000; // latência normal PostgREST via HTTP pode chegar a 1.4s
const VERY_SLOW_THRESHOLD_MS = 4000; // acima disso é problema real (scan lento, timeout, degradação)

let cycleCount    = 0;
let execCount     = 0;
let healthRunning = false;

setInterval(() => {
    console.log(`[METRIC] payments-health executions per 10s: ${execCount}`);
    execCount = 0;
}, 10000);

// ── CHECK 1: Stale locks (pending + processing=true + processing_at > 2min) ─
async function checkStaleLocks() {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const qStart = Date.now();
    const { data: stale, error } = await supabase
        .from('pedidos')
        .select('id, processing_at')
        .eq('status', 'pending')
        .eq('processing', true)
        .lt('processing_at', cutoff);
    console.log(JSON.stringify({ tag: 'DB_QUERY', table: 'pedidos', op: 'select_stale_locks', duration_ms: Date.now() - qStart, rows: stale?.length || 0, error: !!error }));

    if (error) {
        console.error(JSON.stringify({ tag: 'MONITOR_DB_ERROR', context: 'stale_locks', error: error.message, timestamp: new Date().toISOString() }));
        return 0;
    }

    if (!stale || stale.length === 0) return 0;

    for (const row of stale) {
        systemAlert('ALERT_STALE_LOCK', { order_id: row.id, processing_at: row.processing_at });

        const uStart = Date.now();
        const { error: fixErr } = await supabase
            .from('pedidos')
            .update({ processing: false, processing_at: null })
            .eq('id', row.id)
            .eq('processing', true);
        console.log(JSON.stringify({ tag: 'DB_QUERY', table: 'pedidos', op: 'update_stale_lock', duration_ms: Date.now() - uStart, rows: 1, error: !!fixErr }));

        if (fixErr) {
            console.error(JSON.stringify({ tag: 'MONITOR_FIX_ERROR', order_id: row.id, error: fixErr.message, timestamp: new Date().toISOString() }));
        } else {
            console.log(JSON.stringify({ tag: 'STALE_LOCK_FIXED', order_id: row.id, timestamp: new Date().toISOString() }));
            console.log(JSON.stringify({ tag: 'PAYMENT_PROCESSED', source: 'worker', action: 'stale_lock_fixed', order_id: row.id, timestamp: new Date().toISOString() }));
        }
    }

    return stale.length;
}

// ── CHECK 2: Pedidos pending com mp_payment_id há mais de 10 min — indica falha no processPaidMPOrder ─
async function checkUnfinalizedPayments() {
    // Ignora pedidos recém-criados (webhook pode ainda estar em trânsito)
    const minAgeCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // Throttle: só alerta pedidos não alertados na última hora (usa coluna alerted_at)
    const alertCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const qStart = Date.now();
    const { data: unfinalized, error } = await supabase
        .from('pedidos')
        .select('id, mp_payment_id, created_at, alerted_at')
        .eq('status', 'pending')
        .not('mp_payment_id', 'is', null)
        .lt('created_at', minAgeCutoff)
        .or(`alerted_at.is.null,alerted_at.lt.${alertCutoff}`);
    console.log(JSON.stringify({ tag: 'DB_QUERY', table: 'pedidos', op: 'select_unfinalized', duration_ms: Date.now() - qStart, rows: unfinalized?.length || 0, error: !!error }));

    if (error) {
        console.error(JSON.stringify({ tag: 'MONITOR_DB_ERROR', context: 'unfinalized_payments', error: error.message, timestamp: new Date().toISOString() }));
        return 0;
    }

    if (!unfinalized || unfinalized.length === 0) return 0;

    const ids = [];
    for (const row of unfinalized) {
        systemAlert('ALERT_PAYMENT_NOT_FINALIZED', {
            order_id: row.id,
            mp_payment_id: row.mp_payment_id,
            created_at: row.created_at
        });
        ids.push(row.id);
    }

    // Atualiza alerted_at para evitar spam de alertas
    if (ids.length > 0) {
        await supabase.from('pedidos').update({ alerted_at: new Date().toISOString() }).in('id', ids);
    }

    return unfinalized.length;
}

// ── CHECK 3: Schema cache — valida coluna 'processing' sem transferir dados ─
async function checkSchema() {
    const qStart = Date.now();
    const { error } = await supabase
        .from('pedidos')
        .select('processing')
        .limit(0);
    console.log(JSON.stringify({ tag: 'DB_QUERY', table: 'pedidos', op: 'select_schema_check', duration_ms: Date.now() - qStart, rows: 0, error: !!error }));

    if (!error) return;

    systemAlert('SCHEMA_ERROR', { error: error.message });

    try {
        const rStart = Date.now();
        await supabase.rpc('notify_pgrst_reload');
        console.log(JSON.stringify({ tag: 'DB_QUERY', table: 'rpc', op: 'notify_pgrst_reload', duration_ms: Date.now() - rStart, rows: 0, error: false }));
        console.log(JSON.stringify({ tag: 'SCHEMA_RELOAD_TRIGGERED', timestamp: new Date().toISOString() }));
    } catch (rpcErr) {
        console.error(JSON.stringify({ tag: 'SCHEMA_RELOAD_FAILED', error: rpcErr.message, timestamp: new Date().toISOString() }));
    }
}

async function run() {
    if (healthRunning) {
        console.warn(JSON.stringify({ tag: 'MONITOR_OVERLAP', pid: process.pid, timestamp: new Date().toISOString() }));
        return;
    }
    healthRunning = true;
    execCount++;

    const runStart = Date.now();
    console.log(JSON.stringify({ tag: 'MONITOR_START', pid: process.pid, timestamp: new Date().toISOString() }));

    // checkStaleLocks
    const t1 = Date.now();
    const staleLockCount = await checkStaleLocks();
    const d1 = Date.now() - t1;
    console.log(JSON.stringify({ tag: 'PERF_DETAIL', step: 'checkStaleLocks', duration_ms: d1, result_count: staleLockCount }));
    if (d1 > SLOW_THRESHOLD_MS)      console.warn(JSON.stringify({ tag: 'SLOW_OPERATION',          step: 'checkStaleLocks', duration_ms: d1, note: 'Possível latência de rede ou degradação externa (PostgREST)' }));
    if (d1 > VERY_SLOW_THRESHOLD_MS) console.error(JSON.stringify({ tag: 'CRITICAL_SLOW_OPERATION', step: 'checkStaleLocks', duration_ms: d1, note: 'Latência anormal acima do esperado — possível problema real' }));

    // checkUnfinalizedPayments
    const t2 = Date.now();
    const unfinalizedCount = await checkUnfinalizedPayments();
    const d2 = Date.now() - t2;
    console.log(JSON.stringify({ tag: 'PERF_DETAIL', step: 'checkUnfinalizedPayments', duration_ms: d2, result_count: unfinalizedCount }));
    if (d2 > SLOW_THRESHOLD_MS)      console.warn(JSON.stringify({ tag: 'SLOW_OPERATION',          step: 'checkUnfinalizedPayments', duration_ms: d2, note: 'Possível latência de rede ou degradação externa (PostgREST)' }));
    if (d2 > VERY_SLOW_THRESHOLD_MS) console.error(JSON.stringify({ tag: 'CRITICAL_SLOW_OPERATION', step: 'checkUnfinalizedPayments', duration_ms: d2, note: 'Latência anormal acima do esperado — possível problema real' }));

    // checkSchema
    const t3 = Date.now();
    await checkSchema();
    const d3 = Date.now() - t3;
    console.log(JSON.stringify({ tag: 'PERF_DETAIL', step: 'checkSchema', duration_ms: d3, result_count: 0 }));
    if (d3 > SLOW_THRESHOLD_MS)      console.warn(JSON.stringify({ tag: 'SLOW_OPERATION',          step: 'checkSchema', duration_ms: d3, note: 'Possível latência de rede ou degradação externa (PostgREST)' }));
    if (d3 > VERY_SLOW_THRESHOLD_MS) console.error(JSON.stringify({ tag: 'CRITICAL_SLOW_OPERATION', step: 'checkSchema', duration_ms: d3, note: 'Latência anormal acima do esperado — possível problema real' }));

    console.log(JSON.stringify({ tag: 'MONITOR_DONE', timestamp: new Date().toISOString() }));
    perfLog('payments-health:run', runStart);
    healthRunning = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout exceeded (${ms}ms)`)), ms)
        )
    ]);
}

async function startWorker() {
    console.log(`[BOOT] payments-health worker iniciado PID: ${process.pid}`);

    while (true) {
        const cycleStart = Date.now();
        cycleCount++;

        try {
            await withTimeout(run(), CYCLE_TIMEOUT_MS);
        } catch (err) {
            console.error(JSON.stringify({ tag: 'WORKER_CYCLE_ERROR', cycle: cycleCount, error: err.message, timestamp: new Date().toISOString() }));
            healthRunning = false; // libera o overlap guard em caso de timeout
        }

        const elapsed = Date.now() - cycleStart;

        console.log(JSON.stringify({ tag: 'CYCLE_SUMMARY', total_duration_ms: elapsed, cycle: cycleCount, timestamp: new Date().toISOString() }));

        if (cycleCount >= MAX_CYCLES) {
            console.log(JSON.stringify({ tag: 'WORKER_PREVENTIVE_RESTART', cycles: cycleCount, pid: process.pid, timestamp: new Date().toISOString() }));
            process.exit(0);
        }

        const delay = Math.max(MIN_DELAY_MS, CYCLE_INTERVAL_MS - elapsed);

        console.log(JSON.stringify({ tag: 'WORKER_SLEEP', next_in_ms: delay, cycle: cycleCount, timestamp: new Date().toISOString() }));

        await sleep(delay);
    }
}

process.on('unhandledRejection', err => {
    console.error(JSON.stringify({ tag: 'FATAL_UNHANDLED_REJECTION', error: err && err.message, timestamp: new Date().toISOString() }));
});

process.on('uncaughtException', err => {
    console.error(JSON.stringify({ tag: 'FATAL_UNCAUGHT_EXCEPTION', error: err.message, stack: err.stack, timestamp: new Date().toISOString() }));
});

startWorker();
