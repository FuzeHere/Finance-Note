module.exports = {
  apps: [
    {
      name: 'finance-note',
      script: 'scripts/start-production.cjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3100',
        DATABASE_PATH: '/var/lib/finance-note/finance.sqlite',
      },
    },
  ],
};
