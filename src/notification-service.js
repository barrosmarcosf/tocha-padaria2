const nodemailer = require('nodemailer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const path = require('path');
const { callAntigravity } = require('./utils/antigravity-client');

const STORE_OWNER_WA = process.env.OWNER_WHATSAPP;
const USE_AI = process.env.USE_AI_NOTIFICATIONS === 'true';

// Configuração do Transportador (SMTP)
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, 
    pool: true, // Reutiliza as conexões para acelerar o envio
    maxConnections: 5,
    auth: {
        user: smtpUser,
        pass: smtpPass
    }
});

// Verificação de SMTP no início com logs detalhados
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ ERRO SMTP: Falha na conexão com o servidor de e-mail.");
        console.error("👉 Detalhes:", error.code, error.message);
        if (error.code === 'EAUTH') console.error("💡 DICA: O usuário ou senha de e-mail estão incorretos (Check App Passwords).");
    } else {
        console.log("✅ SERVIDOR SMTP: Pronto para enviar e-mails.");
    }
});

// Controle de inicialização
let isInitializing = false;

// A inicialização agora é feita via startBot() exportado
async function startBot() {
    if (isInitializing || isBotReady) return;
    isInitializing = true;
    
    try {
        console.log("TOCHA BOT: Chamando client.initialize()...");
        await client.initialize();
        console.log("TOCHA BOT: Processo de inicialização em andamento...");
    } catch (err) {
        isInitializing = false;
        console.error("❌ ERRO CRÍTICO ao iniciar Tocha Bot:");
        if (err.message && err.message.includes('browser is already running')) {
            console.error("💡 ERRO: Perfil do Chrome bloqueado. Tente reiniciar o servidor.");
        } else {
            console.error(err);
        }
    }
}

async function restartBot() {
    console.log("🔄 TOCHA BOT: Reiniciando...");
    try {
        isBotReady = false;
        isInitializing = false;
        botStatus = "REINICIANDO";
        
        // Tenta destruir o cliente atual se possível
        try {
            await client.destroy();
            console.log("✅ TOCHA BOT: Cliente destruído com sucesso.");
        } catch (e) {
            console.warn("⚠️ TOCHA BOT: Erro ao destruir cliente (pode já estar fechado):", e.message);
        }

        // Aguarda um pouco e reinicia
        setTimeout(() => {
            startBot();
        }, 3000);
        
        return { success: true, message: "Comando de reinicialização enviado." };
    } catch (err) {
        console.error("❌ TOCHA BOT: Falha crítica ao reiniciar:", err);
        return { success: false, error: err.message };
    }
}

// --- ESTADOS DO WHATSAPP (Roteiro de Controle) ---
const WA_STATE = {
    INITIALIZING: 'INITIALIZING',
    AUTHENTICATED: 'AUTHENTICATED',
    READY: 'READY',
    DISCONNECTED: 'DISCONNECTED',
    ERROR: 'ERROR'
};

let isBotReady = false;
let botStatus = WA_STATE.INITIALIZING;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.resolve(__dirname, '..', '.wwebjs_auth') }),
    puppeteer: {
        executablePath: process.env.CHROME_PATH || undefined,
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--disable-web-security'
        ]
    }
});

client.on('qr', async (qr) => {
    isBotReady = false;
    botStatus = WA_STATE.INITIALIZING; // Aguardando login ainda é fase de inicialização
    console.log(`[WA-STATE] ${botStatus} - ESCANEIE O CÓDIGO ABAIXO:`);
    qrcodeTerminal.generate(qr, { small: false });
    
    try {
        const qrPath = path.join(__dirname, '..', 'public', 'qr.png');
        await QRCode.toFile(qrPath, qr, { width: 600 });
        console.log("✅ QR Code ampliado salvo em: public/qr.png");
    } catch (err) {
        console.error("❌ [WA-STATE] Erro ao salvar QR:", err);
    }
});

client.on('authenticated', () => {
    botStatus = WA_STATE.AUTHENTICATED;
    console.log(`[WA-STATE] ${WA_STATE.AUTHENTICATED}`);
});

client.on('ready', () => {
    botStatus = WA_STATE.READY;
    isBotReady = true;
    console.log(`[WA-STATE] ${WA_STATE.READY}`);
    console.log('==========================================');
    console.log('TOCHA BOT: CONECTADO E PRONTO PARA ENVIAR!');
    console.log('==========================================');
});

