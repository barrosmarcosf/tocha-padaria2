'use strict';
const { systemAlert } = require('../utils/systemAlert');
const { deductStockAtomico } = require('../utils/deductStock');

async function checkStockDeductionFailures(supabase) {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('id, created_at, total_amount')
            .eq('stock_deduction_failed', true)
            .or('alerted_at.is.null,alerted_at.lt.' + new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (error) {
            console.error(JSON.stringify({ tag: 'STOCK_MONITOR_ERROR', error: error.message, timestamp: new Date().toISOString() }));
            return;
        }

        if (!data || data.length === 0) return;

        console.warn(JSON.stringify({ tag: 'STOCK_DEDUCTION_PENDING_REVIEW', count: data.length, orders: data.map(o => o.id), timestamp: new Date().toISOString() }));
        systemAlert('STOCK_DEDUCTION_PENDING_REVIEW', { orders: data.map(o => ({ id: o.id, created_at: o.created_at })) });

        await supabase
            .from('pedidos')
            .update({ alerted_at: new Date().toISOString() })
            .in('id', data.map(o => o.id));

    } catch (err) {
        console.error(JSON.stringify({ tag: 'STOCK_MONITOR_CRASH', error: err.message, timestamp: new Date().toISOString() }));
    }
}

async function retryStockDeduction(supabase) {
    try {
        const { data: orders, error } = await supabase
            .from('pedidos')
            .select('id, correlation_id, retry_count')
            .eq('stock_deduction_failed', true)
            .eq('status', 'paid')
            .or('retry_count.is.null,retry_count.lt.3');

        if (error) {
            console.error(JSON.stringify({ tag: 'STOCK_RETRY_QUERY_ERROR', error: error.message, timestamp: new Date().toISOString() }));
            return;
        }

        if (!orders || orders.length === 0) return;

        for (const order of orders) {
            const correlationId = order.correlation_id || 'unknown';
            const currentCount = order.retry_count || 0;

            try {
                console.log(JSON.stringify({
                    tag: 'STOCK_RETRY_ATTEMPT',
                    correlation_id: correlationId,
                    order_id: order.id,
                    attempt: currentCount + 1,
                    timestamp: new Date().toISOString()
                }));

                await deductStockAtomico(supabase, order.id);

                await supabase
                    .from('pedidos')
                    .update({ stock_deduction_failed: false })
                    .eq('id', order.id);

                console.log(JSON.stringify({
                    tag: 'STOCK_RETRY_SUCCESS',
                    correlation_id: correlationId,
                    order_id: order.id,
                    attempt: currentCount + 1,
                    timestamp: new Date().toISOString()
                }));

            } catch (err) {
                // Incremento atômico via RPC para evitar race condition em multi-processo
                const { data: updated } = await supabase.rpc('increment_retry_count', { p_order_id: order.id });
                const newCount = updated ?? (currentCount + 1);

                console.error(JSON.stringify({
                    tag: 'STOCK_RETRY_FAILED',
                    correlation_id: correlationId,
                    order_id: order.id,
                    attempt: newCount,
                    error: err.message,
                    timestamp: new Date().toISOString()
                }));

                if (newCount >= 3) {
                    systemAlert('STOCK_RETRY_EXHAUSTED', {
                        correlation_id: correlationId,
                        order_id: order.id
                    });
                    console.warn(JSON.stringify({
                        tag: 'STOCK_RETRY_EXHAUSTED',
                        correlation_id: correlationId,
                        order_id: order.id,
                        timestamp: new Date().toISOString()
                    }));
                }
            }
        }
    } catch (err) {
        console.error(JSON.stringify({ tag: 'STOCK_RETRY_CRASH', error: err.message, timestamp: new Date().toISOString() }));
    }
}

module.exports = { checkStockDeductionFailures, retryStockDeduction };
