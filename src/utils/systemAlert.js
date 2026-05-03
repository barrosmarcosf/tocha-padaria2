'use strict';

function systemAlert(tag, data) {
    const payload = JSON.stringify({ tag, ...data, timestamp: new Date().toISOString() });
    console.error('\n🚨🚨🚨 PAYMENT SYSTEM ALERT 🚨🚨🚨');
    console.error(payload);
    console.error('🚨🚨🚨 PAYMENT SYSTEM ALERT 🚨🚨🚨\n');
}

module.exports = { systemAlert };
