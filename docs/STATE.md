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
- **Section 1 cleanup (2026-11-12):** input/controls rework committed separately; smoke-test zone, poke primitive, desktop debug overlay and obsolete plan doc removed; dev tools gated behind `?debug=1`. Verify + three Playwright runs still to complete before the cleanup commit.
- **Device evidence:** with the current build, controls, portals and hub↔module transitions work on the Quest 3 (user-confirmed). Grab, bounded teleport, the closest-hit dispatch and smooth locomotion are **not yet device-verified**.

## What Is Next
1. Finish section 1: verify green, three Playwright runs, cleanup commit, push.
2. Start section 2 foundation: design tokens, dark-academia hub/brand, credits plaque, Information Panels v2, content schema + audit script, Explodable Assembly, per-scene settings, sections support, hosting readiness.
3. Then module order: Cosmos → Medicine → Aerospace → Climate Change → Urban → Quantum → DNA.

## Blockers
- None currently. Aerospace portal still needs a load-error catch (section 4).

## Last Green Commit
- `541e562` — `chore(cleanup): remove smoke-test zone, dead primitives and desktop overlays` (verify exit 0, three Playwright runs green). Input rework: `7e3b8ab`.

## Which Tool/Session Last Worked
- DeepSeek Harness, 2026-11-12T08:30 EAT. Section 1 complete and pushed. Next: section 2 foundation (design tokens, dark-academia hub/brand, credits, panels v2, content schema + audit, Explodable Assembly, settings, sections, hosting).
