/**
 * funnelSimulator.js — testes de simulação da camada de confiabilidade
 *
 * Uso: node src/services/funnelSimulator.js
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_KEY no ambiente (ou .env)
 *
 * Cenários:
 *   1. Fluxo perfeito (todas as etapas em ordem)
 *   2. Abandono no carrinho
 *   3. Erro de pagamento
 *   4. Evento duplicado (deve ser ignorado pela dedup)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { recordFunnelEvent } = require('./funnelTracker');
const { reprocessFunnel, detectMissingEvents } = require('./funnelAggregator');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY,
);

function sid(suffix) {
    return `sim_${Date.now()}_${suffix}`;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runScenario(name, fn) {
    console.log(`\n── ${name} ──`);
    try {
        await fn();
        console.log('  ✅ OK');
    } catch (e) {
        console.error('  ❌ FALHOU:', e.message);
    }
}

async function cleanupSim() {
    await supabase.from('funnel_events').delete().like('session_id', 'sim_%').catch(() => {});
}

async function main() {
    console.log('\n🧪 FUNIL SIMULATOR — TESTES DE CONFIABILIDADE\n');

    // Garante limpeza pré-teste
    await cleanupSim();
    await sleep(500);

    // ── Cenário 1: Fluxo perfeito ──────────────────────────────────────────
    await runScenario('Cenário 1: Fluxo perfeito', async () => {
        const session = sid('c1');
        const steps = ['site_enter','view_product','cart_created','checkout_started','payment_attempted','payment_success'];
        for (const s of steps) {
            await recordFunnelEvent(supabase, { event_type: s, session_id: session });
            await sleep(50);
        }

        const { data } = await supabase.from('funnel_events').select('event_type, flag_inconsistency').eq('session_id', session);
        const flagged = (data || []).filter(r => r.flag_inconsistency);
        if (flagged.length > 0) throw new Error(`${flagged.length} eventos marcados como inconsistentes no fluxo perfeito`);
        if ((data || []).length !== 6) throw new Error(`Esperado 6 eventos, encontrado ${(data || []).length}`);
    });

    // ── Cenário 2: Abandono no carrinho ────────────────────────────────────
    await runScenario('Cenário 2: Abandono no carrinho', async () => {
        const session = sid('c2');
        await recordFunnelEvent(supabase, { event_type: 'site_enter',   session_id: session });
        await sleep(50);
        await recordFunnelEvent(supabase, { event_type: 'view_product', session_id: session });
        await sleep(50);
        await recordFunnelEvent(supabase, { event_type: 'cart_created', session_id: session });
        // Não continua para checkout → abandono esperado

        const { data } = await supabase.from('funnel_events').select('event_type').eq('session_id', session);
        const types = (data || []).map(r => r.event_type);
        if (types.includes('checkout_started')) throw new Error('checkout_started não deveria existir');
        if (!types.includes('cart_created'))    throw new Error('cart_created ausente');
    });

    // ── Cenário 3: Erro de pagamento ───────────────────────────────────────
    await runScenario('Cenário 3: Erro de pagamento', async () => {
        const session = sid('c3');
        const preSteps = ['site_enter','view_product','cart_created','checkout_started','payment_attempted'];
        for (const s of preSteps) {
            await recordFunnelEvent(supabase, { event_type: s, session_id: session });
            await sleep(50);
        }
        await recordFunnelEvent(supabase, { event_type: 'payment_failed', session_id: session,
            metadata: { reason: 'insufficient_funds' } });

        const { data } = await supabase.from('funnel_events').select('event_type').eq('session_id', session);
        const types = (data || []).map(r => r.event_type);
        if (types.includes('payment_success')) throw new Error('payment_success não deveria existir');
        if (!types.includes('payment_failed')) throw new Error('payment_failed ausente');
    });

    // ── Cenário 4: Evento duplicado ────────────────────────────────────────
    await runScenario('Cenário 4: Deduplicação de eventos', async () => {
        const session = sid('c4');
        await recordFunnelEvent(supabase, { event_type: 'site_enter', session_id: session });
        await sleep(50);
        // Envia o mesmo evento duas vezes adicionais
        await recordFunnelEvent(supabase, { event_type: 'site_enter', session_id: session });
        await sleep(50);
        await recordFunnelEvent(supabase, { event_type: 'site_enter', session_id: session });
        await sleep(200);

        const { data } = await supabase.from('funnel_events')
            .select('id')
            .eq('session_id', session)
            .eq('event_type', 'site_enter');
        if ((data || []).length !== 1) throw new Error(`Esperado 1 registro, encontrado ${(data || []).length} — dedup falhou`);
    });

    // ── Cenário 5: Evento fora de ordem → flag_inconsistency ───────────────
    await runScenario('Cenário 5: Integridade — payment_success sem upstream', async () => {
        const session = sid('c5');
        // Injeta payment_success sem nenhum evento anterior
        await recordFunnelEvent(supabase, { event_type: 'payment_success', session_id: session });
        await sleep(200);

        const { data } = await supabase.from('funnel_events')
            .select('flag_inconsistency')
            .eq('session_id', session)
            .eq('event_type', 'payment_success');
        const row = (data || [])[0];
        if (!row?.flag_inconsistency) throw new Error('flag_inconsistency deveria ser true para payment_success sem upstream');
    });

    // ── Reprocessamento ───────────────────────────────────────────────────
    await runScenario('Reprocessamento: reprocessFunnel()', async () => {
        const result = await reprocessFunnel(supabase, 1);
        if (typeof result.sv !== 'object') throw new Error('sv ausente no resultado');
        if (!Array.isArray(result.stepTimes)) throw new Error('stepTimes deve ser array');
        if (!Array.isArray(result.missingEvts)) throw new Error('missingEvts deve ser array');
    });

    // Limpeza pós-teste
    await cleanupSim();

    console.log('\n══════════════════════════════════');
    console.log('✅ SIMULAÇÃO CONCLUÍDA');
    console.log('══════════════════════════════════\n');
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
