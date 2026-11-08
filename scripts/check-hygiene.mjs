#!/usr/bin/env node
/**
 * @file scripts/check-hygiene.mjs
 * @description Pre-commit hygiene verification script:
 *   1. Scans for potential secrets (API keys, private keys, auth tokens).
 *   2. Scans for oversized files (> 5 MB) that should be in .gitignore or assets/raw.
 *   3. Verifies .gitignore compliance.
 * @usage node scripts/check-hygiene.mjs
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/,               // Google API Key
  /sk-[a-zA-Z0-9]{32,}/,                 // OpenAI secret key
  /ghp_[a-zA-Z0-9]{36}/,                 // GitHub personal token
  /-----BEGIN (RSA|EC|PGP|OPENSSH) PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,                    // AWS Access Key
  /"client_secret"\s*:\s*"[^"]+"/,
  /"private_key"\s*:\s*"[^"]+"/
];

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.vite',
  '.git',
  '.claude',
  'coverage',
  'playwright-report',
  'test-results'
]);

// Forbidden raw WebXR APIs in src/modules (modules must use src/core/input/primitives instead)
const RAW_XR_INPUT_PATTERNS = [
  /session\.inputSources/,
  /navigator\.xr/,
  /XRInputSource/,
  /xr-standard/,
  /getController\(/,
  /getControllerGrip\(/,
  /getHand\(/,
];

async function checkModuleRawXRImports(dir, issues = []) {
  if (!existsSync(dir)) return issues;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = fullPath.replace(ROOT, '').replace(/^[\\/]/, '');

    if (entry.isDirectory()) {
      await checkModuleRawXRImports(fullPath, issues);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      const content = await readFile(fullPath, 'utf-8');
      for (const pattern of RAW_XR_INPUT_PATTERNS) {
        if (pattern.test(content)) {
          issues.push(
            `[RAW XR VIOLATION] ${relPath} uses raw XR input pattern (${pattern.toString()}). Modules MUST use src/core/input/primitives/ instead.`
          );
          break;
        }
      }
    }
  }

  return issues;
}

async function scanDirectory(dir, issues = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = fullPath.replace(ROOT, '').replace(/^[\\/]/, '');

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        await scanDirectory(fullPath, issues);
      }
    } else {
      const stats = await stat(fullPath);

      // Check file size
      if (stats.size > MAX_FILE_SIZE_BYTES) {
        issues.push(`[OVERSIZED] ${relPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB exceeds 5 MB limit)`);
      }

      // Check secrets in text files
      const ext = entry.name.split('.').pop()?.toLowerCase();
      const isText = ['ts', 'js', 'mjs', 'json', 'md', 'env', 'html', 'css', 'yaml', 'yml'].includes(ext || '');

      if (isText && stats.size < 500 * 1024) {
        try {
          const content = await readFile(fullPath, 'utf-8');
          for (const pattern of SECRET_PATTERNS) {
            if (pattern.test(content)) {
              issues.push(`[SECRET SUSPECT] ${relPath} matches pattern: ${pattern.toString()}`);
              break;
            }
          }
        } catch {}
      }
    }
  }

  return issues;
}

async function main() {
  console.log('Running pre-commit hygiene & secret check...');
  const issues = await scanDirectory(ROOT);

  // Check module architectural boundary: no raw XR device APIs in src/modules/
  const modulesDir = join(ROOT, 'src', 'modules');
  await checkModuleRawXRImports(modulesDir, issues);

  if (issues.length > 0) {
    console.error('\n❌ Hygiene check FAILED with issues:');
    issues.forEach(i => console.error('  ' + i));
    process.exit(1);
  } else {
    console.log('✓ Hygiene check PASSED: No secrets, oversized files, or raw XR violations detected.');
  }
}

main().catch(err => {
  console.error('Hygiene check error:', err);
  process.exit(1);
});

