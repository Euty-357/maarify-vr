# MAARIFY — RESUME INSTRUCTIONS
> **For any AI agent (Antigravity, Claude Code, Codex, or other):** When the user says "resume", "continue", or this is a new session, follow these steps IN ORDER before doing anything else.

## Step 1 — Read context files
1. Read `AGENTS.md`
2. Read `docs/STATE.md`
3. Read `docs/TASKS.md`
4. Read the last 30 lines of `docs/PROGRESS_LOG.md`

## Step 2 — Inspect git state
Run `git status` and `git log -5`.

- **If uncommitted work exists:** inspect every changed file, run `npm run verify`.
  - If verify passes → finish the work and commit per the commit policy.
  - If verify fails → list the files in `docs/STATE.md` under "In progress" and ask the user: *"There is uncommitted work in [files]. Shall I attempt to fix and commit, or revert?"* Never silently discard work.
- **If working tree is clean:** continue to Step 3.

## Step 3 — Six-line status briefing
Report **in at most 6 lines**:
1. Current milestone and phase
2. What is done (last completed task ID)
3. What is in progress
4. What is blocked
5. What you will do next (the exact "Next action" from STATE.md)
6. Any decisions you need from the user before proceeding

## Step 4 — Continue work
Execute the "Next action" from `docs/STATE.md` exactly, following:
- All phase gates (never skip a STOP gate without explicit user approval)
- The commit policy (only commit when `npm run verify` is fully green, with hygiene and budget checks)
- Honesty labelling ("verified by unit test" / "verified in Playwright/emulator" / "NOT verified on headset")
- The repetition-to-scripts rule (if the same operation appears twice, turn it into a script)

## Step 5 — If STATE.md is missing or corrupt
Rebuild it from `git log`, `docs/TASKS.md`, and `docs/PROGRESS_LOG.md`. Tell the user what you reconstructed and what is uncertain.

---

## If you changed tools or cloned freshly
1. Confirm you read `docs/TOOL_COMPATIBILITY.md` and understand where this tool expects rules, skills, and agent definitions.
2. Run `npm run sync:agents` (or `node scripts/sync-agent-configs.mjs`) to copy canonical `.agents/` files into this tool's expected locations (e.g., `.claude/`).
3. Continue from Step 3 above.
