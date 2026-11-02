module.exports = {
  apps: [
    {
      name: 'finance-note-ocr',
      script: 'scripts/paddle_ocr_worker.py',
      interpreter: `${__dirname}/.venv-paddle/bin/python`,
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PADDLE_OCR_HOST: '127.0.0.1',
        PADDLE_OCR_PORT: '3101',
      },
    },
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
        HOSTNAME: '0.0.0.0',
        PORT: '3100',
        DATABASE_PATH: '/var/lib/finance-note/finance.sqlite',
        PADDLE_OCR_URL: 'http://127.0.0.1:3101/scan',
      },
    },
  ],
};
