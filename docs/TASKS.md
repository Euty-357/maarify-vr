# TASKS.md — Maarify Task Checklist

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
- [x] `P3-01` Write docs/PLAN.md (audited for Immersion Charter & Quest 2 physics)
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
- [x] `P3-IMMERSION-04` Evaluate 3D physics library options for Quest 2 (custom kinematic constraints vs rapier3d-compat)
- [x] `P3-IMMERSION-05` Citation audit of curriculum-strategy.md -> docs/research/citation-audit.md
- [x] `P3-IMMERSION-06` Medical & science justification -> docs/research/medical-sensitivity-justification.md
- [ ] `P3-12` **STOP: Present Phase 3 Immersion Audit summary, changes, risks, open questions. Wait for user approval.**

## M0: Toolchain (after Phase 3 approval)
- [ ] `M0-01` npm init, install deps (vite, three, typescript, vitest, playwright, iwer)
- [ ] `M0-02` Vite config + TS config
- [ ] `M0-03` Hello-cube scene grabbable in WebXR
- [ ] `M0-04` Desktop fallback working
- [ ] `M0-05` npm run verify pipeline green
- [ ] `M0-06` HEADSET_TEST.md steps verified (emulator)
- [ ] `M0-07` Commit: feat(m0): toolchain and hello-cube verified in emulator

## M1: Core Systems
- [ ] `M1-01` XR session manager
- [ ] `M1-02` Input (controllers + hand tracking)
- [ ] `M1-03` Locomotion (teleport + snap turn + optional smooth)
- [ ] `M1-04` Comfort system (vignette, reduced-motion toggle)
- [ ] `M1-05` Audio manager
- [ ] `M1-06` UI kit (world-space panels, two-tap info card, depth tiers)
- [ ] `M1-07` Challenge framework
- [ ] `M1-08` In-memory progress store
- [ ] `M1-09` Hub scene with portals
- [ ] `M1-10` Shared simulation utilities (stakeholder sim, particle fields)
- [ ] `M1-11` npm run verify green → commit

## M2: Cosmos (vertical slice)
- [ ] `M2-01` Earth surface scene
- [ ] `M2-02` Atmosphere ascent (layers, Karman line)
- [ ] `M2-03` Low Earth orbit (ISS, Hubble, satellites, debris, Moon)
- [ ] `M2-04` Destination selector
- [ ] `M2-05` Travel system (real light-speed mode + cinematic warp, comfort compliant)
- [ ] `M2-06` Sun destination
- [ ] `M2-07` Planets (all 8, key facts + challenge each)
- [ ] `M2-08` Nearby stars + stellar life cycles
- [ ] `M2-09` Black holes (event horizon, photon sphere, accretion disc, lensing)
- [ ] `M2-10` Quasars/AGN, galaxies, scale of universe
- [ ] `M2-11` All info cards (both tap levels, all tiers)
- [ ] `M2-12` ≥3 challenges + capstone
- [ ] `M2-13` "Where this is going" panel
- [ ] `M2-14` Autopilot Playwright test
- [ ] `M2-15` Both read-only reviewers signed off
- [ ] `M2-16` npm run verify green → commit + tag v0.2
- [ ] `M2-17` Write docs/RETRO_COSMOS.md → STOP

## M3–M8: Remaining modules (after RETRO approval)
- [ ] M3: Quantum
- [ ] M4: Human Body & Medicine
- [ ] M5: Aerospace + Fluid Dynamics
- [ ] M6: DNA/Genetics
- [ ] M7: Environment
- [ ] M8: Urban Development

## M9: Integration & Polish
- [ ] Performance pass
- [ ] Entertainment polish
- [ ] Pilot-ready build
- [ ] Deployment guide
- [ ] Consolidated headset test session plan
