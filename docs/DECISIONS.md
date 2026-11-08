# DECISIONS.md — Architectural & Product Decisions
_Record all significant decisions with rationale and alternatives considered._

## 1. Architectural Decisions Register

| ID | Date | Decision | Rationale | Alternatives Considered | Decided By |
|----|------|----------|-----------|------------------------|------------|
| D-001 | 2026-11-07 | WebXR emulator: IWER | Meta-backed, headless CI support, Quest 2/3 controller simulation | @immersive-web/webxr-polyfill | Antigravity/Euty |
| D-002 | 2026-11-07 | No React | Stack fixed by brief; Three.js scene graph is the UI layer | React Three Fiber (adds abstraction overhead) | Euty (brief) |
| D-003 | 2026-11-07 | Progress store: in-memory only (Phase 0–M9) | No backend; resets on reload; storage interface allows future swap | localStorage, Supabase | Euty (brief) |
| D-004 | 2026-11-07 | Modules never import each other | Prevents coupling; each module is a self-contained ModuleDefinition | Shared module bus | Euty (brief) |
| D-005 | 2026-11-07 | Canonical rules in AGENTS.md; tool files are thin pointers | Tool-neutral portability; no content duplication | Per-tool rule files | Euty (brief) |
| D-006 | 2026-11-07 | Build order: Cosmos first as vertical slice | Highest wow-factor; covers travel mechanics and scale shifts | Human Body | Euty (brief) |
| D-007 | 2026-11-08 | Primary target headset: Meta Quest 3 | Developer's real physical test device; Snapdragon XR2 Gen 2 | Quest 2 sole target | Euty |
| D-008 | 2026-11-08 | Tier A (Quest 2) vs Tier B (Quest 3/3S) quality tiers | Guarantee 72fps floor on Quest 2 while unlocking Quest 3 capabilities | Single lowest-common-denominator target | Euty |
| D-009 | 2026-11-08 | Fixed timestep physics ($dt = 1/120\text{s}$) | Deterministic simulation decoupled from variable display refresh rates (72/80/90/120 Hz) | Frame-rate-dependent delta updates | Euty |
| D-010 | 2026-11-08 | Binding Immersion Charter (`docs/IMMERSION_CHARTER.md`) | Eliminates flat web-style 2D cards/HUDs; enforces diegetic spatial anchors | Standard HTML/CSS world overlays | Euty |
| D-011 | 2026-11-08 | Shared interaction primitives in `src/core/input/primitives/` | Modules forbidden from using raw WebXR input APIs directly; ensures consistency | Ad-hoc controller handlers per module | Euty |
| D-012 | 2026-11-08 | Centralized `src/config/tuning.ts` | Eliminates hardcoded magic numbers for interaction thresholds, haptics, comfort | Dispersed constants in scene code | Euty |
| D-013 | 2026-11-08 | Rocket propulsion safety boundary | Text-book/system-level cycles only; strict prohibition on propellant formulations or manufacturing | Full engineering blueprints | Euty |

---

## 2. Standing Decisions & Operating Rules

### Section A: Workflow & Continuity
1. **Files are Memory:** State is persisted continuously to `docs/STATE.md`, `docs/TASKS.md`, and `docs/PROGRESS_LOG.md`. Fresh sessions resume seamlessly via `RESUME.md`.
2. **Commit Policy:** Commit only when `npm run verify` is fully green and git working tree is clean. Conventional commits required. Tag milestones only upon reviewer approval.
3. **No STOP Gates:** Development proceeds uninterrupted without artificial pausing except for: (a) a decision only the user can make, (b) missing credentials/tools, (c) 3 consecutive verify failures at the same step, or (d) an unresolved safety/accuracy conflict.
4. **Repetition Rule:** Any logic or task performed twice is extracted into a script (`scripts/`) or core utility (`src/core/`).
5. **Honesty Labelling:** Strictly distinguish emulator results (`verified in Playwright/emulator`) from real hardware (`NOT verified on headset`).
6. **No Fabricated Facts:** Factual claims require claim-level verification in `SOURCES.md`. Unverified claims are labeled as such and excluded from learner content.
7. **Tool-Neutral Governance:** `.agents/` is the single source of truth; mirrors are synced via `scripts/sync-agent-configs.mjs`.

