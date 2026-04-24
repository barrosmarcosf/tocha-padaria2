const { sendOrderEmails, sendOrderWhatsApp } = require('./notification-service');
require('dotenv').config();

// MOCK DATA
const mockOrder = {
    total_amount: 155.50,
    items: JSON.stringify([
        { qty: 2, name: 'Sourdough Tradicional', price: 25.00 },
        { qty: 1, name: 'Focaccia de Alecrim', price: 35.00 },
        { qty: 3, name: 'Mini Brioche', price: 23.50 }
    ])
};

const mockCustomer = {
    name: 'Marcos Teste',
    email: 'marcos@example.com',
    whatsapp: '5521999999999'
};

const paymentMethod = 'Pix';

console.log("🧪 INICIANDO TESTE DE FORMATAÇÃO DE NOTIFICAÇÕES...\n");

// Sobrescrevemos temporariamente as funções de envio real para apenas logar no console
// No notification-service.js, as funções usam transporter.sendMail e client.sendMessage
// Para este teste, vamos apenas rodar uma versão simplificada ou observar os logs do console se adicionarmos logs lá.

// Como não quero disparar e-mail real agora, vou apenas simular a lógica de formatação aqui para validar rápido.
function formatItemsLocal(items) {
    let text = "";
    const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
    itemsArray.forEach(item => {
        const qty = item.qty || item.quantity;
        const name = item.name || item.description;
        const unitPrice = item.price || (item.amount_total / 100 / qty);
        const subtotal = unitPrice * qty;
        const line = `${qty}x ${name} - R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        text += `- ${line}\n`;
    });
    return text;
}

const itemsText = formatItemsLocal(mockOrder.items);
const totalStr = `R$ ${mockOrder.total_amount.toFixed(2).replace('.', ',')}`;

const pickupInfo = `
📍 *LOCAL DE RETIRADA*
Av. Presidente Kennedy, 627 - Vila Jurandir, São João de Meriti
Referência: em frente à Tetraforma - material de construção.

⏰ *DATA E HORÁRIO DA RETIRADA*
Todo sábado a partir das 15h

✅ *CONFIRMAÇÃO*
Você receberá uma mensagem no WhatsApp confirmando que o pedido está pronto para retirada.

🚗 *OPÇÕES DE RETIRADA*
• Retirada pessoal
• Uber Flash
• 99 Flash

⚠️ *Lembrete importante:* retire apenas após nossa confirmação de disponibilidade.
`;

const message = `*${mockCustomer.name}*, seu pedido foi confirmado com sucesso! 🎉\n\n` +
    `*DETALHES DO PEDIDO*\n${itemsText}\n` +
    `*VALOR TOTAL:* ${totalStr}\n` +
    `*FORMA DE PAGAMENTO:* ${paymentMethod}\n\n` +
    `📍 *LOCAL DE RETIRADA*\n` +
    `Av. Presidente Kennedy, 627 - Vila Jurandir, São João de Meriti\n` +
    `Referência: em frente à Tetraforma - material de construção.\n\n` +
    `⏰ *DATA E HORÁRIO DA RETIRADA*\n` +
    `Todo sábado a partir das 15h\n\n` +
    `✅ *CONFIRMAÇÃO*\n` +
    `Você receberá uma mensagem no WhatsApp confirmando que o pedido está pronto para retirada.\n\n` +
    `🚗 *OPÇÕES DE RETIRADA*\n` +
    `• Retirada pessoal\n` +
    `• Uber Flash\n` +
    `• 99 Flash\n\n` +
    `⚠️ *Lembrete importante:* retire apenas após nossa confirmação de disponibilidade.\n\n` +
    `Precisa de algo? É só nos chamar! 😉🥖🔥`;

console.log("--- WHATSAPP MESSAGE PREVIEW ---");
console.log(message);
console.log("--------------------------------\n");

console.log("--- EMAIL TEXT PREVIEW ---");
console.log(`${mockCustomer.name}, seu pedido foi confirmado com sucesso!\n\nDETALHES DO PEDIDO\n${itemsText}\nVALOR TOTAL: ${totalStr}\nFORMA DE PAGAMENTO: ${paymentMethod}\n\n${pickupInfo.replace(/\*/g, '')}\n\nPrecisa de algo? É só nos chamar! 😉`);
console.log("--------------------------");
