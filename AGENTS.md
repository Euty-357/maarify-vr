# MAARIFY — AGENTS & RULES
> **Resume rule:** If the user says "resume", "continue", or this is a new session, read `RESUME.md` first, then follow its steps in order.

## Product & Target Hardware
Maarify is a gamified WebXR learning app delivered as a web app. Seven full 10–20 min modules under a spatial hub, three depth tiers (Foundation / Advanced / Expert).
- **Target Hardware:** Meta Quest 3 (primary) and Meta Quest 3S only. Quest 2 and Quest Pro are **not supported**. Design for the less capable of the two where they differ; all performance/feel claims are "NOT measured on device" until measured on Quest 3/3S.
- **Single Quality Baseline (Quest 3 / 3S):** 90 Hz default, 72 Hz minimum. Hard ceilings per worst-case scene: **<250k triangles, <180 draw calls**. Working target is 60–70 % of the ceilings (**150k triangles, 108 draw calls**) until measured on device. The dynamic quality controller remains: frame-time-based framebuffer scale (0.7–1.2), fixed foveation, particle and effect counts, because thermals and 90/120 Hz still matter.
- **Dynamic Quality Engine:** Runtime capability detection via `session.supportedFrameRates`, `session.updateTargetFrameRate()`, `XRWebGLLayer.fixedFoveation` (0.0 to 1.0), and `framebufferScaleFactor` (0.7 to 1.2). A frame-time-based dynamic quality controller scales visual fidelity dynamically to prevent dropped frames.
- **Fixed Timestep Simulation:** All physical and numerical simulations run on an accumulator-driven fixed timestep ($dt = 1/120\text{s}$) with state interpolation, completely decoupled from render frame rate (72/80/90/120 Hz).
- **Binding Immersion Charter (`docs/IMMERSION_CHARTER.md`):** VR-first, hands-first. Desktop exists only as a test harness; the learner target is Quest 3/3S. Show, don't tell: Level 2 technical content must be an interactive 3D demonstration (scrub, pitch, slice, rotate), not a text block.
- **Diegetic Spatial Anchors:** No head-locked HUDs, scroll panes, or floating cards. Info is anchored on/next to objects with spatial leader lines. Level 1 = 3D tag (≤40 words); Level 2 = exploded/scrubbable micro-simulation at that spot.

## Stack (fixed)
- **Language:** TypeScript strict
- **Build:** Vite
- **3D/XR:** Three.js + WebXR Device API
- **Testing:** Vitest (unit), Playwright + WebXR emulator (e2e/emulated XR)
- **WebXR emulator:** IWER (Immersive Web Emulator Runtime; https://github.com/meta-quest/IWER)
- **No React.** No backend. No accounts. No runtime network calls.
- **Progress store:** in-memory behind a storage interface (resets on reload; backend-swappable later).

## Architecture
```
src/
  core/          # XR session, input (Touch Plus/hands), locomotion, comfort,
                 # spatial audio, diegetic anchor kit, store, fixed timestep physics,
                 # dynamic quality controller, shared stakeholder simulation
  hub/           # Hub scene, physical portals
  modules/<name> # One folder per module; exports ModuleDefinition
  gamification/  # XP, badges, spatial status plinths
```
- Modules **never import each other.** Adding a module must **not** require changes to `src/core`.

## Comfort & Accessibility
- Teleport + snap turn default; optional smooth locomotion with vignette.
- Seated mode: every module 100% completable seated.
- Spatial Anchors: 1–2 m from user, minimum readable text size (≥24 pt equivalent at 1 m). No forced camera motion ever.
- Warp/travel: user-initiated, short, fixed visual frame of reference (cockpit frame), vignette on, reduced-motion toggle.

## Content & Safety Rules
- Accuracy over spectacle; plain language; analogies state where they break down.
- Known misconceptions called out (equal-transit-time lift myth, FTL travel fiction).
- Medical content (HIV, cancer): accurate, destigmatising, non-diagnostic, education-only disclaimer.
- **Rocket Propulsion Safety Scope:** Educational and system-level principles only (cycles, flow paths, propellant trade-offs). Strictly NO propellant formulations, mixing, ignition, or hardware fabrication instructions.
- Every factual claim sourced in that module's `SOURCES.md`. Unverified numbers marked "unverified."
- Simulations labelled "simplified model — not engineering grade."

## Commit & Hygiene Policy
Commit **only** when:
1. `npm run verify` is fully green (typecheck + lint + unit tests + Playwright/emulator + budget checks + hygiene check + console-error check).
2. `git status` inspected; zero secrets, large binaries (>5MB), or untracked files staged.
3. Meaningful, complete unit; conventional commit message. Tag a milestone only after verify is green AND required reviewers sign off.
4. Exception: One-time baseline docs commit permitted prior to M0 code.

## Honesty Labelling
- `verified by unit test`
- `verified in Playwright/emulator`
- `NOT verified on headset` (all Quest 3 / 3S hardware-specific performance and feel metrics)

## Reviewers (sign-off required to close a module)
| Reviewer | Scope |
|----------|-------|
| `architect` | Coupling, budget violations, duplicated logic |
| `immersion-reviewer` | VR-first, spatial anchors, direct manipulation, body kinematics |
| `science-medical-reviewer` | Accuracy, sources, tone, medical sensitivity, rocket safety scope |
| `comfort-accessibility-reviewer` | Comfort, seated completability, legibility, motion sickness |
| `performance-reviewer` | Budget measurements (Quest 3/3S ceilings: 250k tris / 180 draws; 90 Hz target, 72 Hz floor; all NOT measured on device) |
| `qa-automation` | Tests passing, zero console errors, reports generated |

## Build Strategy: Full Sequential Delivery
Modules built one by one to 100% full SPEC before starting the next.
Order (revised 2026-11-12): foundation → M2 Cosmos → Medicine (six wings) → Aerospace → Climate Change → Urban Development & Planning → Quantum → DNA → Integration & Polish.
Desktop/mobile UX is dropped; IWER-driven tests are kept. Audio and narration are last.

## npm run verify
Runs: `sync:agents` → `check:hygiene` → `typecheck` → `lint` → `test:unit` → `test:e2e` → `test:budget` → `generate-report`. Must be fully green before any code commit.
