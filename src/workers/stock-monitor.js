'use strict';
const { systemAlert } = require('../utils/systemAlert');

async function checkStockDeductionFailures(supabase) {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('pedidos')
            .select('id, created_at, total_amount')
            .eq('stock_deduction_failed', true)
            .gt('created_at', since);

        if (error) {
            console.error(JSON.stringify({ tag: 'STOCK_MONITOR_ERROR', error: error.message, timestamp: new Date().toISOString() }));
            return;
        }

        if (data && data.length > 0) {
            console.warn(JSON.stringify({ tag: 'STOCK_DEDUCTION_PENDING_REVIEW', count: data.length, orders: data.map(o => o.id), timestamp: new Date().toISOString() }));
            systemAlert('STOCK_DEDUCTION_PENDING_REVIEW', { orders: data.map(o => ({ id: o.id, created_at: o.created_at })) });
        }
    } catch (err) {
        console.error(JSON.stringify({ tag: 'STOCK_MONITOR_CRASH', error: err.message, timestamp: new Date().toISOString() }));
    }
}

module.exports = { checkStockDeductionFailures };
