---
name: module-authoring
description: >
  ModuleDefinition contract, module folder template, and the per-module "done" checklist.
  Load when creating or auditing a module.
---

# Module Authoring Skill

## ModuleDefinition Contract
```ts
// src/modules/<name>/index.ts
export interface ModuleDefinition {
  id: string;                      // e.g. 'cosmos'
  displayName: string;
  description: string;             // ≤ 80 characters
  estimatedMinutes: [number, number]; // [min, max] e.g. [10, 20]
  thumbnail: string;               // path to KTX2 thumbnail
  load(): Promise<THREE.Object3D>; // returns scene root
  unload(): void;                  // disposes all resources
  getChallenges(): ChallengeDefinition[];
  getInfoCards(): InfoCardContent[];
}
```
Modules export a `ModuleDefinition` and nothing else visible to other modules.
Modules **never import from other modules** (`src/modules/<other>`).
Core systems imported from `src/core/` only.

## Module Folder Structure
```
src/modules/<name>/
  index.ts          # ModuleDefinition export
  scene.ts          # Three.js scene graph construction
  challenges.ts     # ChallengeDefinition array
  info-cards.ts     # InfoCardContent array
  SOURCES.md        # All factual sources for this module
  SPEC.md           # (in docs/modules/<name>/) — planning doc
```

## Per-Module "Done" Checklist
- [ ] All learning objectives met (per SPEC.md)
- [ ] All beat-timeline sections implemented
- [ ] All info cards written (level1 ≤ 40 words, level2 for all 3 tiers)
- [ ] All sources cited in SOURCES.md (no unverified factual claims)
- [ ] ≥ 3 challenges + capstone, all seated-completable
- [ ] "Where this is going" panel
- [ ] VR mode and flat desktop fallback working
- [ ] `npm run verify` green
- [ ] Playwright autopilot test passes (all cards reached, all challenges completed)
- [ ] `science-medical-reviewer` signed off (read-only)
- [ ] `comfort-accessibility-reviewer` signed off (read-only)
- [ ] Performance within budget (checked via `renderer.info`)
- [ ] Device-only test cases added to `docs/DEVICE_TEST_BACKLOG.md`
- [ ] Committed with conventional commit message
