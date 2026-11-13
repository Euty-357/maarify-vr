import * as THREE from 'three';
import {
  ROCKET_ENGINE_CYCLES,
  calculateAerodynamics,
  evaluateNozzleExpansion,
} from './propulsion.js';
import { getSpatialAnchors } from './anchors.js';
import {
  SpatialAnchorPrimitive,
  SpatialSliderPrimitive,
  SpatialRotatorPrimitive,
  SpatialLeverPrimitive,
  ExplodableAssembly,
} from '../../core/input/primitives/index.js';
import { createTextPanel } from '../../core/ui/text-panel.js';

export interface AerospaceSceneComponents {
  root: THREE.Group;
  wingSparRoot: THREE.Group;
  rocketEngineRoot: THREE.Group;
  nozzlePlumeRoot: THREE.Group;
  taifaCubeSatRoot: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  wingPitchSlider: SpatialSliderPrimitive;
  explodeAssembly: ExplodableAssembly;
  cycleRotator: SpatialRotatorPrimitive;
  nozzlePressureSlider: SpatialSliderPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export async function buildAerospaceScene(): Promise<AerospaceSceneComponents> {
  const root = new THREE.Group();
  root.name = 'aerospace-module-root';

  // 1. Aerodrome & space-history tarmac (Wilson Airport / historic Malindi range)
  const floorGroup = new THREE.Group();
  floorGroup.name = 'aerospace-tarmac-floor';

  const floorGeo = new THREE.PlaneGeometry(14, 14, 24, 24);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.85,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.05;
  floorGroup.add(floor);

  // Runway markings (yellow centerline stripe)
  const lineGeo = new THREE.PlaneGeometry(0.2, 12);
  lineGeo.rotateX(-Math.PI / 2);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xddaa33 });
  const lineMesh = new THREE.Mesh(lineGeo, lineMat);
  lineMesh.position.set(0, -0.04, 0);
  floorGroup.add(lineMesh);
  root.add(floorGroup);

  // 2. Mandatory Educational & Safety Scope Notice Plinth (Prominent at entrance)
  const safetyPlinthGroup = new THREE.Group();
  safetyPlinthGroup.name = 'propulsion-safety-plinth';
  safetyPlinthGroup.position.set(0, 0.7, -0.4);

  const plinthColumnGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.7, 16);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x1a2636,
    metalness: 0.5,
    roughness: 0.4,
  });
  const column = new THREE.Mesh(plinthColumnGeo, plinthMat);
  column.position.y = 0.35;
  safetyPlinthGroup.add(column);

  let safetyTexture: THREE.CanvasTexture | THREE.Texture | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 240);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AEROSPACE & PROPULSION SCOPE', 256, 45);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '15px sans-serif';
      ctx.fillText('System-level principles, cycle thermodynamics,', 256, 85);
      ctx.fillText('and flow paths only. Strictly NO propellant', 256, 115);
      ctx.fillText('formulations, chemical mixing, ignition details,', 256, 145);
      ctx.fillText('or fabrication instructions.', 256, 175);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'italic 13px sans-serif';
      ctx.fillText('Kenya Space Agency • historic Malindi range', 256, 215);

      safetyTexture = new THREE.CanvasTexture(canvas);
    }
  }

  const signGeo = new THREE.PlaneGeometry(0.48, 0.24);
  const signMat = new THREE.MeshBasicMaterial({
    map: safetyTexture,
    side: THREE.DoubleSide,
  });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 0.78, 0);
  signMesh.rotation.x = -Math.PI / 6;
  safetyPlinthGroup.add(signMesh);
  root.add(safetyPlinthGroup);

  // 3. Aircraft Wing Spar & Transonic Wind Tunnel Section (Left Station)
  const wingSparRoot = new THREE.Group();
  wingSparRoot.name = 'wing-spar-station';
  wingSparRoot.position.set(-1.4, 1.2, -1.2);

  // Wing geometry: NACA 0012 stylized symmetrical aerofoil section
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.4, 0);
  wingShape.bezierCurveTo(0.3, 0.08, -0.1, 0.07, -0.4, 0.01);
  wingShape.bezierCurveTo(-0.45, 0.0, -0.45, -0.01, -0.4, -0.01);
  wingShape.bezierCurveTo(-0.1, -0.07, 0.3, -0.08, 0.4, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 0.8,
    bevelEnabled: false,
  };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.center();
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.7,
    roughness: 0.3,
  });
  const wingMesh = new THREE.Mesh(wingGeo, wingMat);
  wingMesh.name = 'aerofoil-mesh';
  wingSparRoot.add(wingMesh);

  // Wind tunnel smoke streamlines & luminous tracer particles (Section 4.3)
  const streamlineGroup = new THREE.Group();
  streamlineGroup.name = 'wind-tunnel-streamlines';
  const numStreamlines = 16;
  let flowEnabled = true;

  // One batched geometry keeps the 16 flow ribbons at one draw call.
  const streamlinePositions: number[] = [];
  for (let i = 0; i < numStreamlines; i++) {
    const yOffset = -0.22 + (i / (numStreamlines - 1)) * 0.44;
    const zOffset = ((i % 4) - 1.5) * 0.22;
    const points: THREE.Vector3[] = [];
    for (let x = -1.2; x <= 1.2; x += 0.1) {
      // Flow contour turning around the aerofoil profile
      const distFromWing = Math.hypot(x, yOffset);
      const deflection = yOffset > 0 ? Math.exp(-distFromWing * 4) * 0.08 : -Math.exp(-distFromWing * 4) * 0.04;
      points.push(new THREE.Vector3(x, yOffset + deflection, zOffset));
    }
    for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
      streamlinePositions.push(...points[pointIndex].toArray(), ...points[pointIndex + 1].toArray());
    }
  }
  const streamlineGeo = new THREE.BufferGeometry();
  streamlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(streamlinePositions, 3));
  const streamlineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const streamlineRibbons = new THREE.LineSegments(streamlineGeo, streamlineMat);
  streamlineRibbons.name = 'wind-tunnel-streamline-ribbons';
  streamlineRibbons.userData.streamlineCount = numStreamlines;
  streamlineGroup.add(streamlineRibbons);

  // Active particulate smoke puffs: instanced/points particle field
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);
  for (let p = 0; p < particleCount; p++) {
    particlePositions[p * 3] = (Math.random() - 0.5) * 2.4;
    particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 0.45;
    particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 0.7;
    particleSpeeds[p] = 0.8 + Math.random() * 0.6;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.028,
    transparent: true,
    opacity: 0.85,
  });
  const smokeParticles = new THREE.Points(particleGeo, particleMat);
  smokeParticles.name = 'wind-tunnel-particles';
  streamlineGroup.add(smokeParticles);
  wingSparRoot.add(streamlineGroup);

  // Simplified fluid model label
  const modelNotice = createTextPanel('SIMPLIFIED MODEL — NOT ENGINEERING CFD', {
    widthMeters: 0.9,
    heightMeters: 0.1,
    fontSizePx: 22,
    align: 'center',
    background: '#0f172a',
    color: '#38bdf8',
    lines: 1,
  });
  modelNotice.position.set(0, 0.55, 0);
  wingSparRoot.add(modelNotice);

  // Flow on/off lever, visibly set to ON at entry.
  const flowLeverPivot = new THREE.Group();
  flowLeverPivot.name = 'wind-tunnel-flow-lever';
  flowLeverPivot.position.set(-1.0, 0.75, -0.9);
  const flowLeverBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  flowLeverPivot.add(flowLeverBase);
  const flowLeverHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.16, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5 })
  );
  flowLeverHandle.position.y = 0.08;
  flowLeverPivot.add(flowLeverHandle);
  const flowLever = new SpatialLeverPrimitive(flowLeverPivot, {
    axis: 'z',
    minAngleDeg: -35,
    maxAngleDeg: 35,
    onAngleChange: (_angleDeg, normalized) => {
      flowEnabled = normalized > 0.15;
      streamlineGroup.visible = flowEnabled;
    },
  });
  flowLever.setAngle(35); // ON by default
  root.add(flowLeverPivot);

  // Density lever controls both the smoke opacity and particle count without a HUD.
  const densityLeverPivot = new THREE.Group();
  densityLeverPivot.name = 'wind-tunnel-density-lever';
  densityLeverPivot.position.set(-0.72, 0.75, -0.9);
  const densityLeverBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.025, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  densityLeverPivot.add(densityLeverBase);
  const densityLeverHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.13, 0.022),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.5 })
  );
  densityLeverHandle.position.y = 0.065;
  densityLeverPivot.add(densityLeverHandle);
  const densityLever = new SpatialLeverPrimitive(densityLeverPivot, {
    axis: 'z',
    minAngleDeg: -35,
    maxAngleDeg: 35,
    onAngleChange: (_angleDeg, normalized) => {
      const density = 0.25 + normalized * 0.75;
      streamlineMat.opacity = density;
      particleMat.opacity = density;
      smokeParticles.visible = normalized > 0.05;
    },
  });
  densityLever.setAngle(25);
  root.add(densityLeverPivot);

  // Wing Pitch Slider Handle & Primitive
  const pitchHandleGeo = new THREE.BoxGeometry(0.12, 0.06, 0.06);
  const pitchHandleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const pitchHandle = new THREE.Mesh(pitchHandleGeo, pitchHandleMat);
  pitchHandle.position.set(-1.4, 0.7, -0.9);
  root.add(pitchHandle);

  const wingPitchSlider = new SpatialSliderPrimitive(pitchHandle, {
    axis: 'x',
    minDistance: -1.6,
    maxDistance: -1.2,
    onValueChange: (normalizedVal) => {
      // Map normalized [0, 1] to -5° to 25°
      const deg = -5 + normalizedVal * 30;
      wingMesh.rotation.z = -(deg * Math.PI) / 180;
      const aero = calculateAerodynamics(deg, 1680);
      if (aero.isStalled) {
        streamlineMat.color.setHex(0xef4444); // Red separated flow
        streamlineRibbons.position.y = (Math.random() - 0.5) * 0.08;
        streamlineRibbons.rotation.z = (Math.random() - 0.5) * 0.2;
      } else {
        streamlineMat.color.setHex(0x38bdf8); // Smooth blue attached flow
        streamlineRibbons.position.y = 0;
        streamlineRibbons.rotation.z = 0;
      }
      if (aero.isStalled) {
        particleMat.color.setHex(0xef4444);
      } else {
        particleMat.color.setHex(0x7dd3fc);
      }
    },
  });
  root.add(wingSparRoot);

  // 4. Liquid Rocket Engine 3D Exploded View & Staged Combustion Assembly (Center Station)
  const rocketEngineRoot = new THREE.Group();
  rocketEngineRoot.name = 'rocket-engine-exploded-assembly';
  rocketEngineRoot.position.set(0.0, 1.2, -1.3);

  // Component 1: Injector Dome & Powerhead Ring
  const injectorGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.12, 24);
  const injectorMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.8,
    roughness: 0.2,
  });
  const injectorMesh = new THREE.Mesh(injectorGeo, injectorMat);
  injectorMesh.position.y = 0.55;
  injectorMesh.name = 'injector-dome';
  rocketEngineRoot.add(injectorMesh);

  // Component 2: Main Combustion Chamber
  const chamberGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.28, 24);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.6,
    roughness: 0.3,
  });
  const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
  chamberMesh.position.y = 0.35;
  chamberMesh.name = 'combustion-chamber';
  rocketEngineRoot.add(chamberMesh);

  // Component 3: Turbopump Assembly (dual pumps + central turbine)
  const turbopumpGroup = new THREE.Group();
  turbopumpGroup.name = 'turbopump-assembly';
  turbopumpGroup.position.set(0.35, 0.45, 0);

  const loxPumpGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16);
  const loxPumpMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 }); // Cyan for LOX
  const loxPump = new THREE.Mesh(loxPumpGeo, loxPumpMat);
  loxPump.rotation.z = Math.PI / 2;
  turbopumpGroup.add(loxPump);

  const fuelPumpGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16);
  const fuelPumpMat = new THREE.MeshStandardMaterial({ color: 0xf97316 }); // Orange for Fuel
  const fuelPump = new THREE.Mesh(fuelPumpGeo, fuelPumpMat);
  fuelPump.position.x = 0.18;
  fuelPump.rotation.z = Math.PI / 2;
  turbopumpGroup.add(fuelPump);
  rocketEngineRoot.add(turbopumpGroup);

  // Component 4: Regenerative Cooling Jacket (Helical wire lines around nozzle)
  const coolingJacketGroup = new THREE.Group();
  coolingJacketGroup.name = 'regenerative-cooling-jacket';
  const helixPoints: THREE.Vector3[] = [];
  for (let t = 0; t <= Math.PI * 12; t += 0.25) {
    const y = 0.25 - (t / (Math.PI * 12)) * 0.5;
    const radius = 0.16 + (0.25 - y) * 0.35;
    helixPoints.push(new THREE.Vector3(Math.cos(t) * radius, y, Math.sin(t) * radius));
  }
  const helixGeo = new THREE.BufferGeometry().setFromPoints(helixPoints);
  const helixMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
  });
  const coolingHelix = new THREE.Line(helixGeo, helixMat);
  coolingJacketGroup.add(coolingHelix);
  rocketEngineRoot.add(coolingJacketGroup);

  // Component 5: de Laval Expansion Nozzle Bell
  const nozzleBellGeo = new THREE.CylinderGeometry(0.14, 0.38, 0.5, 24, 1, true);
  const nozzleBellMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });
  const nozzleBellMesh = new THREE.Mesh(nozzleBellGeo, nozzleBellMat);
  nozzleBellMesh.position.y = -0.05;
  nozzleBellMesh.name = 'nozzle-bell';
  rocketEngineRoot.add(nozzleBellMesh);

  // Explodable assembly: every named part is individually grabbable and snaps back.
  const explodeAssembly = new ExplodableAssembly(rocketEngineRoot);
  explodeAssembly.addPart('injector', injectorMesh, {
    explodeDirection: new THREE.Vector3(0, 1, 0),
    explodeDistanceMeters: 0.35,
  });
  explodeAssembly.addPart('chamber', chamberMesh, {
    explodeDirection: new THREE.Vector3(0, 0.8, 0),
    explodeDistanceMeters: 0.28,
  });
  explodeAssembly.addPart('turbopump', turbopumpGroup, {
    explodeDirection: new THREE.Vector3(1, 0.2, 0),
    explodeDistanceMeters: 0.4,
  });
  explodeAssembly.addPart('cooling-jacket', coolingJacketGroup, {
    explodeDirection: new THREE.Vector3(0, -0.3, 0.6),
    explodeDistanceMeters: 0.25,
  });
  explodeAssembly.addPart('nozzle', nozzleBellMesh, {
    explodeDirection: new THREE.Vector3(0, -1, 0),
    explodeDistanceMeters: 0.35,
  });

  // Pull the lever up to separate every part; each part can also be grabbed alone.
  const explodeLeverPivot = new THREE.Group();
  explodeLeverPivot.name = 'explode-lever';
  explodeLeverPivot.position.set(0.55, 0.68, -1.35);
  const leverBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 })
  );
  explodeLeverPivot.add(leverBase);
  const leverHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.18, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.35 })
  );
  leverHandle.position.y = 0.09;
  explodeLeverPivot.add(leverHandle);
  const explodeLever = new SpatialLeverPrimitive(explodeLeverPivot, {
    axis: 'x',
    minAngleDeg: -40,
    maxAngleDeg: 40,
    onAngleChange: (_angleDeg, normalized) => explodeAssembly.setExplodeAmount(normalized),
  });
  explodeLever.setAngle(-40);
  root.add(explodeLeverPivot);
  root.add(rocketEngineRoot);

  // 5. Engine Cycle Rotator Plinth (Right of Engine)
  const cycleDialGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
  const cycleDialMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  const cycleDial = new THREE.Mesh(cycleDialGeo, cycleDialMat);
  cycleDial.position.set(0.6, 0.8, -1.0);
  root.add(cycleDial);

  const cycleKeys = Object.keys(ROCKET_ENGINE_CYCLES);
  let activeCycleIndex = 6; // Full-flow staged combustion default

  const cycleRotator = new SpatialRotatorPrimitive(cycleDial, {
    detentStepDeg: 45,
    onRotate: (angleDeg) => {
      const step = 360 / cycleKeys.length;
      activeCycleIndex = Math.abs(Math.round(angleDeg / step)) % cycleKeys.length;
      const cycle = ROCKET_ENGINE_CYCLES[cycleKeys[activeCycleIndex]];

      // Tint combustion chamber according to cycle
      if (cycle.id.includes('fuel-rich')) {
        chamberMat.color.setHex(0xf97316); // Orange
      } else if (cycle.id.includes('oxidizer-rich')) {
        chamberMat.color.setHex(0x06b6d4); // Cyan
      } else if (cycle.id.includes('full-flow')) {
        chamberMat.color.setHex(0x8b5cf6); // Purple gas-gas FFSC
      } else {
        chamberMat.color.setHex(0x0284c7); // Standard blue
      }
    },
  });

  // 6. Supersonic Shock Diamonds Plume Simulation (Under Nozzle Bell)
  const nozzlePlumeRoot = new THREE.Group();
  nozzlePlumeRoot.name = 'nozzle-shock-diamonds-plume';
  nozzlePlumeRoot.position.set(0.0, 0.85, -1.3);

  const diamondMeshes: THREE.Mesh[] = [];
  const numDiamonds = 6;
  for (let i = 0; i < numDiamonds; i++) {
    const dGeo = new THREE.OctahedronGeometry(0.045 - i * 0.005, 0);
    const dMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const dMesh = new THREE.Mesh(dGeo, dMat);
    dMesh.position.y = -0.06 - i * 0.08;
    diamondMeshes.push(dMesh);
    nozzlePlumeRoot.add(dMesh);
  }
  root.add(nozzlePlumeRoot);

  // Atmospheric Backpressure Slider Handle & Primitive
  const pressureHandleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
  const pressureHandleMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });
  const pressureHandle = new THREE.Mesh(pressureHandleGeo, pressureHandleMat);
  pressureHandle.position.set(1.4, 0.7, -0.9);
  root.add(pressureHandle);

  const nozzlePressureSlider = new SpatialSliderPrimitive(pressureHandle, {
    axis: 'y',
    minDistance: 0.6,
    maxDistance: 0.85,
    onValueChange: (normalizedVal) => {
      // Map normalized [0, 1] to [0.0, 1.013] bar
      const bar = normalizedVal * 1.013;
      const state = evaluateNozzleExpansion(50.0, bar, 100);
      diamondMeshes.forEach((mesh, idx) => {
        mesh.visible = idx < state.shockDiamondCount;
        if (state.expansionRegime === 'overexpanded') {
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        } else if (state.expansionRegime === 'underexpanded') {
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
        }
      });
    },
  });

  // 7. Kenya Space Agency Taifa-1 Satellite Model & Sun-Synchronous orbital arc
  const taifaCubeSatRoot = new THREE.Group();
  taifaCubeSatRoot.name = 'taifa-1-cubesat';
  taifaCubeSatRoot.position.set(0.0, 1.8, -0.6);

  // 3U CubeSat main bus (10cm x 10cm x 30cm scaled)
  const busGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
  const busMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.2,
  });
  const busMesh = new THREE.Mesh(busGeo, busMat);
  taifaCubeSatRoot.add(busMesh);

  // Deployed solar arrays
  const solarPanelGeo = new THREE.PlaneGeometry(0.2, 0.28);
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    metalness: 0.9,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  const leftPanel = new THREE.Mesh(solarPanelGeo, solarMat);
  leftPanel.position.set(-0.16, 0, 0);
  leftPanel.rotation.y = Math.PI / 8;
  taifaCubeSatRoot.add(leftPanel);

  const rightPanel = new THREE.Mesh(solarPanelGeo, solarMat);
  rightPanel.position.set(0.16, 0, 0);
  rightPanel.rotation.y = -Math.PI / 8;
  taifaCubeSatRoot.add(rightPanel);
  root.add(taifaCubeSatRoot);

  // 8. Diegetic Spatial Anchors
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'aerospace-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // Scene update loop
  let time = 0;
  const update = (deltaSeconds: number) => {
    time += deltaSeconds;

    // Gentle Taifa-1 orbital tumbling / slow yaw
    taifaCubeSatRoot.rotation.y += deltaSeconds * 0.25;

    // Pulse supersonic shock diamonds
    diamondMeshes.forEach((mesh, idx) => {
      const s = 1.0 + Math.sin(time * 8 + idx * 0.7) * 0.12;
      mesh.scale.set(s, s * 1.4, s);
    });

    if (flowEnabled) {
      // Animate the batched flow field along X.
      streamlineRibbons.position.x = (streamlineRibbons.position.x + deltaSeconds * 1.2) % 0.4;

      // Animate smoke particles through wind tunnel
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        positions[p * 3] += particleSpeeds[p] * deltaSeconds * 1.4;
        if (positions[p * 3] > 1.2) {
          positions[p * 3] = -1.2;
          positions[p * 3 + 1] = (Math.random() - 0.5) * 0.45;
          positions[p * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
      }
      posAttr.needsUpdate = true;
    }
  };

  // Scene disposal
  const dispose = () => {
    wingPitchSlider.handleMesh.parent?.remove(wingPitchSlider.handleMesh);
    delete injectorMesh.userData.grabPrimitive;
    delete injectorMesh.userData.isGrabbable;
    cycleRotator.dialObject.parent?.remove(cycleRotator.dialObject);
    nozzlePressureSlider.handleMesh.parent?.remove(nozzlePressureSlider.handleMesh);
    anchorPrimitive.dispose();

    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });

    if (safetyTexture) safetyTexture.dispose();
  };

  return {
    root,
    wingSparRoot,
    rocketEngineRoot,
    nozzlePlumeRoot,
    taifaCubeSatRoot,
    anchorPrimitive,
    wingPitchSlider,
    explodeAssembly,
    cycleRotator,
    nozzlePressureSlider,
    update,
    dispose,
  };
}
