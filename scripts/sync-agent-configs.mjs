#!/usr/bin/env node
/**
 * @file scripts/sync-agent-configs.mjs
 * @description Copies canonical .agents/ files to tool-specific locations.
 *   Syncs skills and agent role files from .agents/ to:
 *   - .claude/skills/ and .claude/agents/ (Claude Code)
 *   - (extend this list as new tools are added)
 *   No symlinks — Windows-safe. Idempotent.
 * @usage node scripts/sync-agent-configs.mjs [--dry-run]
 * @example node scripts/sync-agent-configs.mjs
 * @example node scripts/sync-agent-configs.mjs --dry-run
 */

import { readdir, copyFile, mkdir, readFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

/** @type {Array<{from: string, to: string}>} */
const SYNC_RULES = [
  // Claude Code: skills
  { from: join(ROOT, '.agents', 'skills'), to: join(ROOT, '.claude', 'skills') },
  // Claude Code: agents
  { from: join(ROOT, '.agents', 'agents'), to: join(ROOT, '.claude', 'agents') },
  // Add more tool targets here as needed:
  // { from: join(ROOT, '.agents', 'skills'), to: join(ROOT, '.cursor', 'skills') },
];

async function copyDirRecursive(src, dest) {
  if (!existsSync(src)) {
    console.warn(`  [SKIP] Source does not exist: ${src}`);
    return;
  }
  if (!DRY_RUN) {
    await mkdir(dest, { recursive: true });
  }
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would copy: ${srcPath} → ${destPath}`);
      } else {
        await copyFile(srcPath, destPath);
        console.log(`  Copied: ${basename(srcPath)} → ${destPath}`);
      }
    }
  }
}

async function main() {
  console.log(`sync-agent-configs.mjs ${DRY_RUN ? '(dry run)' : ''}`);
  for (const rule of SYNC_RULES) {
    console.log(`\nSyncing: ${rule.from} → ${rule.to}`);
    await copyDirRecursive(rule.from, rule.to);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error('sync-agent-configs failed:', err.message);
  process.exit(1);
});
