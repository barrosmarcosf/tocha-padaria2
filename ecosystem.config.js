module.exports = {
    apps: [
        {
            name: 'tocha-padaria',
            script: 'server.js',
            cwd: __dirname,
            instances: 1,
            autorestart: true,
            watch: false
        },
        {
            name: 'payments-monitor',
            script: 'monitor/payments-health.js',
            cwd: __dirname,
            cron_restart: '* * * * *',
            autorestart: true,
            watch: false
        }
    ]
};
