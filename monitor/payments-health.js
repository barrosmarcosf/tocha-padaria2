'use strict';
require('dotenv').config({ path: '/root/tocha-padaria2/.env' });

const { createClient } = require('@supabase/supabase-js');
const { systemAlert } = require('../src/utils/systemAlert');

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

// ── CHECK 1: Stale locks (pending + processing=true + processing_at > 2min) ─
async function checkStaleLocks() {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: stale, error } = await supabase
        .from('pedidos')
        .select('id, processing_at')
        .eq('status', 'pending')
        .eq('processing', true)
        .lt('processing_at', cutoff);

    if (error) {
        console.error(JSON.stringify({ tag: 'MONITOR_DB_ERROR', context: 'stale_locks', error: error.message, timestamp: new Date().toISOString() }));
        return;
    }

    if (!stale || stale.length === 0) return;

    for (const row of stale) {
        systemAlert('ALERT_STALE_LOCK', { order_id: row.id, processing_at: row.processing_at });

        const { error: fixErr } = await supabase
            .from('pedidos')
            .update({ processing: false, processing_at: null })
            .eq('id', row.id)
            .eq('processing', true);

        if (fixErr) {
            console.error(JSON.stringify({ tag: 'MONITOR_FIX_ERROR', order_id: row.id, error: fixErr.message, timestamp: new Date().toISOString() }));
        } else {
            console.log(JSON.stringify({ tag: 'STALE_LOCK_FIXED', order_id: row.id, timestamp: new Date().toISOString() }));
        }
    }
}

// ── CHECK 2: Pedidos pending com mp_payment_id — indica falha no processPaidMPOrder ─
async function checkUnfinalizedPayments() {
    const { data: unfinalized, error } = await supabase
        .from('pedidos')
        .select('id, mp_payment_id, created_at')
        .eq('status', 'pending')
        .not('mp_payment_id', 'is', null);

    if (error) {
        console.error(JSON.stringify({ tag: 'MONITOR_DB_ERROR', context: 'unfinalized_payments', error: error.message, timestamp: new Date().toISOString() }));
        return;
    }

    if (!unfinalized || unfinalized.length === 0) return;

    for (const row of unfinalized) {
        systemAlert('ALERT_PAYMENT_NOT_FINALIZED', {
            order_id: row.id,
            mp_payment_id: row.mp_payment_id,
            created_at: row.created_at
        });
    }
}

// ── CHECK 3: Schema cache — valida coluna 'processing' sem transferir dados ─
async function checkSchema() {
    const { error } = await supabase
        .from('pedidos')
        .select('processing')
        .limit(0);

    if (!error) return;

    systemAlert('SCHEMA_ERROR', { error: error.message });

    try {
        await supabase.rpc('notify_pgrst_reload');
        console.log(JSON.stringify({ tag: 'SCHEMA_RELOAD_TRIGGERED', timestamp: new Date().toISOString() }));
    } catch (rpcErr) {
        console.error(JSON.stringify({ tag: 'SCHEMA_RELOAD_FAILED', error: rpcErr.message, timestamp: new Date().toISOString() }));
    }
}

async function run() {
    console.log(JSON.stringify({ tag: 'MONITOR_START', timestamp: new Date().toISOString() }));

    await Promise.all([checkStaleLocks(), checkUnfinalizedPayments()]);
    await checkSchema();

    console.log(JSON.stringify({ tag: 'MONITOR_DONE', timestamp: new Date().toISOString() }));
}

run().catch(err => {
    systemAlert('MONITOR_FATAL', { error: err.message });
    process.exit(1);
});
