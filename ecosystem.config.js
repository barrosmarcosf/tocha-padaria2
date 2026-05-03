module.exports = {
    apps: [{
        name: 'tocha-padaria',
        script: 'server.js',
        cwd: '/root/tocha-padaria2',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
            NODE_ENV: 'production'
        }
    }]
};
