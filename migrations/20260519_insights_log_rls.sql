-- BX-06: insights_log sem RLS — anon pode ler anomalias do sistema
-- Aplica RLS: somente service_role tem acesso total; anon/authenticated bloqueados

ALTER TABLE insights_log ENABLE ROW LEVEL SECURITY;

-- Remove política padrão permissiva se existir
DROP POLICY IF EXISTS "Allow all" ON insights_log;

-- Somente service_role (backend) pode ler e escrever
CREATE POLICY "service_role_only" ON insights_log
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
