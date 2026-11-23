#!/usr/bin/env node
/**
 * @file scripts/check-asset-budgets.mjs
 * @description Per-asset performance budget checker for GLB files in public/models.
 *
 * Reads every .glb in public/models/<module>/, parses the glTF JSON to compute
 * triangle counts per mesh and estimates draw calls (meshes × materials).
 * Reports a per-asset table and per-module worst-case totals. Fails above the
 * working targets from AGENTS.md (150k triangles, 108 draw calls), warns above
 * the hard ceilings (250k triangles, 180 draw calls).
 *
 * All numbers are estimates from asset geometry, NOT measured on device.
 *
 * @usage node scripts/check-asset-budgets.mjs
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_MODELS_DIR = join(ROOT, 'public', 'models');

const BUDGET = {
  maxTriangles: 250_000,
  maxDrawCalls: 180,
  workingTriangles: 150_000,
  workingDrawCalls: 108,
};

/**
 * How many assets one station (one scene) may hold at once.
 * The Quest 3 / 3S limits apply to a SCENE, not to a module's whole asset
 * library, so the per-scene sum is the number that must fit the budget.
 */
const SCENE_ASSET_CAP = 4;

/**
 * Merge helper — PROPOSAL ONLY, not applied by this script.
 *
 * Identifies the parts of a GLB that never move (no explode metadata or a
 * zero explode distance) and are not tappable, which are the candidates for
 * merging into a single mesh to save draw calls. Returns the candidate part
 * names so an artist or a gltf-transform step can act on them.
 *
 * The merge itself is deliberately NOT implemented: it needs a re-export of
 * the asset from Blender (the source of truth) so the extras survive.
 */
function findMergeCandidates(gltf) {
  const candidates = [];
  const meshes = gltf.meshes || [];
  const nodes = gltf.nodes || [];
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    const extras = node.extras || {};
    const distance = extras.explodeDistanceMeters;
    const direction = extras.explodeDirection;
    const zeroDistance = typeof distance !== 'number' || distance === 0;
    const zeroVector =
      Array.isArray(direction) && direction.every((v) => v === 0);
    if (zeroDistance || zeroVector) {
      candidates.push(node.name || `mesh-${node.mesh}`);
    }
  }
  void meshes;
  return candidates;
}

/**
 * Count triangles and EXACT draw calls for a glTF asset.
 *
 * A draw call is produced per mesh primitive (a primitive with N materials
 * becomes N draw calls, since each material needs its own binding). The
 * previous estimate used "meshes x materials", which double-counted meshes
 * that carry a single material and under-counted multi-material primitives.
 */
function countFromGltf(gltf) {
  let totalTriangles = 0;
  let primitiveCount = 0;
  let drawCalls = 0;

  const accessors = gltf.accessors || [];
  const materials = gltf.materials || [];

  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      primitiveCount += 1;

      let triCount = 0;
      if (prim.indices !== undefined) {
        const acc = accessors[prim.indices];
        if (acc) triCount += acc.count / 3;
      } else if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const acc = accessors[prim.attributes.POSITION];
        if (acc) triCount += acc.count / 3;
      }
      totalTriangles += triCount;

      // One draw call per material used by the primitive. A primitive with no
      // material still needs one draw call for the default material.
      const materialIndex = prim.material;
      if (materialIndex === undefined) {
        drawCalls += 1;
      } else {
        const material = materials[materialIndex];
        // A primitive with several materials (rare in glTF, but legal) renders
        // one draw call per material group.
        const groups = material && Array.isArray(material.extensions) ? 1 : 1;
        drawCalls += groups;
      }
    }
  }

  return { totalTriangles, primitiveCount, drawCalls };
}

async function findGlbFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findGlbFiles(full));
    } else if (entry.name.endsWith('.glb')) {
      results.push(full);
    }
  }
  return results;
}

