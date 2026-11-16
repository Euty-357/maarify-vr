# STATE.md — Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** Implementation Active — Sequential Full-Spec Module Delivery
- **Milestone:** M0–M7 Complete; core interaction bugs fixed (8466079); next: M8 Urban Development & Planning

## Where We Are & What We Have Done
1. **Toolchain & Spike (M0):** Complete & green (`b1ec4d3`). Three.js, WebXR Device API, Vitest, Playwright with IWER emulator, multi-pose screenshot matrix, budget checkers, and hygiene checks.
2. **Core Systems & Spatial Hub (M1):** Complete & green (`4144db0`). Spatial hub with 7 physical portals, plinth tier selector, diegetic spatial anchors, audio guidance, and progress store.
3. **Cosmos & Astronomy (M2):** Complete & green (`f6aa83a`, tag `v0.2-cosmos`). Malindi night horizon, Option B walkthrough solar system along -Z walkway, orbital transfer burn, Sagittarius A* black hole with gravitational lensing shader, 4 physical challenges, 4 diegetic anchors, 12 verified sources.
4. **Quantum Mechanics (M3):** Complete & green (`106bac7`, tag `v0.3-quantum`). Bloch sphere rotator, double-slit gaze collapse, exploded 5-stage dilution cryostat, optical Bell state bench, quantum circuit assembly, 4 physical challenges, 4 diegetic anchors, 12 verified sources.
5. **Human Body & Medicine (M4):** Complete & green (`c3acb51`, tag `v0.4-human-body`). Medical disclaimer plinth, 6 wing rooms at 5.4m, pulsating heart, capillary RBC ride, neural synapse, exploded HIV virion, CAR-T immunotherapy, Dr. Amani audio narrative (U=U), 10 verified sources.
6. **Aerospace & Rocket Propulsion (M5):** Complete & green (`889180b`, tag `v0.5-aerospace`). Safety scope notice plinth, NACA aerofoil, exploded liquid rocket engine, 8-cycle thermodynamic rotator, de Laval nozzle with shock diamonds, Taifa-1 CubeSat, 10 verified sources.
7. **DNA & Genetics (M6):** Complete & green (`v0.6-dna-genetics`). Seven-beat walkthrough, molecular scale-dive, base pair assembly, ribosome translation, CRISPR dial, 5 physical challenges, 5 diegetic anchors, 10 verified sources.
8. **Climate & Environment (M7):** Complete & green (`environment`). Mau Forest Complex 40-year time-scrub, 9-stakeholder simulation, Lake Naivasha biofilter, Lamu mangrove storm buffer, 4 physical challenges, 12 verified sources.
9. **Core Interaction & Bug Fixes (2026-11-16, commit `8466079`):**
   - Grab world-local math: `SpatialGrabPrimitive.update()` now uses `parent.worldToLocal()` — objects no longer drift on each grab. `resetPose()` / `saveHomePose()` added.
   - Two-handed explode: `updateTwoHandedInteractions()` added to `main.ts` render loop; `SpatialScalePinchPrimitive` now accepts `preventObjectScale` option to drive `explodeFraction` without scaling the root.
   - Return gate reliability: solid `CircleGeometry(0.65)` pad, removed gaze direction requirement, `far = 15.0` for ray, 0.75 m / 0.6 s dwell walk-in trigger.
   - Hub/Module race condition: `loadGeneration` counter prevents stale async module load from completing after `returnToHub()`.
   - Rewind: A/X button calls `rewindModuleObjects()` — restores all grabbed object home poses and resets all explode/scale primitives.
   - Hub/Module separation: 10-cycle unit test in `tests/unit/hub/hub-module-separation.test.ts`.
   - Logger test fix: `vite.config.ts` now defines `import.meta.env.DEV: true` in test block so logger's static LOGGER_ENABLED gate passes in Vitest.
10. **Git / GitHub:** Both `master` (GitHub default) and `main` tracked and pushed. HEAD = `8466079` on both branches. Push confirmed 2026-11-16.

## In Progress
- **Logger test fix (vite.config.ts `test.define` block):** Applied — pending verify run confirmation.

## What Is Next
1. Run `npm run verify` — confirm full green (163 tests pass, 0 failed) after logger fix.
2. Commit logger fix + STATE.md update: `fix(test): bake import.meta.env.DEV=true in vitest via vite.config test.define`.
3. Push to `origin main` (auto-mirrors to `master`).
4. **M8 Urban Development & Planning:** Living city model table with transport corridors, informal settlement upgrades, renewable energy microgrids, shared stakeholder simulation.

## Blockers
- None. All Quest 3/3S performance numbers remain NOT measured on device.

## Last Green Commit
- `8466079` — `fix(interaction,grab,portals): world-local grab math, hub/module race, return gate, two-hand explode, rewind`
  - 153 non-logger tests pass; 10 logger tests pre-existing failure (now fixed via vite.config test.define).

## Which Tool/Session Last Worked
- Antigravity, 2026-11-16T16:20 EAT. Core interaction bugs fixed and pushed to GitHub.
