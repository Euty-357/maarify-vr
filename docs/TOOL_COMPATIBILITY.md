# Tool Compatibility Notes
_Last updated: 2026-11-07_

## Rules / System Prompt Files

| Tool | Expected file(s) | Notes |
|------|-----------------|-------|
| Antigravity (AGY) | `GEMINI.md`, `.gemini/GEMINI.md`, or skill rules | Points to `AGENTS.md` |
| Claude Code | `CLAUDE.md` (supports `@file` imports) | Points to `AGENTS.md` |
| Codex (OpenAI) | `AGENTS.md` (reads directly) | Canonical file |
| Cursor / Windsurf | `.cursorrules` or `.windsurfrules` | Thin pointer — run `sync-agent-configs.mjs` |
| Other agents | `AGENTS.md` (the shared standard) | Canonical file |

## Subagent / Role Support

| Tool | Subagent support | Fallback |
|------|-----------------|---------|
| Antigravity | Native subagents via invoke_subagent | ✓ |
| Claude Code | `CLAUDE.md` agent definitions (`.claude/agents/`) | Sequential "hat" mode |
| Codex | No native subagent routing | Sequential "hat" mode |

**Sequential "hat" mode:** When a tool lacks subagent routing, the same `.agents/agents/<name>.md` role files are loaded one at a time as instruction overlays. The engineer loads the relevant role file, performs the task, then switches to the next role.

## Skill Locations

| Tool | Canonical source | Synced to |
|------|-----------------|-----------|
| All tools | `.agents/skills/<name>/SKILL.md` | Via `scripts/sync-agent-configs.mjs` |
| Claude Code | `.agents/skills/` → `.claude/skills/` | Auto-synced |
| Antigravity | `.agents/skills/` | Reads directly (configure in AGY settings) |

## Sync Script
Run `node scripts/sync-agent-configs.mjs` whenever skills or agent files change. This copies canonical `.agents/` files to tool-specific locations without symlinks (Windows-safe).

## WebXR Emulator Choice
**Selected: IWER (Immersive Web Emulator Runtime)**
- GitHub: https://github.com/meta-quest/IWER
- Maintained by Meta's Immersive Web team; successor to the browser extension emulator.
- Works headlessly in Node/Playwright (no browser extension required in CI).
- Simulates Quest 2 controller input, 6DOF pose, hand tracking events.
- Alternative considered: `@immersive-web/webxr-polyfill` — lower fidelity, no controller simulation.
- Justification: IWER is the current best option for headless XR testing as of 2026; backed by W3C Immersive Web CG.
