/**
 * funnelTracker.js — grava eventos de funil server-side
 *
 * Confiabilidade:
 * - Deduplicação write-time: upsert com ON CONFLICT (session_id, event_type) DO NOTHING
 * - Validação de integridade: evento downstream sem upstream → flag_inconsistency = true
 * - Falha silenciosa — tracking nunca derruba o fluxo principal
 *
 * event_type taxonomy:
 *   site_enter | view_product | cart_created | checkout_started |
 *   payment_attempted | payment_success | payment_failed | cart_abandoned
 */

const FUNNEL_ORDER = [
    'site_enter',
    'view_product',
    'cart_created',
    'checkout_started',
    'payment_attempted',
    'payment_success',
];

// Para cada evento, qual upstream imediato é obrigatório
const REQUIRED_UPSTREAM = {
    cart_created:      'site_enter',
    checkout_started:  'cart_created',
    payment_attempted: 'checkout_started',
    payment_success:   'payment_attempted',
};

async function checkIntegrity(supabase, session_id, event_type) {
    const required = REQUIRED_UPSTREAM[event_type];
    if (!required || !session_id) return false;

    const { data } = await supabase
        .from('funnel_events')
        .select('id')
        .eq('session_id', session_id)
        .eq('event_type', required)
        .limit(1);

    return !data || data.length === 0;
}

async function recordFunnelEvent(supabase, { event_type, session_id, order_id, user_id, metadata = {} }) {
    if (!event_type) return;

    const sid = session_id ? String(session_id).slice(0, 128) : null;

    console.log('[FUNNEL EVENT]', {
        event_type,
        session_id: sid,
        user_id:    user_id || null,
        order_id:   order_id || null,
        timestamp:  new Date().toISOString(),
    });

    let flag_inconsistency = false;
    if (sid && REQUIRED_UPSTREAM[event_type]) {
        try {
            flag_inconsistency = await checkIntegrity(supabase, sid, event_type);
            if (flag_inconsistency) {
                console.warn('[FUNNEL INTEGRITY]', { event_type, session_id: sid, missing_upstream: REQUIRED_UPSTREAM[event_type] });
            }
        } catch (_) {}
    }

    // Dedup write-time: ON CONFLICT (session_id, event_type) DO NOTHING
    // Promise.allSettled nunca rejeita — compatível com Supabase v2 (sem .catch() nos builders)
    await Promise.allSettled([
        supabase.from('funnel_events').upsert({
            event_type,
            session_id: sid,
            order_id:   order_id || null,
            user_id:    user_id  || null,
            metadata,
            flag_inconsistency,
        }, { onConflict: 'session_id,event_type', ignoreDuplicates: true }),
        supabase.from('events').insert({
            event_name: event_type,
            session_id: sid,
            metadata:   { ...metadata, ...(order_id ? { order_id } : {}), ...(user_id ? { user_id } : {}) },
        }),
    ]);
}

module.exports = { recordFunnelEvent, FUNNEL_ORDER };
