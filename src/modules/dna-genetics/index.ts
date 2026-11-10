import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildScene, type DnaGeneticsScene } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: DnaGeneticsScene | null = null;

const module: ModuleDefinition = {
  id: 'dna-genetics',
  displayName: 'DNA & Genetics',
  description: 'Unzip DNA, build proteins, and explore careful gene targeting.',
  estimatedMinutes: [15, 20],
  thumbnail: '/assets/thumbnails/dna-genetics.ktx2',

  async load(container: THREE.Scene) {
    activeScene = await buildScene();
    container.add(activeScene.root);
    return activeScene.root;
  },

  unload() {
    if (activeScene) {
      activeScene.dispose();
      activeScene.root.parent?.remove(activeScene.root);
      activeScene = null;
    }
  },

  update(deltaSeconds: number) {
    activeScene?.update(deltaSeconds);
  },

  getState() {
    return activeScene ? { ...activeScene.getState() } : null;
  },

  getChallenges,
  getSpatialAnchors,
};

export default module;
