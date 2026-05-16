module.exports = {
    apps: [{
        name: 'claude-webend',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        cwd: 'C:\\Users\\Administrator\\Desktop\\claude_webend_user',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
};
