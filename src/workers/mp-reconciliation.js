'use strict';

const { systemAlert } = require('../utils/systemAlert');
const { sendAlert } = require('../../monitor/alert-dispatcher');

async function reconcileMPPayments(supabase) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) return;

    // Não reconciliar entre 23h e 6h (São Paulo)
    const spHour = Number(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
    if (spHour >= 23 || spHour < 6) return;

    try {
        const { data: pending, error } = await supabase
            .from('pedidos')
            .select('id, mp_payment_id, status, total_amount')
            .eq('status', 'pending')
            .not('mp_payment_id', 'is', null)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error(JSON.stringify({ tag: 'RECONCILE_DB_ERROR', error: error.message, timestamp: new Date().toISOString() }));
            return;
        }
        if (!pending || pending.length === 0) return;

        console.log(JSON.stringify({ tag: 'RECONCILE_START', count: pending.length, timestamp: new Date().toISOString() }));

        const { processPaidMPOrder } = require('../routes/mercadopago');

        for (const order of pending) {
            try {
                const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${order.mp_payment_id}`, {
                    headers: { Authorization: `Bearer ${mpToken}` }
                });
                if (!mpRes.ok) continue;

                const mpData = await mpRes.json();
                console.log(JSON.stringify({ tag: 'RECONCILE_CHECK', order_id: order.id, mp_payment_id: order.mp_payment_id, mp_status: mpData.status, timestamp: new Date().toISOString() }));

                if (mpData.status === 'approved') {
                    await processPaidMPOrder(supabase, String(order.mp_payment_id), mpData);
                    sendAlert({ tipo: 'RECONCILE_AUTO_FIX', order_id: order.id, detail: `mp_payment_id=${order.mp_payment_id} aprovado e corrigido automaticamente` }).catch(() => {});
                } else if (mpData.status === 'cancelled' || mpData.status === 'rejected') {
                    await supabase.from('pedidos')
                        .update({ status: 'payment_failed' })
                        .eq('id', order.id)
                        .eq('status', 'pending');
                    console.log(JSON.stringify({ tag: 'RECONCILE_CANCELLED', order_id: order.id, mp_status: mpData.status, timestamp: new Date().toISOString() }));
                }
            } catch (orderErr) {
                console.error(JSON.stringify({ tag: 'RECONCILE_ENTRY_ERROR', order_id: order.id, error: orderErr.message, timestamp: new Date().toISOString() }));
            }
        }

        console.log(JSON.stringify({ tag: 'RECONCILE_DONE', timestamp: new Date().toISOString() }));
    } catch (err) {
        systemAlert('RECONCILE_FATAL', { error: err.message });
    }
}

module.exports = { reconcileMPPayments };
