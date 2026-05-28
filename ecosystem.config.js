module.exports = {
  apps: [{
    name: 'gomedchina',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 5000',
    cwd: '/var/www/gomedichina',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      HUNYUAN_API_KEY: 'sk-sp-OYN1bI6MeMYFsKLTo9d3G1FxRcz0rWFst5jkTiK8LUMYp2Zz',
      DATABASE_URL: 'postgresql://medai_user:medai_password@localhost:5432/medai_platform',
      PGDATABASE_URL: 'postgresql://medai_user:medai_password@localhost:5432/medai_platform',
      NEXT_PUBLIC_APP_URL: 'https://hefunder.cn'
    }
  }]
};