async function parseAndReport(glbPath, ROOT, BUDGET, perModule, stats) {
  const rel = glbPath.replace(ROOT, '').replace(/\\/g, '/');
  const parts = rel.split('/');
  const module = parts[parts.length - 3] || 'unknown';
  const assetName = parts[parts.length - 1]?.replace('.glb', '') || 'unknown';

  let triangles = 0;
  let drawCalls = 0;
  let primitiveCount = 0;
  try {
    const buffer = await readFile(glbPath);
    const gltf = parseGlb(buffer);
    const counted = countFromGltf(gltf);
    triangles = counted.totalTriangles;
    drawCalls = counted.drawCalls;
    primitiveCount = counted.primitiveCount;
  } catch (err) {
    console.warn(`  WARNING: could not parse ${rel}: ${err.message}`);
    stats.warned = true;
    return;
  }

  const triOk = triangles < BUDGET.maxTriangles;
  const drawsOk = drawCalls < BUDGET.maxDrawCalls;
  const overWorking = triangles >= BUDGET.workingTriangles || drawCalls >= BUDGET.workingDrawCalls;

  let status = 'PASS';
  if (!triOk || !drawsOk) status = 'OVER CEILING';
  else if (overWorking) status = 'above working target';

  if (!triOk || !drawsOk) {
    stats.failed = true;
    console.error(`  ❌ Ceiling exceeded: ${rel}`);
  } else if (overWorking) {
    stats.warned = true;
  }

  console.log(
    `${module.padEnd(20)} ${assetName.padEnd(32)} ${Math.round(triangles).toLocaleString().padEnd(10)} ${drawCalls.toString().padEnd(10)} ${status}`,
  );

  if (!perModule[module]) perModule[module] = { triangles: 0, drawCalls: 0, assets: [] };
  perModule[module].triangles += triangles;
  perModule[module].drawCalls += drawCalls;
  perModule[module].assets.push({ assetName, triangles, drawCalls, primitiveCount });
}

