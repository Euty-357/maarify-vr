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
- **Cosmos content (experimental):** source pack at 36 entries; first batch has 7/24 anchors, 25 glossary terms ×3 tiers, 10 mapped objectives and a 3-tool Observatory Desk. Every page/glossary/objective/practitioner rule passes; only the anchor count blocks the audit. 3/15 highest-risk claims have exact quoted sentences; the other 12 are PENDING and the module is hidden from learners.
- **Panels v2 renderer:** `FolioPanel` is in and wired to Cosmos anchors (tier tabs with per-tier page memory, arrows, collapse, gentle turn, grab). It renders the verified content data; Cosmos still has only 7/24 anchors, so the module remains experimental.
- **Cosmos — READY (tag `v0.7-cosmos-ready`), device-unverified.** 24/24 anchors, 25 glossary terms ×3, 10 objectives, practitioner desk, audit `--enforce` passes; all 24 anchors open the folio. **17/17 highest-risk claims have exact supporting sentences** (NASA fact sheets, Planck, Gillon, LIGO, KSA, FAI PDF, NOAA). Budget **7,618 tris / 121 draws** (working band 108–126, ceiling 180).
- **Cosmos reviewer passes (emulator evidence):**
  - Immersion — PASS with device caveat: world-space folio at 1.1 m, grabbable, gentle turn, opens from the anchor; no page-turn gesture or page-turn haptics yet.
  - Science — PASS: 17 quoted claims; San Marco (KSA) and Sun (NASA) corrections; lower-risk facts cite the NASA/ESA source pack.
  - Comfort/accessibility — PASS with device check: 34 px body, sRGB mipmapped canvas, 1.1 m distance, no head-lock; comfort and legibility **NOT device-verified**.
  - Performance — PASS (emulator): 121 draws, 7,618 tris inside the working band; dynamic quality controller not yet built; **NOT measured on device**.
- **Next (goal continues):** close the Kármán source, trim Cosmos draws toward ≤108, then run the four reviewer passes and mark Cosmos ready; after that Medicine, Aerospace, Climate Change, Urban, Quantum, DNA.
- **Device:** controls, portals and transitions confirmed on Quest 3. Everything after that is **NOT verified on device**; no Quest 3S session yet.

## What Is Next
1. Cosmos: Kármán source + draw-call optimisation + reviewer passes; then ready and tagged.
2. Medicine six wings (heart realism first), Aerospace (exploded engine, visible flow), Climate Change, Urban, Quantum, DNA.
3. Cross-cutting: Explodable Assembly, SETTING framework, sections, hosting readiness.

## Blockers
- None. Content policy: verified-only, thresholds unchanged, source pack first.
- All Quest 3/3S performance numbers remain NOT measured on device.

## Last Green Commit
- `18811eb` — `fix(cosmos): verify the Karman line from the FAI PDF` (verify exit 0). 15-claim pass: `982a94b`; Cosmos 24 anchors: `a5c8875`; folio: `5e6609e`.

## Which Tool/Session Last Worked
- DeepSeek Harness, 2026-11-12T08:30 EAT. Section 1 complete and pushed. Next: section 2 foundation (design tokens, dark-academia hub/brand, credits, panels v2, content schema + audit, Explodable Assembly, settings, sections, hosting).
