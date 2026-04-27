require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function getColumns() {
    // Supabase allows querying information_schema if the service key has permissions
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'pedidos' });
    
    if (error) {
        // Se RPC não existir, tentamos via query direta (se habilitado)
        const { data: cols, error: err2 } = await supabase.from('pedidos').select('*').limit(1);
        if (cols && cols.length > 0) {
            console.log('Colunas:', Object.keys(cols[0]));
        } else {
             // Tenta inserir e deletar para ver as colunas no retorno
             const { data: ins, error: err3 } = await supabase.from('pedidos').insert([{ total_amount: 0, status: 'temp_check' }]).select();
             if (ins && ins.length > 0) {
                 console.log('Colunas (via insert):', Object.keys(ins[0]));
                 await supabase.from('pedidos').delete().eq('status', 'temp_check');
             } else {
                 console.error('Não foi possível determinar as colunas:', err2?.message || err3?.message);
             }
        }
        return;
    }
    console.log('Colunas (RPC):', data);
}

getColumns();
