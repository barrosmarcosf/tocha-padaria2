const { sendAbandonmentRecovery } = require('../notification-service');

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
        const delayMinutes = parseInt(process.env.ABANDON_DELAY_MINUTES) || 60;
        const checkTimeAgo = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

        const { data: abandoned, error } = await supabase
            .from('carrinhos')
            .select('*')
            .eq('status', 'active')
            .eq('recovery_sent', false)
            .lt('last_activity_at', checkTimeAgo)
            .order('last_activity_at', { ascending: true });

        if (error) throw error;

        // Filtragem Extra de Segurança: verifica se existe pedido pago para este carrinho
        const activeAbandoned = [];
        for (const cart of abandoned) {
            // Usa order_id se disponível (armazenado via AÇÃO 6); caso contrário, pula a checagem
            if (cart.order_id) {
                const { data: existingOrder } = await supabase
                    .from('pedidos')
                    .select('status')
                    .eq('id', cart.order_id)
                    .maybeSingle();

                if (existingOrder && (existingOrder.status === 'paid' || existingOrder.status === 'completed')) {
                    console.log(`[WORKER] 🛡️ Carrinho ${cart.id} ignorado: Pedido ${cart.order_id} já consta como PAGO.`);
                    console.log('[CART SAVE TRACE] origem: cart-abandonment.js pedido pago → status=completed id=', cart.id);
                    await supabase.from('carrinhos').update({ status: 'completed' }).eq('id', cart.id);
                    continue;
                }
            }
            activeAbandoned.push(cart);
        }

        for (const cart of activeAbandoned) {
            const hasContact = cart.customer_data && (cart.customer_data.email || cart.customer_data.whatsapp);

            if (hasContact) {
                console.log(`[ABANDONO MATCH OK] session_id=${cart.session_id}`);
                console.log(`🚀 [ABANDONO DISPARADO] ${cart.customer_data.name || 'Cliente'} — session_id=${cart.session_id}`);

                const appUrl = process.env.BASE_URL || 'http://localhost:3333';
                const recoveryUrl = `${appUrl}/?token=${cart.recovery_token}`;

                await sendAbandonmentRecovery(supabase, cart.customer_data, JSON.parse(cart.items), recoveryUrl);
                console.log('[CART SAVE TRACE] origem: cart-abandonment.js hasContact → recovery_sent=true id=', cart.id);
                await supabase.from('carrinhos').update({ recovery_sent: true }).eq('id', cart.id);
            } else {
                // Tenta identificar cliente via customer_sessions usando o session_id do cookie
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
                            console.log(`🚀 [ABANDONO DISPARADO] ${sessionCustomer.name || 'Cliente'} (via sessão) — session_id=${cart.session_id}`);

                            const appUrl = process.env.BASE_URL || 'http://localhost:3333';
                            const recoveryUrl = `${appUrl}/?token=${cart.recovery_token}`;

                            await sendAbandonmentRecovery(supabase, sessionCustomer, JSON.parse(cart.items), recoveryUrl);
                            console.log('[CART SAVE TRACE] origem: cart-abandonment.js via session → recovery_sent=true id=', cart.id);
                            await supabase.from('carrinhos').update({ recovery_sent: true }).eq('id', cart.id);
                        }
                    }
                } catch (_) {}

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
                            console.log(`🚀 [ABANDONO DISPARADO] ${directCustomer.name || 'Cliente'} (via customer_id) — session_id=${cart.session_id}`);

                            const appUrl = process.env.BASE_URL || 'http://localhost:3333';
                            const recoveryUrl = `${appUrl}/?token=${cart.recovery_token}`;

                            await sendAbandonmentRecovery(supabase, directCustomer, JSON.parse(cart.items), recoveryUrl);
                            console.log('[CART SAVE TRACE] origem: cart-abandonment.js via customer_id → recovery_sent=true id=', cart.id);
                            await supabase.from('carrinhos').update({ recovery_sent: true }).eq('id', cart.id);
                        }
                    } catch (_) {}
                }

                if (!identified) {
                    console.log(`[ABANDONO SKIP] session_id=${cart.session_id}: sem vínculo de cliente. Aguardando identificação.`);
                }
            }
        }
    } catch (e) { console.error("❌ Erro no trabalhador de abandono:", e.message); }
}

module.exports = { checkAbandonedCarts };
