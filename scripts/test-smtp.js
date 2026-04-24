require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

console.log(`🔍 Testando SMTP para: ${smtpUser}`);
console.log(`🔑 Senha (tamanho): ${smtpPass.length} caracteres`);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, 
    auth: {
        user: smtpUser,
        pass: smtpPass
    }
});

async function runTest() {
    try {
        console.log("⏳ Verificando conexão e autenticação...");
        await transporter.verify();
        console.log("✅ Conexão SMTP estabelecida com sucesso!");

        console.log("⏳ Tentando enviar e-mail de teste...");
        await transporter.sendMail({
            from: `"Teste Tocha" <${smtpUser}>`,
            to: smtpUser, // Envia para si mesmo
            subject: "🚀 Teste de Notificação - Tocha Padaria",
            text: "Se você recebeu este e-mail, a configuração do SMTP está funcionando perfeitamente!",
            html: "<b>Se você recebeu este e-mail, a configuração do SMTP está funcionando perfeitamente!</b>"
        });
        console.log("✨ E-mail de teste enviado com sucesso!");
    } catch (error) {
        console.error("❌ FALHA NO TESTE DE E-MAIL:");
        console.error(error);
        
        if (error.code === 'EAUTH') {
            console.log("\n💡 DICA: Erro de Autenticação (EAUTH).");
            console.log("1. Verifique se o e-mail está correto.");
            message = "2. Se estiver usando Gmail, você PRECISA de uma 'Senha de App'.";
            console.log(message);
            console.log("3. A senha deve ter 16 caracteres e NÃO deve ter espaços.");
        }
    }
    process.exit();
}

runTest();
