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
| D-014 | 2026-11-22 | Same-origin static GLB build-time assets | Build-time static GLB files served from public/models/<module>/; no runtime network calls to other origins; no third-party hosts | Procedural-only geometry; runtime GLB fetching from external CDNs | Owner (approved) |
| D-015 | 2026-11-23 | Course system in `src/core/course/` with a shared event bus | Missions must be data-driven and fed by the shared interaction primitives, never raw XR input; a single event bus keeps mission code testable and free of Three.js dependencies | Per-module bespoke mission logic; polling the controller state from mission code | Lead Engineer |
| D-016 | 2026-11-23 | Star sprite is a procedural `DataTexture`, not a canvas texture | A canvas texture needs a DOM, which broke the alpha map in headless unit tests; a DataTexture works in the browser, in WebXR and in Node with no network request | CanvasTexture (needs DOM); shipped PNG asset (adds a file and a load) | Lead Engineer |
| D-017 | 2026-11-23 | Hint ladder levels are 1/2/3 (highlight / clearer / show me) | The three hint strings in `hints[0..2]` map one-to-one onto the three ladder rungs at 20 s, 45 s and 90 s; a 0-based ladder silently skipped the clearer hint | Two-level ladder with a combined "clearer" rung; separate hint arrays per rung | Lead Engineer |
| D-018 | 2026-11-23 | Pointer hit selection lives in one pure function (`src/core/input/ray-hit.ts`); `PointerPipeline` is kept but not wired into `main.ts` | The pointer bug was a duplicated, divergent rule: `main.ts` raycast the whole scene recursively and filtered with a `isIgnoredExplodableBase` hack, while `PointerPipeline` had its own (unused) registration model. `ray-hit.ts` is now the single rule — hidden objects never stop the beam and only interactables do. `PointerPipeline` is the intended home for per-hand hover state, so it is kept and now shares the same visibility rule rather than deleted; wiring it into `main.ts` is a larger refactor that is out of scope for this batch | Delete `PointerPipeline` and its tests; wire `PointerPipeline` as the only pointer path (large refactor); keep both rules (the bug) | Lead Engineer |
| D-019 | 2026-11-23 | `src/core/course/` and `src/core/mission/` are one system split by responsibility; scoring lives only in the progress store | A parallel scoring implementation in the course would drift from the store's XP, badge and capstone totals. The course computes a score and forwards it through the `CourseScoreSink` interface, which the in-memory store implements | Keep a separate course ledger; move the mission board into `core/course` (would duplicate the existing diegetic board) | Lead Engineer |
| D-020 | 2026-11-23 | The "i" anchor badge and the anchor leader line are DELETED, not kept hidden | Information System V3 replaced the floating "i" glyph with engraved brass placards, so both were permanently invisible but still allocated a geometry, a material and a canvas texture per anchor. The batched leader-line replacement was left visible, which drew a permanent ray from every anchor to nowhere. Deleting them removes the leak and the ray at the source | Keep them hidden (still leaks a texture per anchor); keep the leader line as a real feature (needs a design pass) | Lead Engineer |

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

### Section D.1: Static GLB Build-Time Assets (D-014)

1. **What:** Same-origin, build-time static GLB files are served from `public/models/<module>/`.
   - `scripts/sync-assets.mjs` (`npm run sync:assets`) copies GLBs from `MAARIFY_ASSETS_DIR`
     (default `C:\MaarifyAssets`) into `public/models/<module>/`, verifies SHA-256 against
     `manifest.json`, fails on mismatch, warns on missing files.
   - It generates `src/core/assets/registry.generated.ts` with typed ids, URLs, part ids,
     and triangle counts.
   - `src/core/assets/` provides `loadGlbAsset()` (GLTFLoader), `parseAssetNodes()` (typed
     parts/anchors/flows/roles extraction), and `AssetCache` (reference counting, full
     disposal on release).
2. **Why:** The owner approved a narrow exception to the "no external assets" rule so that
   author-created models (engines, heart, virion, cryostat, etc.) can be used instead of
   purely procedural geometry. Build-time copying means zero runtime network calls.
