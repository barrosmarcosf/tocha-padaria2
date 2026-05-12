CREATE TABLE IF NOT EXISTS payment_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES pedidos(id),

  event_type  TEXT NOT NULL,
  -- 'approval' | 'decline' | 'refund' | 'chargeback' | 'attempt'

  status      TEXT,
  provider    TEXT,
  method      TEXT,

  reason      TEXT,
  raw_code    TEXT,

  amount      DECIMAL,
  currency    TEXT DEFAULT 'BRL',

  metadata    JSONB,

  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id
  ON payment_events(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_type
  ON payment_events(event_type);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
  ON payment_events(created_at);

SELECT notify_pgrst_reload();
