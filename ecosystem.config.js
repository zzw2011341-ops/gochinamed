module.exports = {
  apps: [{
    name: 'gomedchina',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 5000',
    cwd: '/var/www/gomedichina',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      HUNYUAN_SECRET_ID: process.env.HUNYUAN_SECRET_ID,
      HUNYUAN_SECRET_KEY: process.env.HUNYUAN_SECRET_KEY
    }
  }]
};
