/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const ocrEnginePath = path.join(__dirname, '.ocr-engine');
const ocrEngine = process.env.OCR_ENGINE || (fs.existsSync(ocrEnginePath)
  ? fs.readFileSync(ocrEnginePath, 'utf8').trim()
  : 'paddle');

module.exports = {
  apps: [
    {
      name: 'finance-note-ocr',
      script: 'scripts/paddle_ocr_worker.py',
      interpreter: ocrEngine === 'tesseract' ? 'python3' : `${__dirname}/.venv-paddle/bin/python`,
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
