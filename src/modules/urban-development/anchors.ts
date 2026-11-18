import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

const tiers = (caption: string) => ({
  foundation: { type: 'exploded-view' as const, description: caption, caption },
  advanced: { type: 'scrubbable-mechanism' as const, description: caption, caption },
  expert: { type: 'cross-section-flux' as const, description: caption, caption },
});

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    { id: 'urban-transit', anchorPosition: new THREE.Vector3(-1.4, 1.1, -1.1), label: 'Transit Corridor', level1Note: 'A city works better when many people can reach daily needs safely and reliably.', level2Simulation: tiers('Explore the relationship between corridor capacity, access, and congestion.'), sourceRefs: [] },
    { id: 'urban-services', anchorPosition: new THREE.Vector3(1.1, 1.05, -0.8), label: 'Essential Services', level1Note: 'Water, sanitation, light, and safe paths are part of a dignified neighbourhood.', level2Simulation: tiers('Arrange service links without displacing residents in this simplified model.'), sourceRefs: [] },
    { id: 'urban-heat', anchorPosition: new THREE.Vector3(0.7, 1.2, 1.3), label: 'Urban Heat', level1Note: 'Shade, trees, and reflective surfaces can change how hot places feel.', level2Simulation: tiers('Scan surfaces and compare shaded and unshaded city blocks.'), sourceRefs: [] },
    { id: 'urban-stakeholders', anchorPosition: new THREE.Vector3(0, 1.55, -2.1), label: 'City Stakeholder Network', level1Note: 'Housing, transport, livelihoods, and environment affect one another.', level2Simulation: tiers('Toggle policies and watch the simplified city network respond.'), sourceRefs: [] },
  ];
}
