/**
 * funnelTracker.js
 *
 * Records funnel events to:
 *   1. `events` table  — always works (existing schema)
 *   2. `funnel_events` — works after migration 001_funnel_events.sql is run; silent-fail otherwise
 *
 * event_type taxonomy:
 *   site_enter | cart_created | checkout_started | payment_attempted |
 *   payment_success | payment_failed | cart_abandoned | checkout_abandoned
 */

async function recordFunnelEvent(supabase, { event_type, session_id, order_id, metadata = {} }) {
    if (!event_type) return;

    const base = {
        event_name: event_type,
        session_id: session_id ? String(session_id).slice(0, 128) : null,
        metadata: { ...metadata, ...(order_id ? { order_id } : {}) },
    };

    // Always write to existing events table
    supabase.from('events').insert(base).catch(() => {});

    // Also write to dedicated funnel_events if it exists
    supabase.from('funnel_events').insert({
        event_type,
        session_id: base.session_id,
        order_id: order_id || null,
        metadata,
    }).catch(() => {});
}

module.exports = { recordFunnelEvent };