client.on('auth_failure', (msg) => {
    botStatus = WA_STATE.ERROR;
    isBotReady = false;
    console.error(`[WA-STATE] ${WA_STATE.ERROR} - Falha: ${msg}`);
});

client.on('disconnected', (reason) => {
    botStatus = WA_STATE.DISCONNECTED;
    isBotReady = false;
    console.log(`[WA-STATE] ${WA_STATE.DISCONNECTED} - Motivo: ${reason}`);
});

// --- NOVO: INTERACAO INTELIGENTE (IA) ---
client.on('message', async msg => {
    // Ignorar mensagens de grupos, status@broadcast ou se o bot nao estiver pronto
    if (!isBotReady || msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

    const chat = await msg.getChat();
    // Nao responder se for do proprio dono (feedback loop)
    if (msg.from === `${STORE_OWNER_WA}@c.us`) return;

    // Se estiver em modo de IA, processar a resposta
    if (USE_AI) {
        try {
            console.log(`[IA] 🤖 Processando mensagem de ${msg.from}: "${msg.body}"`);
            
            chat.sendStateTyping(); // Mostra "digitando..."

            const systemPrompt = `Você é o Tocha Bot, o assistente virtual da Tocha Padaria, uma padaria artesanal especializada em fermentação natural (Levain) em São João de Meriti (Vila Jurandir), RJ.

INFORMAÇÕES CRÍTICAS DA PADARIA:
- Endereço: Av. Presidente Kennedy, 627 — Vila Jurandir (Em frente à Tetraforma), São João de Meriti - RJ.
- Retirada de Pedidos: Acontece sempre aos SÁBADOS, a partir das 15:00.
- Como Pedir: Somente pelo nosso site (link que você enviará conforme a conversa).
- Especialidade: Pães de fermentação natural feitos com carinho e tempo.
- Janela de Venda: Abrimos para encomendas aproximadamente 9 dias antes de cada fornada e fechamos 2 dias antes (quinta-feira às 16h) para podermos preparar a massa.
- Entregas: Não fazemos entregas próprias, mas o cliente pode mandar Uber Flash ou 99 Flash para retirar na loja no sábado após as 15h.

DIRETRIZES DE RESPOSTA:
1. Seja sempre amigável, acolhedor e use emojis de pão 🥖 e fogo 🔥.
2. Seja conciso. Não escreva textos gigantescos.
3. Se perguntarem sobre preços ou menu, diga que o menu completo e preços estão sempre atualizados no nosso site.
4. Se o cliente estiver com problemas no pedido, peça para ele aguardar um pouco que um humano irá atendê-lo em breve.
5. Se for apenas um "olá" ou saudação, cumprimente e pergunte se ele quer encomendar pães para a fornada de sábado.

REGRAS DE OURO:
- Você NUNCA passa números de telefone de terceiros.
- Você NUNCA fecha pedidos pelo WhatsApp (direcione para o site).
- Você NUNCA dá descontos por conta própria.

Responda à mensagem do cliente a seguir de forma natural:`;

            const aiResponse = await callAntigravity({ 
                input: `${systemPrompt}\n\nCLIENTE DISSE: ${msg.body}` 
            });

            if (aiResponse && aiResponse.output) {
                await msg.reply(aiResponse.output);
                console.log(`[IA] ✅ Resposta enviada com sucesso.`);
            }
        } catch (err) {
            console.error("[IA] ❌ Erro ao gerar resposta automatica:", err.message);
        }
    }
});

client.on('auth_failure', msg => {
    isBotReady = false;
    botStatus = "FALHA_AUTH";
    console.error('TOCHA BOT: FALHA NA AUTENTICACAO', msg);
});

client.on('disconnected', (reason) => {
    isBotReady = false;
    botStatus = "DESCONECTADO";
    console.error(`[WHATSAPP] ⚠️ BOT DESCONECTADO! Motivo: ${reason}`);
    
    // Tentativa de reconexão inteligente com Backoff Exponencial simples
    let retryCount = 0;
    const maxRetries = 5;
    
    const reconnect = () => {
        if (retryCount >= maxRetries) {
            console.error("[WHATSAPP] ❌ Limite de tentativas de reconexão atingido.");
            return;
        }
        retryCount++;
        const delay = 5000 * retryCount;
        console.log(`[WHATSAPP] 🔄 Tentando reconectar (${retryCount}/${maxRetries}) em ${delay/1000}s...`);
        
        setTimeout(async () => {
            try {
                await client.initialize();
            } catch (e) {
                console.error("[WHATSAPP] ❌ Erro ao tentar inicializar durante reconexão:", e.message);
                reconnect();
            }
        }, delay);
    };
    
    reconnect();
});

// Inicialização via startBot() no topo do arquivo.

/**
 * Formata os itens do pedido
 */
function formatItems(items) {
    let text = "";
    let html = "<ul style='padding-left: 20px; margin: 10px 0;'>";
    
    let data = typeof items === 'string' ? JSON.parse(items) : items;
    
    // Suporte para o novo formato que inclui metadados do pedido/ciclo
    let itemsArray = Array.isArray(data) ? data : (data && data.actual_items ? data.actual_items : []);
    
    if (!Array.isArray(itemsArray)) {
        console.warn("formatItems: Nenhum array de itens encontrado.", data);
        itemsArray = [];
    }
    
    itemsArray.forEach(item => {
        const qty = item.qty || item.quantity || 0;
        const name = item.name || item.description || 'Produto';
        const unitPrice = item.price || (item.amount_total ? (item.amount_total / 100 / qty) : 0);
        const subtotal = unitPrice * qty;
        const line = `${qty}x ${name} - R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        text += `- ${line}\n`;
        html += `<li style='margin-bottom: 5px;'>${line}</li>`;
    });
    
    html += "</ul>";
    return { text, html };
}

/**
 * Envia e-mails de confirmação
 */
async function sendOrderEmails(supabase, order, customer, paymentMethod = 'Não informado') {
    const { text: itemsText, html: itemsHtml } = formatItems(order.items);
    const totalStr = `R$ ${order.total_amount.toFixed(2).replace('.', ',')}`;
    const customerName = customer.name || customer.nome || 'Cliente';
    
    // Busca template do banco
    let emailTemplate = `✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n🕒 Quando\nSábado, a partir das 15h\n\n⚠️ Importante\nVocê receberá confirmação no WhatsApp quando estiver pronto.\nRetire somente após essa mensagem.\n\n🚚 Opções\nRetirada pessoal | Uber Flash | 99 Flash\n\n🧾 Pedido\n{itens}\n\nTotal: {total}\nPagamento: {pagamento}\n\nSe precisar, é só chamar!`;
    
    if (supabase) {
        try {
            const { data } = await supabase.from('site_content').select('value').eq('key', 'msg_email_confirm').maybeSingle();
            if (data?.value) emailTemplate = data.value;
        } catch (e) { console.error("Erro ao buscar template de email:", e); }
    }

    // Substitui variáveis
    let finalMsg = emailTemplate
        .replace(/{nome}/g, customerName)
        .replace(/{itens}/g, itemsText)
        .replace(/{total}/g, totalStr)
        .replace(/{pagamento}/g, paymentMethod);

    const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo.png');

    const clientMailOptions = {
        from: `"Tocha Padaria" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `✅ Pedido confirmado — ${customerName}`,
        text: finalMsg,
        html: `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    .header { padding: 20px 0; text-align: left; }
                    .logo { max-width: 60px; height: auto; display: inline-block; filter: grayscale(1); opacity: 0.6; }
                    .content { padding: 40px; color: #333333; line-height: 1.6; text-align: center; }
                    .headline { color: #c9994c; font-size: 24px; font-weight: bold; margin-bottom: 30px; text-align: center; }
                    .info-box { background-color: #fcf8f2; border: 1px solid #f5ead9; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center; }
                    .info-title { font-weight: bold; color: #8e6a34; margin-bottom: 10px; display: block; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
                    .order-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .order-row { border-bottom: 1px solid #f0f0f0; }
                    .order-item { padding: 12px 0; font-size: 15px; }
                    .order-price { text-align: right; font-weight: bold; color: #555; }
                    .totals { margin-top: 20px; border-top: 2px solid #c9994c; padding-top: 20px; }
                    .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; }
                    .final-total { font-size: 20px; font-weight: bold; color: #c9994c; margin-top: 10px; }
                    .footer { text-align: center; padding: 30px; color: #888; font-size: 13px; background-color: #fafafa; }
                    .important-notice { color: #d97706; font-size: 14px; font-weight: bold; margin-top: 10px; }
                    ul { list-style: none; padding: 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="cid:tocha_logo" alt="Tocha Padaria" class="logo">
                    </div>
                    <div class="content">
                        <div class="headline">✅ Pedido confirmado — ${customerName}</div>
                        
                        <div class="info-box">
                            <span class="info-title">📍 Retirada</span>
                            <p style="margin: 0;">Av. Presidente Kennedy, 627 — Vila Jurandir<br>(Em frente à Tetraforma)</p>
                            
                            <span class="info-title" style="margin-top: 20px;">🕒 Quando</span>
                            <p style="margin: 0;">Sábado, a partir das 15h</p>

                            <div class="important-notice">
                                ⚠️ Importante: Você receberá confirmação no WhatsApp quando estiver pronto. Retire somente após essa mensagem.
                            </div>
                        </div>

                        <span class="info-title">🧾 Detalhes do Pedido</span>
                        <div style="margin-bottom: 30px; display: inline-block; text-align: left; width: 100%; max-width: 400px;">
                            ${itemsHtml}
                        </div>

                        <div class="totals" style="max-width: 400px; margin: 20px auto 0 auto;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="font-size: 18px; color: #333; text-align: left;"><strong>Total:</strong></td>
                                    <td style="text-align: right; font-size: 22px; color: #c9994c;"><strong>${totalStr}</strong></td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; color: #888; padding-top: 5px; text-align: left;">Pagamento:</td>
                                    <td style="text-align: right; font-size: 14px; color: #888; padding-top: 5px;">${paymentMethod}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Tocha Padaria</strong> — Fermentação Natural de Verdade</p>
                        <p>📍 São João de Meriti, RJ</p>
                        <p style="margin-top: 15px;">Se precisar, é só nos chamar respondendo este e-mail ou no WhatsApp.</p>
                    </div>
                </div>
            </body>
            </html>
        `,

        attachments: [{
            filename: 'logo.png',
            path: logoPath,
            cid: 'tocha_logo'
        }]
    };

    const sellerMailOptions = {
        from: `"Venda Tocha" <${process.env.SMTP_USER}>`,
        to: 'tocha.padariapagamentos@gmail.com',
        subject: `NOVA VENDA - ${customerName}`,
        text: `Venda para ${customerName}\nWhatsApp: ${customer.whatsapp}\nForma de Pagamento: ${paymentMethod}\n\nITENS:\n${itemsText}\nTOTAL: ${totalStr}`,
        html: `<h2>Nova Venda!</h2><p><strong>Cliente:</strong> ${customerName}</p><p><strong>WhatsApp:</strong> ${customer.whatsapp}</p><p><strong>Pagamento:</strong> ${paymentMethod}</p><hr>${itemsHtml}<p><strong>Total:</strong> ${totalStr}</p>`
    };

    try {
        console.log(`📡 [EMAIL-START] Iniciando disparos independentes...`);
        
        // --- E-MAIL CLIENTE ---
        console.log(`📧 [EMAIL-CLIENT-START] Enviando para: ${customer.email}`);
        const sendToClient = transporter.sendMail(clientMailOptions)
            .then(() => console.log("✅ [EMAIL-CLIENT-SUCCESS] E-mail entregue ao cliente."))
            .catch(err => console.error("❌ [EMAIL-CLIENT-FAIL] Erro no e-mail do cliente:", err.message));

        // --- E-MAIL PADARIA ---
        console.log(`📧 [EMAIL-STORE-START] Enviando cópia para a loja...`);
        const sendToSeller = transporter.sendMail(sellerMailOptions)
            .then(() => console.log("✅ [EMAIL-STORE-SUCCESS] E-mail entregue à padaria."))
            .catch(err => console.error("❌ [EMAIL-STORE-FAIL] Erro no e-mail administrativo:", err.message));

        await Promise.allSettled([sendToClient, sendToSeller]);
        
    } catch (error) {
        console.error("❌ [EMAIL-FATAL] Erro crítico no motor de e-mail:", error.message);
    }
}

async function sendCancellationEmail(customer) {
    const customerName = customer.name || customer.nome || 'Cliente';
    const mailOptions = {
        from: `"Tocha Padaria" <${process.env.SMTP_USER}>`,
        to: [customer.email, 'tocha.padariapagamentos@gmail.com'],
        subject: 'Compra Nao Concluida - Tocha Padaria',
        text: `Olá ${customerName},\nInformamos que seu pedido foi cancelado ou expirou.`,
        html: `<p>Olá ${customerName},</p><p>Seu pedido foi cancelado ou a sessão expirou.</p>`
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("OK: E-mails de cancelamento enviados.");
    } catch (error) { console.error("ERRO:", error); }
}

/**
 * Envia E-mail do formulário Fale Conosco
 */
async function sendContactEmail(data) {
    const { name, email, phone, message } = data;
    const mailOptions = {
        from: `"Tocha Padaria - Contato" <${process.env.SMTP_USER}>`,
        to: 'tocha.padariapagamentos@gmail.com',
        subject: 'Fale Conosco',
        text: `Nova mensagem recebida pelo site:\n\nNome: ${name}\nE-mail: ${email}\nTelefone: ${phone}\n\nMensagem:\n${message}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #c9994c;">Nova Mensagem: Fale Conosco</h2>
                <hr>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${phone}</p>
                <div style="background: #f9f9f9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Mensagem:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("OK: E-mail de 'Fale Conosco' enviado.");
    } catch (error) {
        console.error("ERRO ao enviar e-mail de contato:", error);
        throw error;
    }
}

async function sendOrderWhatsApp(supabase, order, customer, paymentMethod = 'Não informado') {
    const customerName = customer.name || customer.nome || 'Cliente';
    const totalStr = `R$ ${Number(order.total_amount).toFixed(2).replace('.', ',')}`;

    // --- 1 & 2. BLOQUEIO EXPLÍCITO DE ESTADO (Roteiro) ---
    if (botStatus !== WA_STATE.READY) {
        console.error(`[WA-BLOCKED] Tentativa de envio abortada: client em estado ${botStatus}`);
        return;
    }

    try {
        let itemsText = "";
        try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const itemsArray = Array.isArray(items) ? items : (items.actual_items || []);
            itemsText = itemsArray.map(i => `• ${i.name} (x${i.qty || i.quantidade || 1})`).join('\n');
        } catch (e) { itemsText = "Itens do pedido (ver no admin)"; }
        
        // Busca template do banco
        let waTemplate = `✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n🕒 *Quando*\nSábado, a partir das 15h\n\n⚠️ *Importante*\nVocê receberá confirmação no WhatsApp quando estiver pronto.\nRetire somente após essa mensagem.\n\n🚚 *Opções*\nRetirada pessoal | Uber Flash | 99 Flash\n\n🧾 *Pedido*\n{itens}\n\n*Total:* {total}\n*Pagamento:* {pagamento}\n\nSe precisar, é só chamar!`;
        
        if (supabase) {
            try {
                const { data } = await supabase.from('site_content').select('value').eq('key', 'msg_wa_confirm').maybeSingle();
                if (data?.value) waTemplate = data.value;
            } catch (e) { console.error("Erro ao buscar template de WA confirm:", e); }
        }

        const clientMsg = waTemplate
            .replace(/{nome}/g, customerName)
            .replace(/{itens}/g, itemsText)
            .replace(/{total}/g, totalStr)
            .replace(/{pagamento}/g, paymentMethod);

        // --- 3. CORREÇÃO DEFINITIVA DA RESOLUÇÃO (Roteiro) ---
        const resolveJid = async (raw, label) => {
            const cleaned = raw.toString().replace(/\D/g, '');
            let normalized = cleaned.startsWith('55') ? cleaned : '55' + cleaned;
            
            console.log(`[WA-CHECK] ${label} - Bruto: ${raw}`);
            console.log(`[WA-CHECK] ${label} - Normalizado: ${normalized}`);
            console.log(`[WA-CHECK] ${label} - Estado atual: ${botStatus}`);

            try {
                let numberId = await client.getNumberId(normalized);
                
                // Fallback para 9º dígito Brasil (Accounts antigas vs novas)
                if (!numberId && normalized.startsWith('55')) {
                    console.log(`[WA-CHECK] ${label} - Tentando fallback de 9º dígito...`);
                    let alt;
                    if (normalized.length === 13) {
                        // Tenta remover o 9 (55 21 988887777 -> 55 21 88887777)
                        alt = normalized.substring(0, 4) + normalized.substring(5);
                    } else if (normalized.length === 12) {
                        // Tenta adicionar o 9 (55 21 88887777 -> 55 21 988887777)
                        alt = normalized.substring(0, 4) + '9' + normalized.substring(4);
                    }
                    
                    if (alt) {
                        console.log(`[WA-CHECK] ${label} - Normalizado Alt: ${alt}`);
                        numberId = await client.getNumberId(alt);
                    }
                }

                console.log(`[WA-CHECK] ${label} - getNumberId Final: ${JSON.stringify(numberId)}`);
                
                if (numberId && numberId._serialized) {
                    return numberId._serialized;
                }
                console.error(`❌ [WA-ERROR] ${label} - Número não resolvido pela rede.`);
                return null;
            } catch (e) {
                console.error(`❌ [WA-ERROR] ${label} - Erro na resolução: ${e.message}`);
                return null;
            }
        };

        // --- RESOLUÇÃO DO CLIENTE ---
        const clientJid = await resolveJid(customer.whatsapp, 'CLIENTE');
        if (clientJid) {
            console.log(`[WA-START] Enviando para: ${clientJid}`);
            await client.sendMessage(clientJid, clientMsg);
            console.log(`✅ [WA-SUCCESS] Mensagem entregue ao CLIENTE.`);
        }

        // --- RESOLUÇÃO DA LOJA ---
        const ownerJid = await resolveJid(STORE_OWNER_WA, 'LOJA');
        if (ownerJid) {
            console.log(`[WA-START] Enviando para: ${ownerJid}`);
            const ownerMsg = `🤖 *TOCHA BOT: NOVA VENDA!* 💰\n\n` +
                `👤 *Cliente:* ${customerName}\n` +
                `📱 *WhatsApp:* ${customer.whatsapp || 'Não informado'}\n` +
                `🧾 *Pedido:* \n${itemsText}\n` +
                `💰 *Total:* ${totalStr}\n` +
                `💳 *Pagamento:* ${paymentMethod}`;

            await client.sendMessage(ownerJid, ownerMsg);
            console.log(`✅ [WA-SUCCESS] Aviso de venda entregue à LOJA.`);
        }

        console.log(`✨ [WA-FINISH] Fluxo de WhatsApp concluído.`);

    } catch (error) {
        console.error("❌ [WA-ERROR] Erro bruto completo:", error);
    }
}

/**
 * Recuperação de Carrinho Abandonado
 */
async function sendAbandonmentRecovery(supabase, customer, items, recoveryUrl) {
    const customerName = (customer.name || customer.nome || 'Cliente').split(' ')[0]; // Julia
    const itemsListText = items.map(i => `${i.qty}x ${i.name}`).join('\n'); // Sem o hífen (-)
    const itemsListHtml = items.map(i => `<li style="margin-bottom: 5px;">${i.qty}x ${i.name}</li>`).join('');

    // Busca template de WA do banco
    let waTemplate = `{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos , bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}\n\nQualquer dúvida, estamos por aqui!\n\n🔗 {link}`;
    
    if (supabase) {
        try {
            const { data } = await supabase.from('site_content').select('value').eq('key', 'msg_wa_abandoned').maybeSingle();
            if (data?.value) waTemplate = data.value;
        } catch (e) { console.error("Erro ao buscar template de WA abandonado:", e); }
    }

    let waMessage = waTemplate
        .replace(/{nome}/g, customerName)
        .replace(/{itens}/g, itemsListText)
        .replace(/{link}/g, recoveryUrl);

    // 1. E-MAIL DE RECUPERAÇÃO (Último Modelo)
    const mailOptions = {
        from: `"Tocha Padaria" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `🥖 ${customerName}, tudo bem?`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <div style="text-align: center; padding: 20px; background: #000;">
                    <img src="https://lh3.googleusercontent.com/d/1X5X7oGvH5P9HhMvP6-kLz9qV9GjO1g3E" alt="Tocha Padaria" style="height: 60px;">
                </div>
                <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                    <h1 style="color: #000; font-family: serif; font-size: 24px; margin-top: 0;">Faltou pouco, ${customerName}! 🥖</h1>
                    <p>Notamos que você selecionou alguns pães artesanais, mas não chegou a concluir o pedido.</p>
                    <p>Nossa produção é limitada e sob demanda — cada levain é preparado com carinho para a fornada do próximo sábado.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin-top: 0; font-weight: bold; font-size: 14px; text-transform: uppercase; color: #888;">Seus itens salvos:</p>
                        <ul style="list-style: none; padding: 0; font-size: 16px;">
                            ${itemsListHtml}
                        </ul>
                    </div>

                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${recoveryUrl}" style="background: #E5B560; color: #000; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Finalizar agora</a>
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Tocha Padaria - Fermentação Natural de São João de Meriti</p>
                </div>
            </div>
        `
    };

    // --- INTEGRAÇÃO COM IA (Opcional via .env) ---
    if (USE_AI) {
        try {
            console.log(`[IA] ✨ Gerando mensagem personalizada para ${customerName}...`);
            const aiPrompt = `Você é o Tocha Bot da Tocha Padaria. Crie uma mensagem curta e amigável para enviar via WhatsApp para o cliente ${customerName} que esqueceu estes itens no carrinho: ${itemsListText}. 
            A mensagem deve ser acolhedora, mencionar a qualidade artesanal (fermentação natural) e terminar pedindo para clicar no link para finalizar: ${recoveryUrl}. 
            Use emojis de pão e fogo. Mantenha o tom de padaria artesanal de bairro, mas premium.`;
            
            const aiResponse = await callAntigravity({ input: aiPrompt });
            if (aiResponse && aiResponse.output) {
                waMessage = aiResponse.output;
                console.log("[IA] ✅ Mensagem personalizada gerada com sucesso.");
            }
        } catch (aiErr) {
            console.warn("[IA] ⚠️ Falha ao gerar mensagem com IA, usando template padrão:", aiErr.message);
        }
    }

    try {
        if (customer.email) {
            console.log(`📡 [RECUPERACAO] Enviando e-mail para ${customer.email}...`);
            await transporter.sendMail(mailOptions);
        }
        if (customer.whatsapp && isBotReady) {
            let basePhone = customer.whatsapp.replace(/\D/g, '');
            if (!basePhone.startsWith('55') && basePhone.length >= 10) basePhone = '55' + basePhone;
            const jid = `${basePhone}@c.us`;
            console.log(`📡 [WHATSAPP] Enviando recuperação para: ${jid}`);
            await client.sendMessage(jid, waMessage);
        }
        console.log(`✅ [RECUPERACAO] Processo finalizado para ${customerName}`);
    } catch (e) { 
        console.error("❌ Erro no envio de recuperação:", e.message); 
    }
}

/**
 * Envia uma mensagem genérica via WhatsApp usando o bot logado
 * @param {string} phone Número no formato DDI+DDD+Número
 * @param {string} message Conteúdo da mensagem
 */
async function sendWhatsAppMessage(phone, message) {
    if (!isBotReady) throw new Error("O robô de WhatsApp não está conectado.");
    if (!phone) throw new Error("Telefone não informado.");

    // --- LÓGICA DE FORMATAÇÃO DE NÚMERO (BRASIL) conforme sendOrderWhatsApp ---
    let basePhone = phone.replace(/\D/g, '');
    if (!basePhone.startsWith('55') && basePhone.length >= 10) basePhone = '55' + basePhone;
    
    let targetChatId = `${basePhone}@c.us`;
    
    // Verificação de registro e ajuste de 9º dígito (opcional mas recomendado)
    try {
        const isRegistered = await client.isRegisteredUser(targetChatId);
        if (!isRegistered) {
            if (basePhone.length === 13) {
                const alt = basePhone.substring(0, 4) + basePhone.substring(5) + '@c.us';
                if (await client.isRegisteredUser(alt)) targetChatId = alt;
            } else if (basePhone.length === 12) {
                const alt = basePhone.substring(0, 4) + '9' + basePhone.substring(4) + '@c.us';
                if (await client.isRegisteredUser(alt)) targetChatId = alt;
            }
        }
    } catch (e) { console.warn("[WHATSAPP] Falha ao validar número, tentando envio bruto."); }

    await client.sendMessage(targetChatId, message);
    return true;
}

module.exports = {
    startBot,
    restartBot,
    sendOrderEmails,
    sendCancellationEmail,
    sendOrderWhatsApp,
    sendContactEmail,
    sendAbandonmentRecovery,
    sendWhatsAppMessage,
    // Exportando estado e definições para diagnóstico
    get WA_STATE() { return WA_STATE; },
    get client() { return client; },
    get isBotReady() { return isBotReady; },
    get botStatus() { return botStatus; }
};
