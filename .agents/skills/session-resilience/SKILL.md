---
name: session-resilience
description: >
  How to maintain STATE.md, TASKS.md, PROGRESS_LOG.md, DEVICE_TEST_BACKLOG.md,
  the commit policy, and hand over between tools cleanly.
  Load at the start of every session and before any risky operation.
---

# Session Resilience Skill

## STATE.md Maintenance
Update `docs/STATE.md` after every completed task:
1. Update "Last Completed Task."
2. Clear "In Progress" (or add newly in-progress items).
3. Update "Next Action" to the exact next step.
4. Record the commit hash if a commit was made.
5. Record which tool/session last worked.

Before any risky or long operation:
- Write to STATE.md: "In progress: [operation], files: [list]" BEFORE starting.

## TASKS.md Maintenance
- Tick `[x]` checkboxes as tasks complete.
- Never delete tasks — add new tasks with new IDs if scope changes.

## PROGRESS_LOG.md Maintenance
- Append-only. Never edit or delete existing entries.
- Format: `## YYYY-MM-DDTHH:MM TZ | Session N | Tool`
- Record: what was done, what was found, decisions made.

## DEVICE_TEST_BACKLOG.md Maintenance
- Add a new entry for every capability that cannot be verified in emulator.
- Use the standard template (see the file).
- Never mark an item "verified on headset" without an actual device test session record.

## Commit Policy (enforced)
1. Run `npm run verify` → must be fully green.
2. Write conventional commit message: `type(scope): description`.
3. `git add -A && git commit -m "message"`.
4. Record hash in `docs/STATE.md`.
5. Never commit failing tests, partial features, or WIP code.

## Tool Handover Checklist
When switching tools (e.g., Antigravity → Claude Code):
1. Ensure `docs/STATE.md` is current.
2. Ensure last commit is green (or uncommitted work is documented in STATE.md).
3. Run `node scripts/sync-agent-configs.mjs` to sync `.agents/` to tool-specific locations.
4. New tool reads `RESUME.md` → follows its steps.
