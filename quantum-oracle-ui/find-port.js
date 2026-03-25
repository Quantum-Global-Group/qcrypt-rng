#!/usr/bin/env node
/**
 * Picks a TCP port for this app: start from a project-specific base (default 3040),
 * not 3000, so other tools can keep using 3000 without clashing.
 * If the base is busy, scans upward until a free port is found (same behavior
 * each run when the previous dev server has stopped — the base is stable).
 *
 * Priority: CLI arg > QUANTUM_ORACLE_UI_PORT env > .env.local > default base.
 *
 * Usage:
 *   node find-port.js           -> prints e.g. "3040"
 *   node find-port.js 3050      -> scan from 3050
 */

const fs = require('fs');
const net = require('net');
const path = require('path');

const DEFAULT_BASE = 3040;
const maxTries = 30;

function readQuantumOracleUiPortFromEnvLocal() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^QUANTUM_ORACLE_UI_PORT\s*=\s*(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
  } catch {
    // missing or unreadable .env.local
  }
  return null;
}

function preferredPort() {
  if (process.argv[2]) {
    return parseInt(process.argv[2], 10);
  }
  if (process.env.QUANTUM_ORACLE_UI_PORT) {
    return parseInt(process.env.QUANTUM_ORACLE_UI_PORT, 10);
  }
  const fromFile = readQuantumOracleUiPortFromEnvLocal();
  if (fromFile != null && !Number.isNaN(fromFile)) {
    return fromFile;
  }
  return DEFAULT_BASE;
}

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
  const preferred = preferredPort();
  if (Number.isNaN(preferred) || preferred < 1 || preferred > 65535) {
    console.error('find-port: invalid preferred port');
    process.exit(1);
  }

  for (let i = 0; i < maxTries; i++) {
    const port = preferred + i;
    if (port > 65535) break;
    if (await isPortFree(port)) {
      return port;
    }
  }

  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address();
      const p = typeof addr === 'object' && addr ? addr.port : 0;
      s.close(() => resolve(p));
    });
  });
}

findPort().then((port) => {
  process.stdout.write(String(port));
});
