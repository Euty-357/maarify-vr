import * as THREE from 'three';
import { getSpatialAnchors } from './anchors.js';
import {
  SpatialAnchorPrimitive,
  SpatialSliderPrimitive,
  SpatialRotatorPrimitive,
  SpatialGrabPrimitive,
} from '../../core/input/primitives/index.js';
import { StakeholderSimulation } from '../../core/simulation/stakeholder-sim.js';

export interface EnvironmentSceneComponents {
  root: THREE.Group;
  terrainRoot: THREE.Group;
  stakeholderGraphRoot: THREE.Group;
  naivashaRoot: THREE.Group;
  mangroveRoot: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  timeScrubSlider: SpatialSliderPrimitive;
  naivashaValve: SpatialRotatorPrimitive;
  stakeholderSim: StakeholderSimulation;
  update: (deltaSeconds: number) => void;
  getState: () => Record<string, unknown>;
  dispose: () => void;
}

export async function buildEnvironmentScene(): Promise<EnvironmentSceneComponents> {
  const root = new THREE.Group();
  root.name = 'environment-module-root';

  // ---------------------------------------------------------------------------
  // 1. Exterior Montane & Savanna Sky / Ground Environment
  // ---------------------------------------------------------------------------
  const terrainRoot = new THREE.Group();
  terrainRoot.name = 'mau-watershed-terrain';

  // Main ground plane — fertile Kenyan highland volcanic loam
  const groundGeo = new THREE.PlaneGeometry(16, 16, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);

  // Deform plane slightly to create gentle rift valley ridge and river gully
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    // River depression along x = 0 diagonal
    const riverDist = Math.abs(x - z * 0.3);
    let y = Math.sin(x * 0.4) * 0.2 + Math.cos(z * 0.3) * 0.15;
    if (riverDist < 1.2) {
      y -= (1.2 - riverDist) * 0.25; // river canyon depression
    }
    posAttr.setY(i, y);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2e5c38, // lush highland green
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  terrainRoot.add(ground);

  // Winding Mara River ribbon
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, 0.02, -7),
    new THREE.Vector3(-2, 0.01, -4),
    new THREE.Vector3(-0.5, 0.01, -1),
    new THREE.Vector3(0.5, 0.01, 2),
    new THREE.Vector3(2.5, 0.01, 6),
  ]);
  const riverGeo = new THREE.TubeGeometry(riverCurve, 32, 0.45, 8, false);
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.name = 'mara-river-flow';
  terrainRoot.add(riverMesh);

  // Indigenous forest canopy tree clumps (Mau Forest water tower zone)
  const canopyGroup = new THREE.Group();
  canopyGroup.name = 'indigenous-forest-canopy';
  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
  const foliageGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

  for (let i = 0; i < 24; i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 0.6;
    tree.add(trunk);
    tree.add(foliage);

    const angle = (i / 24) * Math.PI * 1.6 - 1.2;
    const dist = 3.2 + (i % 4) * 0.6;
    tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist - 1.5);
    canopyGroup.add(tree);
  }
  terrainRoot.add(canopyGroup);
  root.add(terrainRoot);

  // ---------------------------------------------------------------------------
  // 2. Mau Watershed 40-Year Time Scrub Station (Beat 2)
  // ---------------------------------------------------------------------------
  const timeStation = new THREE.Group();
  timeStation.name = 'watershed-time-station';
  timeStation.position.set(-1.8, 0.9, -1.5);

  const leverPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.85, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
  );
  timeStation.add(leverPedestal);

  const sliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  sliderTrack.position.y = 0.45;
  timeStation.add(sliderTrack);

  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 }),
  );
  sliderHandle.name = 'environment-time-scrub-slider';
  sliderHandle.position.set(0, 0.48, -0.15);
  timeStation.add(sliderHandle);

  const timeScrubSlider = new SpatialSliderPrimitive(sliderHandle, {
    axis: 'z',
    minDistance: -0.15,
    maxDistance: 0.15,
  });
  root.add(timeStation);

  // ---------------------------------------------------------------------------
  // 3. Reforestation Assembly Station (Beat 3)
  // ---------------------------------------------------------------------------
  const reforestStation = new THREE.Group();
  reforestStation.name = 'reforestation-assembly-station';
  reforestStation.position.set(-1.2, 0.85, 0.6);

  // Degraded slope tray
  const slopeTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.1, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 })
  );
  reforestStation.add(slopeTray);

  // 3 Grabbable native sapling clusters
  const saplingPlots: THREE.Group[] = [];
  for (let s = 0; s < 3; s++) {
    const sapling = new THREE.Group();
    sapling.name = `sapling-plot-${s}`;
    sapling.position.set(-0.3 + s * 0.3, 0.1, 0);

    const saplingMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    saplingMesh.position.y = 0.11;
    sapling.add(saplingMesh);

    new SpatialGrabPrimitive(sapling);
    reforestStation.add(sapling);
    saplingPlots.push(sapling);
  }
  root.add(reforestStation);

  // ---------------------------------------------------------------------------
  // 4. Room-Scale 9-Stakeholder Causal Feedback Graph (Beat 4 & 5)
  // ---------------------------------------------------------------------------
  const stakeholderGraphRoot = new THREE.Group();
  stakeholderGraphRoot.name = 'stakeholder-causal-graph';
  stakeholderGraphRoot.position.set(0, 1.4, -2.4);

  const stakeholderSim = new StakeholderSimulation();

  // Populate 9 Key Kenyan Stakeholders & Resources
  stakeholderSim.addResource({
    id: 'res-mau-water',
    name: 'Mau Catchment Storage',
    quantity: 85,
    baseQuantity: 85,
    regenerationRate: 0.2,
    capacity: 100,
    description: 'Montane forest groundwater infiltration',
  });
  stakeholderSim.addResource({
    id: 'res-river-flow',
    name: 'Mara River Baseflow',
    quantity: 75,
    baseQuantity: 75,
    regenerationRate: 0.1,
    capacity: 100,
    description: 'Perennial flow into downstream wildlife and reserves',
  });

  const STAKEHOLDERS_DEF = [
    { id: 'sh-smallholders', name: 'Upstream Smallholders', cat: 'community' as const, base: 70, deps: ['res-mau-water'] },
    { id: 'sh-pastoralists', name: 'Rift Valley Pastoralists', cat: 'community' as const, base: 65, deps: ['res-river-flow'] },
    { id: 'sh-horticulture', name: 'Commercial Flower Farms', cat: 'economy' as const, base: 85, deps: ['res-mau-water'] },
    { id: 'sh-fisherfolk', name: 'Lake Fisherfolk', cat: 'community' as const, base: 60, deps: ['res-river-flow'] },
    { id: 'sh-wildlife', name: 'Mara Wildlife Reserves', cat: 'ecosystem' as const, base: 80, deps: ['res-river-flow'] },
    { id: 'sh-geothermal', name: 'Olkaria Geothermal Power', cat: 'economy' as const, base: 90, deps: ['res-mau-water'] },
    { id: 'sh-water-board', name: 'Catchment Water Board', cat: 'governance' as const, base: 75, deps: ['res-river-flow'] },
    { id: 'sh-coastal-mangrove', name: 'Coastal Mangrove Fishers', cat: 'ecosystem' as const, base: 70, deps: ['res-river-flow'] },
    { id: 'sh-future-gen', name: 'Future Generations', cat: 'community' as const, base: 70, deps: ['res-mau-water', 'res-river-flow'] },
  ];

  STAKEHOLDERS_DEF.forEach((s) => {
    stakeholderSim.addStakeholder({
      id: s.id,
      name: s.name,
      category: s.cat,
      wellbeing: s.base,
      baseWellbeing: s.base,
      dependsOn: s.deps,
      description: s.name,
    });
  });

  // Action: Reforestation policy
  stakeholderSim.addAction({
    id: 'act-reforest-mau',
    name: 'Restore 50,000 ha Indigenous Canopy',
    description: 'Community-led Green Belt reforestation',
    applied: false,
    effects: [
      { targetId: 'res-mau-water', delta: 15 },
      { targetId: 'res-river-flow', delta: 12 },
    ],
  });

  // Action: Unregulated irrigation expansion
  stakeholderSim.addAction({
    id: 'act-irrigation-boom',
    name: 'Unregulated Agricultural Diversion',
    description: 'Diverts river baseflow for flood irrigation',
    applied: false,
    effects: [
      { targetId: 'res-river-flow', delta: -35 },
      { targetId: 'sh-horticulture', delta: 15 },
    ],
  });

  // 3D Spatial Nodes for the 9 stakeholders
  const nodeMeshes: THREE.Mesh[] = [];
  STAKEHOLDERS_DEF.forEach((s, idx) => {
    const angle = (idx / STAKEHOLDERS_DEF.length) * Math.PI * 2;
    const rad = 1.35;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshStandardMaterial({
        color: s.cat === 'ecosystem' ? 0x22c55e : s.cat === 'economy' ? 0xf59e0b : 0x38bdf8,
        metalness: 0.4,
        roughness: 0.6,
      })
    );
    node.name = `node-${s.id}`;
    node.position.set(Math.cos(angle) * rad, Math.sin(angle) * 0.45, Math.sin(angle) * 0.25);
    stakeholderGraphRoot.add(node);
    nodeMeshes.push(node);
  });

  // Connecting beam lines between nodes and central resource hub
  const linkGeo = new THREE.BufferGeometry();
  const linkPositions: number[] = [];
  nodeMeshes.forEach((mesh) => {
    linkPositions.push(0, 0, 0); // center
    linkPositions.push(mesh.position.x, mesh.position.y, mesh.position.z);
  });
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
  const linkMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.5 });
  const links = new THREE.LineSegments(linkGeo, linkMat);
  stakeholderGraphRoot.add(links);
  root.add(stakeholderGraphRoot);

  // ---------------------------------------------------------------------------
  // 5. Lake Naivasha Water Balance Table (Beat 5)
  // ---------------------------------------------------------------------------
  const naivashaRoot = new THREE.Group();
  naivashaRoot.name = 'lake-naivasha-table';
  naivashaRoot.position.set(1.8, 0.9, -1.5);

  // Circular table basin
  const tableBasin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 0.85, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 })
  );
  naivashaRoot.add(tableBasin);

  // Lake water surface disk
  const waterSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.7 })
  );
  waterSurface.name = 'naivasha-water-surface';
  waterSurface.position.y = 0.43;
  naivashaRoot.add(waterSurface);

  // Papyrus wetland buffer perimeter ring
  const papyrusRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.44, 24).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x65a30d, side: THREE.DoubleSide })
  );
  papyrusRing.position.y = 0.435;
  naivashaRoot.add(papyrusRing);

  // Abstraction control valve wheel
  const valveMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.015, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 })
  );
  valveMesh.position.set(0.3, 0.46, 0.2);
  valveMesh.rotateX(Math.PI / 2);
  naivashaRoot.add(valveMesh);

  const naivashaValve = new SpatialRotatorPrimitive(valveMesh, { detentStepDeg: 30 });
  root.add(naivashaRoot);

  // ---------------------------------------------------------------------------
  // 6. Lamu Coastal Mangrove Blue Carbon Zone (Beat 6)
  // ---------------------------------------------------------------------------
  const mangroveRoot = new THREE.Group();
  mangroveRoot.name = 'lamu-coastal-mangrove-zone';
  mangroveRoot.position.set(0, 0.85, 2.4);

  // Shallow tidal water pool
  const tidalPool = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.08, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.3, transparent: true, opacity: 0.85 })
  );
  tidalPool.position.y = -0.04;
  mangroveRoot.add(tidalPool);

  // Rhizophora prop stilt roots (intertwined branching cylinders)
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  for (let r = 0; r < 8; r++) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.45, 6), rootMat);
    stilt.position.set(-0.5 + (r % 4) * 0.3, 0.15, (r < 4 ? -0.15 : 0.15));
    stilt.rotation.z = (r % 2 === 0 ? 0.25 : -0.25);
    stilt.rotation.x = (r < 4 ? 0.2 : -0.2);
    mangroveRoot.add(stilt);
  }
  root.add(mangroveRoot);

  // ---------------------------------------------------------------------------
  // 7. Mandatory Simulation Disclaimer Plinth (immersion & science rule)
  // ---------------------------------------------------------------------------
  if (typeof document !== 'undefined') {
    const disclaimerCanvas = document.createElement('canvas');
    disclaimerCanvas.width = 512;
    disclaimerCanvas.height = 96;
    const ctx = disclaimerCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(4, 4, 504, 88, 12);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Simplified educational model — not engineering grade.', 16, 38);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Watershed hydrology & 9-stakeholder social-ecological system.', 16, 68);

    const disclaimerTex = new THREE.CanvasTexture(disclaimerCanvas);
    const disclaimerPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.3),
      new THREE.MeshBasicMaterial({ map: disclaimerTex, transparent: true, side: THREE.FrontSide })
    );
    disclaimerPlane.name = 'environment-simulation-disclaimer';
    disclaimerPlane.position.set(0, 0.35, -0.7);
    root.add(disclaimerPlane);
  }

  // ---------------------------------------------------------------------------
  // 8. Diegetic Spatial Anchors Kit
  // ---------------------------------------------------------------------------
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'environment-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // ---------------------------------------------------------------------------
  // 9. Simulation Update Loop & State
  // ---------------------------------------------------------------------------
  let animTime = 0;
  let simulatedYear = 2000;

  function update(deltaSeconds: number): void {
    animTime += deltaSeconds;

    // Time scrub slider adjusts simulated year (1980 to 2024)
    const angleRatio = timeScrubSlider.value; // 0 to 1
    simulatedYear = Math.round(1980 + angleRatio * 44);

    // Tree canopy scale reflects historical forest cover loss over time
    const canopyScale = 1.0 - angleRatio * 0.45;
    canopyGroup.scale.set(canopyScale, canopyScale, canopyScale);

    // River flow color & speed update
    stakeholderSim.update(deltaSeconds);

    // Water level slight oscillation
    waterSurface.position.y = 0.43 + Math.sin(animTime * 1.5) * 0.005;
  }

  function getState(): Record<string, unknown> {
    return {
      simulatedYear,
      overallHealth: stakeholderSim.getOverallHealth(),
      riverBaseflow: stakeholderSim.getResource('res-river-flow')?.quantity ?? 0,
      mauStorage: stakeholderSim.getResource('res-mau-water')?.quantity ?? 0,
    };
  }

  function dispose(): void {
    anchorPrimitive.dispose();
    groundGeo.dispose();
    groundMat.dispose();
  }

  return {
    root,
    terrainRoot,
    stakeholderGraphRoot,
    naivashaRoot,
    mangroveRoot,
    anchorPrimitive,
    timeScrubSlider,
    naivashaValve,
    stakeholderSim,
    update,
    getState,
    dispose,
  };
}
