#!/usr/bin/env node
/**
 * @file scripts/audit-missions.mjs
 * @description Audits every module's course missions. Fails when a mission lacks
 *   a hint ladder, a success predicate, a debrief, per-tier outcomes, sources,
 *   or a seated / reduced-motion variant.
 *
 * Also reports the counts used by the module spec: missions, hints, tiers,
 * and placards (panel refs).
 *
 * @usage node scripts/audit-missions.mjs
 * @usage node scripts/audit-missions.mjs --enforce
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MODULES_DIR = join(ROOT, 'src', 'modules');

const enforce = process.argv.includes('--enforce');
const TIERS = ['foundation', 'advanced', 'expert'];

async function findMissionFiles(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...await findMissionFiles(full));
    } else if (entry.name === 'missions.ts') {
      found.push(full);
    }
  }
  return found;
}

/**
 * Extract the mission objects from a missions.ts source file without executing
 * TypeScript. The file follows a strict shape, so a targeted scan is enough:
 * every `id: '...'` at the top level of the array is a mission id, and the
 * source text around it tells us which fields are present.
 */
function auditSource(source, file) {
  const problems = [];
  const markers = [...source.matchAll(/^\s{4}id: '([^']+)',$/gm)];

  if (markers.length === 0) {
    problems.push(`${file}: no missions found`);
    return { problems, stats: { missions: 0, hints: 0, tiers: 0, placards: 0 } };
  }

  // Split the source into per-mission chunks using the 4-space `id:` markers.
  const chunks = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : source.length;
    chunks.push({ id: markers[i][1], text: source.slice(start, end) });
  }

  let hintTotal = 0;
  let placardTotal = 0;
  let tierTotal = 0;

  for (const chunk of chunks) {
    const where = `${file}: ${chunk.id}`;

    // Hint ladder: exactly three string entries in the `hints:` array.
    const hintsMatch = chunk.text.match(/hints:\s*\[([\s\S]*?)\],/);
    if (!hintsMatch) {
      problems.push(`${where}: missing hint ladder`);
    } else {
      const hintCount = (hintsMatch[1].match(/'/g) ?? []).length / 2;
      hintTotal += hintCount;
      if (hintCount !== 3) {
        problems.push(`${where}: hint ladder must have exactly 3 levels, found ${hintCount}`);
      }
    }

    // Success predicate and tolerance.
    if (!/successPredicate:\s*\(/.test(chunk.text)) {
      problems.push(`${where}: missing success predicate`);
    }
    if (!/tolerance:\s*-?\d/.test(chunk.text)) {
      problems.push(`${where}: missing numeric tolerance`);
    }

    // Debrief / feedback.
    const feedbackMatch = chunk.text.match(/feedback:\s*\{([\s\S]*?)\n\s{4}\},/);
    if (!feedbackMatch) {
      problems.push(`${where}: missing debrief feedback`);
    } else {
      for (const key of ['success', 'nearMiss', 'wrong']) {
        if (!new RegExp(`${key}:\\s*'`).test(feedbackMatch[1])) {
          problems.push(`${where}: missing ${key} debrief`);
        }
      }
    }

    // Per-tier outcomes that all differ.
    const outcomesMatch = chunk.text.match(/outcomes:\s*\{([\s\S]*?)\n\s{4}\},/);
    if (!outcomesMatch) {
      problems.push(`${where}: missing tier outcomes`);
    } else {
      const texts = [];
      for (const tier of TIERS) {
        const tierMatch = outcomesMatch[1].match(new RegExp(`${tier}:\\s*\\n?\\s*'([^']*)'`));
        if (!tierMatch) {
          problems.push(`${where}: missing ${tier} outcome`);
        } else {
          texts.push(tierMatch[1]);
        }
      }
      tierTotal += texts.length;
      if (texts.length === 3 && new Set(texts).size !== 3) {
        problems.push(`${where}: tier outcomes must all differ from each other`);
      }
    }

    // Sources.
    const sourcesMatch = chunk.text.match(/sources:\s*\[([^\]]*)\]/);
    if (!sourcesMatch || sourcesMatch[1].trim().length === 0) {
      problems.push(`${where}: has no source ids`);
    }

    // Accessibility variants.
    if (!/seatedVariant:\s*'/.test(chunk.text)) {
      problems.push(`${where}: missing seated variant`);
    }
    if (!/reducedMotionVariant:\s*'/.test(chunk.text)) {
      problems.push(`${where}: missing reduced-motion variant`);
    }

    // Placards (panel refs).
    const panelMatch = chunk.text.match(/panelRefs:\s*\[([^\]]*)\]/);
    if (panelMatch) {
      const count = (panelMatch[1].match(/'/g) ?? []).length / 2;
      placardTotal += count;
    }

    // Steps with captions and predicates.
    if (!/caption:\s*'/.test(chunk.text)) {
      problems.push(`${where}: step has no caption`);
    }
    if (!/completed:\s*\(/.test(chunk.text)) {
      problems.push(`${where}: step has no completion predicate`);
    }
  }

  return {
    problems,
    stats: { missions: chunks.length, hints: hintTotal, tiers: tierTotal, placards: placardTotal },
  };
}

async function main() {
  console.log('=== Course Mission Audit ===\n');

  const files = await findMissionFiles(MODULES_DIR);
  if (files.length === 0) {
    console.log('No missions.ts files found — nothing to audit.');
    if (enforce) process.exit(1);
    return;
  }

  const allProblems = [];
  let totalMissions = 0;
  let totalHints = 0;
  let totalPlacards = 0;

  console.log(`${'Module'.padEnd(18)} ${'Missions'.padEnd(10)} ${'Hints'.padEnd(8)} ${'Tiers'.padEnd(8)} Placards`);
  console.log('-'.repeat(60));

  for (const file of files.sort()) {
    const source = await readFile(file, 'utf8');
    const relative = file.replace(ROOT, '').replace(/\\/g, '/');
    const moduleName = relative.split('/')[3] ?? relative;
    const { problems, stats } = auditSource(source, relative);

    allProblems.push(...problems);
    totalMissions += stats.missions;
    totalHints += stats.hints;
    totalPlacards += stats.placards;

    console.log(
      `${moduleName.padEnd(18)} ${String(stats.missions).padEnd(10)} ${String(stats.hints).padEnd(8)} ${String(stats.tiers).padEnd(8)} ${stats.placards}`,
    );
  }

  console.log(`\nTotals: ${totalMissions} missions, ${totalHints} hints, ${totalPlacards} placards.`);

  if (allProblems.length > 0) {
    console.error(`\n${allProblems.length} problem(s) found:`);
    for (const problem of allProblems) {
      console.error(`  ❌ ${problem}`);
    }
    if (enforce) {
      console.error('\nMission audit FAILED.');
      process.exit(1);
    }
    console.log('\nMission audit found problems (report only; run with --enforce to fail).');
    return;
  }

  console.log('\n✓ Every mission has a hint ladder, a success predicate, a debrief, tier outcomes, sources, and accessibility variants.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
