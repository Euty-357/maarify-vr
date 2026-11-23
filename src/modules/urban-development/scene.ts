import * as THREE from 'three';
import { SpatialAnchorPrimitive, SpatialGrabPrimitive, SpatialSliderPrimitive } from '../../core/input/primitives/index.js';
import { StakeholderSimulation } from '../../core/simulation/stakeholder-sim.js';
import { getSpatialAnchors } from './anchors.js';

export interface UrbanSceneComponents {
  root: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  update: (deltaSeconds: number) => void;
  getState: () => Record<string, unknown>;
  dispose: () => void;
}

export async function buildUrbanScene(): Promise<UrbanSceneComponents> {
  const root = new THREE.Group();
  root.name = 'urban-development-module-root';
  const room = new THREE.Group();
  room.name = 'urban-rooftop-planning-lab';
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.82 }));
  floor.position.y = -0.1;
  room.add(floor);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x26364d, metalness: 0.25, roughness: 0.65 });
  for (const [x, z, width, depth] of [[0, -4.8, 10, 0.15], [0, 4.8, 10, 0.15], [-4.8, 0, 0.15, 10], [4.8, 0, 0.15, 10]] as const) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 3.3, depth), wallMaterial);
    wall.position.set(x, 1.55, z);
    room.add(wall);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x101827, side: THREE.BackSide }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.2;
  room.add(ceiling);
  root.add(room);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  const city = new THREE.Group();
  city.name = 'nairobi-district-model';
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 });
  for (const x of [-2, 0, 2]) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 5.5), roadMat);
    road.position.set(x, 0.02, 0);
    city.add(road);
  }
  for (let index = 0; index < 28; index += 1) {
    const x = -2.5 + (index % 7) * 0.82;
    const z = -2 + Math.floor(index / 7) * 1.18;
    const height = 0.35 + (index % 4) * 0.18;
    const building = new THREE.Mesh(new THREE.BoxGeometry(0.48, height, 0.62), new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0xc47a45 : 0x94a3b8, roughness: 0.65 }));
    building.position.set(x, height / 2, z);
    city.add(building);
  }
  root.add(city);

  const transit = new THREE.Group();
  transit.name = 'matatu-corridor';
  transit.position.set(-1.4, 0.08, -1.1);
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 3.7), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
  transit.add(line);
  root.add(transit);

  const sliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  sliderTrack.position.set(-2.6, 0.62, 1.7);
  root.add(sliderTrack);
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 }),
  );
  sliderHandle.name = 'urban-capacity-slider';
  sliderHandle.position.set(-2.6, 0.65, 1.7);
  root.add(sliderHandle);
  const capacitySlider = new SpatialSliderPrimitive(sliderHandle, { axis: 'z', minDistance: 1.5, maxDistance: 1.9 });

  const scanner = new THREE.Group();
  scanner.name = 'urban-heat-scanner';
  scanner.position.set(0.7, 0.24, 1.3);
  scanner.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.24), new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.45 })));
  new SpatialGrabPrimitive(scanner);
  root.add(scanner);

  const sim = new StakeholderSimulation();
  sim.addResource({ id: 'urban-access', name: 'Access', quantity: 62, baseQuantity: 62, regenerationRate: 0, capacity: 100, description: 'Daily access to jobs and services' });
  sim.addResource({ id: 'urban-green', name: 'Green cover', quantity: 38, baseQuantity: 38, regenerationRate: 0.05, capacity: 100, description: 'Trees and shade' });
  const people = ['residents', 'informal-residents', 'operators', 'traders', 'planners', 'developers', 'county', 'environment'];
  people.forEach((id, index) => sim.addStakeholder({ id, name: id.replace('-', ' '), category: index === 7 ? 'ecosystem' : index > 4 ? 'governance' : 'community', wellbeing: 62, baseWellbeing: 62, dependsOn: ['urban-access', 'urban-green'], description: id }));
  sim.addAction({ id: 'urban-transit-priority', name: 'Transit priority', description: 'Prioritise high-capacity public transport.', applied: false, effects: [{ targetId: 'urban-access', delta: 18 }] });
  sim.addAction({ id: 'urban-green-corridor', name: 'Green corridor', description: 'Add connected shade and river buffers.', applied: false, effects: [{ targetId: 'urban-green', delta: 25 }] });

  const network = new THREE.Group();
  network.name = 'urban-stakeholder-network';
  network.position.set(0, 1.45, -2.1);
  people.forEach((_id, index) => {
    const angle = index / people.length * Math.PI * 2;
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: index === 7 ? 0x22c55e : 0x38bdf8 }));
    node.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 0.35, 0);
    node.userData.activate = () => sim.toggleAction(index % 2 ? 'urban-green-corridor' : 'urban-transit-priority');
    network.add(node);
  });
  root.add(network);

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 640, 80); ctx.fillStyle = '#f8fafc'; ctx.font = '22px sans-serif'; ctx.fillText('Simplified educational model — real urban dynamics are more complex.', 16, 48); }
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.FrontSide }));
    label.position.set(0, 1.0, 2.4); root.add(label);
  }

  const anchors = new THREE.Group();
  const anchorPrimitive = new SpatialAnchorPrimitive(anchors);
  getSpatialAnchors().forEach((definition) => anchorPrimitive.registerAnchor(definition, 'foundation'));
  anchorPrimitive.staggerOverlapping(); anchorPrimitive.batchLeaderLines(); root.add(anchors);
  let elapsed = 0;
  return {
    root, anchorPrimitive,
    update: (deltaSeconds) => { elapsed += deltaSeconds; sim.update(deltaSeconds); transit.position.x = -1.4 + capacitySlider.value * 0.25; scanner.rotation.y = Math.sin(elapsed) * 0.08; },
    getState: () => ({ corridorPriority: capacitySlider.value, cityHealth: sim.getOverallHealth(), greenCover: sim.getResource('urban-green')?.quantity ?? 0 }),
    dispose: () => anchorPrimitive.dispose(),
  };
}
