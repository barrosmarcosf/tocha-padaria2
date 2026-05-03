'use strict';

const { systemAlert } = require('../utils/systemAlert');
const { sendAlert } = require('../../monitor/alert-dispatcher');

const MAX_RETRIES = 3;

async function retryFailedPayments(supabase) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    try {
        const { data: entries, error } = await supabase
            .from('failed_payments_queue')
            .select('*')
            .lt('retries', MAX_RETRIES)
            .order('created_at', { ascending: true })
            .limit(20);

        if (error) {
            console.error(JSON.stringify({ tag: 'DLQ_ERROR', error: error.message, timestamp: new Date().toISOString() }));
            return;
        }
        if (!entries || entries.length === 0) return;

        console.log(JSON.stringify({ tag: 'DLQ_START', count: entries.length, timestamp: new Date().toISOString() }));

        for (const entry of entries) {
            try {
                const { order_id, mp_payment_id } = entry;

                // Se o pedido já foi pago por outra via, limpar da fila
                const { data: order } = await supabase
                    .from('pedidos')
                    .select('id, status')
                    .eq('id', order_id)
                    .maybeSingle();

                if (!order) {
                    await supabase.from('failed_payments_queue').delete().eq('id', entry.id);
                    console.log(JSON.stringify({ tag: 'DLQ_REMOVED', order_id, reason: 'order_not_found', timestamp: new Date().toISOString() }));
                    continue;
                }

                if (order.status === 'paid') {
                    await supabase.from('failed_payments_queue').delete().eq('id', entry.id);
                    console.log(JSON.stringify({ tag: 'DLQ_RESOLVED', order_id, reason: 'already_paid', timestamp: new Date().toISOString() }));
                    continue;
                }

                // Tentar reprocessar consultando o status no MP
                if (mp_payment_id && mpToken) {
                    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mp_payment_id}`, {
                        headers: { Authorization: `Bearer ${mpToken}` }
                    });
                    const mpData = await mpRes.json();

                    if (mpData.status === 'approved') {
                        const { processPaidMPOrder } = require('../routes/mercadopago');
                        await processPaidMPOrder(supabase, String(mp_payment_id), mpData);
                        await supabase.from('failed_payments_queue').delete().eq('id', entry.id);
                        console.log(JSON.stringify({ tag: 'DLQ_SUCCESS', order_id, mp_payment_id, timestamp: new Date().toISOString() }));
                        continue;
                    }
                }

                const newRetries = entry.retries + 1;
                await supabase.from('failed_payments_queue')
                    .update({ retries: newRetries, last_retry_at: new Date().toISOString(), last_error: 'mp_not_approved_on_retry' })
                    .eq('id', entry.id);

                console.log(JSON.stringify({ tag: 'DLQ_RETRY', order_id, retries: newRetries, timestamp: new Date().toISOString() }));

                if (newRetries >= MAX_RETRIES) {
                    systemAlert('ALERT_DLQ_MAX_RETRIES', { order_id, mp_payment_id, retries: newRetries });
                    sendAlert({ tipo: 'ALERT_DLQ_MAX_RETRIES', order_id, detail: `${newRetries} tentativas falharam — intervenção manual necessária` }).catch(() => {});
                }
            } catch (entryErr) {
                const newRetries = entry.retries + 1;
                await supabase.from('failed_payments_queue')
                    .update({ retries: newRetries, last_retry_at: new Date().toISOString(), last_error: entryErr.message })
                    .eq('id', entry.id);
                console.error(JSON.stringify({ tag: 'DLQ_ENTRY_ERROR', order_id: entry.order_id, error: entryErr.message, timestamp: new Date().toISOString() }));
            }
        }

        console.log(JSON.stringify({ tag: 'DLQ_DONE', timestamp: new Date().toISOString() }));
    } catch (err) {
        systemAlert('DLQ_FATAL', { error: err.message });
    }
}

module.exports = { retryFailedPayments };
