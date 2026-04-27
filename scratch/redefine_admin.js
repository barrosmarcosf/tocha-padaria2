require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAdmin() {
    const newEmail = 'admin@tochapadaria';
    const newPassword = 'Romeus12*';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`🚀 Redefinindo login para: ${newEmail}`);

    // Tenta atualizar o usuário existente (admin@tocha.com que vimos antes)
    const { data: existingUser } = await supabase.from('usuarios').select('id').eq('role', 'admin').maybeSingle();

    if (existingUser) {
        const { error } = await supabase
            .from('usuarios')
            .update({ 
                email: newEmail, 
                senha: hashedPassword,
                nome: 'Administrador Tocha'
            })
            .eq('id', existingUser.id);
        
        if (error) {
            console.error('❌ Erro ao atualizar usuário:', error.message);
        } else {
            console.log('✅ Usuário admin atualizado no banco de dados!');
        }
    } else {
        // Se não existir, cria um novo
        const { error } = await supabase
            .from('usuarios')
            .insert([{
                email: newEmail,
                senha: hashedPassword,
                nome: 'Administrador Tocha',
                role: 'admin'
            }]);
        
        if (error) {
            console.error('❌ Erro ao criar usuário:', error.message);
        } else {
            console.log('✅ Novo usuário admin criado no banco de dados!');
        }
    }
}

updateAdmin();
