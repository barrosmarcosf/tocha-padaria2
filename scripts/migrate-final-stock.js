require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function migrateFinalStock() {
    console.log("🚀 Aplicando modelagem final de estoque por ciclo de fornada...");
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const sql = `
-- 1. TABELA DE FORNADAS
CREATE TABLE IF NOT EXISTS fornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bake_date TEXT UNIQUE NOT NULL, -- Usamos TEXT para simplificar match com strings das outras configs
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ESTOQUE POR PRODUTO E FORNADA
CREATE TABLE IF NOT EXISTS produto_estoque_fornada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id TEXT REFERENCES produtos(id) ON DELETE CASCADE,
    fornada_id UUID REFERENCES fornadas(id) ON DELETE CASCADE,
    estoque_base INTEGER DEFAULT 0,
    estoque_disponivel INTEGER DEFAULT 0,
    vendas_confirmadas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(produto_id, fornada_id)
);

-- 3. Habilitar RLS
ALTER TABLE fornadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_estoque_fornada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública fornadas" ON fornadas FOR SELECT USING (true);
CREATE POLICY "Leitura pública estoque ciclo" ON produto_estoque_fornada FOR SELECT USING (true);

-- 4. Função para atualização atômica
CREATE OR REPLACE FUNCTION processar_venda_estoque(p_id TEXT, f_date TEXT, amount INTEGER)
RETURNS void AS $$
DECLARE
    f_id UUID;
BEGIN
    -- Busca ID da fornada pela data
    SELECT id INTO f_id FROM fornadas WHERE bake_date = f_date;
    
    IF f_id IS NOT NULL THEN
        UPDATE produto_estoque_fornada
        SET estoque_disponivel = GREATEST(0, estoque_disponivel - amount),
            vendas_confirmadas = vendas_confirmadas + amount
        WHERE produto_id = p_id AND fornada_id = f_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
`;

    try {
        // Tenta rodar via RPC se existir exec_sql
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error("❌ SQL via RPC falhou. Por favor, execute manualmente no Supabase:");
            console.log(sql);
        } else {
            console.log("✅ Modelagem aplicada com sucesso!");
        }
    } catch (e) {
        console.error("💥 Erro:", e.message);
        console.log(sql);
    }
}

migrateFinalStock();
