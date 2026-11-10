# MAARIFY — Project Plan
_Last updated: 2026-11-08. Status: Implementation Phase (M0/M1 Active)_
_Target Hardware: Meta Quest 3 (Primary), Quest 3S, Quest 2 (Baseline)_

## 1. Milestone Overview & Sequential Order

| Milestone | Focus | Key Deliverable | Gate Policy |
| :--- | :--- | :--- | :--- |
| **M0** | Toolchain & Spatial Spike | WebXR grabbable cube, flat desktop fallback, IWER emulator harness, verify pipeline | `npm run verify` green; baseline commit |
| **M1** | Core Systems, Hub & Smoke-Test | Direct hands, teleport, vignette, positional audio, haptics, Diegetic Spatial Anchor kit, portal Hub, Hub Device Smoke-Test Zone | **STOP GATE:** Quest 3 Tuesday test rehearsal & review |
| **M2** | Cosmos (Full Spec) | Earth surface $\to$ Karman line $\to$ LEO $\to$ warp/lightspeed $\to$ planets $\to$ black hole | 100% SPEC complete; M2 retro report |
| **M3** | Quantum (Full Spec) | Bloch sphere rotation, 7 hardware cryostat models, Deutsch-Jozsa/Grover circuits | 100% SPEC complete; regression check |
| **M4** | Human Body & Medicine (Full Spec) | Beating heart, blood flow scale ride, brain circuits, cancer hallmarks, HIV virion & Pumwani cohort | 100% SPEC complete; medical sign-off |
| **M5** | Aerospace & Propulsion (Full Spec) | Aircraft aerodynamics, wind tunnel stall, turbofan, 7 rocket engine exploded cycles & propellant trade-offs | 100% SPEC complete; safety scope sign-off |
| **M6** | DNA / Genetics (Full Spec) | Double helix unzipping, ribosome translation, CRISPR-Cas9 manual insertion | 100% SPEC complete; regression check |
| **M7** | Environment (Full Spec) | Watershed time scrub, Mau Forest & Naivasha scenarios, shared stakeholder cause-and-effect sim | 100% SPEC complete; regression check |
| **M8** | Urban Development (Full Spec) | Nairobi transit & land use, paratransit matatu routing, informal settlement upgrading | 100% SPEC complete; regression check |
| **M9** | Integration & Headset Polish | Final polish pass, dynamic quality tuning on Quest 3, accessibility check, deployment tag | Ship gate: full Ready + sign-offs (freeze withdrawn 2026-11-10) |

---

## 2. Hardware Quality Tiers & Performance Budgets

| Metric | Tier A (Quest 2 Baseline) | Tier B (Quest 3 / 3S Provisional) | Verification Method |
| :--- | :--- | :--- | :--- |
| **Display Refresh Rate** | 72 Hz | 90 Hz / 120 Hz | WebXR `updateTargetFrameRate` |
| **Triangle Budget** | $< 100,000$ per scene | $< 250,000$ per scene *(Provisional)* | `renderer.info.render.triangles` |
| **Draw Call Budget** | $< 100$ per scene | $< 180$ per scene *(Provisional)* | `renderer.info.render.calls` |
| **Texture Format** | KTX2 Basis Universal | High-Res KTX2 Basis Universal | Three.js `KTX2Loader` |
| **Fixed Foveation (FFR)** | 0.8–1.0 (Aggressive) | 0.0–0.5 (Dynamic based on frame time) | `XRWebGLLayer.fixedFoveation` |
| **Mixed Reality Mode** | Grayscale fallback | 4MP Color Passthrough (`immersive-ar`) | WebXR feature detection |

---

## 3. Detailed Milestone Tasks

### Milestone M0: Toolchain & Spatial Spike
- Vite, TypeScript strict, Three.js, Vitest, Playwright, and IWER emulator setup.
- WebXR grabbable cube with flat desktop fallback.
- Dev-only debug overlay (FPS, frame time, triangles, draw calls, active tier, input mode).
- Playwright multi-pose camera screenshot harness (`tests/e2e/helpers/screenshot-matrix.ts`).
- Verification pipeline configured (`npm run verify`).

### Milestone M1: Core Systems, Hub & Device Smoke-Test Zone
- Fixed-timestep physics accumulator ($dt = 1/120\text{s}$) with interpolation.
- Direct manipulation input (finger poke, distance grab, Touch Plus haptics).
- Locomotion: parabolic teleport, snap-turn, seated offset, smooth movement with vignette.
- Diegetic Spatial Anchor kit (3D tags, leader lines, grab-and-pull micro-sim controller).
- In-memory progress store behind `SwappableStorage`.
- Central Hub scene with 7 physical portals, tier selector plinth, and **Hub Device Smoke-Test Zone**.

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
