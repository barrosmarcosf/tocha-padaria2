-- ============================================================
-- Cria função auxiliar para forçar reload do schema cache do PostgREST.
-- Útil após migrations que adicionam/alteram colunas da tabela pedidos.
--
-- Como usar:
--   • SQL Editor: SELECT notify_pgrst_reload();
--   • App JS:     await supabase.rpc('notify_pgrst_reload')
--   • Deploy:     chamado automaticamente pelo deploy_mp_fix.js
-- ============================================================

CREATE OR REPLACE FUNCTION notify_pgrst_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Dispara o reload imediatamente ao aplicar esta migration
SELECT notify_pgrst_reload();

-- Verificação: confirma colunas de lock existem
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'pedidos'
  AND column_name  IN ('processing', 'processing_at', 'payment_attempt_id')
ORDER BY column_name;
