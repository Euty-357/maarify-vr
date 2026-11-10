import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildHumanBodyScene, type HumanBodySceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: HumanBodySceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'human-body',
  displayName: 'Human Body & Medicine',
  description: 'From cardiac valves to CAR-T immunotherapy and destigmatizing HIV science.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/human-body.ktx2',

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

  getChallenges,
  getSpatialAnchors,
};

export default moduleDef;

