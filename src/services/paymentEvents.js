'use strict';

/**
 * Serviço centralizado para registrar eventos de pagamento na tabela payment_events.
 * Toda aprovação, recusa, estorno, chargeback e tentativa passa por aqui.
 * Falhas de insert são silenciosas (nunca devem interromper o fluxo principal).
 */

async function recordPaymentEvent(supabase, { order_id, event_type, status, provider, method, reason, raw_code, amount, currency, metadata }) {
    if (!order_id || !event_type) return;
    try {
        await supabase.from('payment_events').insert({
            order_id,
            event_type,
            status:   status   || null,
            provider: provider || null,
            method:   method   || null,
            reason:   reason   || null,
            raw_code: raw_code || null,
            amount:   amount != null ? Number(amount) : null,
            currency: currency || 'BRL',
            metadata: metadata || null,
        });
    } catch (err) {
        console.warn(`[PaymentEvents] Falha ao registrar evento ${event_type} (order=${order_id}):`, err.message);
    }
}

/**
 * Agrega métricas das últimas N horas a partir de payment_events.
 * Retorna: approval_rate_24h, rejection_top_reasons, refund_rate, total_events_by_type
 */
async function getPaymentEventMetrics(supabase, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await supabase
        .from('payment_events')
        .select('event_type, reason, raw_code, amount, provider, method')
        .gte('created_at', since);

    if (error || !events) return null;

    const byType = {};
    events.forEach(e => { byType[e.event_type] = (byType[e.event_type] || 0) + 1; });

    const approvals  = byType['approval']  || 0;
    const declines   = byType['decline']   || 0;
    const refunds    = byType['refund']    || 0;
    const chargebacks= byType['chargeback']|| 0;
    const attempts   = byType['attempt']   || 0;
    const total      = approvals + declines + attempts;

    // Top motivos de rejeição
    const reasonMap = {};
    events.filter(e => e.event_type === 'decline' && e.reason).forEach(e => {
        reasonMap[e.reason] = (reasonMap[e.reason] || 0) + 1;
    });
    const rejectionTopReasons = Object.entries(reasonMap)
        .map(([reason, count]) => ({ reason, count, pct: declines > 0 ? Math.round((count / declines) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Split por método (aprovações)
    const methodMap = {};
    events.filter(e => e.event_type === 'approval' && e.method).forEach(e => {
        const m = e.method.includes('Pix') ? 'PIX'
            : e.method.includes('Crédito') || e.method === 'credit_card' ? 'Crédito'
            : e.method.includes('Débito')  || e.method === 'debit_card'  ? 'Débito'
            : 'Outros';
        methodMap[m] = (methodMap[m] || 0) + 1;
    });
    const methodSplit = Object.entries(methodMap)
        .map(([method, count]) => ({ method, count, pct: approvals > 0 ? Math.round((count / approvals) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

    return {
        period_hours: hours,
        approval_rate_24h: total > 0 ? Math.round((approvals / total) * 1000) / 10 : 0,
        refund_rate:       approvals > 0 ? Math.round(((refunds + chargebacks) / approvals) * 1000) / 10 : 0,
        total_events_by_type: { approval: approvals, decline: declines, refund: refunds, chargeback: chargebacks, attempt: attempts },
        rejection_top_reasons: rejectionTopReasons,
        method_split: methodSplit,
    };
}

module.exports = { recordPaymentEvent, getPaymentEventMetrics };
