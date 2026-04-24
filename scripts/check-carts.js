require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkCarts() {
    console.log("🔍 Buscando carrinhos ativos e abandonados no Supabase...");
    const { data: carts, error } = await supabase
        .from('carrinhos')
        .select('*')
        .order('last_activity_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Erro ao buscar carrinhos:", error.message);
        return;
    }

    if (carts.length === 0) {
        console.log("ℹ️ Nenhum carrinho encontrado.");
    } else {
        carts.forEach(cart => {
            console.log(`\nSessão: ${cart.session_id}`);
            console.log(`Status: ${cart.status}`);
            console.log(`Cliente: ${JSON.stringify(cart.customer_data)}`);
            console.log(`Última Atividade: ${cart.last_activity_at}`);
            console.log(`Recuperação Enviada: ${cart.recovery_sent}`);
            console.log(`-----------------------------------`);
        });
    }
    process.exit(0);
}

checkCarts();
