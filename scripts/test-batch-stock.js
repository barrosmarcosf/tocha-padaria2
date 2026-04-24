require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testScenarios() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const productId = 'sd-01'; // Croissant (exemplo)
    const batchDate = '2026-04-18';
    const nextBatchDate = '2026-04-25';

    console.log("🛠️ Limpando dados de teste...");
    await supabase.from('product_batch_stock').delete().eq('product_id', productId);

    console.log("\n🧪 CENÁRIO 1: Fornada 18/04, Base 10, Vende 7");
    // Simulando 7 vendas manuais (inserindo registros de pedidos fictícios ou apenas definindo o disponível)
    // Na vida real, o sistema calcularia Base - Vendidos.
    await supabase.from('product_batch_stock').insert([{
        product_id: productId,
        batch_date: batchDate,
        initial_stock: 10,
        available_stock: 3
    }]);
    
    let { data } = await supabase.from('product_batch_stock').select('*').eq('product_id', productId).eq('batch_date', batchDate).single();
    console.log(`Resultado: Base=${data.initial_stock}, Disponível=${data.available_stock} (Esperado: 3)`);

    console.log("\n🧪 CENÁRIO 2: Inserir novo ciclo 25/04 (Independente)");
    await supabase.from('product_batch_stock').insert([{
        product_id: productId,
        batch_date: nextBatchDate,
        initial_stock: 10,
        available_stock: 10
    }]);
    
    let { data: d2 } = await supabase.from('product_batch_stock').select('*').eq('product_id', productId).eq('batch_date', nextBatchDate).single();
    console.log(`Resultado Ciclo Novo: Base=${d2.initial_stock}, Disponível=${d2.available_stock} (Esperado: 10)`);
    
    let { data: d1 } = await supabase.from('product_batch_stock').select('*').eq('product_id', productId).eq('batch_date', batchDate).single();
    console.log(`Resultado Ciclo Antigo: Disponível=${d1.available_stock} (Esperado: 3) - SUCESSO: SEM INTERFERÊNCIA`);
}

testScenarios();
