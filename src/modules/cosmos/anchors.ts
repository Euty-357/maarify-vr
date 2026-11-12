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

/** Place the extra content anchors on two arcs in front of the observer. */
function extraAnchorPosition(index: number): THREE.Vector3 {
  const angle = -Math.PI / 3 + (index * Math.PI * 2) / 20;
  const radius = 2.1 + (index % 3) * 0.35;
  return new THREE.Vector3(Math.sin(angle) * radius, 1.0 + (index % 4) * 0.14, -Math.cos(angle) * radius);
}

function toDefinition(anchor: AnchorContent, index: number): SpatialAnchorDefinition {
  return {
    id: anchor.id,
    anchorPosition: extraAnchorPosition(index),
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
        caption: 'Expert tier: open the folio for the worked mathematics and sources.',
      },
    },
    sourceRefs: sourceRefs(anchor),
  };
}

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  const base: SpatialAnchorDefinition[] = [
    {
      id: 'cosmos-anchor-karman-line',
      anchorPosition: new THREE.Vector3(0, 1.3, -1.2),
      label: 'The Karman Line (100 km)',
      level1Note:
        'An agreed human convention (~100 km) where aerodynamic lift requires speeds exceeding orbital velocity; not a physical boundary.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Interactive air density column: scrub your hand vertically to watch molecular density transition from dense sea-level fog to high-vacuum space.',
          caption: 'Molecular density drops by a factor of 1 million by 100 km altitude.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Barometric pressure slider demonstrating exponential lapse rate P = P0 * exp(-h / H) with live altitude readouts.',
          caption: 'Standard scale height H ≈ 8.5 km in Earth\'s lower atmosphere.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Aerodynamic lift vs orbital speed boundary plane illustrating where aircraft stall speed equals circular Keplerian velocity.',
          caption: 'Lift equation L = 0.5 * rho * v^2 * S * Cl fails when required v exceeds orbital velocity sqrt(GM/r).',
        },
      },
      sourceRefs: ['VON-KARMAN-1956', 'NOAA-US-STANDARD-ATMOSPHERE-1976'],
    },
    {
      id: 'cosmos-anchor-iss-satellite',
      anchorPosition: new THREE.Vector3(0.8, 1.4, -1.0),
      label: 'Low Earth Orbit (LEO)',
      level1Note:
        'Satellites in low Earth orbit, including Kenya\'s Taifa-1, remain in continuous freefall while moving sideways fast enough to follow Earth\'s curvature.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Two-handed grab gesture explodes the satellite into solar arrays, reaction wheels, communications transponder, and spectrometer payload.',
          caption: 'Satellites require independent attitude control (reaction wheels) in vacuum.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Orbital velocity balancing lever: observe how increasing altitude reduces required circular speed according to v = sqrt(GM/r).',
          caption: 'Gravity does not vanish in LEO; at 400 km, g is still ~90% of sea-level value.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Thermospheric residual drag cutting plane displaying orbital decay rate and ballistic coefficient beta = m / (Cd * A).',
          caption: 'Atomic oxygen in the thermosphere exerts drag requiring periodic re-boosts.',
        },
      },
      sourceRefs: ['NASA-ORBITAL-MECHANICS-2020', 'KSA-TAIFA-1-2023'],
    },
    {
      id: 'cosmos-anchor-sagittarius-a',
      anchorPosition: new THREE.Vector3(-0.8, 1.3, -1.0),
      label: 'Sagittarius A* Black Hole',
      level1Note:
        'Supermassive black hole at Milky Way\'s center (4.15 million solar masses). Light cannot escape within the Schwarzschild event horizon.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Toss a glowing test probe toward the event horizon; watch it appear to slow, freeze, and dim red due to gravitational time dilation.',
          caption: 'External observers never see an object cross the event horizon in coordinate time.',
        },
        advanced: {
          type: 'cross-section-flux',
          description:
            'Interactive slicing plane cutting through the photon sphere (r = 1.5 rs) and innermost stable circular orbit (ISCO at r = 3 rs).',
          caption: 'Photons can temporarily orbit in unstable circular paths at 1.5 Schwarzschild radii.',
        },
        expert: {
          type: 'scrubbable-mechanism',
          description:
            'Relativistic Doppler beaming dial: rotate observation angle to see how approaching plasma on the disc is blueshifted and brightened.',
          caption: 'Doppler beaming factor D = [gamma * (1 - beta * cos(theta))]^(-3) creates asymmetric disc brightness.',
        },
      },
      sourceRefs: ['EHT-SGR-A-2022', 'GENZEL-GHEZ-NOBEL-2020'],
    },
    {
      id: 'cosmos-anchor-exoplanet-frontier',
      anchorPosition: new THREE.Vector3(0, 1.1, -0.6),
      label: 'Interstellar Exoplanet Frontier',
      level1Note:
        'Thousands of exoplanets exist, but interstellar distances are colossal. Reaching Proxima Centauri takes 4.25 years for light, ~75,000 years for Voyager.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Dual speed comparison scale: compare honest speed-of-light travel against human rocket speeds across interstellar voids.',
          caption: 'Light speed (300,000 km/s) is the universal cosmic speed limit.',
        },
        advanced: {
          type: 'exploded-view',
          description:
            'Transit photometry simulation: rotate planet transit across the host star to view the transit depth dip delta F / F = (Rp / R*)^2.',
          caption: 'Transit timing variations (TTV) reveal unseen neighboring planets in the system.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Minkowski spacetime light-cone visualizer demonstrating why faster-than-light trajectories produce closed timelike loops and causality paradoxes.',
          caption: 'In Special Relativity, any FTL signal in one reference frame moves backward in time in another.',
        },
      },
      sourceRefs: ['MAYOR-QUELOZ-1995', 'GILLON-TRAPPIST-1-2017', 'EINSTEIN-1905'],
    },
  ];

  // Every content anchor becomes a real spatial anchor, not just the four legacy ones.
  const content = getModuleContent('cosmos');
  const existing = new Set(base.map((anchor) => anchor.id));
  const extras = (content?.anchors ?? [])
    .filter((anchor) => !existing.has(anchor.id))
    .map((anchor, index) => toDefinition(anchor, index));
  return [...base, ...extras];
}

