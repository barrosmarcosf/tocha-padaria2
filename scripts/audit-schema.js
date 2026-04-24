require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function auditSchema() {
    console.log("🔍 Auditando Tabelas...");

    const { data: pedidos, error: pError } = await supabase.from('pedidos').select('*').limit(1);
    if (pError) {
        console.error("❌ Erro ao ler tabela 'pedidos':", pError.message);
    } else {
        console.log("✅ Colunas detectadas em 'pedidos':", Object.keys(pedidos[0] || {}).join(', '));
    }

    const { data: clientes, error: cError } = await supabase.from('clientes').select('*').limit(1);
    if (cError) {
        console.error("❌ Erro ao ler tabela 'clientes':", cError.message);
    } else {
        console.log("✅ Colunas detectadas em 'clientes':", Object.keys(clientes[0] || {}).join(', '));
    }
}

auditSchema();
