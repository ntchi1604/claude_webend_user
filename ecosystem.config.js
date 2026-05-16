module.exports = {
    apps: [{
        name: 'claude-webend',
        script: 'node_modules/next/dist/bin/next',
        args: 'start -p 3000',
        interpreter: 'node',
        cwd: 'C:\\Users\\Administrator\\Desktop\\claude_webend_user',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
};
