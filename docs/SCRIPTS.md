# SCRIPTS.md — Registered Scripts
_All scripts in scripts/ are documented here. Update this file when adding or modifying a script._

| Script | Purpose | Usage | Example |
|--------|---------|-------|---------|
| `sync-agent-configs.mjs` | Copies canonical .agents/ files to tool-specific locations (Claude, Cursor, etc.) without symlinks | `node scripts/sync-agent-configs.mjs` | Run after editing any file in .agents/ |
| `audit-content-depth.mjs` | Audits `src/modules/<id>/content/module-content.json` against the Panels v2 schema: ≥24 anchors, Foundation ≥1 page / Advanced ≥2 / Expert ≥2, ≤90 words per page, ≤40-word Level 1, Expert sources block, ≥25 glossary terms ×3 tiers, ≥10 mapped objectives, practitioner desk | `node scripts/audit-content-depth.mjs [--enforce]` | Report-only until module content exists; `--enforce` fails on gaps |
| `check-budgets.mjs` | Reads renderer.info values from Playwright e2e runs and fails if the worst captured scene state exceeds the Quest 3/3S ceilings (triangles < 250k, draw calls < 180); warns above the 150k / 108 working target | `node scripts/check-budgets.mjs` | Called automatically by `npm run verify` |
| `generate-report.mjs` | Generates reports/latest.md and reports/history/\<timestamp\>.json from test and budget data | `node scripts/generate-report.mjs` | Called automatically by `npm run verify` |
| `scaffold-module.mjs` | Scaffolds a new module folder (src/modules/\<id\>/) and docs/modules/\<id\>/SPEC.md from the module template | `node scripts/scaffold-module.mjs <id> "<Name>"` | `node scripts/scaffold-module.mjs cosmos "Cosmos"` |
