# TASKS.md — Maarify Task Checklist

## Hardware Baseline (2026-11-12)
- [x] `HW-01` Drop Quest 2/Pro; single Quest 3/3S baseline (AGENTS, DECISIONS, CHARTER, PLAN, ARCHITECTURE, docs, skills, agents)
- [x] `HW-02` Single ceilings 250k tris / 180 draws; working target 150k / 108; verify + report updated
- [x] `HW-03` Tuning single `quality` block; tests updated; 90 Hz default, 72 Hz floor
- [x] `HW-04` One-time dismissible notice for non-Quest-3 headsets
- [x] `HW-05` Move input edge/pinch/source state into `src/core/input/input-state.ts` with 8 unit tests; `main.ts` consumes it (poses, sources, pinch hysteresis)
- [x] `HW-06a` Design tokens (`src/core/design/tokens.ts`) and warm hub re-skin
- [x] `HW-06b` Brand plaque with automatic logo wiring, page title/favicon
- [x] `HW-06c` Credits plaque generated from module SOURCES
- [ ] `HW-06d` Full Reading Room architecture (shelves, arched windows, orrery, lectern)
- [x] `HW-07a` Content schema (`src/core/content/schema.ts`) + 5 unit tests
- [x] `HW-07b` `audit-content-depth.mjs` and `npm run audit:content` (report-only; `--enforce` fails on gaps)
- [x] `HW-07c1` Cosmos source pack (36 entries) + first content batch: 7/24 anchors, 25 glossary, 10 objectives, practitioner desk; verified quotes for 3/15 high-risk claims
- [x] `HW-07c2a` Panels v2 folio renderer (tier tabs, paging, collapse, gentle turn, grab) + 3 state tests + Cosmos e2e assertion
- [x] `HW-07c2b` Cosmos 24/24 anchors + all anchors placed in the scene + `audit:content --enforce` passes
- [x] `HW-07c2c` 15/15 exact claim quotes recorded; San Marco and Sun figures corrected from primary sources
- [ ] `HW-07c2c2` Verify the 100 km Kármán convention or replace it with a retrievable source
- [ ] `HW-07c2d` Cosmos draw-call optimisation (132 -> ≤126, ideally ≤108)
- [ ] `HW-07d` Content-as-data migration for the other modules (same source-pack-first rule)
- [ ] `HW-08` Explodable Assembly primitive + settings/sections framework
- [ ] `HW-09` Hosting readiness (build/preview, _headers, lazy modules, size report)

## Phase 0: Environment & Portability
- [x] `P0-01` Verify node, npm, git versions
- [x] `P0-02` Create folder structure (src/, tests/, scripts/, docs/, assets/, .agents/)
- [x] `P0-03` Write RESUME.md, AGENTS.md, CLAUDE.md, GEMINI.md
- [x] `P0-04` Write docs/TOOL_COMPATIBILITY.md
- [x] `P0-05` Write all 13 skill files (.agents/skills/)
- [x] `P0-06` Write all 9 agent role files (.agents/agents/)
- [x] `P0-07` Write scripts/sync-agent-configs.mjs
- [x] `P0-08` Write tracking files (STATE.md, TASKS.md, PROGRESS_LOG.md, DECISIONS.md, CHANGELOG.md, SCRIPTS.md, DEVICE_TEST_BACKLOG.md)
- [x] `P0-09` Write package.json with npm run verify pipeline
- [ ] `P0-10` Initial git commit (verify green)

## Phase 1: Governance Complete
- [x] `P1-01` All governance files reviewed and confirmed by user

## Phase 2: Research
- [x] `P2-01` Run research-curriculum agent
- [x] `P2-02` docs/research/curriculum-strategy.md complete and reviewed

## Phase 3: Planning & Immersion Audit (STOP gate)
- [x] `P3-01` Write docs/PLAN.md (audited for Immersion Charter & Quest 3/3S physics)
- [x] `P3-02` Write docs/ARCHITECTURE.md (audited for Diegetic Spatial Anchors & kinematic solvers)
- [x] `P3-03` Write docs/MODULE_TEMPLATE.md (audited with mandatory Immersion Map)
- [x] `P3-04` Write docs/HEADSET_TEST.md
- [x] `P3-05` Write docs/modules/cosmos/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-06` Write docs/modules/quantum/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-07` Write docs/modules/human-body/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-08` Write docs/modules/aerospace/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-09` Write docs/modules/dna-genetics/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-10` Write docs/modules/environment/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-11` Write docs/modules/urban-development/SPEC.md (with Immersion Map & Diegetic Anchors)
- [x] `P3-IMMERSION-01` Write docs/IMMERSION_CHARTER.md (10 binding principles)
- [x] `P3-IMMERSION-02` Add .agents/skills/spatial-interaction-design/SKILL.md & .agents/agents/immersion-reviewer.md; sync to .claude/
- [x] `P3-IMMERSION-03` Audit all 7 module specs with comprehensive Immersion Maps & Diegetic Spatial Anchors
- [x] `P3-IMMERSION-04` Evaluate 3D physics library options for Quest 3/3S (custom kinematic constraints vs rapier3d-compat)
- [x] `P3-IMMERSION-05` Citation audit of curriculum-strategy.md -> docs/research/citation-audit.md
- [x] `P3-IMMERSION-06` Medical & science justification -> docs/research/medical-sensitivity-justification.md
- [ ] `P3-12` **STOP: Present Phase 3 Immersion Audit summary, changes, risks, open questions. Wait for user approval.**

