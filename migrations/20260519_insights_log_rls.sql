-- BX-06: insights_log sem RLS — anon pode ler anomalias do sistema
-- Cria a tabela se ainda não existir (reliability_layer não foi aplicada), depois protege com RLS

-- 1. Cria a tabela (idempotente)
CREATE TABLE IF NOT EXISTS insights_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  value       NUMERIC,
  context     JSONB,
  resolved    BOOLEAN     DEFAULT false,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_insights_log_type        ON insights_log (type);
CREATE INDEX IF NOT EXISTS idx_insights_log_date        ON insights_log (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_log_unresolved  ON insights_log (resolved) WHERE resolved = false;

-- 2. Habilita RLS
ALTER TABLE insights_log ENABLE ROW LEVEL SECURITY;

-- 3. Remove política permissiva padrão se existir
DROP POLICY IF EXISTS "Allow all" ON insights_log;

-- 4. Somente service_role (backend) pode ler e escrever
CREATE POLICY "service_role_only" ON insights_log
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
