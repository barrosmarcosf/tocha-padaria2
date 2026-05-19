'use strict';

function perfLog(label, start) {
    const duration_ms = Date.now() - start;
    console.log(JSON.stringify({ tag: 'PERF', label, duration_ms, timestamp: new Date().toISOString() }));
}

module.exports = { perfLog };
