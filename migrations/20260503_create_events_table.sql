-- Tabela de tracking de eventos para métricas do admin
CREATE TABLE IF NOT EXISTS events (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name  TEXT         NOT NULL,
    user_id     TEXT,
    session_id  TEXT,
    metadata    JSONB        DEFAULT '{}',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event_name ON events (event_name);
CREATE INDEX IF NOT EXISTS idx_events_session_id  ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at  ON events (created_at DESC);
