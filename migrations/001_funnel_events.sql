-- Migration: funnel_events
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS funnel_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  session_id  TEXT,
  order_id    UUID,
  event_type  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_session  ON funnel_events (session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_type     ON funnel_events (event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created  ON funnel_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_order    ON funnel_events (order_id);
