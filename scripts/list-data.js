require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function list() {
    const { data: cats, error: catErr } = await supabase.from('categorias').select('slug, title');
    if (catErr) {
        console.error("Error cats:", catErr.message);
    } else {
        console.log(`Categorias: ${cats.length}`);
        cats.forEach(c => console.log(` - ${c.title} (${c.slug})`));
    }

    const { data: prods, error: prodErr } = await supabase.from('produtos').select('id, name, price, category_slug');
    if (prodErr) {
        console.error("Error prods:", prodErr.message);
    } else {
        console.log(`Produtos: ${prods.length}`);
        prods.forEach(p => console.log(` - [${p.category_slug}] ${p.name} (ID: ${p.id}) - R$ ${p.price}`));
    }
    process.exit(0);
}
list();
