const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data } = await supabase.from('pedidos').select('status');
    const counts = {};
    data.forEach(p => counts[p.status] = (counts[p.status] || 0) + 1);
    console.log('--- STATUS DISTRIBUTION ---');
    console.log(counts);
}
check();
