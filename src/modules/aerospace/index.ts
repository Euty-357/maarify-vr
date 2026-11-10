import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildAerospaceScene, type AerospaceSceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: AerospaceSceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'aerospace',
  displayName: 'Aerospace & Rocket Propulsion',
  description: 'Master the four forces of flight, exploded liquid rocket engines, thermodynamic cycles, and supersonic shock diamonds.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/aerospace.ktx2',

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildAerospaceScene();
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
};

export default moduleDef;