3. **Consequences:**
   - Build step now requires `npm run sync:assets` before dev/preview if assets changed.
   - `public/models/` is treated as build output (generated, not hand-edited).
   - Missing asset files in `C:\MaarifyAssets` produce warnings, not errors — modules
     degrade gracefully when assets are absent.
   - All runtime geometry loads are same-origin (`/models/...`); no third-party hosts,
     no runtime network calls to other origins. The "no runtime network calls" rule is
     preserved because assets are bundled at build time and served from the same origin.
   - Asset sizes/shapes may change over time; part ids are stable. Placement code scales
     and rotates assets at runtime.
4. **How it respects "no runtime network calls":** All GLBs are copied to `public/models/`
   at build time and served by the dev server / static host from the same origin. The app
   never fetches from `C:\MaarifyAssets` or any third-party URL at runtime.

### Section D.2: Graphics Library Evaluation (Prompt 0)

_Licences and sizes checked before adoption. No new dependency is installed unless the benefit clearly beats the cost on Quest 3 / 3S._

| Library | Licence | Size impact | Verdict for Maarify |
|:--------|:--------|:------------|:--------------------|
| `three-mesh-bvh` | MIT | ~60 kB min+gzip | **Defer.** BVH acceleration is only worth it once the Cosmos and DNA scenes have tens of thousands of pickable triangles. Today the raycast cost is dominated by a few hundred meshes. Adopt when the exoplanet catalogue or the instanced DNA fields make picking slow. |
| `troika-three-text` | MIT | ~120 kB min+gzip | **Defer.** The repo already renders every panel with `createTextPanel` (CanvasTexture), which is adequate at the panel sizes in use and costs no extra bundle. troika earns its place only if panels need long scrolling bodies or SDF crispness at 4K. |
| `@pmndrs/uikit` | MIT | ~90 kB min+gzip | **Reject for now.** It targets React; the stack has no React (D-002). Its vanilla core would still be a second UI framework competing with the folio panel. |
| `GPUComputationRenderer` | MIT (Three.js) | 0 (ships with three) | **Adopt later, not yet.** It is already available inside `three/examples`, so no new dependency. It is the right tool for the Cosmos wind-tunnel / Aerospace potential-flow particle fields, but the current Aerospace flow already runs on 200 CPU-driven points and stays inside budget. Adopt when the particle count passes ~10 k. |
| Three.js clipping planes + stencil caps | MIT (Three.js) | 0 (ships with three) | **Adopt.** Zero new dependency and the medicine cutaway wing needs it (Heart M2). The stencil-cap technique is documented in the Three.js `webgl_clipping_stencil` example. |
| `vite-plugin-glsl` | MIT | dev-only | **Defer.** The one custom shader in the repo (Cosmos black hole) embeds its GLSL in a template string, which is readable and needs no plugin. Adopt if shader count grows past a handful. |
| `gltf-transform` | MIT (CLI) | dev-only | **Adopt for the asset pipeline.** The GLBs are authored in Blender and exported with extras; running `gltf-transform` in `sync-assets.mjs` would dedupe and prune them. Deferred to the asset-pipeline follow-up because the current GLBs are already within budget (max 28 428 triangles, max 125 estimated draw calls). |
| Poly Haven / ambientCG textures | CC0 | varies | **Adopt when textures arrive.** CC0 removes the share-alike obligations that Z-Anatomy/BodyParts3D (CC BY-SA) would impose. |
| NASA / NIH 3D Resources | Public domain | varies | **Adopt for Cosmos and Anatomy.** Public domain means no attribution requirement, but the credits plaque will still list the source for honesty. |
| Z-Anatomy / BodyParts3D | CC BY-SA | 100–500 MB source | **Manual download only, and listed as an asset request.** The share-alike licence propagates to derived meshes and the source archive is too large to fetch in a build. Listed under "Asset requests" in docs/STATE.md rather than downloaded automatically. |

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
