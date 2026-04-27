require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    const { data, error } = await supabase.from('usuarios').select('email, nome, role');
    if (error) {
        console.error('Erro ao listar usuários:', error.message);
    } else {
        console.log('Usuários encontrados:', JSON.stringify(data, null, 2));
    }
}

listUsers();
