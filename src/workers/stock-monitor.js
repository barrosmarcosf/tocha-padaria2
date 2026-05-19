'use strict';
const { systemAlert } = require('../utils/systemAlert');

async function checkStockDeductionFailures(supabase) {
    try {
        // Busca todas as falhas não alertadas OU alertadas há mais de 1h
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

        // Marca registros como alertados para evitar spam (re-alerta após 1h)
        await supabase
            .from('pedidos')
            .update({ alerted_at: new Date().toISOString() })
            .in('id', data.map(o => o.id));

    } catch (err) {
        console.error(JSON.stringify({ tag: 'STOCK_MONITOR_CRASH', error: err.message, timestamp: new Date().toISOString() }));
    }
}

module.exports = { checkStockDeductionFailures };
