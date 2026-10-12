/** PM2 config — ใช้บน Windows server (หลีกเลี่ยงปัญหา pm2 start npm -- run start) */
module.exports = {
  apps: [
    {
      name: 'ha-center',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
