const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data } = await supabase.from('pedidos').select('id, status, created_at, total_amount').order('created_at', { ascending: false });
    console.log('--- ALL ORDERS ---');
    data.forEach(p => {
        console.log(`ID: ${p.id} | Status: ${p.status} | Date: ${p.created_at} | Amount: ${p.total_amount}`);
    });
}
check();
