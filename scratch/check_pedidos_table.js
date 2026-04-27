require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkTable() {
    const { data, error } = await supabase.from('pedidos').select('*').limit(1);
    if (error) {
        console.error('Erro ao buscar pedidos:', error.message);
        return;
    }
    console.log('Colunas da tabela pedidos:', Object.keys(data[0] || {}));
}

checkTable();