## M0: Toolchain (after Phase 3 approval)
- [x] `M0-01` npm init, install deps (vite, three, typescript, vitest, playwright, iwer, @types/node)
- [x] `M0-02` Vite config + TS config + Vitest config + Playwright config + ESLint flat config
- [x] `M0-03` Hello-cube scene grabbable in WebXR
- [x] `M0-04` Desktop fallback working with pointer raycast grab toggle
- [x] `M0-05` npm run verify pipeline green
- [x] `M0-06` HEADSET_TEST.md steps verified (emulator + multi-pose screenshot matrix)
- [x] `M0-07` Commit: feat(m0): toolchain and hello-cube verified in emulator (`b77ff9e`)

## M1: Core Systems & Spatial Hub
- [x] `M1-01` XR session manager (immersive-vr with frame rate negotiation and desktop fallback)
- [x] `M1-02` Input (Touch Plus controllers + optical hand tracking detection)
- [x] `M1-03` Locomotion & Comfort (comfort system with dynamic radial vignette, snap-turn angle helper)
- [x] `M1-04` WebXR gamepad haptic triggers (`triggerHapticPulse`)
- [x] `M1-05` Audio manager (Web Audio API HRTF spatialized panner with oscillator ping generator)
- [x] `M1-06` Diegetic Spatial Anchor kit (3D tags with leader lines, micro-sim root expansion/collapse state machine)
- [x] `M1-07` Fixed-timestep physics accumulator (dt = 1/120s) with Vitest multi-frame rate determinism test
- [x] `M1-08` In-memory progress store behind SwappableStorage interface with unit test suite
- [x] `M1-09` Spatial Hub scene with 7 physical portals and depth-tier selector plinth
- [x] `M1-10` ~~Hub Device Smoke-Test Zone~~ removed 2026-11-12; device checks now live in `docs/HEADSET_TEST.md`
- [x] `M1-11` npm run verify green → commit (`0c13267`)

## M2: Cosmos (vertical slice)
- [x] `M2-01` Earth surface scene
- [x] `M2-02` Atmosphere ascent (layers, Karman line)
- [x] `M2-03` Low Earth orbit (ISS, Hubble, satellites, debris, Moon)
- [x] `M2-04` Destination selector
- [x] `M2-05` Travel system (real light-speed mode + cinematic warp, comfort compliant)
- [x] `M2-06` Sun destination
- [x] `M2-07` Planets (all 8, key facts + challenge each)
- [x] `M2-08` Nearby stars + stellar life cycles
- [x] `M2-09` Black holes (event horizon, photon sphere, accretion disc, lensing)
- [x] `M2-10` Quasars/AGN, galaxies, scale of universe
- [x] `M2-11` All info cards (both tap levels, all tiers)
- [x] `M2-12` ≥3 challenges + capstone
- [x] `M2-13` "Where this is going" panel
- [x] `M2-14` Autopilot Playwright test
- [x] `M2-15` Both read-only reviewers signed off
- [x] `M2-16` npm run verify green → commit + tag v0.2
- [x] `M2-17` Write docs/RETRO_COSMOS.md → STOP

## M3–M8: Remaining modules (after RETRO approval)
- [x] M3: Quantum
- [x] M4: Human Body & Medicine
- [x] M5: Aerospace + Fluid Dynamics
- [x] M6: DNA/Genetics
- [ ] M7: Environment
- [ ] M8: Urban Development

## M9: Integration & Polish
- [ ] Performance pass
- [ ] Entertainment polish
- [ ] Pilot-ready build
- [ ] Deployment guide
- [ ] Consolidated headset test session plan

---

## Module Pipeline Status Matrix
_Execution Mode: Sequential Full-Spec Build Order | Scope: complete M6 DNA/Genetics to Ready, then stop (freeze withdrawn 2026-11-10)_

| Module | Status | SPEC & Immersion Map | Verify Suite Green? | Reviewer Sign-Offs | Claim-Level Sourcing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0: Toolchain Spike** | Ready | Ready | Yes (Green) | Approved | N/A |
| **M1: Core Systems & Hub** | Ready | Ready | Yes (Green) | Approved | N/A |
| **M2: Cosmos** | Ready | Ready | Yes (Green) | Approved (4/4) | Approved (12 verified) |
| **M3: Quantum** | Ready | Ready | Yes (Green) | Approved (4/4) | Approved (12 verified) |
| **M4: Human Body & Medicine** | Ready | Ready | Yes (Green) | Approved (4/4) | Approved (10 verified) |
| **M5: Aerospace & Propulsion** | Ready | Ready | Yes (Green) | Approved (4/4) | Approved (10 verified) |
| **M6: DNA / Genetics** | Ready | Ready | Yes (Green) | Pending (4 reviewers) | Approved (10 entries) |
| **M7: Environment** | Planned | Ready | Pending | Pending | Pending |
| **M8: Urban Development** | Planned | Ready | Pending | Pending | Pending |
| **M9: Integration & Polish** | Planned | Ready | Pending | Pending | Pending |
