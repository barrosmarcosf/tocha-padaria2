'use strict';

async function getPaymentMetrics(supabase) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [logsRes, ordersRes, dlqRes] = await Promise.all([
        supabase.from('payment_logs').select('status, duration_ms').gte('created_at', since),
        supabase.from('pedidos').select('status').gte('created_at', since),
        supabase.from('failed_payments_queue').select('id', { count: 'exact', head: true }).lt('retries', 3)
    ]);

    const logs   = logsRes.data   || [];
    const orders = ordersRes.data || [];

    const totalAttempts = logs.length;
    const approved = logs.filter(l => l.status === 'approved' || l.status === 'success').length;
    const errors   = logs.filter(l => l.status === 'error').length;

    const durations = logs.filter(l => l.duration_ms > 0).map(l => l.duration_ms);
    const avgDurationMs = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const paidCount    = orders.filter(o => o.status === 'paid').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const failedCount  = orders.filter(o => o.status === 'payment_failed' || o.status === 'error').length;

    return {
        period: '24h',
        payment_attempts: totalAttempts,
        conversion_rate_pct: totalAttempts > 0 ? Math.round((approved / totalAttempts) * 100) : 0,
        failure_rate_pct:    totalAttempts > 0 ? Math.round((errors   / totalAttempts) * 100) : 0,
        avg_duration_ms: avgDurationMs,
        orders: { paid: paidCount, pending: pendingCount, failed: failedCount },
        dlq_pending: dlqRes.count ?? 0,
        timestamp: new Date().toISOString()
    };
}

module.exports = { getPaymentMetrics };
