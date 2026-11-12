import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';
import { getModuleContent } from '../../core/content/loader.js';
import type { AnchorContent, TierId } from '../../core/content/schema.js';

function firstParagraph(anchor: AnchorContent, tier: TierId): string {
  const block = anchor.tiers[tier]?.pages[0]?.blocks.find((candidate) => candidate.type === 'paragraph');
  return block && block.type === 'paragraph' ? block.text : anchor.level1Note;
}

function sourceRefs(anchor: AnchorContent): string[] {
  const refs = new Set<string>();
  for (const page of anchor.tiers.expert?.pages ?? []) {
    for (const block of page.blocks) {
      if (block.type === 'sources') block.refs.forEach((ref) => refs.add(ref));
    }
  }
  return [...refs];
}

/** Place the 24 aerospace anchors across the hangar/tarmac, engine stand, and satellite zone. */
function aerospaceAnchorPosition(index: number): THREE.Vector3 {
  // Wing/Aerodynamics zone (indices 0..7): Left station around x ~ -1.5, z ~ -1.2
  if (index < 8) {
    const angle = -Math.PI * 0.4 + (index * Math.PI * 0.25) / 7;
    const r = 0.5 + (index % 2) * 0.2;
    return new THREE.Vector3(-1.4 + Math.sin(angle) * r, 1.0 + (index % 4) * 0.14, -1.2 + Math.cos(angle) * r);
  }
  // Rocket engine / propulsion zone (indices 8..15): Center station around x ~ 0.0, z ~ -1.3
  if (index < 16) {
    const i = index - 8;
    const angle = -Math.PI * 0.3 + (i * Math.PI * 0.6) / 7;
    const r = 1.3 + (i % 2) * 0.35;
    return new THREE.Vector3(Math.sin(angle) * r, 0.95 + (i % 4) * 0.15, -1.3 - Math.cos(angle) * 0.4);
  }
  // Satellite / flight / Kenyan space history zone (indices 16..23): Right station around x ~ 1.4, z ~ -1.1
  const i = index - 16;
  const angle = Math.PI * 0.2 + (i * Math.PI * 0.25) / 7;
  return new THREE.Vector3(1.3 + Math.sin(angle) * 0.6, 1.0 + (i % 4) * 0.14, -1.1 + Math.cos(angle) * 0.6);
}

function toDefinition(anchor: AnchorContent, index: number): SpatialAnchorDefinition {
  return {
    id: anchor.id,
    anchorPosition: aerospaceAnchorPosition(index),
    label: anchor.label,
    level1Note: anchor.level1Note,
    level2Simulation: {
      foundation: {
        type: 'scrubbable-mechanism',
        description: firstParagraph(anchor, 'foundation'),
        caption: anchor.tiers.foundation.pages[0]?.blocks[0]?.type ?? 'concept',
      },
      advanced: {
        type: 'exploded-view',
        description: firstParagraph(anchor, 'advanced'),
        caption: anchor.tiers.advanced.pages[0]?.blocks[0]?.type ?? 'mechanism',
      },
      expert: {
        type: 'cross-section-flux',
        description: firstParagraph(anchor, 'expert'),
        caption: 'Expert tier: open the folio for isentropic flow mathematics, cycles, and sources.',
      },
    },
    sourceRefs: sourceRefs(anchor),
  };
}

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  const content = getModuleContent('aerospace');
  if (!content || !content.anchors.length) {
    return [
      {
        id: 'aerospace-anchor-aerofoil-lift',
        anchorPosition: new THREE.Vector3(-1.2, 1.4, -0.9),
        label: 'Aerofoil Circulation & Lift Physics',
        level1Note: 'Wings create lift by turning oncoming airflow downward.',
        level2Simulation: {
          foundation: { type: 'scrubbable-mechanism', description: 'Rotate angle of attack.', caption: 'Lift' },
          advanced: { type: 'cross-section-flux', description: 'Pressure coefficient distribution.', caption: 'Cp' },
          expert: { type: 'exploded-view', description: 'Boundary layer velocity profile.', caption: 'Boundary layer' },
        },
        sourceRefs: ['NASA-GLENN-LIFT-MYTHS'],
      },
    ];
  }
  return content.anchors.map((anchor, index) => toDefinition(anchor, index));
}
