#!/usr/bin/env node
/**
 * @file scripts/check-budgets.mjs
 * @description Performance budget checker for the single Meta Quest 3 / 3S baseline.
 *
 *   Hard ceilings (fail verify):
 *     - Triangles: < 250,000 per worst-case scene state
 *     - Draw calls: < 180 per worst-case scene state
 *
 *   Working target (warn only): 60–70 % of the ceilings
 *     - Triangles: 150,000
 *     - Draw calls: 108
 *
 *   Every number is NOT measured on device. Refresh targets are 90 Hz with 72 Hz
 *   as the floor; the dynamic quality controller must still adapt at runtime.
 *
 * @usage node scripts/check-budgets.mjs
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUDGET_FILE = join(ROOT, 'reports', 'budget-data.json');

const BUDGET = {
  name: 'Meta Quest 3 / 3S baseline',
  maxTriangles: 250_000,
  maxDrawCalls: 180,
  workingTriangles: 150_000,
  workingDrawCalls: 108,
};

async function main() {
  console.log(`Checking scene budgets against: ${BUDGET.name}`);
  console.log('NOTE: ceilings are hard limits; the working target is a warning only.');
  console.log('NOTE: every number is NOT measured on device.');

  if (!existsSync(BUDGET_FILE)) {
    console.log('No budget-data.json found — skipping budget check (run e2e tests first).');
    process.exit(0);
  }

  const raw = await readFile(BUDGET_FILE, 'utf-8');
  const data = JSON.parse(raw);
  let failed = false;
  let warned = false;

  for (const [scene, record] of Object.entries(data)) {
    const states = record.states ?? { baseline: record };
    const samples = Object.entries(states);
    if (samples.length === 0) {
      console.error(`  ❌ No captured render states for scene: ${scene}`);
      failed = true;
      continue;
    }

    const worstCase = samples.reduce((worst, [state, metrics]) => ({
      state:
        metrics.triangles >= worst.metrics.triangles || metrics.drawCalls >= worst.metrics.drawCalls
          ? state
          : worst.state,
      metrics: {
        triangles: Math.max(worst.metrics.triangles, metrics.triangles),
        drawCalls: Math.max(worst.metrics.drawCalls, metrics.drawCalls),
      },
    }), { state: samples[0][0], metrics: samples[0][1] });

    const { triangles, drawCalls } = worstCase.metrics;
    const trianglesOk = triangles < BUDGET.maxTriangles;
    const drawCallsOk = drawCalls < BUDGET.maxDrawCalls;
    const overWorkingTarget =
      triangles >= BUDGET.workingTriangles || drawCalls >= BUDGET.workingDrawCalls;

    console.log(`\nScene: ${scene} (worst case across ${samples.length} captured state${samples.length === 1 ? '' : 's'})`);
    console.log(`  Triangles: ${triangles.toLocaleString()} / ${BUDGET.maxTriangles.toLocaleString()} — ${trianglesOk ? 'PASS' : 'OVER CEILING'}`);
    console.log(`  Draw calls: ${drawCalls} / ${BUDGET.maxDrawCalls} — ${drawCallsOk ? 'PASS' : 'OVER CEILING'}`);
    if (overWorkingTarget && trianglesOk && drawCallsOk) {
      console.log('  ⚠ Above the 60–70 % working target; tighten before adding more detail.');
      warned = true;
    }

    if (!trianglesOk || !drawCallsOk) {
      failed = true;
      console.error(`  ❌ Ceiling exceeded in scene: ${scene} (state: ${worstCase.state})`);
    }
  }

  if (failed) {
    console.error(`\nBudget check FAILED against ${BUDGET.name}.`);
    process.exit(1);
  }

  console.log(`\n✓ All scenes within the ${BUDGET.name} ceilings${warned ? ' (some above the working target)' : ''}.`);
  console.log('NOTE: Emulator measurements. Headset performance NOT verified on headset.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
