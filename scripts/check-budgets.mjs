#!/usr/bin/env node
/**
 * @file scripts/check-budgets.mjs
 * @description Performance budget checker — reads renderer.info values recorded
 *   during Playwright e2e runs and validates against Tier A (Quest 2 baseline)
 *   and Tier B (Quest 3/3S provisional) budgets.
 *   
 *   Tier A (Quest 2 baseline):
 *     - Triangles: < 100,000 per scene
 *     - Draw calls: < 100 per scene
 *     - Target FPS: 72 fps
 *   
 *   Tier B (Quest 3 / 3S provisional):
 *     - Triangles: < 250,000 per scene
 *     - Draw calls: < 180 per scene
 *     - Target FPS: 90/120 fps
 *     (Provisional - NOT measured on device)
 *
 * @usage node scripts/check-budgets.mjs [--tier A|B]
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUDGET_FILE = join(ROOT, 'reports', 'budget-data.json');

const BUDGET_TIERS = {
  A: {
    name: 'Tier A (Quest 2 Baseline)',
    triangles: 100_000,
    drawCalls: 100,
    targetFps: 72
  },
  B: {
    name: 'Tier B (Quest 3 / 3S Provisional)',
    triangles: 250_000,
    drawCalls: 180,
    targetFps: 90
  }
};

const targetTier = process.argv.includes('--tier') 
  ? process.argv[process.argv.indexOf('--tier') + 1]?.toUpperCase() || 'A' 
  : 'A';

const activeBudget = BUDGET_TIERS[targetTier] || BUDGET_TIERS.A;

async function main() {
  console.log(`Checking scene budgets against: ${activeBudget.name}`);

  if (!existsSync(BUDGET_FILE)) {
    console.log('No budget-data.json found — skipping budget check (run e2e tests first).');
    console.log('NOTE: Budget enforcement will be active once e2e tests generate budget-data.json');
    process.exit(0);
  }

  const raw = await readFile(BUDGET_FILE, 'utf-8');
  const data = JSON.parse(raw);
  let failed = false;

  for (const [scene, record] of Object.entries(data)) {
    const states = record.states ?? { baseline: record };
    const samples = Object.entries(states);
    if (samples.length === 0) {
      console.error(`  ❌ No captured render states for scene: ${scene}`);
      failed = true;
      continue;
    }
    const worstCase = samples.reduce((worst, [state, metrics]) => ({
      state: metrics.triangles >= worst.metrics.triangles || metrics.drawCalls >= worst.metrics.drawCalls ? state : worst.state,
      metrics: {
        triangles: Math.max(worst.metrics.triangles, metrics.triangles),
        drawCalls: Math.max(worst.metrics.drawCalls, metrics.drawCalls),
      },
    }), { state: samples[0][0], metrics: samples[0][1] });
    const { triangles, drawCalls } = worstCase.metrics;
    const tOk = triangles < activeBudget.triangles;
    const dOk = drawCalls < activeBudget.drawCalls;

    console.log(`\nScene: ${scene} (worst case across ${samples.length} captured state${samples.length === 1 ? '' : 's'})`);
    console.log(`  Triangles: ${triangles.toLocaleString()} / ${activeBudget.triangles.toLocaleString()} — ${tOk ? 'PASS' : 'OVER BUDGET'}`);
    console.log(`  Draw calls: ${drawCalls} / ${activeBudget.drawCalls} — ${dOk ? 'PASS' : 'OVER BUDGET'}`);

    if (!tOk || !dOk) {
      failed = true;
      console.error(`  ❌ Budget exceeded in scene: ${scene} (state: ${worstCase.state})`);
    }
  }

  if (failed) {
    console.error(`\nBudget check FAILED against ${activeBudget.name}.`);
    process.exit(1);
  } else {
    console.log(`\n✓ All scenes within ${activeBudget.name} budget.`);
    console.log('NOTE: Emulator measurements. Headset performance NOT verified on headset.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
