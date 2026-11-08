# DECISIONS.md — Architectural & Product Decisions
_Record all significant decisions with rationale and alternatives considered._

| ID | Date | Decision | Rationale | Alternatives Considered | Decided By |
|----|------|----------|-----------|------------------------|------------|
| D-001 | 2026-11-07 | WebXR emulator: IWER | Meta-backed, headless CI support, Quest 2 controller simulation, successor to browser extension emulator | @immersive-web/webxr-polyfill (lower fidelity) | Antigravity/Euty |
| D-002 | 2026-11-07 | No React | Stack fixed by brief; Three.js scene graph is the UI layer | React Three Fiber (adds abstraction overhead) | Euty (brief) |
| D-003 | 2026-11-07 | Progress store: in-memory only (Phase 0–M9) | No backend; resets on reload; storage interface allows future swap | localStorage (privacy concerns), Supabase (adds backend dep) | Euty (brief) |
| D-004 | 2026-11-07 | Modules never import each other | Prevents coupling; each module is a self-contained ModuleDefinition | Shared module bus (complexity risk) | Euty (brief) |
| D-005 | 2026-11-07 | Canonical rules in AGENTS.md; tool-specific files are thin pointers | Tool-neutral portability; no content duplication | Per-tool rule files (drift risk) | Euty (brief) |
| D-006 | 2026-11-07 | Build order: Cosmos first as vertical slice | Highest wow-factor; covers travel mechanics which are the hardest comfort/UX challenge | Human Body (simpler geometry) | Euty (brief) |
