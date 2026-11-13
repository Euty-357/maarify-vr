# Implementation Plan

## Overview

25 tasks across 10 execution blocks fix all 24 confirmed bugs in the Maarify WebXR platform. The workflow follows the exploratory PBT pattern: write a bug-condition exploration test and a preservation test first, then apply fixes in dependency order (P0 render-loop first, then input, then per-module, then UX/visual), and run `npm run verify` once at the very end. Tasks 1–2 are the PBT gate that must run on unfixed code before any implementation begins.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "label": "PBT gate — run on UNFIXED code",
      "tasks": ["1", "2"]
    },
    {
      "wave": 1,
      "label": "Block 1 — Render Loop P0 (critical path)",
      "tasks": ["3"]
    },
    {
      "wave": 2,
      "label": "Block 1 sub-tasks and BUG-05 world coords",
      "tasks": ["3.1", "3.2", "3.3", "4"]
    },
    {
      "wave": 3,
      "label": "Block 1 PBT verification",
      "tasks": ["3.4", "3.5"]
    },
    {
      "wave": 4,
      "label": "Blocks 2–3 — Input Reliability and Human Body Wings",
      "tasks": ["5", "6", "7", "8", "9", "10"]
    },
    {
      "wave": 5,
      "label": "Block 4 — Cosmos Redesign",
      "tasks": ["11", "12", "13"]
    },
    {
      "wave": 6,
      "label": "Blocks 5–7 — Quantum, DNA, Branding",
      "tasks": ["14", "15", "16", "17", "18"]
    },
    {
      "wave": 7,
      "label": "Block 8 — Anchor Card UX Redesign",
      "tasks": ["19", "20", "21", "22"]
    },
    {
      "wave": 8,
      "label": "Block 9 — Scene Visibility and Plinth Clips",
      "tasks": ["23", "24"]
    },
    {
      "wave": 9,
      "label": "Block 10 — Full Verification",
      "tasks": ["25"]
    }
  ]
}
```

## Tasks

## Exploration and Preservation Tests (run BEFORE any fixes)

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** — Render Loop Incompleteness (BUG-01 / BUG-02)
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples demonstrating that grab update and module update are never called
  - **Scoped PBT Approach**: Scope to the two concrete deterministic cases: (a) grab world-position unchanged after N frames, (b) module animation value unchanged after 2 s elapsed
  - Create a test file `src/__tests__/bugCondition.render-loop.test.ts`
  - Test A — grab update missing: instantiate a `SpatialGrabPrimitive`, spy on its `update()` method, drive two `renderFrame()` calls, assert `update` was called at least once — this FAILS on unfixed code
  - Test B — module update missing: spy on a mock module's `update()`, drive two `renderFrame()` calls, assert `update` was called at least once — this FAILS on unfixed code
  - Run: `npx vitest run src/__tests__/bugCondition.render-loop.test.ts`
  - **EXPECTED OUTCOME**: Both tests FAIL (proves bugs 1.1 and 1.2 exist)
  - Document counterexamples: "renderFrame ran twice; grab.update called 0 times; module.update called 0 times"
  - Mark task complete when test is written, run, and failures documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** — Existing Dispatch and Locomotion Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code, observe outputs, then write assertions
  - Observe: slider dispatch returns `'slider'` for hits on `sliderPrimitive`-tagged meshes
  - Observe: rotator dispatch returns `'rotator'` for hits on `rotatorPrimitive`-tagged meshes
  - Observe: teleport arc commit fires vignette callback and haptic stub
  - Observe: portal entry triggers module-load callback without throwing
  - Create test file `src/__tests__/preservation.dispatch.test.ts`
  - Write property-based tests (using `fast-check` if available, otherwise parameterised vitest): for all ray origins/directions in a bounded domain, hits on `sliderPrimitive`-tagged objects always return `'slider'` — identical to pre-fix routing
  - Write property: for all non-lever, non-module-update input paths, the dispatch result is unchanged
  - Run: `npx vitest run src/__tests__/preservation.dispatch.test.ts`
  - **EXPECTED OUTCOME**: All tests PASS on unfixed code (confirms baseline behaviour to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.3, 3.4, 3.6, 3.7_

---

## Block 1 — Render Loop (P0, must be first)

- [ ] 3. Fix BUG-01 / BUG-02 / BUG-03: Render loop completeness in `src/main.ts`

  - [ ] 3.1 Add `activeModuleDef.update()` call inside `renderFrame()`
    - File: `src/main.ts`, function `renderFrame()`
    - Location: immediately after the physics/accumulator step, before the XR camera sync
    - Insert: `activeModuleDef?.update?.(deltaSec);`
    - This single call also unblocks BUG-04 (CRISPR lock) as a side-effect
    - Done condition: `activeModuleDef?.update?.(deltaSec)` is present and reachable in `renderFrame`
    - _Bug_Condition: isBugCondition_P0 — activeModuleDef.update NOT called in renderFrame_
    - _Expected_Behavior: FOR ALL frames where activeModuleDef is non-null, update SHALL be called with deltaSeconds > 0_
    - _Preservation: slider/rotator/teleport/portal paths are unchanged — no other call sites modified_
    - _Requirements: 1.2, 2.2_

  - [ ] 3.2 Add `activeGrabs.forEach` iteration inside `renderFrame()`
    - File: `src/main.ts`, function `renderFrame()`, immediately after the `activeModuleDef?.update?.(deltaSec)` call added in 3.1
    - Insert the full `activeGrabs.forEach((grab, controller) => { ... })` block from the design (§BUG-01), computing `origin`, `quat`, `dir`, and `dist` from `xrControllers` entries or controller world-state fallback
    - Done condition: `activeGrabs.forEach` loop is present in `renderFrame`; loop body calls `grab.update(origin.addScaledVector(dir, dist), quat)`
    - _Bug_Condition: isBugCondition_P0 — activeGrabs NOT iterated in renderFrame_
    - _Expected_Behavior: FOR ALL (controller, grab) in activeGrabs, grab.update SHALL be called each frame_
    - _Preservation: grab registration in trigger-down handlers is untouched_
    - _Requirements: 1.1, 2.1_

  - [ ] 3.3 Declare `activeLevers` map and add lever dispatch in `src/main.ts`
    - File: `src/main.ts`
    - Step 1: Declare `const activeLevers = new Map<THREE.Object3D, SpatialLeverPrimitive>();` alongside `activeGrabs`
    - Step 2: Confirm `SpatialLeverPrimitive` is included in the import from `primitives/index`
    - Step 3: In `handleModuleRayInteraction()`, after the `grabPrimitive` branch, add the `leverPrimitive` branch (design §BUG-03 Step 3)
    - Step 4: In `handleModuleProximityInteraction()`, after the rotator proximity branch, add the lever proximity branch (design §BUG-03 Step 4)
    - Step 5: In `releaseControllerGrab()`, add `activeLevers.delete(controller)`
    - Step 6: In `renderFrame()`, after the `activeGrabs.forEach` block, add the `activeLevers.forEach` per-frame update block (design §BUG-03 Step 6)
    - Done condition: `activeLevers` map exists; lever branch present in both ray and proximity handlers; `activeLevers.delete` in release; per-frame update in `renderFrame`
    - Run: `npx tsc --noEmit` — must pass
    - _Bug_Condition: isBugCondition_Lever — leverPrimitive not dispatched_
    - _Expected_Behavior: lever.updateFromGrab SHALL be called on hit and each subsequent frame_
    - _Preservation: slider/rotator/grab dispatch branches are identical to pre-fix_
    - _Requirements: 1.3, 2.3_

  - [ ] 3.4 Verify Property 1 exploration test now PASSES
    - **Property 1: Expected Behavior** — Render Loop Completeness
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run: `npx vitest run src/__tests__/bugCondition.render-loop.test.ts`
    - **EXPECTED OUTCOME**: Both tests PASS (confirms BUG-01 and BUG-02 are fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.5 Verify Property 2 preservation tests still PASS
    - **Property 2: Preservation** — Dispatch Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run: `npx vitest run src/__tests__/preservation.dispatch.test.ts`
    - **EXPECTED OUTCOME**: All tests PASS (no regressions in slider/rotator/teleport/portal paths)

- [ ] 4. Fix BUG-05: Pass world coordinates from `SpatialGrabPrimitive.update()`
  - File: `src/core/input/primitives/grab.ts`
  - Function: `SpatialGrabPrimitive.update()`
  - Location: the line(s) that call `this.options.onMove?.(...)`
  - Replace `this.targetObject.position` with `this.targetObject.getWorldPosition(new THREE.Vector3())`
  - Replace `this.targetObject.quaternion` with `this.targetObject.getWorldQuaternion(new THREE.Quaternion())`
  - No change to `explodable-assembly.ts` — its `parent.worldToLocal()` is already correct
  - Done condition: `onMove` receives world-space vector and quaternion; `npx tsc --noEmit` passes
  - Dependency: Task 3 (render loop must be active so the grab update path is exercised)
  - _Bug_Condition: isBugCondition (ExplodableAssembly double-conversion) — onMove receives local coords_
  - _Expected_Behavior: onMove SHALL receive getWorldPosition() / getWorldQuaternion() output_
  - _Preservation: DNA scene handle callbacks only use the vector as a signal; they do not call worldToLocal — behaviour unchanged_
  - _Requirements: 1.5, 2.5_

---

## Block 2 — Input Reliability (P1–P2)

- [ ] 5. Fix BUG-06: Raise teleport limits in `src/config/tuning.ts`
  - File: `src/config/tuning.ts`
  - Change `teleportMaxDistanceMeters` from `3.5` to `6.0` in `DEFAULT_TUNING.comfort`
  - Change `teleportMaxRadiusMeters` from `4.0` to `7.0` in `DEFAULT_TUNING.comfort`
  - Done condition: both values updated; `SpatialTeleportPrimitive` reads from `ActiveTuning` at runtime so no other file changes required; confirm no test asserts the old literal values
  - Dependency: Task 3
  - _Requirements: 1.6, 2.6_

- [ ] 6. Fix BUG-07: Two-pass interactive-first ray hit selection in `src/main.ts`
  - File: `src/main.ts`, function `handleModuleRayInteraction()`
  - Prerequisite: Task 19 must have set `this.tagMesh.userData.isAnchorTag = true` in `diegetic-anchor.ts` (see Block 8) — if Block 8 has not run yet, add the userData mark here as a temporary step and remove the duplication after Block 8 completes
  - Replace single `hits[0]` selection with the three-variable two-pass priority filter from design §BUG-07: `interactiveHit` (non-tag, has primitive), `anchorHit` (non-tag, has diegetic anchor), `hit = interactiveHit ?? anchorHit ?? hits[0]`
  - Done condition: anchor tag no longer blocks interactive hits; `npx tsc --noEmit` passes
  - Dependency: Task 3
  - _Requirements: 1.7, 2.7_

- [ ] 7. Fix BUG-09: Camera gaze fallback for first-frame pointer ray in `src/main.ts`
  - File: `src/main.ts`, function `getPointerRay()`
  - Location: the last-resort fallback branch (executed before any XR pose arrives)
  - Replace `getControllerForward(controller, direction)` (or equivalent identity-quaternion read) with `camera.getWorldDirection(direction)`
  - Done condition: fallback branch uses `camera.getWorldDirection`; ray no longer aims behind user on session start
  - Dependency: Task 3
  - _Requirements: 1.9, 2.9_

- [ ] 8. Fix BUG-10: Hand tracking grab threshold in `src/config/tuning.ts` and `src/core/input/primitives/grab.ts`
  - File 1: `src/config/tuning.ts` — add `handGrabThresholdMeters: 0.20` to `TuningConfig.input` interface and `DEFAULT_TUNING.input`
  - File 2: `src/core/input/primitives/grab.ts`, `SpatialGrabPrimitive.tryGrab()` — select threshold based on `inputSource?.hand`: use `ActiveTuning.input.handGrabThresholdMeters` when hand is truthy, `ActiveTuning.input.grabThresholdMeters` otherwise
  - Done condition: new field in tuning config; conditional threshold in `tryGrab`; `npx tsc --noEmit` passes
  - Dependency: Task 4
  - _Requirements: 1.10, 2.10_

- [ ] 9. Fix BUG-11: Raise pinch guard threshold in `src/main.ts`
  - File: `src/main.ts`, function `syncControllerPoses()`, inside the hand-joint pinch block
  - Change both `thumbPosition.lengthSq() > 0.0001` and `indexPosition.lengthSq() > 0.0001` guards to `> 0.01`
  - Done condition: both guards read `> 0.01`
  - Dependency: Task 3
  - _Requirements: 1.11, 2.11_

---

## Block 3 — Human Body Wings (P1)

- [ ] 10. Fix BUG-08: Reposition Human Body content groups into wing doorways
  - File: `src/modules/human-body/scene.ts`, function `buildHumanBodyScene()`
  - Add `wingWorldPos(wingId, localOffset)` helper function inside `buildHumanBodyScene` (design §BUG-08)
  - After all content objects are constructed, replace each hard-coded `.position.set(...)` with `wingWorldPos(...)` calls for: `heartRoot`, `sliderHandle`, `dialMesh`, `synapseRoot`, `carTRoot`, `hivVirionRoot`, `capillaryLoop`
  - Preserve `hivVirionRoot.rotation.y = Math.PI`
  - Done condition: each content group is positioned relative to its named wing; no group at world origin `(0, 0, 0)` after scene build; `npx tsc --noEmit` passes
  - Dependency: Task 3 (module update must be live to verify placement at runtime)
  - _Requirements: 1.8, 2.8_

---

## Block 4 — Cosmos Redesign (P2)

- [ ] 11. Fix BUG-14: Compact solar system initial scale and position in `src/modules/cosmos/scene.ts`
  - File: `src/modules/cosmos/scene.ts`, function `buildCosmosScene()`
  - After `solarSystemRoot` is constructed, before `root.add(solarSystemRoot)`: call `solarSystemRoot.scale.setScalar(0.4)` and `solarSystemRoot.position.set(0, 1.2, -2.5)`
  - Update `scalePinchPrimitive` options: `minScale: 0.3, maxScale: 4.0`; set `scalePinchPrimitive.currentScale = 0.4`
  - Add a `scaleLabel` text panel above the orrery (design §BUG-14 step 4)
  - Done condition: `solarSystemRoot.scale.x ≈ 0.4` on scene build; `npx tsc --noEmit` passes
  - Dependency: Task 3
  - _Requirements: 1.14, 2.14_

- [ ] 12. Fix BUG-15 + warp-to event: Realistic black hole, animated jets, warp pads, and `maarify:warp-to` listener
  - File A: `src/modules/cosmos/scene.ts`, function `buildCosmosScene()`
    - Move `blackHoleRoot` position to `(-8, 1.5, -6)`
    - Remove existing single-disc / static-jet implementation
    - Add event horizon rim glow `RingGeometry` (design §BUG-15 step 1)
    - Add three rotating disc layers (`discRotInner`, `discRotMid`, `discRotOuter`) with correct emissive materials and `DoubleSide` (design §BUG-15 step 2)
    - Add photon ring (design §BUG-15 step 3)
    - Add `northJet` / `southJet` `CylinderGeometry` cones, track `bhTime` accumulator in `update()` closure; animate `jetPulse` via `Math.sin` (design §BUG-15 step 4)
    - Add `PointLight` at black hole position to `root` (design §BUG-15 step 5)
    - Add two warp pad floor rings (`userData.activate`) dispatching `maarify:warp-to` custom events (design §BUG-15 step 6)
  - File B: `src/main.ts`, `initApp()`
    - Register `window.addEventListener('maarify:warp-to', ...)` listener that sets `cameraRig.position.set(d.x, 0, d.z)` (design §BUG-15 step 6)
  - Done condition: black hole has 3 disc layers + photon ring + pulsing jets + point light; warp pads teleport the rig; `npx tsc --noEmit` passes; triangle/draw-call budget still met
  - Dependency: Tasks 3, 11
  - _Requirements: 1.15, 2.15, 3.7_

- [ ] 13. Fix BUG-16: Exoplanet pod billboard flag in `src/modules/cosmos/scene.ts`
  - File: `src/modules/cosmos/scene.ts`, exoplanet pod loop
  - For each exoplanet pod, set `pod.userData.billboard = true`
  - File: `src/main.ts`, `renderFrame()` — add the per-frame billboard traverse after the module update call: traverse all scene objects, call `object.lookAt(camPos)` where `object.userData.billboard === true` (design §BUG-16; this same traverse also covers anchor tag billboarding from BUG-21)
  - Done condition: exoplanet pods re-orient toward camera each frame; `npx tsc --noEmit` passes
  - Dependency: Tasks 3, 11
  - _Requirements: 1.16, 2.16_

---

## Block 5 — Quantum Fix (P2)

- [ ] 14. Fix BUG-17 + BUG-18: `batchLeaderLines()` and Bloch sphere axis in `src/modules/quantum/scene.ts`
  - File: `src/modules/quantum/scene.ts`
  - Fix 1 (BUG-18): In the `SpatialRotatorPrimitive` constructor for `blochVectorArrow`, change `axis: 'z'` to `axis: 'y'`
  - Fix 2 (BUG-17): After `anchorDefs.forEach(...)`, before `root.add(anchorContainer)`, add `anchorPrimitive.batchLeaderLines()`
  - Done condition: Bloch sphere rotator uses `axis: 'y'`; `anchorContainer` has a child named `anchor-leader-lines-batched`; `npx tsc --noEmit` passes
  - Dependency: Task 3
  - _Requirements: 1.17, 1.18, 2.17, 2.18_

---

## Block 6 — DNA Fixes (P2)

- [ ] 15. Fix BUG-12: Prune completed tweens from DNA tween queue in `src/modules/dna-genetics/scene.ts`
  - File: `src/modules/dna-genetics/scene.ts`, `update()` tween loop
  - Confirm the backward `for` loop iterates from `tweens.length - 1` down to `0`
  - Confirm `tweens.splice(index, 1)` is called when `t >= 1` (re-insert if absent)
  - Done condition: splice is present; loop iterates high-to-low; `npx tsc --noEmit` passes
  - Dependency: Task 3 (module update must be called for the tween loop to run)
  - _Requirements: 1.12, 2.12_

- [ ] 16. Fix BUG-13: Thread `inputSource` to `slot.attempt()` in `src/modules/dna-genetics/scene.ts`
  - File: `src/modules/dna-genetics/scene.ts`, each nucleotide and tRNA `onRelease` callback
  - In each callback: retrieve `grabbingSource` from `nucleotide.userData.grabPrimitive as SpatialGrabPrimitive`; guard against `'desktop'` string; pass resulting `XRInputSource | undefined` as second argument to `slot.attempt(nucleotide, inputSrc)`
  - Apply same pattern to tRNA `onRelease` callbacks and diversity-chain node `onRelease` callbacks (design §BUG-13)
  - Done condition: all `slot.attempt` calls thread `inputSrc`; rejection haptic fires; `npx tsc --noEmit` passes
  - Dependency: Tasks 3, 15
  - _Requirements: 1.13, 2.13_

- [ ] 17. Fix BUG-04: CRISPR lock — confirm proximity snap works after render loop fix
  - File: `src/modules/dna-genetics/scene.ts`
  - BUG-04 is a secondary effect of BUG-02: once `activeModuleDef.update()` is called (Task 3.1), `checkCrisprLock()` runs each frame and sets `crisprLocked = true` correctly
  - Verify that `setRepairOutcome` no longer early-returns due to `!crisprLocked` by reading the guard condition
  - If `setRepairOutcome` has an additional bug unrelated to `crisprLocked` (e.g. its own early-return for a missing state flag), fix it now
  - Done condition: `checkCrisprLock()` is called from `update()`; `setRepairOutcome` proceeds past the `crisprLocked` guard; `npx tsc --noEmit` passes
  - Dependency: Tasks 3.1, 15, 16
  - _Requirements: 1.4, 2.4_

---

## Block 7 — Branding (P2)

- [ ] 18. Fix BUG-19: Restyle Maarify wordmark in `src/core/brand/brand.ts`
  - File: `src/core/brand/brand.ts`, `createBrandPlaque()` and the canvas-drawing block
  - Increase canvas to 768×256
  - Replace any hard-coded `sans-serif` font string with `FONTS.serif` from the already-imported `tokens.ts`
  - Draw drop-cap M at 90 px then `AARIFY` at 65 px (design §BUG-19 step 3)
  - Add two thin brass horizontal rules at y=55 and y=185 (design §BUG-19 step 4)
  - Add subtitle `'A SPATIAL LEARNING EXPERIENCE'` at y=215 in brass (design §BUG-19 step 5)
  - Add four Adinkra-inspired concentric-arc corner decorations using `ctx.save/restore` and `ctx.scale(-1,1)` for mirrored corners (design §BUG-19 step 6)
  - Confirm `lookAt` target in `hub-world.ts` faces user spawn (z positive); if it faces away, change to `lookAt(0, 2.0, 1.0)` (design §BUG-19 step 7)
  - Done condition: canvas uses `FONTS.serif`; drop-cap M present; subtitle present; corner decorations drawn; plaque faces user; `npx tsc --noEmit` passes
  - Dependency: none (standalone visual fix)
  - _Requirements: 1.19, 2.19_

---

## Block 8 — Anchor Card UX Redesign (P3)

- [ ] 19. Fix BUG-07 prereq: Mark anchor tagMesh with `isAnchorTag` userData in `src/core/spatial-anchors/diegetic-anchor.ts`
  - File: `src/core/spatial-anchors/diegetic-anchor.ts`, constructor
  - Add `this.tagMesh.userData.isAnchorTag = true` immediately after `tagMesh` is created
  - This is a prerequisite for the two-pass hit filter in Task 6 (BUG-07); if Task 6 added a temporary mark here, remove the duplication now
  - Done condition: `tagMesh.userData.isAnchorTag === true` on every anchor instance
  - Dependency: Task 6
  - _Requirements: 1.7, 2.7_

- [ ] 20. Fix BUG-20 + BUG-21: Collapsed-by-default indicator sphere and billboard flag in `src/core/spatial-anchors/diegetic-anchor.ts`
  - File: `src/core/spatial-anchors/diegetic-anchor.ts`
  - Add `indicatorMesh` (3 cm cyan emissive sphere) to constructor; add to `this`
  - Set `tagMesh.visible = false` and `indicatorMesh.visible = true` in constructor (collapsed initial state)
  - Set `this.tagMesh.userData.billboard = true` (picked up by the billboard traverse from Task 13 — BUG-21)
  - Update `toggleExpansion()`: toggle `isExpanded`; set `tagMesh.visible = isExpanded`, `indicatorMesh.visible = !isExpanded`, `microSimRoot.visible = isExpanded`; call `renderTagCanvas(isExpanded)` (design §BUG-20 step 5)
  - File: `src/core/input/primitives/anchor.ts` — in `toggleExpansion` call site, confirm camera position is passed if the signature requires it
  - Done condition: new anchor instances start collapsed (indicator visible, tag hidden); activation toggles states; tag billboards toward camera via traverse; `npx tsc --noEmit` passes
  - Dependency: Tasks 13, 19
  - _Requirements: 1.20, 1.21, 2.20, 2.21_

- [ ] 21. Fix BUG-21: Confirm billboard traverse covers anchor tags (no extra code needed)
  - Verify that `this.tagMesh.userData.billboard = true` set in Task 20 is picked up by the `scene.traverse` billboard pass added in Task 13
  - If Task 13's traverse is scoped narrowly (e.g. module root only), broaden it to cover the full `scene`
  - Done condition: anchor tag `lookAt(camPos)` is called each frame via the existing traverse; no additional traverse needed
  - Dependency: Tasks 13, 20
  - _Requirements: 1.21, 2.21_

- [ ] 22. Fix BUG-22: Overlap Y-stagger in `src/core/input/primitives/anchor.ts`
  - File: `src/core/input/primitives/anchor.ts`, `SpatialAnchorPrimitive`
  - Add public method `staggerOverlapping()` implementing the O(n²) pair-distance check; push later anchor +0.2 m Y when horizontal distance < 0.4 m (design §BUG-22)
  - File: each module scene file that calls `batchLeaderLines()` (human-body, aerospace, dna-genetics, quantum, cosmos): add `anchorPrimitive.staggerOverlapping()` call before `batchLeaderLines()`
  - Done condition: method exists; called in all five module scenes; `npx tsc --noEmit` passes
  - Dependency: Tasks 14, 20
  - _Requirements: 1.22, 2.22_

---

## Block 9 — Scene Visibility (P3)

- [ ] 23. Fix BUG-23: Session `visibilitychange` → `scene.visible` in `src/main.ts`
  - File: `src/main.ts`, `setupWebXR()` → `onEnterVR()`, immediately after `await renderer.xr.setSession(session)`
  - Add: `session.addEventListener('visibilitychange', () => { scene.visible = session.visibilityState !== 'visible-blurred'; });`
  - In the session `'end'` handler, add: `scene.visible = true`
  - Done condition: listener registered; `scene.visible` toggles correctly; session end restores visibility; `npx tsc --noEmit` passes
  - Dependency: Task 3
  - _Requirements: 1.23, 2.23_

- [ ] 24. Fix BUG-24: Raise plinth sign Y positions
  - File A: `src/modules/human-body/scene.ts` — change medical disclaimer plaque `position.set(0, 0.32, 0)` to `position.set(0, 0.68, 0)` (or `y = 0.68` wherever the plaque Y is set)
  - File B: `src/modules/aerospace/scene.ts` — change `signMesh.position.set(0, 0.72, 0)` to `signMesh.position.set(0, 0.78, 0)`
  - Done condition: both values updated; sign meshes no longer clip plinth tops; `npx tsc --noEmit` passes
  - Dependency: none (standalone positional fix)
  - _Requirements: 1.24, 2.24_

---

## Checkpoint — Full Verification

- [ ] 25. Checkpoint — Ensure all tests pass
  - Run the full verification suite: `npm run verify`
  - This covers hygiene, typecheck, lint, unit tests, Playwright e2e tests, and Tier A budget checks
  - **EXPECTED OUTCOME**: zero console errors; all tests green; 250 k triangle / 180 draw-call ceilings respected
  - If any failure occurs, triage and fix before marking complete; ask the user if the failure source is unclear
  - _Requirements: 3.6, 3.7_

## Notes

- Run `npm run verify` only ONCE at the very end (Task 25). For type-impacting tasks, run `npx tsc --noEmit` after that individual task instead.
- Tasks 1 and 2 are PBT gate tasks: they MUST run on unfixed code before any implementation begins. Task 1 is expected to FAIL on unfixed code; Task 2 is expected to PASS on unfixed code.
- BUG-04 (CRISPR lock) has no independent task — it is resolved as a side-effect of Task 3.1 (module update). Task 17 is a verification-only step confirming the cascade fix.
- BUG-21 (anchor billboard) has no independent fix step — it is resolved by Task 13's `scene.traverse` billboard pass combined with the `userData.billboard = true` flag set in Task 20. Task 21 is a verification-only step.
- Task 12 covers both BUG-15 (black hole redesign) and the `maarify:warp-to` event listener in `main.ts` required by the warp pads. These are co-located in the same PR to avoid a broken intermediate state.
- The `staggerOverlapping()` call (Task 22) must be added to all five module scene files that use `SpatialAnchorPrimitive` before `batchLeaderLines()` is called.
