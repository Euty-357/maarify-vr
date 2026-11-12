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

/** Place the 48 medicine anchors radially around the six wing entrances. */
function medicineAnchorPosition(index: number): THREE.Vector3 {
  // 6 wings, 8 anchors per wing. Distribute around the atrium circle (radius ~3.2m).
  const wingIndex = Math.floor(index / 8);
  const anchorInWing = index % 8;
  const baseAngle = (wingIndex * Math.PI) / 3 - Math.PI / 2;
  const spread = (anchorInWing - 3.5) * 0.08;
  const angle = baseAngle + spread;
  const radius = 3.0 + (anchorInWing % 2) * 0.4;
  const y = 1.0 + (anchorInWing % 4) * 0.16;
  return new THREE.Vector3(Math.sin(angle) * radius, y, -Math.cos(angle) * radius);
}

function toDefinition(anchor: AnchorContent, index: number): SpatialAnchorDefinition {
  return {
    id: anchor.id,
    anchorPosition: medicineAnchorPosition(index),
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
        caption: 'Expert tier: open the folio for clinical mechanisms, equations and sources.',
      },
    },
    sourceRefs: sourceRefs(anchor),
  };
}

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  const content = getModuleContent('human-body');
  if (!content || !content.anchors.length) {
    return [
      {
        id: 'human-body-anchor-heart-valve',
        anchorPosition: new THREE.Vector3(0, 1.3, -1.0),
        label: 'Cardiac Mitral Valve & Pressure Loop',
        level1Note: 'Heart valves function as passive mechanical check valves.',
        level2Simulation: {
          foundation: { type: 'scrubbable-mechanism', description: 'Valves seal tight under pressure.', caption: 'Valves' },
          advanced: { type: 'exploded-view', description: 'Wiggers diagram viewer.', caption: 'Wiggers' },
          expert: { type: 'cross-section-flux', description: 'Frank-Starling PV loop.', caption: 'PV loop' },
        },
        sourceRefs: ['GUYTON-HALL-PHYSIOLOGY-2020'],
      },
    ];
  }
  return content.anchors.map((anchor, index) => toDefinition(anchor, index));
}
