#!/usr/bin/env node
/**
 * npm run logs:summary — Print a one-page summary of the last session's NDJSON log.
 *
 * Report sections:
 *   1. Anomalies: type, count, first/last timestamp
 *   2. Module timing stats: time spent in each module
 *   3. Last 5 errors
 *   4. Mark-bug events
 *
 * No extra deps — uses manual ANSI codes.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');

const C = {
  reset: '\x1b[0m',
  grey: '\x1b[90m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

// ---------------------------------------------------------------------------
// Find newest log
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
// Parse
// ---------------------------------------------------------------------------
function parseEvents(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const events = [];
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      /* skip malformed lines */
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
function formatTs(wall) {
  if (!wall) return '?';
  return new Date(wall).toISOString().slice(11, 23);
}

function summarise(events) {
  const anomalies = {};   // type → { count, first, last }
  const moduleEnters = []; // { name, wall }
  const errors = [];
  const marks = [];

  for (const ev of events) {
    // Anomalies
    if (ev.category === 'error' && ev.level === 'warn' && ev.data?.anomaly) {
      const type = ev.data.anomaly;
      if (!anomalies[type]) anomalies[type] = { count: 0, first: ev.wall, last: ev.wall };
      anomalies[type].count++;
      if (ev.wall < anomalies[type].first) anomalies[type].first = ev.wall;
      if (ev.wall > anomalies[type].last) anomalies[type].last = ev.wall;
    }

    // Module enters (match both module-entered and module-loaded or module changes)
    if (
      (ev.category === 'module' && (ev.data?.event === 'module-entered' || ev.data?.event === 'module-loaded' || ev.data?.event === 'return-to-hub')) ||
      (ev.module && (!moduleEnters.length || moduleEnters[moduleEnters.length - 1].name !== ev.module))
    ) {
      const name = ev.data?.name || ev.data?.moduleId || ev.module || 'hub';
      if (!moduleEnters.length || moduleEnters[moduleEnters.length - 1].name !== name) {
        moduleEnters.push({ name, wall: ev.wall, perf: ev.perf });
      }
    }

    // Errors
    if (ev.level === 'error') {
      errors.push(ev);
    }

    // Mark-bug
    if (ev.category === 'mark' && ev.data?.event === 'mark-bug') {
      marks.push(ev);
    }
  }

  return { anomalies, moduleEnters, errors, marks };
}

// ---------------------------------------------------------------------------
// Module timing
// ---------------------------------------------------------------------------
function moduleTimings(moduleEnters, lastEventWall) {
  const timings = [];
  for (let i = 0; i < moduleEnters.length; i++) {
    const start = moduleEnters[i];
    const endWall = i + 1 < moduleEnters.length ? moduleEnters[i + 1].wall : lastEventWall;
    const durationSec = endWall && start.wall ? (endWall - start.wall) / 1000 : null;
    timings.push({ name: start.name, startTs: formatTs(start.wall), durationSec });
  }
  return timings;
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------
function hr(char = '─', width = 72) {
  return C.grey + char.repeat(width) + C.reset;
}

function printReport(filePath, events) {
  const { anomalies, moduleEnters, errors, marks } = summarise(events);
  const lastWall = events.length > 0 ? events[events.length - 1].wall : null;
  const timings = moduleTimings(moduleEnters, lastWall);

  console.log('');
  console.log(hr('═'));
  console.log(`${C.bold}  Maarify Debug Log Summary${C.reset}`);
  console.log(`${C.grey}  File: ${filePath}${C.reset}`);
  console.log(`${C.grey}  Events: ${events.length}${C.reset}`);
  console.log(hr('═'));

  // --- Anomalies ---
  console.log('');
  console.log(`${C.bold}${C.yellow}  Anomalies${C.reset}`);
  console.log(hr());
  const anomalyKeys = Object.keys(anomalies);
  if (anomalyKeys.length === 0) {
    console.log(`  ${C.green}None detected${C.reset}`);
  } else {
    for (const type of anomalyKeys.sort()) {
      const a = anomalies[type];
      console.log(
        `  ${C.yellow}${type.padEnd(24)}${C.reset}` +
        ` count=${C.bold}${a.count}${C.reset}` +
        `  first=${formatTs(a.first)}  last=${formatTs(a.last)}`
      );
    }
  }

  // --- Module timing ---
  console.log('');
  console.log(`${C.bold}${C.cyan}  Module Timing${C.reset}`);
  console.log(hr());
  if (timings.length === 0) {
    console.log(`  ${C.grey}No module-entered events found${C.reset}`);
  } else {
    for (const t of timings) {
      const dur = t.durationSec !== null ? `${t.durationSec.toFixed(1)}s` : '(ongoing)';
      console.log(`  ${C.cyan}${(t.name ?? '?').padEnd(20)}${C.reset}  entered=${t.startTs}  spent=${dur}`);
    }
  }

  // --- Last 5 errors ---
  console.log('');
  console.log(`${C.bold}${C.red}  Last 5 Errors${C.reset}`);
  console.log(hr());
  const last5 = errors.slice(-5);
  if (last5.length === 0) {
    console.log(`  ${C.green}No errors recorded${C.reset}`);
  } else {
    for (const ev of last5) {
      const dataStr = JSON.stringify(ev.data).slice(0, 160);
      console.log(`  ${C.red}${formatTs(ev.wall)}${C.reset}  [${ev.category}]  ${dataStr}`);
    }
  }

  // --- Mark-bug events ---
  console.log('');
  console.log(`${C.bold}${C.yellow}  Mark-Bug Events${C.reset}`);
  console.log(hr());
  if (marks.length === 0) {
    console.log(`  ${C.grey}None${C.reset}`);
  } else {
    for (const ev of marks) {
      console.log(`  ${C.yellow}mark-bug #${ev.data?.counter ?? '?'}${C.reset}  at ${formatTs(ev.wall)}  mod=${ev.module}`);
    }
  }

  console.log('');
  console.log(hr('═'));
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const logFile = findNewestLog();
if (!logFile) {
  console.error(`${C.red}No session-*.ndjson files found in ${LOG_DIR}${C.reset}`);
  process.exit(1);
}

const events = parseEvents(logFile);
printReport(logFile, events);
