import type * as THREE from 'three';
import type { ModuleDefinition } from '../../core/types.js';
import { getChallenges } from './challenges.js';
import { getSpatialAnchors } from './anchors.js';
import { buildUrbanScene, type UrbanSceneComponents } from './scene.js';

let activeScene: UrbanSceneComponents | null = null;
const moduleDef: ModuleDefinition = {
  id: 'urban-development', displayName: 'Urban Development & Planning', description: 'Shape an equitable, connected and cooler Nairobi district.', estimatedMinutes: [15, 20], thumbnail: '/assets/thumbnails/urban-development.ktx2',
  mission: { title: 'URBAN MASTER PLANNER', guideName: 'DR. AMANI', tutorial: [{ id: 'transit', instruction: 'Point at the amber transit corridor and use its controls.', target: 'transit' }] },
  setting: { id: 'urban-rooftop', name: 'Nairobi Rooftop Planning Lab', environment: 'interior', lighting: 'dusk city glow and warm planning lamps', palette: ['#334155', '#f59e0b', '#22c55e'], props: ['city model', 'transit corridor', 'heat scanner'], ambience: 'distant city and market soundscape' },
  async load(container: THREE.Scene) { activeScene = await buildUrbanScene(); container.add(activeScene.root); return activeScene.root; },
  unload() { if (activeScene) { activeScene.dispose(); activeScene.root.parent?.remove(activeScene.root); activeScene = null; } },
  update(deltaSeconds) { activeScene?.update(deltaSeconds); }, getState() { return activeScene?.getState() ?? null; },
  setDepthTier(tier) { activeScene?.anchorPrimitive.updateTier(tier); },
  isWalkable(position) { return Math.hypot(position.x, position.z) <= 4.5; }, getChallenges, getSpatialAnchors,
};
export default moduleDef;
