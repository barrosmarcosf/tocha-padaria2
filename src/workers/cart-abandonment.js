const { sendAbandonmentRecovery } = require('../notification-service');

/**
 * Trabalhador de Abandono de Carrinho
 * Verifica carrinhos abandonados e envia notificações de recuperação
 */
async function checkAbandonedCarts(supabase) {
    // 1. Verificação de Horário Comercial (Evitar barulho de madrugada)
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const currentHour = saoPauloTime.getHours();

    // Só envia entre 09:00 e 21:00
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

        // Filtragem Extra de Segurança: Verifica se existe pedido pago para esta sessão
        const activeAbandoned = [];
        for (const cart of abandoned) {
            const { data: existingOrder } = await supabase
                .from('pedidos')
                .select('status')
                .eq('stripe_session_id', cart.session_id)
                .maybeSingle();

            if (existingOrder && (existingOrder.status === 'paid' || existingOrder.status === 'completed')) {
                console.log(`[WORKER] 🛡️ Sessão ${cart.session_id} ignorada: Pedido já consta como PAGO.`);
                await supabase.from('carrinhos').update({ status: 'completed' }).eq('id', cart.id);
                continue;
            }
            activeAbandoned.push(cart);
        }

        for (const cart of activeAbandoned) {
            const hasContact = cart.customer_data && (cart.customer_data.email || cart.customer_data.whatsapp);

            if (hasContact) {
                console.log(`🚀 [ABANDONO] Disparando recuperação para: ${cart.customer_data.name || 'Cliente'}`);

                const appUrl = process.env.BASE_URL || 'http://localhost:3333';
                const recoveryUrl = `${appUrl}/?token=${cart.recovery_token}`;

                await sendAbandonmentRecovery(supabase, cart.customer_data, JSON.parse(cart.items), recoveryUrl);

                await supabase.from('carrinhos').update({ recovery_sent: true }).eq('id', cart.id);
            } else {
                console.log(`[ABANDONO] Sessao ${cart.session_id} ignorada: Cliente não se identificou.`);
            }
        }
    } catch (e) { console.error("❌ Erro no trabalhador de abandono:", e.message); }
}

module.exports = { checkAbandonedCarts };
