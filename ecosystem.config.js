module.exports = {
    apps: [
        {
            name: 'tocha-padaria',
            script: 'server.js',
            cwd: __dirname,
            instances: 2,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env_production: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'payments-monitor',
            script: 'monitor/payments-health.js',
            cwd: __dirname,
            cron_restart: '* * * * *',
            autorestart: true,
            watch: false,
            max_memory_restart: '128M',
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
