const crypto = require('crypto');
const { sendAbandonmentRecovery } = require('../notification-service');

// Delays em minutos por step: 30min → 2h → 24h
const STEP_DELAYS_MINUTES = [30, 120, 1440];

function isStepDue(cart) {
    const step = cart.recovery_step || 0;
    if (step >= STEP_DELAYS_MINUTES.length) return false;
    const delayMs = STEP_DELAYS_MINUTES[step] * 60 * 1000;
    if (step === 0) {
        if (!cart.last_activity_at) return false;
        return Date.now() - new Date(cart.last_activity_at).getTime() >= delayMs;
    }
    if (!cart.last_recovery_at) return false;
    return Date.now() - new Date(cart.last_recovery_at).getTime() >= delayMs;
}

async function ensureRecoveryToken(supabase, cart) {
    if (cart.recovery_token) return cart.recovery_token;
    const token = crypto.randomBytes(24).toString('hex');
    await supabase.from('carrinhos').update({ recovery_token: token }).eq('id', cart.id);
    console.log(`[CART RECOVERY STEP ${cart.recovery_step || 0}] Fallback token gerado id=${cart.id}`);
    return token;
}

async function markRecoverySent(supabase, cart) {
    const nextStep = (cart.recovery_step || 0) + 1;
    const isLastStep = nextStep >= STEP_DELAYS_MINUTES.length;
    const update = {
        recovery_step: nextStep,
        last_recovery_at: new Date().toISOString(),
        ...(isLastStep ? { recovery_sent: true } : {})
    };
    await supabase.from('carrinhos').update(update).eq('id', cart.id);
}

async function dispatchRecovery(supabase, cart, customerData) {
    const step = cart.recovery_step || 0;
    const recoveryToken = await ensureRecoveryToken(supabase, cart);
    const appUrl = process.env.BASE_URL || 'http://localhost:3333';
    const recoveryUrl = `${appUrl}/?token=${recoveryToken}`;

    await sendAbandonmentRecovery(supabase, customerData, JSON.parse(cart.items), recoveryUrl);
    console.log(`[CART RECOVERY STEP ${step}] Enviado session_id=${cart.session_id} cliente=${customerData.name || 'Cliente'}`);
    await markRecoverySent(supabase, cart);
}

async function checkAbandonedCarts(supabase) {
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const currentHour = saoPauloTime.getHours();

    if (currentHour < 9 || currentHour >= 21) {
        console.log(`[WORKER] 💤 Fora do horário comercial (${currentHour}h). Aguardando próxima janela.`);
        return;
    }

    console.log("⏱️ [WORKER] Verificando carrinhos abandonados...");
    try {
        // Busca carrinhos ativos com recovery_step < 3 e recovery_sent=false (backward compat)
        const { data: candidates, error } = await supabase
            .from('carrinhos')
            .select('*')
            .eq('status', 'active')
            .eq('recovery_sent', false)
            .lt('recovery_step', STEP_DELAYS_MINUTES.length)
            .order('last_activity_at', { ascending: true });

        if (error) throw error;

        // Filtra por tempo de delay por step
        const abandoned = candidates.filter(isStepDue);

        // Filtragem de segurança: pula carrinhos com pedido pago
        const activeAbandoned = [];
        for (const cart of abandoned) {
            if (cart.order_id) {
                const { data: existingOrder } = await supabase
                    .from('pedidos')
                    .select('status')
                    .eq('id', cart.order_id)
                    .maybeSingle();

                if (existingOrder && (existingOrder.status === 'paid' || existingOrder.status === 'completed')) {
                    console.log(`[RECOVERY SKIP - PAID] Carrinho ${cart.id} — Pedido ${cart.order_id} já PAGO.`);
                    await supabase.from('carrinhos').update({ status: 'completed' }).eq('id', cart.id);
                    continue;
                }
            }
            activeAbandoned.push(cart);
        }

        for (const cart of activeAbandoned) {
            const step = cart.recovery_step || 0;

            // Prioridade 1: customer_data direto no carrinho
            const hasContact = cart.customer_data && (cart.customer_data.email || cart.customer_data.whatsapp);
            if (hasContact) {
                console.log(`[ABANDONO MATCH OK] session_id=${cart.session_id}`);
                await dispatchRecovery(supabase, cart, cart.customer_data);
                continue;
            }

            // Prioridade 2: via customer_sessions
            let identified = false;
            try {
                const { data: sessionLink } = await supabase
                    .from('customer_sessions')
                    .select('customer_email')
                    .eq('session_id', cart.session_id)
                    .maybeSingle();

                if (sessionLink?.customer_email) {
                    const { data: sessionCustomer } = await supabase
                        .from('clientes')
                        .select('name, email, whatsapp')
                        .eq('email', sessionLink.customer_email)
                        .maybeSingle();

                    if (sessionCustomer) {
                        identified = true;
                        console.log(`[ABANDONO MATCH OK] session_id=${cart.session_id} email=${sessionCustomer.email}`);
                        await dispatchRecovery(supabase, cart, sessionCustomer);
                    }
                }
            } catch (_) {}

            // Prioridade 3: via customer_id
            if (!identified && cart.customer_id) {
                try {
                    const { data: directCustomer } = await supabase
                        .from('clientes')
                        .select('name, email, whatsapp')
                        .eq('id', cart.customer_id)
                        .maybeSingle();

                    if (directCustomer && (directCustomer.email || directCustomer.whatsapp)) {
                        identified = true;
                        console.log(`[ABANDONO MATCH OK] session_id=${cart.session_id} customer_id=${cart.customer_id}`);
                        await dispatchRecovery(supabase, cart, directCustomer);
                    }
                } catch (_) {}
            }

            if (!identified) {
                console.log(`[ABANDONO SKIP] session_id=${cart.session_id}: sem vínculo de cliente. step=${step}`);
            }
        }
    } catch (e) { console.error("❌ Erro no trabalhador de abandono:", e.message); }
}

module.exports = { checkAbandonedCarts };
