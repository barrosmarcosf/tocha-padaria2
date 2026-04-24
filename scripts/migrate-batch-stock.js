require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function migrateBatchStock() {
    console.log("🚀 Iniciando migração para estoque por fornada...");
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sql = `
-- 1. Criar tabela de estoque por ciclo
CREATE TABLE IF NOT EXISTS product_batch_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES produtos(id) ON DELETE CASCADE,
    batch_date TEXT NOT NULL, -- Ex: '2026-04-18'
    initial_stock INTEGER DEFAULT 0,
    available_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, batch_date)
);

-- 2. Habilitar RLS
ALTER TABLE product_batch_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública de estoque por ciclo" ON product_batch_stock FOR SELECT USING (true);

-- 3. Função para atualizar estoque atômico por ciclo
CREATE OR REPLACE FUNCTION decrement_batch_stock(p_id TEXT, b_date TEXT, amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE product_batch_stock
    SET available_stock = GREATEST(0, available_stock - amount)
    WHERE product_id = p_id AND batch_date = b_date;
END;
$$ LANGUAGE plpgsql;
`;

    console.log("--- SQL PARA EXECUTAR ---");
    console.log(sql);
    console.log("-------------------------");

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error("❌ Erro via RPC:", error.message);
            console.log("👉 Por favor, execute o SQL acima manualmente no SQL Editor do Supabase.");
        } else {
            console.log("✅ Migração aplicada com sucesso!");
        }
    } catch (e) {
        console.error("💥 Erro:", e.message);
    }
}

migrateBatchStock();
