#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI; CommonJS require is intentional */
/**
 * Finds an available port starting from the preferred default (3000).
 * Prints the port number to stdout so npm scripts can capture it.
 *
 * Usage:
 *   node find-port.js          -> prints e.g. "3000"
 *   node find-port.js 3002     -> starts scanning from 3002
 */

const net = require('net');

const preferred = parseInt(process.argv[2] || process.env.PORT || '3000', 10);
const maxTries = 20;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findPort() {
  for (let i = 0; i < maxTries; i++) {
    const port = preferred + i;
    if (await isPortFree(port)) {
      return port;
    }
  }
  // fallback: let the OS pick
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

findPort().then((port) => {
  process.stdout.write(String(port));
});
