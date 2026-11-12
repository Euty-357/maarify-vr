#!/usr/bin/env node
/**
 * One-command Quest dev loop:
 *   1. free port 5173
 *   2. clear Vite's dependency cache
 *   3. start Vite with a strict port (fails loudly instead of moving to 5174)
 *   4. wait until /__build answers
 *   5. adb reverse 5173 and verify it
 *   6. print the URL and build id
 *
 * Usage: npm run quest
 */
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = 5173;
const isWindows = process.platform === 'win32';

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
        console.log(`[quest] stopped process ${pid} holding :${PORT}`);
      }
    } else {
      const pids = execSync(`lsof -ti tcp:${PORT}`, { encoding: 'utf8' }).trim();
      if (pids) execSync(`kill -9 ${pids.split(/\s+/).join(' ')}`);
    }
  } catch {
    /* nothing was listening */
  }
}

function adb(args, allowFailure = false) {
  try {
    return execSync(`adb ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const detail = String(error.stderr ?? error.message).trim();
    throw new Error(`adb ${args} failed: ${detail}`);
  }
}

async function waitForServer(timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${PORT}/__build`, { cache: 'no-store' });
      if (response.ok) return await response.json();
    } catch {
      /* not up yet */
    }
    await delay(500);
  }
  throw new Error(`Vite did not answer on :${PORT} within ${timeoutMs}ms`);
}

freePort();

rmSync('node_modules/.vite', { recursive: true, force: true });
console.log('[quest] cleared node_modules/.vite');
console.log(`[quest] starting Vite on strict port ${PORT} ...`);

const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'],
  { stdio: 'inherit' }
);

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    vite.kill();
  } catch {
    /* already gone */
  }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
vite.on('exit', (code) => shutdown(code ?? 1));

try {
  const build = await waitForServer();
  console.log(`[quest] Vite ready, build ${build.buildId}`);

  adb('reverse tcp:5173 tcp:5173');
  const list = adb('reverse --list', true);
  if (!list.includes('tcp:5173')) {
    throw new Error(`adb reverse did not register (got: ${list || 'empty'}). Is the headset connected and authorised?`);
  }

  console.log('[quest] adb reverse active:');
  console.log(list.split(/\r?\n/).map((line) => `  ${line}`).join('\n'));
  console.log('');
  console.log(`  Open in the Quest Browser: http://localhost:${PORT}`);
  console.log(`  BUILD ID in the headset must read: ${build.buildId}`);
  console.log('  Keep this terminal open. Ctrl+C stops Vite.');
} catch (error) {
  console.error(`[quest] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
}
