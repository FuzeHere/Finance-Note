const path = require('node:path');
const { loadEnvConfig } = require('@next/env');

const projectRoot = path.resolve(__dirname, '..');
loadEnvConfig(projectRoot, false);
process.env.PORT ||= '3100';

const standaloneServer = path.join(projectRoot, '.next', 'standalone', 'server.js');
require(standaloneServer);
