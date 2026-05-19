'use strict';

function perfLog(label, start) {
    const duration = Date.now() - start;
    console.log(`[PERF] ${label} | ${duration}ms | ${new Date().toISOString()}`);
}

module.exports = { perfLog };
