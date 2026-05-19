const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'security.log');

function secLog(event, ip, route, details = '') {
    const entry = JSON.stringify({ tag: 'SECURITY', event, ip, route, details: details || undefined, timestamp: new Date().toISOString() });
    console.log(entry);
    fs.appendFile(LOG_FILE, entry + '\n', () => {});
}

module.exports = { secLog };
