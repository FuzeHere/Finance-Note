/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');
const backupDir = path.join(root, 'scripts', '.tmp-api-backup');
const middlewareFile = path.join(root, 'src', 'middleware.ts');
const middlewareBackup = path.join(root, 'scripts', '.tmp-middleware-backup.ts');

function moveIfExists(from, to) {
  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    return true;
  }
  return false;
}

const movedApi = moveIfExists(apiDir, backupDir);
const movedMiddleware = moveIfExists(middlewareFile, middlewareBackup);

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, MOBILE_EXPORT: '1' },
  });
} finally {
  if (movedMiddleware) moveIfExists(middlewareBackup, middlewareFile);
  if (movedApi) moveIfExists(backupDir, apiDir);
}
