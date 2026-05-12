'use strict';
/**
 * Backfill de motivos de rejeição históricos.
 * Re-normaliza payment_events e pedidos onde reason/rejection_reason = 'outros'
 * mas raw_code contém um código mapeável no normalizer atual.
 *
 * Uso: node scripts/backfill-rejection-reasons.js [--dry-run]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { normalizePaymentFailure } = require('../src/utils/paymentNormalizer');

const DRY_RUN = process.argv.includes('--dry-run');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function backfillPaymentEvents() {
    const { data, error } = await supabase
        .from('payment_events')
        .select('id, provider, reason, raw_code')
        .eq('event_type', 'decline')
        .eq('reason', 'outros')
        .not('raw_code', 'is', null)
        .neq('raw_code', 'unknown');

    if (error) { console.error('Erro ao buscar payment_events:', error.message); return 0; }
    if (!data || data.length === 0) { console.log('payment_events: nenhum registro a corrigir.'); return 0; }

    let fixed = 0;
    for (const ev of data) {
        const normalized = normalizePaymentFailure(ev.provider || 'mercadopago', ev.raw_code);
        if (normalized.category === 'outros') continue;

        if (!DRY_RUN) {
            const { error: upErr } = await supabase
                .from('payment_events')
                .update({ reason: normalized.category })
                .eq('id', ev.id);
            if (upErr) { console.warn(`  ✗ payment_events[${ev.id}]: ${upErr.message}`); continue; }
        }
        console.log(`  ${DRY_RUN ? '[DRY]' : '✓'} payment_events[${ev.id}]: '${ev.raw_code}' → '${normalized.category}'`);
        fixed++;
    }
    return fixed;
}

async function backfillPedidos() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, rejection_reason, rejection_raw_code, payment_attempts')
        .eq('rejection_reason', 'outros')
        .not('rejection_raw_code', 'is', null)
        .neq('rejection_raw_code', 'unknown');

    if (error) { console.error('Erro ao buscar pedidos:', error.message); return 0; }
    if (!data || data.length === 0) { console.log('pedidos: nenhum registro a corrigir.'); return 0; }

    let fixed = 0;
    for (const order of data) {
        const normalized = normalizePaymentFailure('mercadopago', order.rejection_raw_code);
        if (normalized.category === 'outros') continue;

        const update = { rejection_reason: normalized.category };

        // Atualiza também payment_attempts se o último attempt tiver reason = 'outros'
        if (Array.isArray(order.payment_attempts) && order.payment_attempts.length > 0) {
            const attempts = [...order.payment_attempts];
            const last = attempts[attempts.length - 1];
            if (last.reason === 'outros' && last.raw_code === order.rejection_raw_code) {
                attempts[attempts.length - 1] = { ...last, reason: normalized.category };
                update.payment_attempts = attempts;
            }
        }

        if (!DRY_RUN) {
            const { error: upErr } = await supabase
                .from('pedidos')
                .update(update)
                .eq('id', order.id);
            if (upErr) { console.warn(`  ✗ pedidos[${order.id}]: ${upErr.message}`); continue; }
        }
        console.log(`  ${DRY_RUN ? '[DRY]' : '✓'} pedidos[${order.id}]: '${order.rejection_raw_code}' → '${normalized.category}'`);
        fixed++;
    }
    return fixed;
}

async function main() {
    console.log(`\n🔧 BACKFILL MOTIVOS DE REJEIÇÃO ${DRY_RUN ? '(DRY RUN)' : ''}\n`);

    console.log('[1/2] payment_events...');
    const evFixed = await backfillPaymentEvents();

    console.log('\n[2/2] pedidos...');
    const orFixed = await backfillPedidos();

    console.log(`\n══════════════════════════════════`);
    console.log(`payment_events corrigidos : ${evFixed}`);
    console.log(`pedidos corrigidos        : ${orFixed}`);
    if (DRY_RUN) console.log('\n⚠  Dry run — nenhum dado alterado. Rode sem --dry-run para aplicar.');
    else          console.log('\n✅ Backfill concluído.');
    console.log('══════════════════════════════════\n');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
