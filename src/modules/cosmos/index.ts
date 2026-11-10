import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildCosmosScene, type CosmosSceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: CosmosSceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'cosmos',
  displayName: 'Cosmos & Astronomy',
  description: 'From Malindi to Sagittarius A*: orbital velocity, scale collapse, and exoplanets.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/cosmos.ktx2',

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildCosmosScene();
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