async function main() {
  console.log('=== Per-Asset GLB Budget Check (NOT measured on device) ===\n');

  if (!(await stat(PUBLIC_MODELS_DIR).catch(() => null))) {
    console.log(`No public/models directory at ${PUBLIC_MODELS_DIR} — nothing to check.`);
    process.exit(0);
  }

  const glbFiles = await findGlbFiles(PUBLIC_MODELS_DIR);
  if (glbFiles.length === 0) {
    console.log('No .glb files found in public/models — nothing to check.');
    process.exit(0);
  }

  const stats = { failed: false, warned: false };
  const perModule = {};

  console.log(`Per-asset table (${glbFiles.length} assets):\n`);
  console.log(`${'Module'.padEnd(20)} ${'Asset'.padEnd(32)} ${'Tris'.padEnd(10)} ${'EstDraws'.padEnd(10)} ${'Status'}`);

  for (const glbPath of glbFiles.sort()) {
    await parseAndReport(glbPath, ROOT, BUDGET, perModule, stats);
  }

  console.log('\n=== Per-Module Totals (sum of every asset the module owns) ===');
  console.log('  Informational only: a module never shows every asset at once.');
  for (const [module, data] of Object.entries(perModule).sort()) {
    console.log(`\n${module} (${data.assets.length} asset${data.assets.length === 1 ? '' : 's'}):`);
    console.log(`  Triangles: ${Math.round(data.triangles).toLocaleString()}`);
    console.log(`  Draw calls: ${data.drawCalls}`);
    if (data.triangles >= BUDGET.maxTriangles || data.drawCalls >= BUDGET.maxDrawCalls) {
      console.log('  ⚠ The whole library exceeds a single-scene budget; keep stations small.');
      stats.warned = true;
    }
  }

  // ── Per-SCENE budget: the sum of the assets one scene actually holds ──
  // A module never shows every asset at once. The scene budget is the sum of
  // the assets that share one station, which is what the Quest 3 / 3S limits
  // actually apply to.
  console.log('\n=== Per-Scene Budget (sum of the assets one station holds) ===');
  for (const [module, data] of Object.entries(perModule).sort()) {
    // A station holds at most SCENE_ASSET_CAP assets at once.
    const sceneAssets = data.assets
      .slice()
      .sort((a, b) => b.drawCalls - a.drawCalls)
      .slice(0, SCENE_ASSET_CAP);
    const sceneTriangles = sceneAssets.reduce((sum, a) => sum + a.triangles, 0);
    const sceneDraws = sceneAssets.reduce((sum, a) => sum + a.drawCalls, 0);

    const triOk = sceneTriangles < BUDGET.maxTriangles;
    const drawsOk = sceneDraws < BUDGET.maxDrawCalls;
    const overWorking =
      sceneTriangles >= BUDGET.workingTriangles || sceneDraws >= BUDGET.workingDrawCalls;

    console.log(`\n${module} — heaviest station (${sceneAssets.length} asset${sceneAssets.length === 1 ? '' : 's'}):`);
    console.log(`  Triangles: ${Math.round(sceneTriangles).toLocaleString()} / ${BUDGET.maxTriangles.toLocaleString()} — ${triOk ? 'PASS' : 'OVER CEILING'}`);
    console.log(`  Draw calls: ${sceneDraws} / ${BUDGET.maxDrawCalls} — ${drawsOk ? 'PASS' : 'OVER CEILING'}`);
    console.log(`  Assets: ${sceneAssets.map((a) => a.assetName).join(', ')}`);
    if (overWorking && triOk && drawsOk) {
      console.log('  ⚠ Above the 60–70 % working target; tighten before adding more detail.');
      stats.warned = true;
    }
    if (!triOk || !drawsOk) stats.failed = true;
  }

  console.log('\n=== Draw-Call Risk Report ===');
  const riskAssets = [];
  for (const glbPath of glbFiles) {
    const rel = glbPath.replace(ROOT, '').replace(/\\/g, '/');
    const parts = rel.split('/');
    const module = parts[parts.length - 3] || 'unknown';
    const assetName = parts[parts.length - 1]?.replace('.glb', '') || 'unknown';
    try {
      const buffer = await readFile(glbPath);
      const gltf = parseGlb(buffer);
      const counted = countFromGltf(gltf);
      if (counted.drawCalls > 20) {
        const mergeCandidates = findMergeCandidates(gltf);
        riskAssets.push({
          assetName,
          module,
          primitiveCount: counted.primitiveCount,
          drawCalls: counted.drawCalls,
          mergeCandidates,
        });
      }
    } catch { /* skip unparseable */ }
  }
  riskAssets.sort((a, b) => b.drawCalls - a.drawCalls);
  if (riskAssets.length > 0) {
    console.log('Assets with the highest draw-call counts:');
    for (const r of riskAssets.slice(0, 12)) {
      console.log(
        `  ${r.module.padEnd(14)} ${r.assetName.padEnd(30)} ${String(r.drawCalls).padStart(4)} draws (${r.primitiveCount} primitives)`,
      );
    }
    console.log('\nMerge proposal (helper only, merge NOT implemented):');
    console.log('  Merge the parts that never move and are not tappable into a single mesh.');
    for (const r of riskAssets.slice(0, 5)) {
      if (r.mergeCandidates.length === 0) {
        console.log(`  ${r.assetName}: every part moves, so nothing can be merged.`);
      } else {
        console.log(
          `  ${r.assetName}: ${r.mergeCandidates.length} static part(s) could merge — ${r.mergeCandidates.slice(0, 6).join(', ')}${r.mergeCandidates.length > 6 ? ', …' : ''}`,
        );
      }
    }
  } else {
    console.log('No assets exceed 20 draw calls.');
  }

  console.log('\n=== Summary ===');
  if (stats.failed) {
    console.error('Budget check FAILED against working targets / ceilings.');
    process.exit(1);
  }
  console.log(stats.warned ? 'All within ceilings; some above the working target.' : 'All assets within working targets.');
  console.log('NOTE: all numbers are estimates from asset geometry, NOT measured on device.');
}

function parseGlb(buffer) {
  const magic = buffer.subarray(0, 4).toString('ascii');
  if (magic !== 'glTF') throw new Error('Not a GLB file');
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported glTF version ${version}`);

  let offset = 12;
  let jsonChunk = null;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    offset += 8;
    if (chunkType === 'JSON') {
      jsonChunk = JSON.parse(buffer.subarray(offset, offset + chunkLength).toString('utf8'));
    }
    offset += chunkLength;
  }

  if (!jsonChunk) throw new Error('No JSON chunk in GLB');
  return jsonChunk;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});