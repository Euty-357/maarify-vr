# STATE.md — Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** GLB asset integration in Aerospace, Quantum, and Human Body modules (procedural stand-ins replaced by GLB models; courses and interactions fully wired; all levers completely removed from the app)
- **Milestone:** All 3 target modules wired with GLB assets, proper lab furniture, and connected courses:
  - **Aerospace:** `engine_ffsc_methalox`, `engine_hydrolox_staged`, `engine_srm` loaded via AssetCache onto engine stands with two-handed pinch-pull explode gestures (or direct click), and flow path players (orange/cyan). Explodable meshes bind directly to instantiated clones via `parseAssetNodes`. Procedural engine stand meshes deleted. All levers removed (collective and wind tunnel converted to smooth sliders). 7 course missions wired.
  - **Quantum:** `quantum_dilution_refrigerator` moved to the centre of the room (`x=0, z=-2.2`), suspended from the ceiling at accessible height (1.0 m base), explodable via two-handed pinch-pull or click (NO levers). All apparatus grounded on dedicated sturdy lab benches at ergonomic 0.78 m height: `bloch_sphere` on lab table; `qc_circuit_kit` on electronics workbench; `bell_bench` and `double_slit_bench` on vibration-isolated optical tables; `qc_architectures_gallery` on wide hardware display table; `qpu_chip_transmon` and `josephson_junction` on equipment benches. ZERO items on the floor, ZERO floating items. 4 course missions wired.
  - **Human Body:** `heart_cutaway` loaded on pedestal with dual blood flows, interactive two-handed cutaway revealing valves, and blood flow player; `hiv_virion_cutaway` with two-handed explode gesture, `hiv_art_bench`, `hiv_integrase_insti`, `hiv_cd4_cell`, `hiv_cd8_ctl` loaded in HIV wing. Procedural heart geometry and procedural virion/bench deleted. All levers removed. 3 course missions wired.
  - **Complete Removal of Levers:** Levers removed from all scenes across the entire app (`aerospace`, `quantum`, `human-body`, `cosmos`, `environment`, `urban-development`, `asset-lab`). Exploded views and cutaways operate via two-handed pinch-pull gestures in VR (`SpatialScalePinchPrimitive`) and desktop clicks. Controls use `SpatialSliderPrimitive`.
  - **Testing & Verification:** `glb-loader.ts` updated with Node filesystem fallback for unit tests; `npm run typecheck`, `npm run audit:missions -- --enforce`, `npm run check:hygiene`, and module unit tests all pass cleanly (0 errors). Ready for headset testing.

## Course system vs mission system
`src/core/course/` and `src/core/mission/` are ONE system, split by responsibility.
There is no duplicated board, scoring or progress logic.

| Concern | Owner | Notes |
|---------|-------|-------|
| Diegetic objective board (lectern with ticks) | `src/core/mission/mission-board.ts` (`MissionBoard`) | The course controller calls `missionBoard.complete(missionId)` so the ticks follow the course. The course never draws its own board. |
| Dr. Amani caption panel | `src/core/mission/mission-board.ts` (`buildDrAmaniCaptionPanel`) | The only caption-panel implementation. `CourseController` uses it; it is world-anchored, never head-locked. |
| Orientation tutorial (60–90 s opening) | `src/core/mission/tutorial-controller.ts` (`TutorialController`) | Runs before the missions. |
| End-of-module summary room | `src/core/mission/summary-plinth.ts` (`buildSummaryPlinth`) | Shows the badge, the XP and the return button. |
| Mission data (title, steps, hints, tier outcomes, predicates) | `src/core/course/` + each module's `missions.ts` | Data-driven; validated by `npm run audit:missions`. |
| Mission state machine (locked/available/active/done) and hint ladder | `src/core/course/mission-runner.ts` (`MissionRunner`) | Fed only by course-bus events. |
| Interaction events from the shared primitives | `src/core/course/event-bus.ts` (`CourseEventBus`) | The only channel from the primitives to the course. No raw XR input. |
| **XP, badges, completed missions, capstone score** | `src/core/store/progress-store.ts` (`InMemoryProgressStore`) | **The single scoring sink.** `MissionRunner` computes a score; `CourseController` forwards it through the `CourseScoreSink` interface. There is no second copy of the bookkeeping. |

## Asset requests
_Assets that do not exist yet or are inadequate. Missions degrade gracefully until these land (no fakes)._

