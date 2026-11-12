# DECISIONS.md — Architectural & Product Decisions
_Record all significant decisions with rationale and alternatives considered._

## 1. Architectural Decisions Register

| ID | Date | Decision | Rationale | Alternatives Considered | Decided By |
|----|------|----------|-----------|------------------------|------------|
| D-001 | 2026-11-07 | WebXR emulator: IWER | Meta-backed, headless CI support, Quest 3/3S controller and hand simulation | @immersive-web/webxr-polyfill | Antigravity/Euty |
| D-002 | 2026-11-07 | No React | Stack fixed by brief; Three.js scene graph is the UI layer | React Three Fiber (adds abstraction overhead) | Euty (brief) |
| D-003 | 2026-11-07 | Progress store: in-memory only (Phase 0–M9) | No backend; resets on reload; storage interface allows future swap | localStorage, Supabase | Euty (brief) |
| D-004 | 2026-11-07 | Modules never import each other | Prevents coupling; each module is a self-contained ModuleDefinition | Shared module bus | Euty (brief) |
| D-005 | 2026-11-07 | Canonical rules in AGENTS.md; tool files are thin pointers | Tool-neutral portability; no content duplication | Per-tool rule files | Euty (brief) |
| D-006 | 2026-11-07 | Build order: Cosmos first as vertical slice | Highest wow-factor; covers travel mechanics and scale shifts | Human Body | Euty (brief) |
| D-007 | 2026-11-08 | Primary target headset: Meta Quest 3 (2026-11-12: Quest 3 and 3S only) | Developer's physical test device; Snapdragon XR2 Gen 2 in both | Quest 2 as supported device (dropped 2026-11-12) | Euty |
| D-008 | 2026-11-12 | **Single Quest 3 / 3S baseline replaces Tier A/B.** 90 Hz default, 72 Hz minimum; hard ceilings 250k triangles / 180 draw calls; working target 150k / 108 | One supported hardware family removes a dead low-end branch; Quest 3S is the less capable design target; all numbers remain NOT measured on device | Keeping the Quest 2 floor, or two tiers within Quest 3/3S | Euty |
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

### Section B: Hardware & Quality Baseline
1. **Target Hardware:** Meta Quest 3 (primary) and Quest 3S only. Quest 2 and Quest Pro are not supported. Design for the less capable of the two where they differ.
2. **Single quality baseline:**
   - 90 Hz default, 72 Hz minimum; record the refresh rates the Quest Browser actually exposes.
   - **Hard ceilings (fail verify):** <250k triangles and <180 draw calls per worst-case scene state.
   - **Working target (warn only):** 150k triangles and 108 draw calls, i.e. 60–70 % of the ceilings, until measured on device. All numbers are **NOT measured on device**.
3. **Runtime Adaptation:** WebXR capability detection (`supportedFrameRates`, `fixedFoveation`, `framebufferScaleFactor`) driven by a frame-time dynamic quality controller, because thermals and 90/120 Hz still matter.
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
2. **No Hard Freeze (withdrawn 2026-11-10 by user):** Delivery scope is M6 DNA/Genetics to full Ready, then stop for review. M7–M9 resume only on explicit instruction.
