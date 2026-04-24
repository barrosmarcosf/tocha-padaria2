require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function runFinalMigration() {
    console.log("🚀 Iniciando migração final de estoque...");
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL PARA EXECUTAR NO DASHBOARD (Caso o RPC falhe)
    const migrationSQL = `
-- 1. Adiciona coluna initial_stock se não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0;

-- 2. Sincroniza dados iniciais: se initial_stock for 0, assume o valor atual de stock_quantity
UPDATE produtos SET initial_stock = stock_quantity WHERE initial_stock = 0 OR initial_stock IS NULL;

-- 3. Cria função para decremento atômico de estoque (Evita condições de corrida)
CREATE OR REPLACE FUNCTION decrement_stock(product_id TEXT, amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE produtos
    SET stock_quantity = GREATEST(0, stock_quantity - amount)
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
`;

    console.log("\n--- SQL PARA EXECUTAR NO SUPABASE SQL EDITOR ---");
    console.log(migrationSQL);
    console.log("------------------------------------------------\n");

    try {
        console.log("⏳ Tentando aplicar migração via RPC 'exec_sql'...");
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (error) {
            console.error("❌ Falha ao aplicar via RPC:", error.message);
            console.log("\n👉 AÇÃO NECESSÁRIA: Como o assistente não tem permissão para criar funções RPC ou rodar DDL direto,");
            console.log("POR FAVOR, COPIE O SQL ACIMA E COLE NO 'SQL EDITOR' DO SEU DASHBOARD SUPABASE.");
        } else {
            console.log("✅ Migração aplicada com sucesso via RPC!");
        }
    } catch (e) {
        console.error("💥 Erro imprevisto:", e.message);
    }
}

runFinalMigration();
