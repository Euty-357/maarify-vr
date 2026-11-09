#!/usr/bin/env node
/**
 * @file scripts/generate-report.mjs
 * @description Generates reports/latest.md and reports/history/<timestamp>.json
 *   from test results and budget data. Called at the end of npm run verify.
 * @usage node scripts/generate-report.mjs
 * @example node scripts/generate-report.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORTS_DIR = join(ROOT, 'reports');
const HISTORY_DIR = join(REPORTS_DIR, 'history');

function getGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return 'no-commit';
  }
}

async function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(await readFile(path, 'utf-8'));
}

async function main() {
  await mkdir(HISTORY_DIR, { recursive: true });

  const timestamp = new Date().toISOString();
  const commitHash = getGitHash();
  const budgetData = await readJsonSafe(join(REPORTS_DIR, 'budget-data.json'));
  const testResults = await readJsonSafe(join(REPORTS_DIR, 'test-results.json'));

  const report = {
    timestamp,
    commitHash,
    budgetData: budgetData ?? 'not generated (run e2e tests)',
    testResults: testResults ?? 'not generated',
    verificationLabels: {
      unit: 'verified by unit test',
      e2e: 'verified in Playwright/emulator',
      headset: 'NOT verified on headset — see docs/DEVICE_TEST_BACKLOG.md',
    },
    notes: [
      'All performance metrics are from emulator — NOT verified on headset.',
      'See docs/DEVICE_TEST_BACKLOG.md for headset-only test cases.',
    ],
  };

  // Write history entry
  const historyPath = join(HISTORY_DIR, `${timestamp.replace(/[:.]/g, '-')}.json`);
  await writeFile(historyPath, JSON.stringify(report, null, 2), 'utf-8');

  // Write latest.md
  const md = `# Maarify — Latest Verify Report
_Generated: ${timestamp}_
_Commit: ${commitHash}_

## Verification Labels
- Unit tests: **verified by unit test**
- E2E / Playwright: **verified in Playwright/emulator**
- Headset: **NOT verified on headset** — see [DEVICE_TEST_BACKLOG.md](../docs/DEVICE_TEST_BACKLOG.md)

## Budget Results
${budgetData
  ? Object.entries(budgetData).map(([scene, record]) => {
      const states = record.states ?? { baseline: record };
      const values = Object.values(states);
      const triangles = Math.max(...values.map((m) => m.triangles));
      const drawCalls = Math.max(...values.map((m) => m.drawCalls));
      return `- **${scene}:** worst-case triangles=${triangles}, drawCalls=${drawCalls} (${Object.keys(states).length} captured state(s))`;
    }).join('\n')
  : '_No budget data yet — run e2e tests to generate._'}

## Test Results
${testResults ? JSON.stringify(testResults, null, 2) : '_No test result data yet._'}

## Notes
- All emulator measurements are NOT verified on headset.
- See [docs/DEVICE_TEST_BACKLOG.md](../docs/DEVICE_TEST_BACKLOG.md) for headset-only test cases.

_History entry: ${historyPath}_
`;

  await writeFile(join(REPORTS_DIR, 'latest.md'), md, 'utf-8');
  console.log(`✓ Report written: reports/latest.md`);
  console.log(`✓ History entry: ${historyPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });

