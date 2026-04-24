require('dotenv').config();
const { sendOrderEmails, sendOrderWhatsApp } = require('../src/notification-service');

async function testNotifications() {
    console.log("🚀 INICIANDO DIAGNÓSTICO DE NOTIFICAÇÕES...");
    
    const mockOrder = {
        id: 'TESTE-DIAGNOSTICO',
        total_amount: 155.50,
        items: JSON.stringify([
            { qty: 2, name: 'Sourdough Tradicional', price: 25.00 },
            { qty: 1, name: 'Focaccia de Alecrim', price: 35.00 }
        ])
    };

    const mockCustomer = {
        name: 'Cliente Teste',
        email: 'tocha.padariapagamentos@gmail.com', 
        whatsapp: '5521966278965' 
    };

    console.log("\n--- [PASSO 1] TESTANDO E-MAIL ---");
    try {
        await sendOrderEmails(mockOrder, mockCustomer, 'Pix');
        console.log("✅ OK: Fluxo de e-mail processado sem erros.");
    } catch (e) {
        console.error("❌ ERRO no fluxo de e-mail:", e.message);
    }

    console.log("\n--- [PASSO 2] TESTANDO WHATSAPP ---");
    console.log("⏳ Aguardando o bot inicializar (isso pode levar até 30s na primeira vez)...");
    
    try {
        // A função sendOrderWhatsApp já tem o waitForReady interno de 40s
        await sendOrderWhatsApp(mockOrder, mockCustomer, 'Pix');
        console.log("✅ OK: Fluxo de WhatsApp processado sem erros críticos.");
    } catch (e) {
        console.error("❌ ERRO no fluxo de WhatsApp:", e.message);
    }

    console.log("\n--- [FIM DO DIAGNÓSTICO] ---");
    // Aguarda um pouco para as mensagens terminarem de sair antes de fechar o processo
    setTimeout(() => {
        console.log("Encerrando processo...");
        process.exit(0);
    }, 5000);
}

testNotifications();
