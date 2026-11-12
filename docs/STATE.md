# STATE.md — Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** Implementation Active — Sequential Full-Spec Module Delivery
- **Milestone:** M0–M6 Complete; M6 tagged `v0.6-dna-genetics`; scope ends here pending headset validation

## Where We Are & What We Have Done
1. **Toolchain & Spike (M0):** Complete & green (`b1ec4d3`). Three.js, WebXR Device API, Vitest, Playwright with IWER emulator, multi-pose screenshot matrix, budget checkers, and hygiene checks.
2. **Core Systems & Spatial Hub (M1):** Complete & green (`4144db0`). Spatial hub with 7 physical portals, plinth tier selector, device smoke-test zone, diegetic spatial anchors, audio guidance, and progress store.
3. **Cosmos & Astronomy (M2):** Complete & green (`f6aa83a`, tag `v0.2-cosmos`). Full vertical slice: Malindi night horizon, atmospheric ascent layers, solar system scale collapse, orbital transfer burn, supermassive black hole Sagittarius A*, 4 physical challenges, 4 diegetic anchors with 3-tier micro-simulations, 12 verified sources.
4. **Quantum Mechanics (M3):** Complete & green (`106bac7`, tag `v0.3-quantum`). Bloch sphere rotator, double-slit gaze collapse, exploded 5-stage dilution cryostat, gallery of 7 hardware architectures, optical Bell state bench, quantum circuit assembly, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 12 verified sources.
5. **Human Body & Medicine (M4):** Complete & green (`c3acb51`, tag `v0.4-human-body`). Prominent medical disclaimer plinth, pulsating 4-chamber heart with mechanical valves and ventricular pressure slider, capillary RBC ride, neural synaptic junction, exploded HIV virion with pinch scale, CAR-T tumor immunotherapy, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, Dr. Amani audio narrative (Pumwani cohort, U=U destigmatization), 10 verified sources.
6. **Aerospace & Rocket Propulsion (M5):** Complete & green (`889180b`, tag `v0.5-aerospace`). Prominent educational safety scope notice plinth, NACA aerofoil wing spar with high-altitude Nairobi Wilson Airport air density tuning (-5° to 25°) and stall buffeting (>15°), 3D exploded staged liquid rocket engine, cycle rotator plinth dynamically simulating 8 thermodynamic cycles, supersonic de Laval nozzle with backpressure slider producing dynamic oblique shock diamonds, 3U Taifa-1 CubeSat model with deployed solar arrays, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 10 verified sources.
7. **Git Source Control & GitHub Remote Sync:** Both `master` (GitHub default branch) and `main` are fully synchronized on [`https://github.com/Euty-357/maarify-vr`](https://github.com/Euty-357/maarify-vr) with dual-push refspecs active.

## In Progress
- **Input hardening (Phases 1–7 of the 2026-11-11 brief).** Phase 1 (instrumentation) is implemented: build id via Vite (`__BUILD_ID__` + `/__build`), head-relative 4 Hz debug panel with live `session.inputSources`, reason codes, event and error rings, and a guarded frame loop. Phase 2 research is logged. Phase 3 (single core input service) is next.
- **M6 DNA / Genetics is complete and tagged** (`v0.6-dna-genetics`), but module work M6-onward is paused until input is solid.

## What Is Next
1. **Device verification of Phases 1/5/6:** reload to build `b793fd9-1794409747081`, confirm `POSE 2/2`, portals by walk/trigger, `RET ray-grab` in Aerospace with `?grabhints=1`, clamped teleport, B/Y return.
2. **Phase 3:** extract the per-frame source/pose/edge logic from `main.ts` into `src/core/input/xr-input-service.ts` and route primitives through it, without changing behaviour. The behaviour already exists in `main.ts` (fresh sources, handedness, frame poses, owned edges); only the file boundary is missing.
3. **Phase 4/7:** Aerospace portal load catch + spatial notice, per-module grab Playwright tests, IWER repeat loop, three flake runs. Then `npm run verify` and wait for "commit".

## Blockers
- Aerospace portal still does not open on device (H7 unresolved).
- No headset verification for anything changed after the last device test; all claims remain emulator-only.

## Last Green Commit
- `b793fd9` — `fix(xr): aim the pointer forward, pivot snap turn on the head, and own the teleport`. Everything after this is uncommitted.

## Which Tool/Session Last Worked
- DeepSeek Harness, 2026-11-11T18:06 EAT. Next: device verification, then Phase 3 extraction.
