import * as THREE from 'three';
import { PALETTE, standardMaterial } from '../design/tokens.js';
import { createTextPanel } from '../ui/text-panel.js';

import cosmosSources from '../../modules/cosmos/SOURCES.md?raw';
import quantumSources from '../../modules/quantum/SOURCES.md?raw';
import humanBodySources from '../../modules/human-body/SOURCES.md?raw';
import aerospaceSources from '../../modules/aerospace/SOURCES.md?raw';
import dnaSources from '../../modules/dna-genetics/SOURCES.md?raw';

export interface CreditEntry {
  organisation: string;
  title: string;
  url: string;
}

/** Parse the markdown source tables into de-duplicated organisation credits. */
export function parseSourceCredits(markdown: string): CreditEntry[] {
  const entries: CreditEntry[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const columns = line.split('|').map((column) => column.trim());
    if (columns.length < 5) continue;
    const organisation = columns[2];
    const title = columns[3];
    const url = columns[4];
    if (!organisation || organisation === 'Author / organization' || organisation.startsWith('---')) continue;
    if (!/^https?:\/\//.test(url)) continue;
    entries.push({ organisation, title, url });
  }
  return entries;
}

export function collectCredits(): CreditEntry[] {
  const all = [
    ...parseSourceCredits(cosmosSources),
    ...parseSourceCredits(quantumSources),
    ...parseSourceCredits(humanBodySources),
    ...parseSourceCredits(aerospaceSources),
    ...parseSourceCredits(dnaSources),
  ];
  const seen = new Set<string>();
  return all.filter((entry) => {
    const key = `${entry.organisation}|${entry.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Credits plaque built from the module SOURCES tables plus the asset licence note.
 * No new markdown file is introduced; the data comes from existing sources.
 */
export function createCreditsPlaque(widthMeters = 1.3, heightMeters = 0.8): THREE.Group {
  const group = new THREE.Group();
  group.name = 'credits-plaque';

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(widthMeters, heightMeters, 0.05),
    standardMaterial('brass')
  );
  group.add(frame);

  const credits = collectCredits();
  const lines = [
    'CREDITS',
    'Brand: Maarify logo © Euty',
    'Sources (see each module SOURCES.md):',
    ...credits.slice(0, 8).map((entry) => `${entry.organisation} — ${entry.title.slice(0, 42)}`),
  ];

  const panel = createTextPanel(lines.join('\n'), {
    widthMeters: widthMeters * 0.94,
    heightMeters: heightMeters * 0.92,
    fontSizePx: 18,
    align: 'left',
    lines: lines.length,
    background: '#241610',
    color: PALETTE.parchment.toString(16).padStart(6, '0').replace(/^/, '#'),
    accent: '#b08d57',
    pixelWidth: 640,
    pixelHeight: 480,
  });
  panel.position.z = 0.032;
  group.add(panel);

  return group;
}
