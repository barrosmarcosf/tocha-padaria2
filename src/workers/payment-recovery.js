const { sendPaymentRecovery } = require('../notification-service');

// Delays em minutos por step, por método de pagamento
const PAYMENT_DELAYS = {
    pix:  [5, 20, 60],  // step 0, 1, 2
    card: [10]          // step 0 apenas
};

function detectPaymentMethod(order) {
    if (order.stripe_session_id) return 'card';
    return 'pix';
}

function isPaymentStepDue(order, delays) {
    const step = order.payment_recovery_step || 0;
    if (step >= delays.length) return false;
    const delayMs = delays[step] * 60 * 1000;
    const reference = step === 0 ? order.created_at : order.payment_last_recovery_at;
    if (!reference) return false;
    return Date.now() - new Date(reference).getTime() >= delayMs;
}

async function resolveCustomer(supabase, order) {
    // Prioridade 1: customer_id
    if (order.customer_id) {
        const { data } = await supabase
            .from('clientes')
            .select('name, email, whatsapp')
            .eq('id', order.customer_id)
            .maybeSingle();
        if (data && (data.email || data.whatsapp)) return data;
    }

    // Prioridade 2: dados embutidos no JSON de items
    try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const embedded = items?.customer || items?.customer_data;
        if (embedded && (embedded.email || embedded.whatsapp)) return embedded;
    } catch (_) {}

    return null;
}

async function checkPendingPayments(supabase) {
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentHour = saoPauloTime.getHours();

    // Janela mais ampla que o worker de carrinho: aceita fora do horário comercial
    // mas respeitando sossego noturno (não incomoda entre 23h e 7h)
    if (currentHour >= 23 || currentHour < 7) return;

    try {
        const { data: pending, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;

        for (const order of pending) {
            // Re-consulta para evitar race condition com webhook
            const { data: fresh } = await supabase
                .from('pedidos')
                .select('status, processing, payment_recovery_step, payment_last_recovery_at, customer_id')
                .eq('id', order.id)
                .maybeSingle();

            if (!fresh || fresh.status !== 'pending') {
                console.log(`[RECOVERY SKIP - PAID] order_id=${order.id} status=${fresh?.status ?? 'não encontrado'}`);
                continue;
            }

            if (fresh.processing) {
                console.log(`[RECOVERY SKIP - PROCESSING] order_id=${order.id}`);
                continue;
            }

            const method = detectPaymentMethod(order);
            const delays = PAYMENT_DELAYS[method] || PAYMENT_DELAYS.pix;
            const step = fresh.payment_recovery_step || 0;

            // Mescla campos atualizados do fresh no objeto order para isPaymentStepDue
            const orderWithFresh = { ...order, ...fresh };
            if (!isPaymentStepDue(orderWithFresh, delays)) continue;

            const customer = await resolveCustomer(supabase, orderWithFresh);
            if (!customer) {
                console.log(`[PAYMENT RECOVERY STEP ${step}] SKIP order_id=${order.id}: sem contato`);
                continue;
            }

            const appUrl = process.env.BASE_URL || 'http://localhost:3333';
            const recoveryUrl = method === 'pix'
                ? `${appUrl}/pagamento-pix.html?order_id=${order.id}`
                : `${appUrl}/checkout-mp.html?order_id=${order.id}`;

            console.log(`[PAYMENT RECOVERY STEP ${step}] order_id=${order.id} method=${method} contato=${customer.email || customer.whatsapp}`);

            await sendPaymentRecovery(supabase, customer, order, recoveryUrl, step, method);

            await supabase.from('pedidos').update({
                payment_recovery_step: step + 1,
                payment_last_recovery_at: new Date().toISOString()
            }).eq('id', order.id);
        }
    } catch (e) {
        console.error('[PAYMENT RECOVERY] Erro no worker:', e.message);
    }
}

module.exports = { checkPendingPayments };
