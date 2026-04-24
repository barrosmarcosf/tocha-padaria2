const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Tentando iniciar Puppeteer...");
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log("Sucesso! Navegador iniciado.");
        await browser.close();
    } catch (err) {
        console.error("Erro ao iniciar Puppeteer:", err);
    }
})();
