#!/usr/bin/env node
/**
 * @file scripts/audit-content-depth.mjs
 * @description Audits Information Panels v2 content-as-data.
 *
 * Reads `src/modules/<id>/content/module-content.json` and enforces:
 *   - at least 24 anchors per module (Medicine: 8 per wing is checked by its own spec)
 *   - Foundation ≥1 page, Advanced ≥2, Expert ≥2
 *   - ≤90 words per page; Level 1 note ≤40 words
 *   - a sources block in every Expert tier
 *   - ≥25 glossary terms with three tier definitions
 *   - ≥10 learning objectives, each mapped to an anchor or challenge
 *   - a practitioner desk with at least three tools
 *
 * @usage node scripts/audit-content-depth.mjs [--enforce]
 *   Without --enforce it reports only; with --enforce it exits non-zero on any gap.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MODULES_DIR = join(ROOT, 'src', 'modules');
const ENFORCE = process.argv.includes('--enforce');

const MIN_ANCHORS = 24;
const MIN_GLOSSARY = 25;
const MIN_OBJECTIVES = 10;
const MAX_PAGE_WORDS = 90;
const MAX_LEVEL1_WORDS = 40;
const MIN_PAGES = { foundation: 1, advanced: 2, expert: 2 };
const TIERS = ['foundation', 'advanced', 'expert'];

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function blockText(block) {
  switch (block.type) {
    case 'paragraph': return block.text ?? '';
    case 'keyFacts': return (block.facts ?? []).join(' ');
    case 'table': return [...(block.headers ?? []), ...(block.rows ?? []).flat()].join(' ');
    case 'equation': return `${block.latex ?? ''} ${block.explanation ?? ''}`;
    case 'workedExample': return [block.context ?? '', ...(block.steps ?? []), block.answer ?? ''].join(' ');
    case 'practitionerNote': return `${block.framework ?? ''} ${block.note ?? ''}`;
    case 'sources': return (block.refs ?? []).join(' ');
    case 'diagram3d': return `${block.caption ?? ''} ${(block.controls ?? []).join(' ')}`;
    default: return '';
  }
}

function auditAnchor(anchor) {
  const problems = [];
  if (!anchor.id) problems.push('anchor without id');
  const level1 = countWords(anchor.level1Note ?? '');
  if (level1 > MAX_LEVEL1_WORDS) problems.push(`${anchor.id}: level 1 is ${level1} words (max ${MAX_LEVEL1_WORDS})`);
  for (const tier of TIERS) {
    const content = anchor.tiers?.[tier];
    if (!content) { problems.push(`${anchor.id}: missing ${tier}`); continue; }
    if ((content.pages ?? []).length < MIN_PAGES[tier]) {
      problems.push(`${anchor.id}: ${tier} has ${(content.pages ?? []).length} page(s), minimum ${MIN_PAGES[tier]}`);
    }
    (content.pages ?? []).forEach((page, index) => {
      const words = (page.blocks ?? []).reduce((total, block) => total + countWords(blockText(block)), 0);
      if (words > MAX_PAGE_WORDS) problems.push(`${anchor.id}: ${tier} page ${index + 1} is ${words} words (max ${MAX_PAGE_WORDS})`);
    });
  }
  const hasSources = (anchor.tiers?.expert?.pages ?? []).some((page) =>
    (page.blocks ?? []).some((block) => block.type === 'sources')
  );
  if (!hasSources) problems.push(`${anchor.id}: expert tier has no sources block`);
  return problems;
}

function auditModule(module) {
  const problems = [];
  const id = module.moduleId ?? 'unknown';
  if ((module.anchors ?? []).length < MIN_ANCHORS) {
    problems.push(`${id}: ${(module.anchors ?? []).length} anchors, minimum ${MIN_ANCHORS}`);
  }
  if ((module.glossary ?? []).length < MIN_GLOSSARY) {
    problems.push(`${id}: ${(module.glossary ?? []).length} glossary terms, minimum ${MIN_GLOSSARY}`);
  }
  for (const term of module.glossary ?? []) {
    for (const tier of TIERS) {
      if (!term.tiers?.[tier]?.trim()) problems.push(`${id}: glossary "${term.term}" missing ${tier}`);
    }
  }
  if ((module.objectives ?? []).length < MIN_OBJECTIVES) {
    problems.push(`${id}: ${(module.objectives ?? []).length} objectives, minimum ${MIN_OBJECTIVES}`);
  }
  for (const objective of module.objectives ?? []) {
    if (!objective.mappedTo) problems.push(`${id}: objective ${objective.id ?? '?'} is not mapped`);
  }
  if ((module.practitioner?.tools ?? []).length < 3) {
    problems.push(`${id}: practitioner desk needs at least 3 tools`);
  }
  for (const anchor of module.anchors ?? []) problems.push(...auditAnchor(anchor));
  return problems;
}

async function main() {
  const entries = await readdir(MODULES_DIR, { withFileTypes: true });
  const moduleDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  let found = 0;
  let failed = false;

  for (const moduleId of moduleDirs) {
    const file = join(MODULES_DIR, moduleId, 'content', 'module-content.json');
    let raw;
    try {
      raw = await readFile(file, 'utf-8');
    } catch {
      continue;
    }
    found += 1;
    let module;
    try {
      module = JSON.parse(raw);
    } catch (error) {
      console.error(`❌ ${moduleId}: invalid JSON (${error.message})`);
      failed = true;
      continue;
    }
    const problems = auditModule(module);
    if (problems.length) {
      failed = true;
      console.error(`\n❌ ${moduleId}: ${problems.length} content gap(s)`);
      for (const problem of problems.slice(0, 40)) console.error(`   - ${problem}`);
      if (problems.length > 40) console.error(`   ... ${problems.length - 40} more`);
    } else {
      console.log(`✓ ${moduleId}: ${module.anchors.length} anchors, ${module.glossary.length} glossary terms`);
    }
  }

  if (found === 0) {
    console.log('No module-content.json files yet. Content-as-data migration has not started.');
    if (ENFORCE) {
      console.error('Enforce mode: at least one module content file is required.');
      process.exit(1);
    }
    return;
  }

  if (failed && ENFORCE) {
    console.error('\nContent audit FAILED.');
    process.exit(1);
  }
  if (failed) {
    console.warn('\nContent audit found gaps (report-only mode; add --enforce to fail).');
  } else {
    console.log(`\n✓ Content audit passed for ${found} module(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
