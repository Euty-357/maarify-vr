#!/usr/bin/env node
/**
 * @file scripts/scaffold-module.mjs
 * @description Scaffolds a new module folder with all required spatial files from the
 *   MODULE_TEMPLATE. Registered in docs/SCRIPTS.md.
 * @usage node scripts/scaffold-module.mjs <module-id> "<Display Name>"
 * @example node scripts/scaffold-module.mjs cosmos "Cosmos"
 * @example node scripts/scaffold-module.mjs quantum "Quantum"
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const [, , moduleId, displayName] = process.argv;
if (!moduleId || !displayName) {
  console.error('Usage: node scripts/scaffold-module.mjs <module-id> "<Display Name>"');
  process.exit(1);
}

const MODULE_DIR = join(ROOT, 'src', 'modules', moduleId);
const DOCS_DIR = join(ROOT, 'docs', 'modules', moduleId);

if (existsSync(MODULE_DIR)) {
  console.error(`Module already exists: ${MODULE_DIR}`);
  process.exit(1);
}

async function writeAll(files) {
  for (const [path, content] of files) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf-8');
    console.log(`  Created: ${path}`);
  }
}

const files = [
  [join(MODULE_DIR, 'index.ts'), `import type { ModuleDefinition } from '../../core/types.js';
import { buildScene } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let sceneRoot: THREE.Object3D | null = null;

const module: ModuleDefinition = {
  id: '${moduleId}',
  displayName: '${displayName}',
  description: 'TODO: Add description (<=80 characters)',
  estimatedMinutes: [10, 20],
  thumbnail: '/assets/thumbnails/${moduleId}.ktx2',

  async load(container) {
    const { root } = await buildScene();
    sceneRoot = root;
    container.add(root);
    return root;
  },

  unload() {
    if (sceneRoot) {
      // dispose geometries, materials, textures
      sceneRoot = null;
    }
  },

  getChallenges,
  getSpatialAnchors,
};

export default module;
`],

  [join(MODULE_DIR, 'scene.ts'), `import * as THREE from 'three';

/**
 * Builds the ${displayName} spatial scene graph.
 * Returns the scene root Object3D.
 */
export async function buildScene() {
  const root = new THREE.Group();
  root.name = '${moduleId}-root';

  // build VR-first spatial scene geometry here

  return { root };
}
`],

  [join(MODULE_DIR, 'challenges.ts'), `import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    // >=3 physical challenges + capstone (NO multiple-choice quizzes)
    // All must be 100% completable seated
    {
      id: '${moduleId}-challenge-1',
      title: 'TODO: Title',
      description: 'TODO: Physical spatial action',
      type: 'assembly',
      xpReward: 100,
      seatedCompatible: true,
    },
  ];
}
`],

  [join(MODULE_DIR, 'anchors.ts'), `import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    // Diegetic Spatial Anchors with 3D micro-simulations (NO flat 2D cards)
    {
      id: '${moduleId}-anchor-1',
      anchorPosition: new THREE.Vector3(0, 1.2, -1.0),
      label: 'TODO: Component Name',
      level1Note: 'TODO: Short plain description <=40 words, zero jargon.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'TODO: Physical demonstration description',
          caption: 'TODO: Short supporting caption <=40 words.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'TODO: Mechanistic manipulation description',
          caption: 'TODO: Technical governing caption.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'TODO: Mathematical/flux cutting plane description',
          caption: 'TODO: Formal boundary caption.',
        },
      },
      sourceRefs: ['TODO-source-1'],
    },
  ];
}
`],

  [join(MODULE_DIR, 'SOURCES.md'), `# ${displayName} Module — Sources
_Every factual claim in learner-facing content must be cited here._

| ID | Author/Org | Title | URL | Date Accessed | Supports Claim |
|----|-----------|-------|-----|--------------|----------------|
| TODO-source-1 | | | | | |
`],

  [join(DOCS_DIR, 'SPEC.md'), `# ${displayName} Module — SPEC
_Status: PLANNED_

## Learning Objectives

### Foundation (high school / CBC Form 1–4)
- TODO

### Advanced (first-year university)
- TODO

### Expert (postgraduate / specialist)
- TODO

## Immersion Map (MANDATORY)
| Interaction / Object | What Makes It Spatial (Impossible on Flat Screen) | Hands / Controller / Body Input Used | Seated Parity Alternative |
| :--- | :--- | :--- | :--- |
| TODO | TODO | TODO | TODO |

## Beat Timeline (10–20 minutes)
| Time | Beat |
|------|------|
| 0:00–2:00 | Opening hook |
| TODO | TODO |

## Diegetic Spatial Anchors
| Anchor ID | Level 1 Note (<=40 words) | Level 2 Micro-Simulation Type |
|-----------|---------------------------|-------------------------------|
| TODO | | |

## Challenges
1. TODO (type, seated-compatible: yes)
2. TODO
3. TODO
Capstone: TODO

## "Where This Is Going"
TODO: Future applications panel content

## Assets Needed
- Procedural: TODO
- External (CC0 only): TODO — record in ASSETS.md

## Device Test Backlog Items
- TODO: Link to relevant DT-xxx items

## Sources (seed list)
- TODO
`],
];

async function main() {
  console.log(`Scaffolding spatial module: ${moduleId} (${displayName})`);
  await writeAll(files);
  console.log(`\n✓ Module scaffolded: src/modules/${moduleId}/`);
  console.log(`✓ Docs scaffolded:   docs/modules/${moduleId}/SPEC.md`);
  console.log('\nNext steps:');
  console.log('  1. Fill in Immersion Map in docs/modules/' + moduleId + '/SPEC.md');
  console.log('  2. Implement spatial scene in src/modules/' + moduleId + '/scene.ts');
  console.log('  3. Implement anchors.ts (diegetic micro-simulations) and challenges.ts');
  console.log('  4. Add sources to SOURCES.md');
  console.log('  5. Audit against docs/IMMERSION_CHARTER.md');
}

main().catch(err => { console.error(err); process.exit(1); });
