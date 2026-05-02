/**
 * check-wa-bot.js
 *
 * Valida o estado real do WhatsApp bot e envia mensagem de teste.
 *
 * IMPORTANTE: o bot vive no processo do servidor (server.js).
 * Para este script ter botStatus=READY ele precisa ser executado
 * dentro do mesmo processo — ou com o servidor parado, chamando startBot()
 * com a flag --start-bot (leva ~20s para reconectar via LocalAuth).
 *
 * Uso:
 *   node scripts/check-wa-bot.js              # verifica estado atual
 *   node scripts/check-wa-bot.js --start-bot  # inicializa bot neste processo
 */

require('dotenv').config();
const ns = require('../src/notification-service');

const TARGET_PHONE = '21969460158';
const TEST_MESSAGE = 'Teste de envio WhatsApp - sistema';
const START_BOT = process.argv.includes('--start-bot');
const BOT_TIMEOUT_MS = 30_000;

async function waitForReady() {
    return new Promise((resolve, reject) => {
        if (ns.isBotReady) return resolve();

        const timeout = setTimeout(() => {
            reject(new Error(`Bot não ficou READY em ${BOT_TIMEOUT_MS / 1000}s`));
        }, BOT_TIMEOUT_MS);

        // Polling via getter exportado (sem acesso ao evento interno)
        const poll = setInterval(() => {
            if (ns.isBotReady) {
                clearInterval(poll);
                clearTimeout(timeout);
                resolve();
            }
        }, 500);
    });
}

async function run() {
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('  CHECK WhatsApp Bot — TOCHA PADARIA');
    console.log(`  Destino: ${TARGET_PHONE}`);
    console.log('══════════════════════════════════════════════════');

    if (START_BOT) {
        console.log('[BOT] Inicializando via startBot() — aguarde...');
        ns.startBot();
        try {
            await waitForReady();
        } catch (err) {
            console.error(`[WA STATUS] NOT_READY`);
            console.error(`[WA ERROR] Bot não conectado — ${err.message}`);
            process.exit(1);
        }
    }

    const ready = ns.isBotReady;
    console.log(`[WA STATUS] ${ready ? 'READY' : 'NOT_READY'}`);

    if (!ready) {
        console.error('[WA ERROR] Bot não conectado');
        console.log('');
        console.log('DICA: execute com --start-bot para inicializar o bot neste processo,');
        console.log('      ou rode este check dentro do servidor (servidor já tem o bot ativo).');
        process.exit(1);
    }

    console.log(`[BOT] Estado: ${ns.botStatus}`);
    console.log(`[BOT] Enviando para ${TARGET_PHONE}...`);

    try {
        await ns.sendWhatsAppMessage(TARGET_PHONE, TEST_MESSAGE);
        console.log('[WA SEND OK]');
    } catch (err) {
        console.error(`[WA SEND ERROR] ${err.message}`);
        process.exit(1);
    }

    console.log('');
    console.log('══════════════════════════════════════════════════');

    if (START_BOT && ns.client) {
        try { await ns.client.destroy(); } catch (_) {}
    }

    process.exit(0);
}

run().catch(err => {
    console.error('[WA SEND ERROR]', err.message ?? err);
    process.exit(1);
});
