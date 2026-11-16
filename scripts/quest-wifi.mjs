#!/usr/bin/env node
/**
 * Wireless dev loop for Quest 3 / 3S.
 *
 * Plain http:// on a LAN IP is NOT a secure context — WebXR will not start.
 * This script starts Vite with HTTPS (self-signed cert via @vitejs/plugin-basic-ssl)
 * so the Quest Browser can establish a secure context without a USB cable or tunnel.
 *
 * Usage: npm run quest:wifi
 *
 * Flow:
 *   1. Free port 5173
 *   2. Clear .vite cache
 *   3. Start Vite with MAARIFY_WIFI=1 (enables the basicSsl plugin)
 *   4. Wait until https://localhost:5173/__build answers (self-signed, skip verify)
 *   5. Detect LAN IP
 *   6. Try to reach self on LAN IP:5173 (firewall check)
 *   7. Print URL and build id
 *
 * Does NOT run adb reverse — that is the USB path (npm run quest).
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { networkInterfaces } from 'node:os';
import https from 'node:https';

const PORT = 5173;
const isWindows = process.platform === 'win32';

// ─── helpers ────────────────────────────────────────────────────────────────

function freePort() {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano -p tcp | findstr :${PORT}`, { encoding: 'utf8' });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const match = line.trim().match(/LISTENING\s+(\d+)$/);
        if (match) pids.add(match[1]);
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[wifi] stopped process ${pid} holding :${PORT}`);
      }
    } else {
      const pids = execSync(`lsof -ti tcp:${PORT}`, { encoding: 'utf8' }).trim();
      if (pids) execSync(`kill -9 ${pids.split(/\s+/).join(' ')}`);
    }
  } catch {
    /* nothing was listening */
  }
}

/** Returns the first non-loopback, non-APIPA IPv4 address, or null. */
function getLanIp() {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        !iface.address.startsWith('169.254.')
      ) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Wait for HTTPS server on localhost (self-signed cert → rejectUnauthorized:false).
 * Returns the parsed JSON body from /__build.
 */
async function waitForServer(timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/__build',
          method: 'GET',
          rejectUnauthorized: false,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try { resolve({ ok: res.statusCode === 200, body }); }
            catch { resolve(null); }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.end();
    });
    if (result?.ok) {
      try { return JSON.parse(result.body); }
      catch { /* malformed */ }
    }
    await delay(500);
  }
  throw new Error(`Vite (HTTPS) did not answer on :${PORT} within ${timeoutMs / 1000}s`);
}

/**
 * Quick TCP reachability check: try to connect to lanIp:PORT from this machine.
 * Returns true if the connection is accepted (firewall is open), false otherwise.
 */
async function canReachSelf(lanIp, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: lanIp,
        port: PORT,
        path: '/__build',
        method: 'GET',
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      (res) => { res.resume(); resolve(true); }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// ─── main ────────────────────────────────────────────────────────────────────

freePort();

rmSync('node_modules/.vite', { recursive: true, force: true });
console.log('[wifi] cleared node_modules/.vite');
console.log(`[wifi] starting Vite (HTTPS / WiFi mode) on strict port ${PORT} ...`);
console.log('[wifi] NOTE: plain http:// over a LAN IP is not a secure context.');
console.log('[wifi]       HTTPS self-signed cert allows WebXR in Quest Browser.\n');

const vite = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host', '0.0.0.0',
    '--port', String(PORT),
    '--strictPort',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, MAARIFY_WIFI: '1' },
  }
);

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  try { vite.kill(); } catch { /* already gone */ }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
vite.on('exit', (code) => shutdown(code ?? 1));

try {
  const build = await waitForServer();
  const lanIp = getLanIp();

  console.log('');
  console.log(`[wifi] ✓ Vite ready`);
  console.log(`[wifi] BUILD ID: ${build.buildId}`);
  console.log('');

  if (lanIp) {
    console.log(`[wifi] ┌─────────────────────────────────────────────────────────┐`);
    console.log(`[wifi] │  Open in Quest Browser: https://${lanIp}:${PORT}`.padEnd(65) + '│');
    console.log(`[wifi] │  Quest Browser will show a security warning for the     │`);
    console.log(`[wifi] │  self-signed cert → tap "Advanced → Proceed".           │`);
    console.log(`[wifi] │  If navigator.xr is undefined after proceeding, use     │`);
    console.log(`[wifi] │  wireless ADB instead (see docs/HEADSET_TEST.md).       │`);
    console.log(`[wifi] └─────────────────────────────────────────────────────────┘`);
    console.log('');

    // Firewall check: can we reach our own HTTPS port via the LAN address?
    const reachable = await canReachSelf(lanIp);
    if (!reachable) {
      console.log('[wifi] ⚠  Port appears UNREACHABLE from this machine via LAN IP.');
      console.log('[wifi]    The Quest Browser may not be able to reach the server.');
      console.log('[wifi]    Windows Firewall fix (run as Administrator):');
      console.log(`[wifi]      netsh advfirewall firewall add rule name="Maarify Dev HTTPS" ^`);
      console.log(`[wifi]        dir=in action=allow protocol=TCP localport=${PORT}`);
      console.log('[wifi]    Or temporarily:');
      console.log('[wifi]      Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False');
      console.log('[wifi]    Then re-enable when done.');
      console.log('');
    }
  } else {
    console.log('[wifi] ⚠  Could not detect a LAN IP. Make sure Wi-Fi is connected.');
    console.log('[wifi]    Manually navigate to https://<your-pc-ip>:5173 on the Quest Browser.');
    console.log('');
  }

  console.log('[wifi] HMR works over HTTPS. The /__log endpoint is on the same HTTPS origin.');
  console.log('[wifi] Keep this terminal open. Ctrl+C stops Vite.');
} catch (error) {
  console.error(`[wifi] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
}
