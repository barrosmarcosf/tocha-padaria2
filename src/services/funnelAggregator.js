/**
 * funnelAggregator.js — métricas derivadas, anomalias e reprocessamento
 *
 * Responsabilidades:
 * - Tempo entre etapas (avg + mediana por par)
 * - Detecção de eventos ausentes por sessão
 * - Detecção de anomalias (queda >30% conversão, aumento >25% rejeição)
 * - Alertas críticos (aprovação=0, abandono>95%)
 * - Gravação em insights_log
 * - Reprocessamento do funil a partir de funnel_events
 */

const FUNNEL_ORDER = [
    'site_enter',
    'view_product',
    'cart_created',
    'checkout_started',
    'payment_attempted',
    'payment_success',
];

const MAX_FUNNEL_MS = 8 * 3600 * 1000; // sessões > 8h são descartadas do cálculo de tempo

function median(arr) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function fmtMs(ms) {
    if (ms === null || ms === undefined) return null;
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// Tempo médio + mediana entre cada par de etapas consecutivas
function computeStepTimes(sessMaps) {
    const pairs = [];
    for (let i = 1; i < FUNNEL_ORDER.length; i++) {
        pairs.push({ from: FUNNEL_ORDER[i - 1], to: FUNNEL_ORDER[i], deltas: [] });
    }

    for (const evs of Object.values(sessMaps)) {
        for (const p of pairs) {
            const t0 = evs[p.from], t1 = evs[p.to];
            if (!t0 || !t1) continue;
            const d = new Date(t1).getTime() - new Date(t0).getTime();
            if (d > 0 && d < MAX_FUNNEL_MS) p.deltas.push(d);
        }
    }

    return pairs.map(p => ({
        from:       p.from,
        to:         p.to,
        n:          p.deltas.length,
        avg_ms:     p.deltas.length ? Math.round(p.deltas.reduce((s, v) => s + v, 0) / p.deltas.length) : null,
        median_ms:  median(p.deltas),
        avg_fmt:    fmtMs(p.deltas.length ? Math.round(p.deltas.reduce((s, v) => s + v, 0) / p.deltas.length) : null),
        median_fmt: fmtMs(median(p.deltas)),
    }));
}

// Sessões com eventos esperados ausentes
function detectMissingEvents(sessMaps) {
    const issues = [];
    for (const [sid, evs] of Object.entries(sessMaps)) {
        if (evs['cart_created'] && !evs['view_product'] && !evs['site_enter'])
            issues.push({ session_id: sid, issue: 'cart_without_visit' });
        if (evs['payment_attempted'] && !evs['checkout_started'])
            issues.push({ session_id: sid, issue: 'payment_without_checkout' });
        if (evs['payment_success'] && !evs['payment_attempted'])
            issues.push({ session_id: sid, issue: 'success_without_attempt' });
        if (evs['checkout_started'] && !evs['cart_created'])
            issues.push({ session_id: sid, issue: 'checkout_without_cart' });
    }
    return issues;
}

// Queda >30% conversão ou aumento >25% rejeição em relação ao período anterior
function detectAnomalies(current, previous) {
    if (!previous) return [];
    const anomalies = [];

    const convCurr = current.site_enter > 0 ? current.payment_success / current.site_enter : 0;
    const convPrev = previous.site_enter > 0 ? previous.payment_success / previous.site_enter : 0;

    if (convPrev > 0) {
        const drop = (convPrev - convCurr) / convPrev;
        if (drop > 0.30) {
            anomalies.push({
                type:    'anomaly',
                value:   +(drop * 100).toFixed(1),
                context: { subtype: 'conversion_drop', current_pct: +(convCurr * 100).toFixed(2), previous_pct: +(convPrev * 100).toFixed(2) },
            });
        }
    }

    if (current.payment_attempted > 0 && previous.payment_attempted > 0) {
        const rejCurr = 1 - (current.payment_success / current.payment_attempted);
        const rejPrev = 1 - (previous.payment_success / previous.payment_attempted);
        if (rejPrev > 0 && (rejCurr - rejPrev) / rejPrev > 0.25) {
            anomalies.push({
                type:    'anomaly',
                value:   +(((rejCurr - rejPrev) / rejPrev) * 100).toFixed(1),
                context: { subtype: 'rejection_increase', current_pct: +(rejCurr * 100).toFixed(1), previous_pct: +(rejPrev * 100).toFixed(1) },
            });
        }
    }

    return anomalies;
}

// Alertas imediatos (aprovação=0, abandono>95%, inconsistências)
function generateAlerts(sv, abandonRate, inconsistencyCount) {
    const alerts = [];

    if (sv.payment_attempted > 5 && sv.payment_success === 0) {
        alerts.push({ type: 'alert', value: 0,
            context: { subtype: 'zero_approval', message: `0 pagamentos aprovados em ${sv.payment_attempted} tentativas.` } });
    }

    if (abandonRate > 95 && sv.cart_created > 10) {
        alerts.push({ type: 'alert', value: abandonRate,
            context: { subtype: 'critical_abandonment', message: `Abandono crítico: ${abandonRate}% das sessões com carrinho.` } });
    }

    if (inconsistencyCount > 10) {
        alerts.push({ type: 'alert', value: inconsistencyCount,
            context: { subtype: 'data_inconsistency', message: `${inconsistencyCount} eventos com inconsistência de ordem detectados.` } });
    }

    return alerts;
}

async function logInsights(supabase, entries) {
    if (!entries.length) return;
    const rows = entries.map(e => ({
        type:        e.type,
        detected_at: new Date().toISOString(),
        value:       e.value ?? null,
        context:     e.context ?? {},
    }));
    const { error: insightErr } = await supabase.from('insights_log').insert(rows);
    if (insightErr) console.warn('[INSIGHT] insert failed:', insightErr.message);
}

// Reconstrói sessMaps + byType direto de funnel_events (sem tabela events)
async function reprocessFunnel(supabase, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { data: rows, error } = await supabase
        .from('funnel_events')
        .select('event_type, session_id, created_at, flag_inconsistency')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(50000);

    if (error) throw new Error('reprocess query failed: ' + error.message);

    const TYPES = new Set(FUNNEL_ORDER);
    const sessMaps = {};
    const byType   = {};

    (rows || []).forEach(({ session_id: sid, event_type: type, created_at: ts }) => {
        if (!sid || !TYPES.has(type)) return;
        if (!byType[type]) byType[type] = new Set();
        byType[type].add(sid);
        if (!sessMaps[sid]) sessMaps[sid] = {};
        if (!sessMaps[sid][type] || ts < sessMaps[sid][type])
            sessMaps[sid][type] = ts;
    });

    const sv          = Object.fromEntries(FUNNEL_ORDER.map(t => [t, byType[t]?.size || 0]));
    const stepTimes   = computeStepTimes(sessMaps);
    const missingEvts = detectMissingEvents(sessMaps);
    const inconsistencies = (rows || []).filter(r => r.flag_inconsistency).length;

    // Persiste snapshot do reprocessamento
    await supabase.from('funnel_aggregates').insert({
        period_start:      since,
        period_end:        new Date().toISOString(),
        period_days:       days,
        site_enter:        sv.site_enter,
        view_product:      sv.view_product,
        cart_created:      sv.cart_created,
        checkout_started:  sv.checkout_started,
        payment_attempted: sv.payment_attempted,
        payment_success:   sv.payment_success,
        step_times:        stepTimes,
        anomalies:         [],
        computed_at:       new Date().toISOString(),
    }).catch(() => {});

    return { sv, stepTimes, missingEvts, inconsistencies, totalSessions: Object.keys(sessMaps).length };
}

module.exports = {
    computeStepTimes,
    detectMissingEvents,
    detectAnomalies,
    generateAlerts,
    logInsights,
    reprocessFunnel,
    FUNNEL_ORDER,
};
