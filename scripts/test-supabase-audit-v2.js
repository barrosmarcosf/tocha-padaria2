const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
    console.log('--- START AUDIT ---');
    const tables = ['usuarios', 'pedidos', 'clientes', 'produtos', 'categorias'];
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ Table [${table}]: ERROR - ${error.message}`);
            } else {
                console.log(`✅ Table [${table}]: OK (${count} rows)`);
            }
        } catch (e) {
            console.log(`❌ Table [${table}]: EXCEPTION - ${e.message}`);
        }
    }

    const { data: recentOrders, error: reError } = await supabase.from('pedidos').select('id, status').limit(5).order('created_at', { ascending: false });
    if (reError) {
        console.log(`❌ Recent Orders Error: ${reError.message}`);
    } else {
        console.log('\n--- Recent Statuses (Pedidos) ---');
        recentOrders.forEach(o => console.log(`ID: ${o.id.toString().slice(0,8)}... | Status: ${o.status}`));
    }
    console.log('--- END AUDIT ---');
}

test();
