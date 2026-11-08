import * as THREE from 'three';
import { QUANTUM_ARCHITECTURES, createHardwarePedestal } from './hardware.js';
import { getSpatialAnchors } from './anchors.js';
import {
  SpatialAnchorPrimitive,
  SpatialRotatorPrimitive,
  SpatialScalePinchPrimitive,
  SpatialGrabPrimitive,
} from '../../core/input/primitives/index.js';

export interface QuantumSceneComponents {
  root: THREE.Group;
  blochSphere: THREE.Group;
  blochVectorArrow: THREE.Group;
  cryostatGroup: THREE.Group;
  hardwarePedestals: THREE.Group[];
  anchorPrimitive: SpatialAnchorPrimitive;
  blochRotator: SpatialRotatorPrimitive;
  cryostatScalePinch: SpatialScalePinchPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export async function buildQuantumScene(): Promise<QuantumSceneComponents> {
  const root = new THREE.Group();
  root.name = 'quantum-module-root';

  // 1. Quantum Dark Lab Environment Floor & Wave Interference Pattern (Beat 1)
  const floorGroup = new THREE.Group();
  floorGroup.name = 'quantum-floor-zone';

  const floorGeo = new THREE.PlaneGeometry(12, 12, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x050814,
    roughness: 0.8,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.05;
  floorGroup.add(floor);

  // Concentric wave interference ripples on the floor (Double-slit probability distribution)
  for (let r = 0.8; r <= 4.0; r += 0.4) {
    const ringGeo = new THREE.RingGeometry(r - 0.02, r + 0.02, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: Math.max(0.08, 0.4 - r * 0.08),
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.005;
    floorGroup.add(ring);
  }
  root.add(floorGroup);

  // 2. Interactive Centerpiece Bloch Sphere (Beat 2 & Challenge 1)
  const blochSphere = new THREE.Group();
  blochSphere.name = 'bloch-sphere-centerpiece';
  blochSphere.position.set(0, 1.3, -1.0);

  // Outer translucent sphere
  const sphereGeo = new THREE.SphereGeometry(0.35, 24, 24);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.9,
    wireframe: true,
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  blochSphere.add(sphereMesh);

  // Equatorial reference ring (XY plane - superposition boundary)
  const equatorGeo = new THREE.RingGeometry(0.34, 0.35, 48);
  equatorGeo.rotateX(Math.PI / 2);
  const equatorMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
  blochSphere.add(equatorRing);

  // North pole |0> label & South pole |1> label markers
  const northPole = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  );
  northPole.position.set(0, 0.35, 0);
  northPole.name = 'bloch-pole-0';
  blochSphere.add(northPole);

  const southPole = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  southPole.position.set(0, -0.35, 0);
  southPole.name = 'bloch-pole-1';
  blochSphere.add(southPole);

  // State Vector Arrow |ψ⟩
  const blochVectorArrow = new THREE.Group();
  blochVectorArrow.name = 'bloch-state-vector-arrow';

  const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.32, 12);
  stemGeo.translate(0, 0.16, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  blochVectorArrow.add(stem);

  const arrowTipGeo = new THREE.ConeGeometry(0.025, 0.06, 16);
  arrowTipGeo.translate(0, 0.32, 0);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const tip = new THREE.Mesh(arrowTipGeo, tipMat);
  blochVectorArrow.add(tip);
  blochSphere.add(blochVectorArrow);
  root.add(blochSphere);

  // Spatial rotator primitive controlling Bloch sphere theta rotation
  const blochRotator = new SpatialRotatorPrimitive(blochVectorArrow, {
    axis: 'z',
    detentStepDeg: 15,
  });

  // 3. Multi-Stage Gold Dilution Refrigerator (Beat 4 & Cryostat Anchor)
  const cryostatGroup = new THREE.Group();
  cryostatGroup.name = 'dilution-refrigerator-cryostat';
  cryostatGroup.position.set(-1.8, 1.4, -0.8);

  const stageTemperatures = [
    { name: '50K Stage', radius: 0.28, color: 0x94a3b8 },
    { name: '4K Pulse Tube', radius: 0.24, color: 0xf59e0b },
    { name: '800mK Still', radius: 0.20, color: 0xd97706 },
    { name: '100mK Cold Plate', radius: 0.16, color: 0xb45309 },
    { name: '15mK Mixing Chamber', radius: 0.12, color: 0x78350f },
  ];

  const stageMeshes: THREE.Mesh[] = [];
  stageTemperatures.forEach((stage, idx) => {
    const plateGeo = new THREE.CylinderGeometry(stage.radius, stage.radius, 0.015, 24);
    const plateMat = new THREE.MeshStandardMaterial({
      color: stage.color,
      metalness: 0.9,
      roughness: 0.15,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = (2 - idx) * 0.15;
    plate.name = `cryostat-stage-${stage.name}`;
    stageMeshes.push(plate);
    cryostatGroup.add(plate);

    // Connecting golden support tubes
    if (idx < stageTemperatures.length - 1) {
      const tubeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
      for (let a = 0; a < 3; a++) {
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        const ang = (a * Math.PI * 2) / 3;
        const rad = stage.radius * 0.7;
        tube.position.set(Math.cos(ang) * rad, (2 - idx) * 0.15 - 0.075, Math.sin(ang) * rad);
        cryostatGroup.add(tube);
      }
    }
  });
  root.add(cryostatGroup);

  // Two-handed scale pinch on cryostat for exploded vertical inspection
  const cryostatScalePinch = new SpatialScalePinchPrimitive(cryostatGroup, {
    minScale: 0.8,
    maxScale: 2.2,
    onExplodeFraction: (frac) => {
      // Displace stages vertically proportional to explode fraction
      stageMeshes.forEach((mesh, i) => {
        mesh.position.y = (2 - i) * (0.15 + frac * 0.12);
      });
    },
  });

  // 4. The 7 Quantum Hardware Pedestals Arc (Beat 4)
  const hardwarePedestals: THREE.Group[] = [];
  const galleryGroup = new THREE.Group();
  galleryGroup.name = 'quantum-hardware-gallery';
  galleryGroup.position.set(0, 0, 1.8);
  galleryGroup.rotation.y = Math.PI; // Face the user inward

  QUANTUM_ARCHITECTURES.forEach((hw, idx) => {
    const ped = createHardwarePedestal(hw);
    const angle = (idx / (QUANTUM_ARCHITECTURES.length - 1)) * (Math.PI * 0.8) - Math.PI * 0.4;
    const r = 3.2;
    ped.position.set(Math.sin(angle) * r, 0, Math.cos(angle) * r - 1.5);
    ped.lookAt(0, 0.8, 0);
    hardwarePedestals.push(ped);
    galleryGroup.add(ped);
  });
  root.add(galleryGroup);

  // 5. Entangled Bell Pair Source & Optical Bench (Beat 5 & Challenge 3)
  const bellGroup = new THREE.Group();
  bellGroup.name = 'bell-pair-optical-bench';
  bellGroup.position.set(1.8, 0.9, -0.6);

  // Non-linear BBO crystal emitter
  const crystalGeo = new THREE.OctahedronGeometry(0.08, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 0.3;
  bellGroup.add(crystal);

  // Left & right photon trajectories with polarization filters
  const leftFilter = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.01, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xec4899 })
  );
  leftFilter.position.set(-0.35, 0.3, 0);
  leftFilter.rotation.y = Math.PI / 2;
  bellGroup.add(leftFilter);

  const rightFilter = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.01, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x10b981 })
  );
  rightFilter.position.set(0.35, 0.3, 0);
  rightFilter.rotation.y = Math.PI / 2;
  bellGroup.add(rightFilter);
  root.add(bellGroup);

  // 6. Quantum Circuit Breadboard & Logic Gate Blocks (Capstone Challenge 4)
  const circuitBoard = new THREE.Group();
  circuitBoard.name = 'quantum-circuit-breadboard';
  circuitBoard.position.set(0, 0.85, -0.5);

  const boardGeo = new THREE.BoxGeometry(0.6, 0.03, 0.35);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  circuitBoard.add(boardMesh);

  // Waveguide rail slots
  for (let w = -0.08; w <= 0.08; w += 0.16) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.005, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    rail.position.set(0, 0.016, w);
    circuitBoard.add(rail);
  }

  // Grabbable Hadamard [H] gate token
  const hGate = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.04, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
  );
  hGate.position.set(-0.15, 0.04, 0.08);
  hGate.name = 'quantum-gate-hadamard';
  new SpatialGrabPrimitive(hGate, { constrainY: true });
  circuitBoard.add(hGate);

  // Grabbable CNOT gate token
  const cnotGate = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.04, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
  );
  cnotGate.position.set(0.15, 0.04, -0.08);
  cnotGate.name = 'quantum-gate-cnot';
  new SpatialGrabPrimitive(cnotGate, { constrainY: true });
  circuitBoard.add(cnotGate);
  root.add(circuitBoard);

  // 7. Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'quantum-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  root.add(anchorContainer);

  // Animation / Render tick handler
  function update(deltaSeconds: number): void {
    // Slowly rotate BBO crystal
    crystal.rotation.x += 0.8 * deltaSeconds;
    crystal.rotation.y += 0.5 * deltaSeconds;

    // Pulse equatorial ring glow
    equatorRing.rotation.z += 0.2 * deltaSeconds;
  }

  function dispose(): void {
    anchorPrimitive.dispose();
  }

  return {
    root,
    blochSphere,
    blochVectorArrow,
    cryostatGroup,
    hardwarePedestals,
    anchorPrimitive,
    blochRotator,
    cryostatScalePinch,
    update,
    dispose,
  };
}

