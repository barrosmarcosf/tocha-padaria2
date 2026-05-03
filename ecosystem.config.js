module.exports = {
    apps: [
        {
            name: 'tocha-padaria',
            script: 'server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'payments-monitor',
            script: 'monitor/payments-health.js',
            cron_restart: '* * * * *',
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
