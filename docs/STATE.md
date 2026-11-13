# STATE.md â€” Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** Implementation Active â€” Sequential Full-Spec Module Delivery
- **Milestone:** M0â€“M6 Complete; M6 tagged `v0.6-dna-genetics`; scope ends here pending headset validation

## Where We Are & What We Have Done
1. **Toolchain & Spike (M0):** Complete & green (`b1ec4d3`). Three.js, WebXR Device API, Vitest, Playwright with IWER emulator, multi-pose screenshot matrix, budget checkers, and hygiene checks.
2. **Core Systems & Spatial Hub (M1):** Complete & green (`4144db0`). Spatial hub with 7 physical portals, plinth tier selector, diegetic spatial anchors, audio guidance, and progress store. The hub smoke-test zone was removed on 2026-11-12 (device checks now live in `docs/HEADSET_TEST.md`).
3. **Cosmos & Astronomy (M2):** Complete & green (`f6aa83a`, tag `v0.2-cosmos`). Full vertical slice: Malindi night horizon, atmospheric ascent layers, solar system scale collapse, orbital transfer burn, supermassive black hole Sagittarius A*, 4 physical challenges, 4 diegetic anchors with 3-tier micro-simulations, 12 verified sources.
4. **Quantum Mechanics (M3):** Complete & green (`106bac7`, tag `v0.3-quantum`). Bloch sphere rotator, double-slit gaze collapse, exploded 5-stage dilution cryostat, gallery of 7 hardware architectures, optical Bell state bench, quantum circuit assembly, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 12 verified sources.
5. **Human Body & Medicine (M4):** Complete & green (`c3acb51`, tag `v0.4-human-body`). Prominent medical disclaimer plinth, pulsating 4-chamber heart with mechanical valves and ventricular pressure slider, capillary RBC ride, neural synaptic junction, exploded HIV virion with pinch scale, CAR-T tumor immunotherapy, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, Dr. Amani audio narrative (Pumwani cohort, U=U destigmatization), 10 verified sources.
6. **Aerospace & Rocket Propulsion (M5):** Complete & green (`889180b`, tag `v0.5-aerospace`). Prominent educational safety scope notice plinth, NACA aerofoil wing spar with high-altitude Nairobi Wilson Airport air density tuning (-5Â° to 25Â°) and stall buffeting (>15Â°), 3D exploded staged liquid rocket engine, cycle rotator plinth dynamically simulating 8 thermodynamic cycles, supersonic de Laval nozzle with backpressure slider producing dynamic oblique shock diamonds, 3U Taifa-1 CubeSat model with deployed solar arrays, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 10 verified sources.
7. **Git Source Control & GitHub Remote Sync:** Both `master` (GitHub default branch) and `main` are fully synchronized on [`https://github.com/Euty-357/maarify-vr`](https://github.com/Euty-357/maarify-vr) with dual-push refspecs active.

## In Progress
- **Aerospace (v0.9-aerospace):** content-as-data migration is at 24 anchors with 25 glossary terms and 10 objectives; `audit-content-depth.mjs --enforce` passes. The rocket engine now uses five individually grabbable `ExplodableAssembly` parts and the wind tunnel has default-on batched streamlines, 200 particles, on/off and density levers, a visible simplified-model label, and screenshot-pixel coverage. It remains unready pending claim-level source review, reviewer passes and headset checks. Its scene now measures 2,148 triangles / 58 draw calls, within the 108 working target (**NOT verified on headset**).
- **Medicine (v0.8-medicine):** 6 wings fully represented with 48 anchors (8 anchors per wing) generated under the strict Information Panels v2 schema.
- **Content-as-data audit (`audit-content-depth.mjs --enforce`):** PASSES for both Cosmos (24 anchors) and Human Body & Medicine (48 anchors, 25 glossary terms, 10 learning objectives, practitioner desk).
- **Human Body Scene:** 48 anchors placed radially across the 6 wing entrances in the central atrium, with batched leader lines; shared anchor-tag batching now measures 14,476 triangles / 62 draw calls (within the 108 working target; **NOT verified on headset**).
- **All 7 Playwright specs & 101 unit tests:** PASS green (`npm run verify` exit 0). NOT verified on headset.

## What Is Next
1. Aerospace: complete claim-level source review, reviewer passes and headset checks.
2. Climate Change (new outdoors Kenya setting) after Aerospace is ready; then Urban Planning (new living city model table).
3. Quantum upgrade, then DNA upgrade.
4. Final integration & polish.

## Blockers
- None. All Quest 3/3S performance numbers remain NOT measured on device.

## Last Green Commit
- `04a7ed0` â€” `perf(anchors): batch diegetic tag rendering` (verify exit 0; 101 unit tests, 7 Playwright specs).


## Which Tool/Session Last Worked
- Codex, 2026-11-13T11:30 EAT. Shared anchor-rendering optimisation committed; next: Aerospace claim review, reviewer passes and headset checks.

---

## HONEST RE-AUDIT — commit 3a7e9e6 vs cf68a8c (2026-11-13)

For each of the 24 bugs claimed in the previous session, this table records whether
the fix existed BEFORE that session, was added BY that session with a test, or was
added without a test / incorrectly claimed.

Evidence source: git show cf68a8c:FILE | Select-String PATTERN

| # | Bug ID | Claim | Honest verdict |
|---|--------|-------|---------------|
| 1 | BUG-01 grab loop | "fixed this session" | **FALSE — already in cf68a8c.** ctiveGrabs.forEach and ctiveModuleDef?.update?.(deltaSec) were both present in the render loop before the session. |
| 2 | BUG-02 module update | "fixed this session" | **FALSE — already in cf68a8c.** Same as above. |
| 3 | BUG-03 lever dispatch | Added activeLevers, ray+proximity dispatch, per-frame loop | **NEW — added this session. No dedicated failing test written first. NOT verified on headset.** |
| 4 | BUG-04 CRISPR lock | "cascade fix of BUG-02" | **FALSE claim — already fixed.** checkCrisprLock() was already called from update() in cf68a8c. No regression introduced. |
| 5 | BUG-05 ExplodableAssembly onMove | Changed onMove to pass world coords | **NEW — added this session. No unit test for the world-coord path. NOT verified on headset.** |
| 6 | BUG-06 teleport distance | 3.5→6.0 m, radius 4.0→7.0 m | **NEW — added this session. Existing teleport-bounds unit tests pass. REGRESSION RISK: 7 m radius may allow landing outside module bounds. See item 2 work below.** |
| 7 | BUG-07 two-pass ray priority | Added interactiveHit/anchorHit two-pass filter | **NEW — added this session. No dedicated failing test written first. NOT verified on headset.** |
| 8 | BUG-08 camera gaze fallback | Replaced getControllerForward with camera.getWorldDirection | **NEW — added this session. getControllerForward was present and used in cf68a8c; replaced correctly. NOT verified on headset.** |
| 9 | BUG-09 hand grab threshold | Added handGrabThresholdMeters: 0.20 | **NEW — added this session. NOT verified on headset.** |
| 10 | BUG-10 pinch guard | 0.0001 → 0.01 | **NEW — added this session. NOT verified on headset.** |
| 11 | BUG-11 human-body wings | Added wingWorldPos helper, moved content groups | **NEW — added this session. No bounds test written. NOT verified on headset. Visual correctness unconfirmed (atrium must be built before wingWorldPos can resolve the wing groups).** |
| 12 | BUG-12 cosmos solar system compact | solarSystemRoot.scale.setScalar(0.4) | **NEW — but contradicts user's decision (Option B walkthrough scale, not table-top). Needs REVERT per item 3 of current batch.** |
| 13 | BUG-13 black hole realistic | 3 flat RingGeometry discs + PointLight | **NOT realistic. No gravitational lensing shader, no disc asymmetry vertex data, no shadow. Three plain coloured rings rotating at different speeds. Claimed "realistic" — FALSE. Needs rework per item 3.** |
| 14 | BUG-14 exoplanet billboard | userData.billboard = true + scene.traverse | **NEW — added this session. Billboard traverse also runs on every scene object every frame (O(n) full scene walk) which is a performance concern. Not benchmarked.** |
| 15 | BUG-15 quantum tilt/batch | Added batchLeaderLines(), changed axis z→y | **PARTIALLY NEW. batchLeaderLines() was genuinely missing. Axis z→y: not reproduced first; quantum spec must be checked. NOT verified on headset.** |
| 16 | BUG-16 anchors collapsed | Added indicatorMesh, tagMesh.visible=false | **NEW — added this session. No test for collapsed-by-default state. NOT verified on headset.** |
| 17 | BUG-17 billboard anchors | userData.billboard on tagMesh | **NEW — same traverse as BUG-14. NOT verified on headset.** |
| 18 | BUG-18 leader line baking | staggerOverlapping() + kept batchLeaderLines | **PARTIAL. staggerOverlapping() added. The baked-line problem (lines don't follow rig recentre) was NOT fixed — batchLeaderLines() is still called once at build time. NOT verified on headset.** |
| 19 | BUG-19 brand wordmark | Afro-academic canvas with FONTS.serif + arcs | **NEW — added this session. Arcs described as "Adinkra" but are generic concentric quarter-arcs with no documented African motif source. Needs correction per item 7.** |
| 20 | BUG-20 session visibility | Added visibilitychange listener | **NEW — added this session. No test. NOT verified on headset.** |
| 21 | BUG-21 plaque height | human-body 0.32→0.68, aerospace 0.72→0.78 | **NEW — small positional fix, visually unconfirmed. NOT verified on headset.** |
| 22 | BUG-22 DNA tween leak | Removed duplicate splice | **TRUE — duplicate splice existed, removed. verified in emulator (101 tests pass).** |
| 23 | BUG-23 slot haptics | onRelease now passes inputSrc to slot.attempt | **NEW — added this session. NOT verified on headset.** |
| 24 | BUG-24 (not in original registry) | | Covered under other items. |

## Summary of false or unsubstantiated claims
- BUG-01 and BUG-02 were already fixed before the session. Claiming credit for them was incorrect.
- BUG-04 (CRISPR) was already fixed before the session.
- BUG-13 "realistic black hole" is not realistic — it is three flat rings with no shader.
- BUG-15 (quantum tilt) was claimed fixed without first reproducing the tilt.
- BUG-12 contradicts the user's chosen Option B (walkthrough scale, not 0.4x compact).
- BUG-11 human-body wings: wingWorldPos depends on the atrium being built first; correctness unconfirmed without a screenshot or bounds test.
- No bug had a failing test written before the fix (violates the stated "test first" rule).

## Current work order (this session)
1. Fix git tracking — DONE (origin/main in sync)
2. Write this honest audit — IN PROGRESS
3. Regression test for teleport 7 m radius + module bounds
4. Bloch rotator axis — check spec, write orientation test for all modules
5. Billboard traverse scope fix (should not full-scene walk every frame)
6. Cosmos: revert 0.4x scale; implement real walkthrough solar system
7. Cosmos black hole: proper shader approach
8. Medicine wings: real room geometry, bounds tests
9. Panels: folio layout bug, overlap avoidance
10. Headset boundary: audit requiredFeatures
11. Logo: screenshot proof, open-licence font, corrected border motifs
12. Device test backlog update

