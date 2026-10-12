/** PM2 สำหรับ patient-bed แบบ Next.js standalone (Windows server) */
module.exports = {
  apps: [
    {
      name: 'patient-bed',
      cwd: 'C:/apps/patient-bed/.next/standalone',
      script: 'server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
}
