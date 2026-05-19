-- BX-10: RLS para tabelas de configuração pública
-- Permite SELECT anônimo em tabelas de catálogo e config; bloqueia escrita anônima
-- ATENÇÃO: Execute APENAS após adicionar SUPABASE_ANON_KEY ao .env e reiniciar o servidor.
-- O service_role (backend) sempre bypassa RLS — estas políticas só afetam o anon key.

-- ──────────────────────────────────────────────────
-- categorias (catálogo público)
-- ──────────────────────────────────────────────────
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read" ON categorias;
CREATE POLICY "anon_read" ON categorias
    FOR SELECT USING (true);

-- ──────────────────────────────────────────────────
-- produtos (catálogo público)
-- ──────────────────────────────────────────────────
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read" ON produtos;
CREATE POLICY "anon_read" ON produtos
    FOR SELECT USING (true);

-- ──────────────────────────────────────────────────
-- site_content (config pública da loja)
-- ──────────────────────────────────────────────────
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read" ON site_content;
CREATE POLICY "anon_read" ON site_content
    FOR SELECT USING (true);
