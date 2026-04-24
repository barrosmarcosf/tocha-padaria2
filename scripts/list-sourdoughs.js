require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function list() {
    const { data: prods, error: prodErr } = await supabase.from('produtos').select('id, name, price').eq('category_slug', 'sourdoughs');
    if (prodErr) {
        console.error("Error prods:", prodErr.message);
    } else {
        console.log(`Sourdoughs: ${prods.length}`);
        prods.forEach(p => console.log(` - ${p.name} (ID: ${p.id}) - R$ ${p.price}`));
    }
    process.exit(0);
}
list();
