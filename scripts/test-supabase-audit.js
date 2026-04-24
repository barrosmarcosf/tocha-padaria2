const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
    console.log('--- Iniciando Auditoria Supabase ---');
    
    const tables = ['usuarios', 'pedidos', 'clientes', 'produtos', 'categorias'];
    
    for (const table of tables) {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Tabela [${table}]: Erro - ${error.message}`);
        } else {
            console.log(`✅ Tabela [${table}]: OK (${count} registros)`);
        }
    }

    const { data: recentOrders } = await supabase.from('pedidos').select('status').limit(5);
    console.log('\n--- Status Recentes (Pedidos) ---');
    console.log(recentOrders?.map(o => o.status));

    console.log('--- Fim da Auditoria ---');
}

test();
