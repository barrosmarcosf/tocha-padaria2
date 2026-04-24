require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkOrders() {
    console.log("🔍 Buscando ultimos 5 pedidos no Supabase...");
    const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Erro ao buscar pedidos:", error.message);
        return;
    }

    if (data.length === 0) {
        console.log("ℹ️ Nenhum pedido encontrado.");
    } else {
        data.forEach(order => {
            console.log(`\nPedido: ${order.id}`);
            console.log(`Status: ${order.status}`);
            console.log(`Sessao: ${order.stripe_session_id}`);
            console.log(`Cliente: ${order.clientes?.name} (${order.clientes?.whatsapp})`);
            console.log(`Total: R$ ${order.total_amount}`);
        });
    }
    process.exit(0);
}

checkOrders();
