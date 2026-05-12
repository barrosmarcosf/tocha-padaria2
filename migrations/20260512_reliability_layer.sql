-- ──────────────────────────────────────────────────────────────────────────
-- Camada de confiabilidade de dados — Funil de Vendas v2
-- Executar no Supabase SQL Editor (uma vez)
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Coluna flag_inconsistency em funnel_events (rastreia violações de ordem)
ALTER TABLE funnel_events
  ADD COLUMN IF NOT EXISTS flag_inconsistency BOOLEAN DEFAULT false;

-- 2. Deduplicação write-time: unique index (session_id, event_type)
--    Remove duplicatas primeiro (mantém o registro mais antigo por par)
DELETE FROM funnel_events
WHERE id NOT IN (
    SELECT DISTINCT ON (session_id, event_type) id
    FROM funnel_events
    WHERE session_id IS NOT NULL
    ORDER BY session_id, event_type, created_at ASC
)
AND session_id IS NOT NULL;

-- Agora cria o índice único (seguro após dedup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_funnel_events_dedup
  ON funnel_events (session_id, event_type)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funnel_events_flag
  ON funnel_events (flag_inconsistency)
  WHERE flag_inconsistency = true;

-- 3. funnel_aggregates: snapshots computados do funil por período
CREATE TABLE IF NOT EXISTS funnel_aggregates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  period_days         INTEGER     NOT NULL,
  site_enter          INTEGER     DEFAULT 0,
  view_product        INTEGER     DEFAULT 0,
  cart_created        INTEGER     DEFAULT 0,
  checkout_started    INTEGER     DEFAULT 0,
  payment_attempted   INTEGER     DEFAULT 0,
  payment_success     INTEGER     DEFAULT 0,
  step_times          JSONB,
  anomalies           JSONB,
  computed_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_agg_period
  ON funnel_aggregates (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_funnel_agg_computed
  ON funnel_aggregates (computed_at DESC);

-- 4. insights_log: insights automáticos, anomalias e alertas
CREATE TABLE IF NOT EXISTS insights_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,   -- 'bottleneck' | 'anomaly' | 'missing_event' | 'alert'
  detected_at TIMESTAMPTZ DEFAULT now(),
  value       NUMERIC,
  context     JSONB,
  resolved    BOOLEAN     DEFAULT false,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_insights_log_type
  ON insights_log (type);

CREATE INDEX IF NOT EXISTS idx_insights_log_date
  ON insights_log (detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_log_unresolved
  ON insights_log (resolved)
  WHERE resolved = false;
