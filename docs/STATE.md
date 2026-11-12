# STATE.md — Maarify Project State
_This file is the single source of truth for resuming any session. Update it after every task._

## Current Phase / Milestone
- **Phase:** Implementation Active — Sequential Full-Spec Module Delivery
- **Milestone:** M0–M6 Complete; M6 tagged `v0.6-dna-genetics`; scope ends here pending headset validation

## Where We Are & What We Have Done
1. **Toolchain & Spike (M0):** Complete & green (`b1ec4d3`). Three.js, WebXR Device API, Vitest, Playwright with IWER emulator, multi-pose screenshot matrix, budget checkers, and hygiene checks.
2. **Core Systems & Spatial Hub (M1):** Complete & green (`4144db0`). Spatial hub with 7 physical portals, plinth tier selector, diegetic spatial anchors, audio guidance, and progress store. The hub smoke-test zone was removed on 2026-11-12 (device checks now live in `docs/HEADSET_TEST.md`).
3. **Cosmos & Astronomy (M2):** Complete & green (`f6aa83a`, tag `v0.2-cosmos`). Full vertical slice: Malindi night horizon, atmospheric ascent layers, solar system scale collapse, orbital transfer burn, supermassive black hole Sagittarius A*, 4 physical challenges, 4 diegetic anchors with 3-tier micro-simulations, 12 verified sources.
4. **Quantum Mechanics (M3):** Complete & green (`106bac7`, tag `v0.3-quantum`). Bloch sphere rotator, double-slit gaze collapse, exploded 5-stage dilution cryostat, gallery of 7 hardware architectures, optical Bell state bench, quantum circuit assembly, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 12 verified sources.
5. **Human Body & Medicine (M4):** Complete & green (`c3acb51`, tag `v0.4-human-body`). Prominent medical disclaimer plinth, pulsating 4-chamber heart with mechanical valves and ventricular pressure slider, capillary RBC ride, neural synaptic junction, exploded HIV virion with pinch scale, CAR-T tumor immunotherapy, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, Dr. Amani audio narrative (Pumwani cohort, U=U destigmatization), 10 verified sources.
6. **Aerospace & Rocket Propulsion (M5):** Complete & green (`889180b`, tag `v0.5-aerospace`). Prominent educational safety scope notice plinth, NACA aerofoil wing spar with high-altitude Nairobi Wilson Airport air density tuning (-5° to 25°) and stall buffeting (>15°), 3D exploded staged liquid rocket engine, cycle rotator plinth dynamically simulating 8 thermodynamic cycles, supersonic de Laval nozzle with backpressure slider producing dynamic oblique shock diamonds, 3U Taifa-1 CubeSat model with deployed solar arrays, 4 physical challenges, 4 diegetic anchors with 3-tier micro-sims, 10 verified sources.
7. **Git Source Control & GitHub Remote Sync:** Both `master` (GitHub default branch) and `main` are fully synchronized on [`https://github.com/Euty-357/maarify-vr`](https://github.com/Euty-357/maarify-vr) with dual-push refspecs active.

## In Progress
- **Input** now lives in `src/core/input/input-state.ts` (edges, pinch hysteresis, handedness/source selection, pose maths) with 8 unit tests; `main.ts` consumes it.
- **Design foundation** is in: `src/core/design/tokens.ts`, warm oak/brass/oxblood hub, brand plaque with automatic logo wiring, generated credits plaque. The full Reading Room architecture is still to build.
- **Next (goal continues):** content schema + `audit-content-depth.mjs`, Information Panels v2, Explodable Assembly, per-scene SETTING framework, sections in `ModuleDefinition`, hosting readiness; then Cosmos, Medicine, Aerospace, Climate Change, Urban, Quantum, DNA.
- **Device:** controls, portals and transitions confirmed on Quest 3. Everything after that is **NOT verified on device**; no Quest 3S session yet.

## What Is Next
1. Content-as-data schema + audit script (24 anchors/module, page minimums, glossary, objectives, sources, practitioner section).
2. Information Panels v2 (tier tabs, paging, collapse, 90-word pages, 3D demo).
3. Explodable Assembly primitive + tests; SETTING framework; sections; hosting readiness.
4. Modules in the revised order; commit and tag each ready module.

## Blockers
- None. On-device results are not blocking by user instruction; everything is tested in one device pass later.
- All Quest 3/3S performance numbers remain NOT measured on device.

## Last Green Commit
- `711f242` — `feat(design): dark-academia tokens, brand plaque and generated credits` (verify exit 0). Input extraction: `86ecce4`; Quest 3/3S baseline: `ecbbf8b`.

## Which Tool/Session Last Worked
- DeepSeek Harness, 2026-11-12T08:30 EAT. Section 1 complete and pushed. Next: section 2 foundation (design tokens, dark-academia hub/brand, credits, panels v2, content schema + audit, Explodable Assembly, settings, sections, hosting).
