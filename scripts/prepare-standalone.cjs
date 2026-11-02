/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const standaloneRoot = path.join(projectRoot, '.next', 'standalone');
const staticSource = path.join(projectRoot, '.next', 'static');
const staticTarget = path.join(standaloneRoot, '.next', 'static');
const publicSource = path.join(projectRoot, 'public');
const publicTarget = path.join(standaloneRoot, 'public');

fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
fs.cpSync(staticSource, staticTarget, { recursive: true });
if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicTarget, { recursive: true });
}