### Section B: Hardware & Quality Tiers
1. **Target Hardware:** Meta Quest 3 is primary test headset; Quest 3S and Quest 2 are fully supported. Quest 2 represents performance floor.
2. **Quality Tiers:**
   - **Tier A (Quest 2 baseline):** 72 fps target, <100k triangles, <100 draw calls, KTX2 textures, no real-time shadows.
   - **Tier B (Quest 3 / 3S provisional):** 90/120 fps target, <250k triangles, <180 draw calls, enhanced particle fields, dynamic lighting, color passthrough. *(Tier B metrics marked "NOT measured on device" until physical tuning).*
3. **Runtime Adaptation:** WebXR capability detection (`supportedFrameRates`, `fixedFoveation`, `framebufferScaleFactor`) driven by dynamic quality engine.
4. **Fixed Timestep Simulation:** All physical and numerical integrations run at $dt = 1/120\text{s}$ with accumulator and state interpolation.

### Section C: Immersion Charter
1. **VR-First:** Headset, Touch Plus controllers, and hands are the primary target; desktop is a secondary graceful degradation.
2. **Show, Don't Tell:** Technical concepts are interactive 3D demonstrations (scrub, slice, explode, orient) rather than text blocks.
3. **Diegetic Information:** Information lives on or beside objects via spatial leader lines and 3D tags (Level 1) expanding into micro-simulations (Level 2).
4. **Direct Manipulation:** 3D grab, pull-apart exploded views, cutting planes, and rotational manipulators.
5. **Body Kinematics:** Walking, leaning, crouching, gaze holding, head-tilt alignment.
6. **Scale & Perspective:** Deliberate, comfortable scale shifts (shrink into blood vessels, ride propellant flows, cosmic zooms).
7. **Comfort & Accessibility:** Teleport + snap-turn default, dynamic radial vignette, 100% seated completability.
8. **Anti-Patterns (Banned):** Head-locked HUDs, scroll panes, 2D text walls, multiple-choice quizzes, passive videos.

### Section D: Architecture & Stack
1. **Tech Stack:** TypeScript strict, Vite, Three.js, WebXR Device API, Vitest, Playwright with IWER emulator.
2. **No React, No Backend:** Fully client-side spatial web application; progress store is in-memory behind `SwappableStorage`.
3. **Decoupled Modules:** Modules live in `src/modules/<id>/`, export a `ModuleDefinition`, and communicate only through `src/core/`.
4. **Shared Primitives:** Modules interact strictly through `src/core/input/primitives/` (`grab`, `poke`, `slider`, `lever`, `rotator`, `scalePinch`, `anchor`, `teleport`, `snapTurn`).

### Section E: Content & Safety Scope
1. **Aerospace & Rocket Safety Scope:** System-level educational principles only (cycles, flow paths, thermodynamic tradeoffs). Strictly NO propellant chemical formulations, mixing procedures, ignition methods, or hardware manufacturing instructions.
2. **Medical Content:** Accurate, destigmatizing (U=U for HIV), educational, and non-diagnostic with prominent medical disclaimers.
3. **Misconceptions Explicitly Corrected:** Equal-transit-time lift fallacy, faster-than-light fiction, and astronomical scale illusions addressed directly.

### Section F: Reviews & Definition of Done
1. **Required Reviewers:** `immersion-reviewer`, `science-medical-reviewer`, `comfort-accessibility-reviewer`, `performance-reviewer`, `architect`, `qa-automation`.
2. **Definition of "Ready":** Full spec implemented, `npm run verify` 100% green, 4 reviewer sign-offs, claim-level sourcing, zero regressions on prior modules, tracking updated.

### Section G: Build Strategy & Milestones
1. **Sequential Full-Spec Delivery:** M0 (Toolchain) → M1 (Core & Hub) → M2 (Cosmos) → M3 (Quantum) → M4 (Human Body) → M5 (Aerospace) → M6 (DNA) → M7 (Environment) → M8 (Urban Dev) → M9 (Integration & Polish).
2. **Hard Freeze:** Monday 22:00 Nairobi time (EAT).