| Asset | Module | Part ids needed | Size (authored) | Interactions | Extras needed | Used by |
|-------|--------|-----------------|------------------|--------------|---------------|---------|
| `aero_wing_section` | aerospace | aerofoil spar, flap, aileron | ~2.0 m | scrub pitch, explode, control-surface move | partId, label, description, explodeDirection, explodeDistanceMeters | `aero-m1-wings-work` (currently procedural, NOT final) |
| `aircraft_general_aviation` | aerospace | fuselage, wing, aileron, elevator, rudder, flap, propeller | ~6 m | grab control surfaces, rotate | partId, label, description, explodeDirection, explodeDistanceMeters | `aero-m2-fly-the-controls` (currently procedural, NOT final) |
| `heart_valve_morphs` | human-body | valve-mitral, valve-aortic, valve-pulmonary, valve-tricuspid | 0.32 m heart | slider stenosis / regurgitation | morph targets or scale-driven deformation | Heart M2 (valve states) — currently a labelled approximate scale deformation |
| `coronary_tree` | human-body | coronary-arteries | 0.32 m heart | slider narrowing | per-segment narrowing axis | Heart M4 (coronary narrowing) — currently a labelled approximation |
| `quantum_cryostat_components` | quantum | attenuator, amplifier, circulator, filter | per-plate | drag to plate sockets | per-part `temperatureK`, `stageLabel` | Quantum M6 "cool the chip" |
| `bloch_pedestal_gate_slot` | quantum | gate-slot | 0.3 m | drop gate token | acceptsGateIds JSON string | Quantum M2 gate puzzle |
| Cosmos props | cosmos | observatory dome, telescope, star chart, launch console, nav console table | varied | grab, panel, teleport | partId, label, description | Cosmos M0–M4 |
| DNA props | dna-genetics | lab bench, PCR machine, centrifuge, gel box, sequencer | varied | grab, panel | partId, label, description | DNA M0–M5 |

_Received since the last update: `engine_turbofan` (2 868 tris, parts fan / low-pressure-compressor /
high-pressure-compressor / combustor / high-pressure-turbine / low-pressure-turbine / nacelle-front /
nacelle-back / nozzle / shafts, flows flow-air + flow-fuel) and `engine_gas_generator` (1 360 tris, parts
chamber / exhaust-duct / feed-lines / gas-generator / injector / nozzle / turbopump, flows flow-fuel /
flow-hot-gas / flow-oxidiser). Both are now referenced by the aerospace missions._

_Assets that exist but are inadequate: none outstanding. All 19 registry assets pass SHA-256 and the per-asset budget check._

## Open questions
1. **Medicine and Quantum mission data not yet written.** The course system, audit script and Aerospace missions are complete. Medicine and Quantum missions still need `missions.ts` files; the audit script only checks modules that have a missions file, so the pipeline stays green until they land.
2. **Aerospace scene controls are not yet authored.** The aerospace missions reference control ids (`aero-wing-pitch-slider`, `aero-control-roll`, `aero-density-altitude-slider`, `aero-stack-delta-v`, `aero-capstone-score`, `aero-explode-amount`, `aero-turbofan-slot-*`) that the scene does not yet build. The mission logic, data, tiering, hint ladder and scoring are complete and unit-tested; the scene wiring is the next step.
3. **The wing-section and control-surface missions still run against procedural geometry** until `aero_wing_section` and `aircraft_general_aviation` land, and are marked NOT final.
4. **`quantum_dilution_refrigerator` is above the draw-call working target** (~155 estimated draws vs the 108 working target, under the 180 ceiling). It is the biggest draw-call risk, as the brief predicted. The merge helper is in `scripts/check-asset-budgets.mjs` but the merge itself is not implemented.

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
   - 47 unit test suites (309 tests) passing cleanly.
   - Property tests: `walkable.property.test.ts`, `travel.property.test.ts`, `load-gen.property.test.ts`, `info-system.property.test.ts`, `mission.property.test.ts`.
   - Asset pipeline tests: `glb-pipeline.test.ts`, `explodable-adapter.test.ts`, `docking-system.test.ts`, `flow-path-player.test.ts`, `asset-budgets.test.ts`, `asset-lab.test.ts`.
8. **Asset Pipeline & Course Choreography (WP1–WP7 Completed):**
   - WP1 GLB pipeline (`src/core/assets/`): `loadGlbAsset()`, `parseAssetNodes()`, `AssetCache`, `scripts/sync-assets.mjs` (19 GLBs synced, SHA-256 verified), `registry.generated.ts`.
   - WP2 Explodable adapter (`createExplodableFromAsset`): direction normalization, zero-vector non-moving parts, rest-pose restore, highlight, tap/hover events.
   - WP3 Docking system (`DockingSystem`): grab-and-slot interactions with snap radius and peg/gate predicates.
   - WP4 Flow path player (`FlowPathPlayer`): Catmull-Rom particle spline with fixed timestep (dt = 1/120s), dynamic quality support; `BloodFlowSystem` refactored with fallback.
   - WP5 Budgets (`scripts/check-asset-budgets.mjs`): per-asset table, worst-case scene checks, draw call risk reporting (cryostat identified), static part merge proposal helper.
   - WP6 Asset Lab (`src/modules/asset-lab`): dev-only module with asset shelf, 1 m placement, explode lever, diegetic part labels, flow toggle, dock socket, stats panel.
   - WP7 Asset plans (`ASSET_PLAN.md` & `asset-plan.ts` for aerospace, human-body, quantum): choreography steps, interaction types, success conditions, source citations, safety scope compliance.
