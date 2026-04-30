const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'security.log');

function secLog(event, ip, route, details = '') {
    const line = `[SECURITY] ${new Date().toISOString()} | ${event} | IP: ${ip} | ${route}${details ? ' | ' + details : ''}\n`;
    process.stdout.write(line);
    try { fs.appendFileSync(LOG_FILE, line); } catch (_) {}
}

module.exports = { secLog };
