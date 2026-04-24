require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seedAdmin() {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash('tocha2024', salt);

    const { data, error } = await supabase.from('usuarios').upsert([
        {
            nome: 'Admin Tocha',
            email: 'admin@tochapadaria.com.br',
            senha: hashedPass,
            role: 'admin'
        }
    ], { onConflict: 'email' });

    if (error) {
        console.error("Erro ao criar admin:", error.message);
    } else {
        console.log("✅ Admin criado ou atualizado com sucesso!");
    }
    process.exit(0);
}

seedAdmin();