9. **Hygiene & Git Hygiene:**
   - Updated `.gitignore` (.kiro/, MAARIFY_KQ_AUDIT.md, *.mp4, *.mov, reports/*.log, *.tmp, *.bak).
   - Updated `scripts/check-hygiene.mjs` to ignore clips/history/.kiro. Hygiene check PASSED.
   - Cleaned up stale CLI dump logs in `reports/` and 0-byte logs in `logs/`.
   - TypeScript compilation: `npm run typecheck` passes with 0 errors.

## Current State
- All code changes are in the working tree (uncommitted per user instruction: "No commit or push").
- **FOLLOW-UP FIX BATCH COMPLETED & FULLY VERIFIED:**
  1. **Clean Typecheck & Unused Variable Cleanups:**
     - Added missing `MissionStep` import to `src/core/course/mission-runner.ts`.
     - Removed unused test variables (`vi`, `referencedTypes`) in `tests/unit/course/fix-batch.test.ts` and `reachedValue` in `src/modules/quantum/missions.ts`.
     - `npm run typecheck` exits cleanly with code 0.
  2. **Real Event Emitters & Dedicated Unit Tests:**
     - Emitted real events at actual interaction sites:
       - `'measured'`: Triggered on quantum measurement button on Bloch sphere pedestal and register readouts.
       - `'enteredZone'`: Emitted via `updateZoneTracking()` whenever learner transitions between room sections / quadrants.
       - `'gazeHeld'`: Emitted via `updateGazeDwell()` when learner maintains gaze on detector/target for $\ge 1.5$ seconds.
     - Stopped emitting `'placed'` on bare release; emitted strictly when a part docks, snaps into an assembly slot, or enters a named zone.
     - Added `tests/unit/course/event-coverage-near-grab.test.ts` asserting:
       - Every event type referenced by mission steps has an active emitter.
       - Any step completed predicate that is a constant true without `narrative: true` explicitly fails.
     - Updated `scripts/audit-missions.mjs` to validate and reject placeholder constant-true predicates without `narrative: true`.
  3. **Full Mission Rewrites (Quantum M0-M7 + Capstone & Human Body H1-H4, V1-V4, B1, C1):**
     - Quantum rewritten to 9 missions: M0 (Orientation), M1 (Bit vs Qubit & Superposition), M2 (Gates as Rotations), M3 (Measurement Statistics), M4 (Bell Entanglement), M5 (Algorithms Grover & Shor), M6 (Dilution Refrigeration & 10 mK), M7 (Hardware Gallery NISQ), Capstone (Deutsch-Jozsa Circuit Synthesis).
     - Human Body rewritten to 10 missions: H1 (Circulation Circuit), H2 (Cutaway & Valves), H3 (ECG Conduction), H4 (Coronary Hemodynamics), V1 (Virion Structure), V2 (HIV Life Cycle & INSTI), V3 (U=U Viral Suppression), V4 (Pumwani Mucosal Immunity), B1 (Brain & Synapse), C1 (CAR-T Oncology).
     - Audit counts verified: 26 missions, 78 hints, 21 placards across all modules.
  4. **Near-Grab Distance = 0 & Pose Consistency:**
     - In `handleModuleProximityInteraction()`, near grab distance is explicitly set to 0 (interactor point = hand position) with pull-in interpolation skipped.
     - Controller world pose (`entry.poseQuaternion`) used consistently across all `tryGrab` and `update` calls.
     - Added animated ease-back (~0.25 s) with `tickEaseBack()`.
     - Clamped bounds replaced with configurable room boundary definitions.
     - Unit test proves world pose continuity on frame 1 is $< 1$ cm and $< 1^\circ$.
  5. **Verification Evidence:**
     - `npm run typecheck`: verified by running (0 errors, code 0).
     - `npm run lint`: verified by running (0 errors, 142 style warnings).
     - `node scripts/audit-missions.mjs --enforce`: verified by running (26 missions, 78 hints, 21 placards verified).
     - `npm run test:unit`: verified by running (49 test files, 320/320 tests green).
     - Hardware metrics: strictly **NOT verified on headset**.

## Next Steps
1. Perform physical headset playthrough on Quest 3 / Quest 3S via MQDH / `adb reverse`.
2. Inspect on-device frame rates, fixed foveation transitions, and comfort under 90 Hz display rate.
3. Commit and tag milestone when instructed by user.

## Blockers
- None. All Quest 3/3S performance and visual feel numbers remain strictly **NOT verified on headset**.

## Last Green Commit
- `e187ff6` (working tree contains uncommitted polish implementation).
