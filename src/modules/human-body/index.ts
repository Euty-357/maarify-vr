import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildHumanBodyScene, type HumanBodySceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';
import { getMissions } from './missions.js';
import { MEDICINE_ATRIUM, MEDICINE_WINGS } from './sections.js';

let activeScene: HumanBodySceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'human-body',
  displayName: 'Medicine',
  description: 'From cardiac valves to CAR-T immunotherapy and destigmatizing HIV science.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/human-body.ktx2',
  setting: MEDICINE_ATRIUM,
  sections: MEDICINE_WINGS.map((wing) => wing.section),

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildHumanBodyScene();
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

  update(deltaSeconds: number) {
    activeScene?.update(deltaSeconds);
  },

  setDepthTier(tier) {
    activeScene?.anchorPrimitive.updateTier(tier);
  },

  getChallenges,
  getSpatialAnchors,
  missions: getMissions(),

  isWalkable(pos: THREE.Vector3): boolean {
    // Atrium footprint: circle of radius 4.7 m
    if (Math.sqrt(pos.x * pos.x + pos.z * pos.z) <= 4.7) return true;
    // Wing room footprints: 6 rooms at r=5.4 m
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      const cx = Math.sin(angle) * 5.4;
      const cz = -Math.cos(angle) * 5.4;
      if (Math.abs(pos.x - cx) <= 3 && Math.abs(pos.z - cz) <= 3) return true;
    }
    return false;
  },
};

export default moduleDef;

