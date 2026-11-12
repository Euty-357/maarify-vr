# MAARIFY — Project Plan
_Last updated: 2026-11-12. Status: implementation active; module order revised._
_Target Hardware: Meta Quest 3 (primary) and Meta Quest 3S only_

## 1. Milestone Overview & Sequential Order

| Milestone | Focus | Key Deliverable | Gate Policy |
| :--- | :--- | :--- | :--- |
| **M0** | Toolchain & Spatial Spike | WebXR grabbable cube, flat desktop fallback, IWER emulator harness, verify pipeline | `npm run verify` green; baseline commit |
| **M1** | Core Systems & Hub | Direct hands, teleport, vignette, positional audio, haptics, Diegetic Spatial Anchor kit, portal Hub | **STOP GATE:** Quest 3 test rehearsal & review |
| **M2** | Cosmos (Full Spec) | Earth surface $\to$ Karman line $\to$ LEO $\to$ warp/lightspeed $\to$ planets $\to$ black hole | 100% SPEC complete; M2 retro report |
| **M3** | Medicine (six wings) | Heart, Brain, Spine, Cancer, HIV, Infection Prevention; hospital atrium, wards and labs | 100% SPEC complete; medical sign-off |
| **M4** | Aerospace (Full Spec) | Hangar, engine test stand, wind tunnel; complete exploded engine, visible fluid dynamics | 100% SPEC complete; safety scope sign-off |
| **M5** | Climate Change (new) | Kenyan landscapes, energy balance, impacts, mitigation/adaptation, stakeholder simulation | 100% SPEC complete; science sign-off |
| **M6** | Urban Development & Planning (new) | Nairobi planning studio and living model, 2050 policy levers | 100% SPEC complete; regression check |
| **M7** | Quantum (upgrade) | Bloch sphere, cryostat, hardware gallery, circuits, practitioner desk | 100% SPEC complete; regression check |
| **M8** | DNA / Genetics (upgrade) | Helix, replication, translation, CRISPR concepts, African genomics, sickle-cell trait | 100% SPEC complete; regression check |
| **M9** | Integration & Headset Polish | Final polish pass, dynamic quality tuning on Quest 3, accessibility check, deployment tag | Ship gate: full Ready + sign-offs (freeze withdrawn 2026-11-10) |

---

## 2. Quest 3 / 3S Baseline & Performance Budgets

| Metric | Quest 3 / 3S baseline | Verification Method |
| :--- | :--- | :--- |
| **Display Refresh Rate** | 90 Hz default, 72 Hz minimum; record `supportedFrameRates` | WebXR `updateTargetFrameRate` |
| **Triangle ceiling** | $< 250,000$ worst-case scene state | `renderer.info.render.triangles` |
| **Draw-call ceiling** | $< 180$ worst-case scene state | `renderer.info.render.calls` |
| **Working target** | 150,000 triangles / 108 draw calls (60–70 %) | warning in `check-budgets.mjs` |
| **Texture Format** | KTX2 Basis Universal | Three.js `KTX2Loader` |
| **Fixed Foveation (FFR)** | 0.0–1.0, frame-time driven (start 0.5) | `XRWebGLLayer.fixedFoveation` |
| **Mixed Reality** | Optional color passthrough with a non-MR fallback | WebXR feature detection |

All numbers are **NOT measured on device**. Quest 3S is the design floor where the two differ.

---

## 3. Detailed Milestone Tasks

### Milestone M0: Toolchain & Spatial Spike
- Vite, TypeScript strict, Three.js, Vitest, Playwright, and IWER emulator setup.
- WebXR grabbable cube with flat desktop fallback.
- Dev-only debug overlay (FPS, frame time, triangles, draw calls, active tier, input mode).
- Playwright multi-pose camera screenshot harness (`tests/e2e/helpers/screenshot-matrix.ts`).
- Verification pipeline configured (`npm run verify`).

### Milestone M1: Core Systems & Hub
- Fixed-timestep physics accumulator ($dt = 1/120\text{s}$) with interpolation.
- Direct manipulation input (finger poke, distance grab, Touch Plus haptics).
- Locomotion: parabolic teleport, snap-turn, seated offset, smooth movement with vignette.
- Diegetic Spatial Anchor kit (3D tags, leader lines, grab-and-pull micro-sim controller).
- In-memory progress store behind `SwappableStorage`.
- Central Hub scene with 7 physical portals and tier selector plinth.

---

## 4. Definition of Done & Module Closure
A module is marked "Ready" only when:
1. 100% of SPEC is implemented with complete Immersion Map.
2. `npm run verify` is green (typecheck, lint, unit, e2e autopilot, budget check, hygiene check).
3. All required reviewers sign off.
4. Factual claims checked at claim level in `SOURCES.md`.
5. Full verify suite passes for ALL previously ready modules (zero regression).
6. Repeated patterns extracted via automation scout.
7. Tracking files updated and git tag applied.
