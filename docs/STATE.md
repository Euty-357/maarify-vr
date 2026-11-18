# STATE.md — Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** Phase 4 Module Polish & Cross-Cutting Verification — Complete across Tasks 1–34
- **Milestone:** All 34 polish tasks implemented. Ready for headset verification on Meta Quest 3 / Quest 3S.

## What We Have Done (Recent Sessions & Tasks 1–34)
1. **Information System V3 Implemented (`src/core/info-system/` & `src/core/ui/`):**
   - Engraved brass placards replace floating "i" spheres.
   - Folio auto-positions 0.4–0.8 m on the user-facing side, never inside geometry or user's face.
   - Three depth tier tabs (Foundation, Advanced, Expert), page arrows, grab handle, close button, pin.
   - Auto-closes when walking away (>2.5 m); one open panel per area.
2. **Hub Upgrades:**
   - Floor crest inlay and portal previews (curved portal ring, readable at 3.5 m).
   - Return gate and exit lectern functional; brand plaque updated.
3. **Cosmos Module Upgrades:**
   - Replaced pink placeholder with relativistic jet cones (blue/white), AGN torus disc, and compact core (`src/modules/cosmos/quasar.ts`).
   - Sgr A* black hole shader with Einstein ring, photon sphere, and Doppler-boosted accretion disc (`src/modules/cosmos/black-hole-shader.ts`).
   - Diegetic navigation console with real speed readouts (`src/modules/cosmos/nav-console.ts`).
   - TRAPPIST-1 7-planet orbital zone.
4. **Medicine Module Upgrades:**
   - All 6 hospital wings accessible and populated with 3D exhibits: Heart (ECG & valves), Brain (lobes & synapse), Spine (C1–S column & herniated disc), Cancer (cell cycle & CAR-T), HIV (virion & ART bench), Infection Prevention (chain of infection & PPE rack).
   - Pulsatile blood flow pipeline with realistic RBC deformation (`src/modules/human-body/blood-flow.ts`).
5. **Quantum Module Upgrades:**
   - Cryogenic lab shell with engraved temperature plates (50K, 4K, 800mK, 100mK, 15mK) and grab-triggered folios.
   - Bloch sphere with 6 state labels and 1.5 m proximity folio; `computeCircuitState` pure function wired to live circuit readout.
   - H, X, Z, CNOT gate tokens with onGrab tooltips; hardware gallery with topological caveat.
   - Walkable boundary $\pm 5\text{ m}$.
6. **Aerospace Module Upgrades:**
   - Hangar expanded to $15 \times 10 \times 6\text{ m}$ with concrete floor, industrial lighting, and clearly separated zones ($x = -5$ aircraft, $x = +5$ engines, $z = -4$ wind tunnel).
   - General-aviation aircraft + helicopter model with collective lever and spatial labels.
   - 3 engine stands (Raptor-class FFSC Methalox, Hydrolox Staged Combustion, SRM) with orange/cyan propellant lines, throttle, explode levers, and Isp readouts.
   - Wind tunnel upgraded with `LineSegments` vertex-colored streamlines (blue/white/red gradient), Mach readout, and stall indicator.
   - Fixed pointer raycast sticking to engine base collider in desktop AND VR controller ray loops (`isIgnoredExplodableBase`).
   - Walkable boundary $\pm 7.5\text{ m} \times \pm 5\text{ m}$.
7. **Cross-Cutting Property & Unit Tests:**
   - 34 unit test suites (189 tests) passing cleanly.
   - Property tests: `walkable.property.test.ts`, `travel.property.test.ts`, `load-gen.property.test.ts`, `info-system.property.test.ts`, `mission.property.test.ts`.
8. **Hygiene & Git Hygiene:**
   - Updated `.gitignore` (.kiro/, MAARIFY_KQ_AUDIT.md, *.mp4, *.mov, reports/*.log, *.tmp, *.bak).
   - Updated `scripts/check-hygiene.mjs` to ignore clips/history/.kiro. Hygiene check PASSED.
   - Cleaned up stale CLI dump logs in `reports/` and 0-byte logs in `logs/`.
   - TypeScript compilation: `npm run typecheck` passes with 0 errors.

## Current State
- All code changes are in the working tree (uncommitted per user instruction).
- Manual headset verification checkpoints (Tasks 9, 13, 18, 23, 30) deferred to user device testing.

## Next Steps (Headset Testing)
1. Run `npm run quest` (or `npm run quest:wifi`) and test on Meta Quest 3 / Quest 3S via Quest Browser.
2. Complete Device Test Backlog items DT-021 through DT-025.
3. Verify performance budget on headset with OVR Metrics Tool (<250k tris, <180 draw calls, 90 Hz target).
4. Stage and commit when instructed.

## Blockers
- None. All Quest 3/3S performance and visual feel numbers remain strictly **NOT verified on headset**.

## Last Green Commit
- `e187ff6` (working tree contains uncommitted polish implementation).
