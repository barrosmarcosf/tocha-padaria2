/**
 * funnelTracker.js — grava eventos de funil server-side
 *
 * Escreve em funnel_events (tabela dedicada) E em events (backward compat).
 * Falha silenciosa em ambas — tracking nunca pode derrubar o fluxo principal.
 *
 * event_type taxonomy:
 *   site_enter | cart_created | checkout_started | payment_attempted |
 *   payment_success | payment_failed | cart_abandoned | checkout_abandoned
 */

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

    // Tabela dedicada funnel_events
    supabase.from('funnel_events').insert({
        event_type,
        session_id: sid,
        order_id:   order_id || null,
        user_id:    user_id  || null,
        metadata,
    }).catch(() => {});

    // Tabela events (backward compat — mantém histórico unificado)
    supabase.from('events').insert({
        event_name: event_type,
        session_id: sid,
        metadata:   { ...metadata, ...(order_id ? { order_id } : {}), ...(user_id ? { user_id } : {}) },
    }).catch(() => {});
}

module.exports = { recordFunnelEvent };
