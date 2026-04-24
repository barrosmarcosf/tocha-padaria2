const { Client, NoAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

console.log("Tentando inicializar com NoAuth...");

client.on('qr', (qr) => {
    console.log("QR CODE RECEBIDO!");
});

client.on('ready', () => {
    console.log("BOT PRONTO!");
});

client.initialize()
    .then(() => console.log("Inicialização iniciada."))
    .catch(err => {
        console.error("ERRO NA INICIALIZAÇÃO:");
        console.error(err);
    });

setTimeout(() => {
    console.log("Encerrando teste após 20 segundos...");
    process.exit(0);
}, 20000);
