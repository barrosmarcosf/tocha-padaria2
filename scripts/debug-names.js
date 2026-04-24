const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data } = await supabase.from('pedidos').select('id, status, created_at, customer_name, total_amount').order('created_at', { ascending: false });
    console.log('--- DETAILED ORDERS AUDIT ---');
    data.forEach(p => {
        console.log(`[${p.created_at}] ID: ${p.id.slice(0,8)} | Status: ${p.status} | Client: ${p.customer_name} | Total: ${p.total_amount}`);
    });
}
check();
