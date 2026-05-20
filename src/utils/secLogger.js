const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'security.log');
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — rotação evita disco cheio

function rotatIfNeeded() {
    try {
        const stat = fs.statSync(LOG_FILE);
        if (stat.size > MAX_BYTES) {
            const rotated = LOG_FILE.replace('.log', `.${Date.now()}.log`);
            fs.renameSync(LOG_FILE, rotated);
        }
    } catch (_) {}
}

function secLog(event, ip, route, details = '') {
    const entry = JSON.stringify({ tag: 'SECURITY', event, ip, route, details: details || undefined, timestamp: new Date().toISOString() });
    console.log(entry);
    rotatIfNeeded();
    fs.appendFile(LOG_FILE, entry + '\n', (err) => {
        if (err) console.error(JSON.stringify({ tag: 'SECLOG_WRITE_ERROR', error: err.message, timestamp: new Date().toISOString() }));
    });
}

module.exports = { secLog };
