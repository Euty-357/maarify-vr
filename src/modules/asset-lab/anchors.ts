import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'asset-lab-shelf',
      anchorPosition: new THREE.Vector3(0, 1.2, -1.0),
      label: 'Asset Shelf',
      level1Note: 'Place assets from the registry here to inspect them at authored scale.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Select an asset and pull it apart to see its parts.',
          caption: 'Explode',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Use the scrub bar to control the explode amount.',
          caption: 'Scrub',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Dock parts into their sockets and view flow paths.',
          caption: 'Dock',
        },
      },
      sourceRefs: [],
    },
  ];
}