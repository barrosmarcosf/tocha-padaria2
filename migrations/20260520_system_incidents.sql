-- Migration: tabela de incidentes para NOC
CREATE TABLE IF NOT EXISTS system_incidents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type        TEXT        NOT NULL,
    payload     JSONB,
    status      TEXT        NOT NULL DEFAULT 'open',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_incidents_status  ON system_incidents (status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_type    ON system_incidents (type);
CREATE INDEX IF NOT EXISTS idx_system_incidents_created ON system_incidents (created_at DESC);
