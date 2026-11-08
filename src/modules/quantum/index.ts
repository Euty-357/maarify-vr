import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildQuantumScene, type QuantumSceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: QuantumSceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'quantum',
  displayName: 'Quantum Mechanics',
  description: 'Superposition, the Bloch sphere, 7 hardware modalities, and Bell entanglement.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/quantum.ktx2',

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildQuantumScene();
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

  getChallenges,
  getSpatialAnchors,
};

export default moduleDef;

