import * as THREE from 'three';
import { createTextPanel, setTextPanelText } from '../../core/ui/text-panel.js';
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

/**
 * Derives a human-readable qubit state description from gate slot contents.
 * Pure function — no side effects, no Three.js dependencies.
 */
export function computeCircuitState(gateSlots: (string | null)[]): string {
  const [slot0, slot1] = gateSlots;
  if (!slot0 && !slot1) return 'State: |0⟩';
  if (slot0 === 'H' && !slot1) return 'State: |+⟩ = (|0⟩+|1⟩)/√2';
  if (slot0 === 'X' && !slot1) return 'State: |1⟩ (bit-flip applied)';
  if (slot0 === 'Z' && !slot1) return 'State: |0⟩ with phase flip (Z|0⟩=|0⟩)';
  if (slot0 === 'H' && slot1 === 'CNOT') return 'Bell state: (|00⟩+|11⟩)/√2 — entangled.';
  if (slot0 === 'X' && slot1 === 'CNOT') return 'State: |11⟩ — both qubits flipped.';
  if (slot0 && slot1) return `State: ${slot0}+${slot1} combination`;
  return 'State: unknown';
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
    color: 0x6b7280,
    roughness: 0.35,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.05;
  floorGroup.add(floor);

  const quantumBoundaryRing = new THREE.Mesh(
    new THREE.RingGeometry(4.95, 5.0, 64),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  quantumBoundaryRing.rotation.x = -Math.PI / 2;
  quantumBoundaryRing.position.y = 0.002;
  root.add(quantumBoundaryRing);

  root.add(floorGroup);

  // Cryogenic lab room shell: steel walls, low ceiling
  const labRoom = new THREE.Group();
  labRoom.name = 'cryolab-room-shell';
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.42 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.75 });
  // Walls (open front for entry) — room spans x:[-5,+5] z:[-5,0]
  for (const [ox, oy, oz, ow, oh, od] of [
    [0,    1.65, -5.0, 10, 3.3, 0.1],   // back wall at z=-5
    [-5.0, 1.65, -2.5, 0.1, 3.3, 10],  // left wall
    [5.0,  1.65, -2.5, 0.1, 3.3, 10],  // right wall
  ] as [number, number, number, number, number, number][]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ow, oh, od), steelMat);
    wall.position.set(ox, oy, oz);
    labRoom.add(wall);
  }
  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), panelMat);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 3.3, -2.5);
  labRoom.add(ceiling);

  // Steel equipment benches along left wall — z values inside room (z: -5 to 0)
  for (const z of [-4.0, -2.5, -1.0]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.74, 0.65), steelMat);
    bench.position.set(-3.8, 0.37, z);
    labRoom.add(bench);
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.025, 0.67), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.3 }));
    benchTop.position.set(-3.8, 0.755, z);
    labRoom.add(benchTop);
  }

  // Gas handling panels on right wall
  for (let gpi = 0; gpi < 3; gpi++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.08), panelMat);
    panel.position.set(4.9, 1.6, -2.0 + gpi * 2.0);
    labRoom.add(panel);
    // Valve handles
    for (let v = 0; v < 3; v++) {
      const valve = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
      valve.position.set(4.86, 1.4 + v * 0.22, -2.0 + gpi * 2.0);
      valve.rotation.y = Math.PI / 2;
      labRoom.add(valve);
    }
  }

  // Cable management racks on ceiling
  for (let cr = 0; cr < 4; cr++) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 }));
    rack.position.set(0, 3.1, -1.5 + cr * 1.0);
    labRoom.add(rack);
  }

  root.add(labRoom);

  // 2. Interactive Centerpiece Bloch Sphere (Beat 2 & Challenge 1)
  const blochSphere = new THREE.Group();
  blochSphere.name = 'bloch-sphere-centerpiece';
  blochSphere.position.set(-1.8, 1.3, -1.8);

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

  // --- Task 20.1: Bloch sphere state labels at six cardinal positions (Req 35.1) ---
  // Label positions: north |0⟩, south |1⟩, equatorial ±X/±Y for |+⟩,|−⟩,|i⟩,|−i⟩
  const blochStateLabels: Array<{ text: string; x: number; y: number; z: number }> = [
    { text: '|0⟩', x: 0,     y:  0.42, z: 0 },
    { text: '|1⟩', x: 0,     y: -0.42, z: 0 },
    { text: '|+⟩', x:  0.42, y:  0,    z: 0 },
    { text: '|−⟩', x: -0.42, y:  0,    z: 0 },
    { text: '|i⟩', x: 0,     y:  0,    z:  0.42 },
    { text: '|−i⟩', x: 0,    y:  0,    z: -0.42 },
  ];
  for (const lbl of blochStateLabels) {
    const lblPanel = createTextPanel(lbl.text, {
      widthMeters: 0.08, heightMeters: 0.04, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8',
    });
    lblPanel.position.set(lbl.x, lbl.y, lbl.z);
    blochSphere.add(lblPanel);
  }

  // Proximity panel: auto-opens when learner walks within 1.5 m (Req 35.2)
  // Tracked in update() via blochSphereProximityOpened flag below.
  const blochProximityPanel = createTextPanel(
    'The arrow shows the qubit\'s quantum state.\n' +
    'North = |0⟩  South = |1⟩\n' +
    'Equator = superposition of |0⟩ and |1⟩\n' +
    'Rotate the dial to change the state.',
    { widthMeters: 0.38, heightMeters: 0.14, fontSizePx: 16, align: 'left',
      background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 4 },
  );
  // Positioned to the right of the sphere in blochSphere local space
  blochProximityPanel.position.set(0.55, 0, 0);
  blochProximityPanel.visible = false;
  blochSphere.add(blochProximityPanel);
  let blochSphereProximityOpened = false;

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

  // Spatial rotator primitive controlling Bloch sphere theta rotation (polar angle between |0> and |1>)
  const blochRotator = new SpatialRotatorPrimitive(blochVectorArrow, {
    axis: 'z',
    detentStepDeg: 15,
  });

  // 3. Multi-Stage Gold Dilution Refrigerator (Beat 4 & Cryostat Anchor)
  const cryostatGroup = new THREE.Group();
  cryostatGroup.name = 'dilution-refrigerator-cryostat';
  cryostatGroup.position.set(1.8, 0, -1.8);

  const stageTemperatures = [
    { name: '50K Stage',          label: '50K',   radius: 0.28, color: 0x94a3b8 },
    { name: '4K Pulse Tube',      label: '4K',    radius: 0.24, color: 0xf59e0b },
    { name: '800mK Still',        label: '800mK', radius: 0.20, color: 0xd97706 },
    { name: '100mK Cold Plate',   label: '100mK', radius: 0.16, color: 0xb45309 },
    { name: '15mK Mixing Chamber',label: '15mK',  radius: 0.12, color: 0x78350f },
  ];

  const CRYOSTAT_FOLIO_TEXT: Record<string, string> = {
    '50K':   '50 K Stage\nFirst thermal shield cooled by pulse-tube refrigerator.\nReduces blackbody radiation load from room temperature.',
    '4K':    '4 K Stage\nSecond shield cooled by pulse-tube cryocooler.\nRemoves heat leaks before the dilution unit.',
    '800mK': '800 mK Still\nHelium-3/Helium-4 mixture evaporates here.\nCools the system toward the millikelvin regime.',
    '100mK': '100 mK Cold Plate\nAnchor for cold electronics and attenuators.\nMinimises thermal noise reaching the qubits.',
    '15mK':  '15 mK Mixing Chamber\nLowest temperature stage — where the qubits sit.\nThermal energy kT ≪ qubit energy splitting hν:\nquantum coherence is preserved.',
  };

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
    plate.userData.cryostatStage = stage.label;

    // --- Task 20.4: Engraved label on each stage plate (Req 38.1) ---
    const stageLabel = createTextPanel(stage.label, {
      widthMeters: stage.radius * 1.6, heightMeters: 0.03, fontSizePx: 14, align: 'center',
      background: '#0f172a', color: '#e2e8f0', accent: '#94a3b8',
    });
    stageLabel.position.set(stage.radius * 0.5, 0.012, 0);
    stageLabel.rotation.x = -Math.PI / 2;
    plate.add(stageLabel);

    // SpatialGrabPrimitive on each stage: on grabStart show folio explanation (Req 38.2)
    const stageInfoPanel = createTextPanel(CRYOSTAT_FOLIO_TEXT[stage.label] ?? stage.name, {
      widthMeters: 0.4, heightMeters: 0.18, fontSizePx: 15, align: 'left',
      background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 5,
    });
    stageInfoPanel.position.set(stage.radius + 0.28, 0, 0);
    stageInfoPanel.visible = false;
    cryostatGroup.add(stageInfoPanel);

    new SpatialGrabPrimitive(plate, {
      onGrab: () => { stageInfoPanel.visible = true; },
      onRelease: () => {
        // Snap back to original position
        plate.position.y = (2 - idx) * 0.15;
        stageInfoPanel.visible = false;
      },
    });

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
  galleryGroup.position.set(0, 0, -2.6);
  galleryGroup.rotation.y = Math.PI; // Face the user inward

  QUANTUM_ARCHITECTURES.forEach((hw, idx) => {
    const ped = createHardwarePedestal(hw);
    const angle = (idx / (QUANTUM_ARCHITECTURES.length - 1)) * (Math.PI * 0.7) - Math.PI * 0.35;
    const r = 2.0;
    ped.position.set(Math.sin(angle) * r, 0, Math.cos(angle) * r - 1.2);
    ped.lookAt(0, ped.position.y, 0); // Yaw-only orientation: face center without vertical tilt
    hardwarePedestals.push(ped);
    galleryGroup.add(ped);
  });
  root.add(galleryGroup);

  // 5. Entangled Bell Pair Source & Optical Bench (Beat 5 & Challenge 3)
  const bellGroup = new THREE.Group();
  bellGroup.name = 'bell-pair-optical-bench';
  bellGroup.position.set(-2.2, 0.85, -2.8);

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
  circuitBoard.position.set(0, 0.85, -1.8);

  const boardGeo = new THREE.BoxGeometry(0.6, 0.03, 0.35);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  circuitBoard.add(boardMesh);
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

  // Gate slot state: [slot0, slot1] track which gates are placed on the rails
  const gateSlots: [string | null, string | null] = [null, null];

  // Circuit state readout panel — shows the computed qubit state string
  const circuitReadout = createTextPanel('State: |0⟩', {
    widthMeters: 0.6, heightMeters: 0.1, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  circuitReadout.name = 'circuit-state-readout';
  circuitReadout.position.set(0, 1.25, -2.1);
  circuitReadout.lookAt(0, 1.25, 0);
  root.add(circuitReadout);

  function updateCircuitReadout(): void {
    const stateText = computeCircuitState(gateSlots);
    setTextPanelText(circuitReadout, stateText);
  }

  // --- Task 20.2: Gate token labels on top face + grab tooltips (Req 36.1–36.3) ---
  // Helper to create a gate canvas label plane on top face of token
  function makeGateTopLabel(text: string, color: string): THREE.Mesh {
    const panel = createTextPanel(text, {
      widthMeters: 0.065, heightMeters: 0.065, fontSizePx: 24, align: 'center',
      background: '#0f172a', color,
    });
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(0, 0.025, 0);
    return panel;
  }

  // Gate tooltip shared panel (single instance, repositioned on grab)
  const gateTooltip = createTextPanel('', {
    widthMeters: 0.34, heightMeters: 0.1, fontSizePx: 16, align: 'left',
    background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 3,
  });
  gateTooltip.visible = false;
  root.add(gateTooltip);

  const GATE_TOOLTIPS: Record<string, string> = {
    H:    'H gate: Hadamard\nPuts qubit into equal superposition:\n|0⟩ → (|0⟩+|1⟩)/√2',
    X:    'X gate: Pauli-X (bit flip)\nFlips |0⟩ to |1⟩ and vice versa.',
    Z:    'Z gate: Pauli-Z (phase flip)\nLeaves |0⟩ unchanged; flips sign of |1⟩.',
    CNOT: 'CNOT gate: Controlled-NOT\nFlips target qubit only if control = |1⟩.\nUsed to entangle two qubits.',
  };

  // Grabbable Hadamard [H] gate token
  const hGate = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.04, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
  );
  hGate.position.set(-0.15, 0.04, 0.08);
  hGate.name = 'quantum-gate-hadamard';
  hGate.userData.gateId = 'H';
  hGate.add(makeGateTopLabel('H', '#ffffff'));
  const hGateHome = hGate.position.clone();
  new SpatialGrabPrimitive(hGate, {
    constrainY: true,
    onGrab: () => {
      setTextPanelText(gateTooltip, GATE_TOOLTIPS['H']);
      const wp = hGate.getWorldPosition(new THREE.Vector3());
      gateTooltip.position.set(wp.x + 0.25, wp.y + 0.08, wp.z);
      gateTooltip.visible = true;
    },
    onRelease: () => {
      gateTooltip.visible = false;
      // Snap to top rail slot (z ≈ +0.08) if dropped near it
      const boardPos = circuitBoard.getWorldPosition(new THREE.Vector3());
      const gateWorldPos = hGate.getWorldPosition(new THREE.Vector3());
      const localPos = circuitBoard.worldToLocal(gateWorldPos.clone());
      const nearTopRail = Math.abs(localPos.z - 0.08) < 0.12 && Math.abs(localPos.x) < 0.25;
      if (nearTopRail) {
        hGate.position.set(0, 0.04, 0.08);
        gateSlots[0] = 'H';
      } else {
        hGate.position.copy(hGateHome);
        if (gateSlots[0] === 'H') gateSlots[0] = null;
      }
      void boardPos; // suppress unused warning
      updateCircuitReadout();
    },
  });
  circuitBoard.add(hGate);

  // Grabbable CNOT gate token
  const cnotGate = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.04, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
  );
  cnotGate.position.set(0.15, 0.04, -0.08);
  cnotGate.name = 'quantum-gate-cnot';
  cnotGate.userData.gateId = 'CNOT';
  cnotGate.add(makeGateTopLabel('CNOT', '#ffffff'));
  const cnotGateHome = cnotGate.position.clone();
  new SpatialGrabPrimitive(cnotGate, {
    constrainY: true,
    onGrab: () => {
      setTextPanelText(gateTooltip, GATE_TOOLTIPS['CNOT']);
      const wp = cnotGate.getWorldPosition(new THREE.Vector3());
      gateTooltip.position.set(wp.x + 0.25, wp.y + 0.08, wp.z);
      gateTooltip.visible = true;
    },
    onRelease: () => {
      gateTooltip.visible = false;
      // Snap to bottom rail slot (z ≈ -0.08) if dropped near it
      const boardPos = circuitBoard.getWorldPosition(new THREE.Vector3());
      const gateWorldPos = cnotGate.getWorldPosition(new THREE.Vector3());
      const localPos = circuitBoard.worldToLocal(gateWorldPos.clone());
      const nearBottomRail = Math.abs(localPos.z + 0.08) < 0.12 && Math.abs(localPos.x) < 0.25;
      if (nearBottomRail) {
        cnotGate.position.set(0, 0.04, -0.08);
        gateSlots[1] = 'CNOT';
      } else {
        cnotGate.position.copy(cnotGateHome);
        if (gateSlots[1] === 'CNOT') gateSlots[1] = null;
      }
      void boardPos; // suppress unused warning
      updateCircuitReadout();
    },
  });
  circuitBoard.add(cnotGate);
  root.add(circuitBoard);

  // Circuit board mission label
  const circuitLabel = createTextPanel(
    'Quantum Circuit Board\nGrab H gate → place on top qubit rail → creates superposition\nGrab CNOT → place on second rail → creates entanglement\nThis builds a Bell state: (|00⟩ + |11⟩)/√2\n\nSimplified model — real circuits run on dilution fridge qubits.',
    { widthMeters: 0.72, heightMeters: 0.3, fontSizePx: 17, align: 'left', background: '#0f172a', color: '#38bdf8', accent: '#3b82f6', lines: 5, pixelWidth: 580, pixelHeight: 240 },
  );
  circuitLabel.position.set(0, 1.22, -0.5);
  circuitLabel.lookAt(0, 1.22, 2);
  root.add(circuitLabel);

  // 7. Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'quantum-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // 8. Lab Aesthetic: Fluorescent strip lights (Beat 1 environment polish)
  for (const sx of [-2, 0, 2]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.04, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.4 }),
    );
    strip.position.set(sx, 2.9, 0);
    root.add(strip);
    const stripLight = new THREE.PointLight(0xffffff, 0.6, 4);
    stripLight.position.set(sx, 2.85, 0);
    root.add(stripLight);
  }

  // Equipment rack on right wall
  const rackBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 2.0, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.5 }),
  );
  rackBody.position.set(4.6, 1.0, 0);
  root.add(rackBody);
  const ledColors = [0x22c55e, 0xef4444, 0x3b82f6, 0xf59e0b, 0x22c55e, 0xef4444];
  for (let li = 0; li < 6; li++) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 0.06),
      new THREE.MeshStandardMaterial({ color: ledColors[li], emissive: ledColors[li], emissiveIntensity: 0.8 }),
    );
    led.position.set(4.6, 1.8 - li * 0.3, 0.21);
    root.add(led);
  }

  // Helium recovery pipes on ceiling
  for (const px of [-1.5, 1.5]) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 4.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 }),
    );
    pipe.position.set(px, 3.1, 0);
    root.add(pipe);
  }

  // Warning signs on walls
  const cryoSign = createTextPanel('⚠ CRYOGENIC HAZARD', {
    widthMeters: 0.5, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#1e3a5f', color: '#fbbf24', accent: '#fbbf24',
  });
  cryoSign.position.set(-4.6, 1.8, 0);
  cryoSign.rotation.y = Math.PI / 2;
  root.add(cryoSign);

  const magSign = createTextPanel('⚠ MAGNETIC FIELD — REMOVE METALLIC OBJECTS', {
    widthMeters: 0.7, heightMeters: 0.08, fontSizePx: 18, align: 'center',
    background: '#1e3a5f', color: '#fbbf24', accent: '#fbbf24',
  });
  magSign.position.set(4.6, 2.1, 0);
  magSign.rotation.y = -Math.PI / 2;
  root.add(magSign);

  // 9. Welcome board at room entrance (replaces floating intro text)
  const boardBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.75, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  );
  boardBacking.name = 'quantum-welcome-board';
  boardBacking.position.set(0, 1.1, 3.5);
  root.add(boardBacking);

  const welcomeText = [
    'QUANTUM COMPUTING LAB',
    '─────────────────────────────',
    '1. Rotate the Bloch sphere to explore qubit states',
    '2. Grab gate tokens and place them on the circuit',
    '3. Pull cryostat stages to learn about cooling',
    '4. Inspect hardware pedestals for qubit architectures',
    '',
    'Move: LEFT thumbstick / teleport arc.',
    'The room extends beyond the VR guardian.',
  ].join('\n');

  const boardPanel = createTextPanel(welcomeText, {
    widthMeters: 1.0, heightMeters: 0.68, fontSizePx: 17, align: 'left',
    background: '#1a0a00', color: '#fef3c7', accent: '#fbbf24',
    lines: 9, pixelWidth: 820, pixelHeight: 560,
  });
  boardPanel.position.set(0, 1.1, 3.48);
  root.add(boardPanel);

  // Animation / Render tick handler
  function update(deltaSeconds: number): void {
    // Slowly rotate BBO crystal
    crystal.rotation.x += 0.8 * deltaSeconds;
    crystal.rotation.y += 0.5 * deltaSeconds;

    // Pulse equatorial ring glow
    equatorRing.rotation.z += 0.2 * deltaSeconds;

    // Task 20.1: Bloch sphere proximity panel (Req 35.2)
    // Opens once when head is within 1.5 m — relies on camera being available externally.
    // We approximate by checking via global camera if available.
    if (!blochSphereProximityOpened) {
      const blochWorldPos = blochSphere.getWorldPosition(new THREE.Vector3());
      // A sentinel userData flag updated by main.ts each frame if present
      const camPos: THREE.Vector3 | undefined = root.userData.headWorldPos as THREE.Vector3 | undefined;
      if (camPos && camPos.distanceTo(blochWorldPos) <= 1.5) {
        blochProximityPanel.visible = true;
        blochSphereProximityOpened = true;
      }
    }
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


/*
 * BUDGET ESTIMATE (NOT measured on device):
 * Floor + ceiling + walls: ~600 tris
 * Bloch sphere (outer + meridians + poles + labels): ~1,400 tris
 * Dilution fridge / cryostat (5 stages): ~400 tris
 * Gate tokens (4 × box): ~48 tris
 * Circuit board: ~200 tris
 * Hardware gallery (6 pedestals + models): ~1,800 tris
 * Lab aesthetic (strips, rack, pipes, signs): ~350 tris
 * Welcome board: ~12 tris
 * Misc labels / text panels: ~60 panels × 2 tris = ~120 tris
 * Triangles total: ~4,930 / working target 150,000 / ceiling 250,000
 * Draw calls: ~45 / working target 108 / ceiling 180
 */

