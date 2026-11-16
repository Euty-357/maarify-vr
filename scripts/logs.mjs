#!/usr/bin/env node
/**
 * npm run logs — Live-tail the newest session-*.ndjson log file.
 *
 * Flags:
 *   --only pointer,grab      Filter to specific categories (comma-separated)
 *   --level warn             Show only warn and error levels
 *
 * Uses manual ANSI codes (no extra deps).
 */

import { readdirSync, openSync, readSync, fstatSync, closeSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------
const C = {
  reset: '\x1b[0m',
  grey: '\x1b[90m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

const LEVEL_COLOUR = {
  debug: C.grey,
  info: C.cyan,
  warn: C.yellow,
  error: C.red,
};

const CATEGORY_COLOUR = {
  'xr-session': C.green,
  pose: C.grey,
  pointer: C.cyan,
  grab: C.magenta,
  lever: C.magenta,
  slider: C.magenta,
  rotator: C.magenta,
  teleport: C.green,
  panel: C.cyan,
  module: C.green,
  frame: C.grey,
  error: C.red,
  mark: C.yellow,
};

// ---------------------------------------------------------------------------
// Parse flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

let onlyCategories = null;
let minLevel = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only' && args[i + 1]) {
    onlyCategories = new Set(args[i + 1].split(',').map((s) => s.trim()));
    i++;
  }
  if (args[i] === '--level' && args[i + 1]) {
    minLevel = args[i + 1].trim();
    i++;
  }
}

const LEVEL_ORDER = ['debug', 'info', 'warn', 'error'];

function levelAtLeast(level, minLvl) {
  if (!minLvl) return true;
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minLvl);
}

// ---------------------------------------------------------------------------
// Find newest log file
// ---------------------------------------------------------------------------
function findNewestLog() {
  let files;
  try {
    files = readdirSync(LOG_DIR).filter((f) => f.startsWith('session-') && f.endsWith('.ndjson'));
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  files.sort();
  return join(LOG_DIR, files[files.length - 1]);
}

// ---------------------------------------------------------------------------
// Tail implementation (poll-based, no extra deps)
// ---------------------------------------------------------------------------
function formatEvent(raw) {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return `${C.grey}[unparseable] ${raw.slice(0, 120)}${C.reset}`;
  }

  const { level = 'debug', category = '?', seq, module: mod, data, wall } = event;

  if (onlyCategories && !onlyCategories.has(category)) return null;
  if (!levelAtLeast(level, minLevel)) return null;

  const lc = LEVEL_COLOUR[level] || C.grey;
  const cc = CATEGORY_COLOUR[category] || C.reset;
  const ts = wall ? new Date(wall).toISOString().slice(11, 23) : '??:??:??.???';
  const dataStr = data !== undefined ? JSON.stringify(data).slice(0, 200) : '';

  return `${C.grey}${ts}${C.reset} ${lc}${level.toUpperCase().padEnd(5)}${C.reset} ${cc}[${category}]${C.reset} ${C.grey}mod=${mod ?? '?'} seq=${seq ?? '?'}${C.reset} ${dataStr}`;
}

function tail(filePath) {
  console.log(`${C.bold}Tailing:${C.reset} ${filePath}`);
  if (onlyCategories) console.log(`${C.grey}Filter categories: ${[...onlyCategories].join(', ')}${C.reset}`);
  if (minLevel) console.log(`${C.grey}Min level: ${minLevel}${C.reset}`);
  console.log('');

  const fd = openSync(filePath, 'r');
  let position = fstatSync(fd).size; // start at end of file (live tail)

  const CHUNK = 65536;
  const buf = Buffer.alloc(CHUNK);
  let leftover = '';

  const interval = setInterval(() => {
    const stats = fstatSync(fd);
    if (stats.size < position) {
      // File rotated or truncated
      position = 0;
    }
    if (stats.size === position) return;

    const toRead = Math.min(stats.size - position, CHUNK);
    const bytesRead = readSync(fd, buf, 0, toRead, position);
    position += bytesRead;

    const chunk = leftover + buf.toString('utf8', 0, bytesRead);
    const lines = chunk.split('\n');
    leftover = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const formatted = formatEvent(line);
      if (formatted !== null) console.log(formatted);
    }
  }, 100);

  process.on('SIGINT', () => {
    clearInterval(interval);
    closeSync(fd);
    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const logFile = findNewestLog();
if (!logFile) {
  console.error(`${C.red}No session-*.ndjson files found in ${LOG_DIR}${C.reset}`);
  console.error('Start the dev server with ?log=1 or ?debug=1 to generate logs.');
  process.exit(1);
}

tail(logFile);
