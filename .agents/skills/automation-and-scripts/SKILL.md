---
name: automation-and-scripts
description: >
  How to detect repeated work, write and register scripts, naming conventions,
  idempotency, and cross-platform rules.
  Load when noticing repeated operations or writing scripts.
---

# Automation and Scripts Skill

## Detecting Repeated Work
Trigger a new script whenever you:
- Perform the same operation twice in a session.
- Notice a pattern that will recur across modules (scaffolding, report generation, config sync).
- Find duplicated code in `src/`.

## Script Standards
- Language: **Node.js ESM** (`.mjs` extension). No PowerShell-only or bash-only code.
- Cross-platform: use `path.join()`, `fs.promises`, `process.cwd()`. No hardcoded backslashes.
- Idempotent: running a script twice must not cause errors or duplicate work.
- Self-documenting: JSDoc comment at top describing purpose, usage, and example.
- Error handling: exit with code 1 on failure; print clear error message.

## Registration
Every script in `scripts/` must be listed in `docs/SCRIPTS.md`:
```
| scripts/my-script.mjs | Purpose | Usage: `node scripts/my-script.mjs [args]` | Example |
```

## Naming Conventions
- Kebab-case filenames: `sync-agent-configs.mjs`, `generate-report.mjs`.
- Verb-noun format: `check-budgets`, `scaffold-module`, `optimise-assets`.

## Extending vs Creating
- Before creating a new script, check if an existing script can be extended with a flag or subcommand.
- Document the new flag in `docs/SCRIPTS.md`.

## Example Script Template
```js
#!/usr/bin/env node
/**
 * @file scripts/my-script.mjs
 * @description What this script does.
 * @usage node scripts/my-script.mjs [--flag]
 * @example node scripts/my-script.mjs --dry-run
 */
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

async function main() {
  // ... implementation
}

main().catch(err => { console.error(err); process.exit(1); });
```
