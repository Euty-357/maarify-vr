import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { buildAssetLabScene, type AssetLabSceneComponents } from './scene.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';

let activeScene: AssetLabSceneComponents | null = null;

const moduleDef: ModuleDefinition = {
  id: 'asset-lab',
  displayName: 'Asset Lab (Dev)',
  description: 'Developer-only module to inspect, place, explode, and dock GLB assets from the generated registry.',
  estimatedMinutes: [10, 20],
  thumbnail: '/assets/thumbnails/asset-lab.ktx2',

  async load(container: THREE.Scene): Promise<THREE.Object3D> {
    activeScene = await buildAssetLabScene();
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

  isWalkable(pos: THREE.Vector3): boolean {
    return pos.x >= -5 && pos.x <= 5 && pos.z >= -5 && pos.z <= 5;
  },

  /** Dev-only state used by the Asset Lab e2e run. */
  getState() {
    return {
      placedAsset: activeScene?.getPlacedAssetName() ?? null,
      explodeAmount: activeScene?.getExplodeAmount() ?? 0,
    };
  },

  getChallenges,
  getSpatialAnchors,
};

export default moduleDef;