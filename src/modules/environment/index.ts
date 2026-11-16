import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildEnvironmentScene, type EnvironmentSceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: EnvironmentSceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'environment',
  displayName: 'Climate & Environment',
  description: 'Mau forest water towers, trophic cascades, and coastal blue carbon buffers.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/environment.ktx2',
  setting: {
    id: 'environment-mau-forest',
    name: 'Mau Forest & Mara River Basin',
    environment: 'exterior',
    lighting: 'early dawn golden mist, high-altitude sun, deep river valley shadows',
    palette: ['#15803d', '#0ea5e9', '#d97706', '#f59e0b'],
    props: ['3D terrain watershed', 'Mara river cutaway', 'stakeholder node network', 'mangrove wave buffer'],
    ambience: 'running water, high-canopy bird calls, wind through acacia and cedar',
  },
  sections: [
    {
      id: 'watershed-time',
      title: 'Mau Forest Complex Watershed & 40-Year Time Scrub',
      settingId: 'environment-mau-forest',
      summary: 'Explore groundwater infiltration, hydrological balance, and forest canopy decline.',
      entryPosition: [-1.8, 0, -1.5],
    },
    {
      id: 'reforestation',
      title: 'Water Tower Slope Infiltration Restoration',
      settingId: 'environment-mau-forest',
      summary: 'Restore indigenous bamboo and cedar plots on degraded catchment slopes.',
      entryPosition: [-1.2, 0, 0.6],
    },
    {
      id: 'stakeholders',
      title: '9-Stakeholder Social-Ecological Network',
      settingId: 'environment-mau-forest',
      summary: 'Manipulate upstream agricultural diversions and monitor ripple effects downriver.',
      entryPosition: [0, 0, -2.4],
    },
    {
      id: 'naivasha',
      title: 'Lake Naivasha Riparian Papyrus Biofilter',
      settingId: 'environment-mau-forest',
      summary: 'Balance commercial horticultural abstraction against papyrus wetland health.',
      entryPosition: [1.8, 0, -1.5],
    },
    {
      id: 'mangroves',
      title: 'Lamu Coastal Mangrove Wave Buffer & Blue Carbon',
      settingId: 'environment-mau-forest',
      summary: 'Measure wave energy dissipation through Rhizophora prop roots and carbon burial.',
      entryPosition: [0, 0, 2.4],
    },
  ],

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildEnvironmentScene();
    container.add(activeScene.root);
    return activeScene.root;
  },

  unload(): void {
    if (activeScene) {
      activeScene.dispose();
      if (activeScene.root.parent) {
        activeScene.root.parent.remove(activeScene.root);
      }
      activeScene = null;
    }
  },

  update(deltaSeconds: number): void {
    activeScene?.update(deltaSeconds);
  },

  getState(): Record<string, unknown> | null {
    return activeScene ? { ...activeScene.getState() } : null;
  },

  setDepthTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    activeScene?.anchorPrimitive.updateTier(tier);
  },

  isWalkable(position: THREE.Vector3): boolean {
    // Ground radius walkable within 4.5m
    const dist = Math.hypot(position.x, position.z);
    return dist <= 4.5;
  },

  getChallenges,
  getSpatialAnchors,
};

export default moduleDef;
