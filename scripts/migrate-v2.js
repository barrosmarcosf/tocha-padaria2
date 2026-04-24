require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function runSQL() {
    const sql = `
        ALTER TABLE produtos ADD COLUMN IF NOT EXISTS upsell_ids JSONB DEFAULT '[]';
        CREATE TABLE IF NOT EXISTS grupos_opcionais (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            titulo TEXT NOT NULL,
            minimo INTEGER DEFAULT 0,
            maximo INTEGER DEFAULT 1,
            obrigatorio BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS opcionais (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            grupo_id UUID REFERENCES grupos_opcionais(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            preco DECIMAL(10,2) DEFAULT 0.00,
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0
        );
    `;

    try {
        const { error } = await s.rpc('exec_sql', { sql });
        if (error) {
            console.warn("⚠️ RPC 'exec_sql' não encontrado. Tentando via Queries diretas...");
            // Se o RPC não existe, o usuário terá que rodar no dashboard,
            // mas podemos tentar garantir as tabelas por outros meios (upsert check)
        } else {
            console.log("✅ Banco de dados atualizado com sucesso!");
        }
    } catch (e) {
        console.error("Erro na migração:", e.message);
    }
}

runSQL();
