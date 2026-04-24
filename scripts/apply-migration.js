require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function applyMigration() {
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_initial_stock.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log("🚀 Aplicando migração...");
    console.log(sql);

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); // Note: some people name it exec_sql or execute_sql
        if (error) {
            console.error("❌ Erro RPC:", error.message);
            console.log("Tentando com nome alternativo de parâmetro (query)...");
            const { error: error2 } = await supabase.rpc('exec_sql', { query: sql });
            if (error2) {
                console.error("❌ Erro RPC (v2):", error2.message);
                console.log("⚠️ Verifique se a função RPC 'exec_sql' existe no seu Supabase.");
            } else {
                console.log("✅ Migração aplicada com sucesso (v2)!");
            }
        } else {
            console.log("✅ Migração aplicada com sucesso!");
        }
    } catch (e) {
        console.error("💥 Erro:", e.message);
    }
}

applyMigration();
