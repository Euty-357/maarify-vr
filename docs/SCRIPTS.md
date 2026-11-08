# SCRIPTS.md — Registered Scripts
_All scripts in scripts/ are documented here. Update this file when adding or modifying a script._

| Script | Purpose | Usage | Example |
|--------|---------|-------|---------|
| `sync-agent-configs.mjs` | Copies canonical .agents/ files to tool-specific locations (Claude, Cursor, etc.) without symlinks | `node scripts/sync-agent-configs.mjs` | Run after editing any file in .agents/ |
| `check-budgets.mjs` | Reads renderer.info values from Playwright e2e runs and fails if any scene exceeds Quest 2 budgets (triangles < 100k, draw calls < 100) | `node scripts/check-budgets.mjs` | Called automatically by `npm run verify` |
| `generate-report.mjs` | Generates reports/latest.md and reports/history/\<timestamp\>.json from test and budget data | `node scripts/generate-report.mjs` | Called automatically by `npm run verify` |
| `scaffold-module.mjs` | Scaffolds a new module folder (src/modules/\<id\>/) and docs/modules/\<id\>/SPEC.md from the module template | `node scripts/scaffold-module.mjs <id> "<Name>"` | `node scripts/scaffold-module.mjs cosmos "Cosmos"` |
