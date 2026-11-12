# CHANGELOG.md
_Follows Keep a Changelog format. Versions map to milestones._

## [0.6.0] — 2026-11-10
### Added
- **M6 DNA / Genetics:** seven spatial beats — cell-interior dive, 4 m double helix with two-hand unzip, complementary base snapping with rejection, room-scale ribosome with A-site translocation, CRISPR guide alignment with NHEJ/HDR outcomes, diversity + sickle-trait exhibit, and a badge/exit horizon.
- Five physical challenges worth **1,025 XP**, five sourced diegetic anchors, and claim-level sources including the African Genome Variation Project and H3Africa.
- Shared `SpatialSlotPrimitive`, diegetic `createTextPanel`, and the `SpatialBadgePlinth` exit-horizon kit in `src/gamification/`.
- XR camera rig with teleport and snap turn, controller-raycast portal entry, real `XRInputSource` haptics, per-frame module animation ticks, and procedural studio lighting.

### Changed
- Hard freeze withdrawn (2026-11-10); delivery scope fixed at M6, then stop.

### Verified
- `npm run verify` green: unit tests, seven Playwright specs, Quest 3/3S budget, zero console errors.
- All hardware performance and feel findings remain **NOT verified on headset**.

## [Unreleased]
### Added
- Interactive VR tuning console: a physical console in the hub opens a world-anchored panel with ray-operated GRAB/HAPTICS/SNAP ±, RESET, EXPORT and CLOSE buttons.
- `docs/CONTROLS.md`: complete control reference for desktop, controllers, hand tracking, in-world controls, URL and console hooks.

### Changed
- Depth-tier selection now propagates from the hub plinth into the loaded module: every anchor updates its tier chip, caption and micro-simulation scale.

### Added
- Project bootstrap: folder structure, governance files, tracking files
- AGENTS.md, RESUME.md, CLAUDE.md, GEMINI.md
- docs/TOOL_COMPATIBILITY.md
- docs/STATE.md, docs/TASKS.md, docs/PROGRESS_LOG.md, docs/DECISIONS.md
- .agents/skills/ (13 skills), .agents/agents/ (9 role files)
- scripts/sync-agent-configs.mjs
- docs/DEVICE_TEST_BACKLOG.md
