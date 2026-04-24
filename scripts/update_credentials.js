const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log("Iniciando atualização de credenciais administrativas...");
  
  const newEmail = "barros.marcosf@gmail.com";
  const newPass = "Romeus12*";
  const hash = await bcrypt.hash(newPass, 10);
  
  const { data, error } = await supabase
    .from('usuarios')
    .update({ 
      email: newEmail, 
      senha: hash,
      nome: 'TOCHA PADARIA'
    })
    .eq('role', 'admin');
    
  if (error) {
    console.error("Erro ao atualizar no Supabase:", error.message);
    process.exit(1);
  } else {
    console.log("Credenciais administrativas atualizadas com sucesso!");
    process.exit(0);
  }
}

run();
