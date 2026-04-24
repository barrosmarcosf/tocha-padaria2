require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function describeTable() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'carrinhos' });
    if (error) {
        // Fallback for when RPC doesn't exist: simple select 0 and JSON reflection
        console.warn("RPC not found, checking with select...");
        const { data: sample, error: err2 } = await supabase.from('carrinhos').select('*').limit(1);
        if (err2) {
            console.error("Error checking table:", err2.message);
        } else {
            console.log("Sample row keys:", Object.keys(sample[0] || {}));
        }
    } else {
        console.log("Table info:", data);
    }
    process.exit(0);
}
describeTable();
