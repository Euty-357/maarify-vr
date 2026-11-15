import * as THREE from 'three';
import { createHeartAnatomyMesh, HIV_STRUCTURAL_COMPONENTS } from './anatomy.js';
import { getSpatialAnchors } from './anchors.js';
import { MEDICINE_WINGS } from './sections.js';
import { createTextPanel } from '../../core/ui/text-panel.js';
import {
  SpatialAnchorPrimitive,
  SpatialSliderPrimitive,
  SpatialScalePinchPrimitive,
  SpatialGrabPrimitive,
  SpatialRotatorPrimitive,
} from '../../core/input/primitives/index.js';

export interface HumanBodySceneComponents {
  root: THREE.Group;
  heartRoot: THREE.Group;
  capillaryLoop: THREE.Group;
  synapseRoot: THREE.Group;
  hivVirionRoot: THREE.Group;
  carTRoot: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  heartPressureSlider: SpatialSliderPrimitive;
  hivScalePinch: SpatialScalePinchPrimitive;
  pacemakerRotator: SpatialRotatorPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/** Six clearly separated wing doorways around the shared hospital-lobby atrium. */
function buildMedicineAtrium(root: THREE.Group): void {
  const atrium = new THREE.Group();
  atrium.name = 'medicine-atrium';

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(4.7, 4.9, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85, metalness: 0.05 })
  );
  floor.position.y = -0.04;
  atrium.add(floor);

  const wayfindingRing = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.42, 48),
    new THREE.MeshBasicMaterial({ color: 0x0f766e, side: THREE.DoubleSide })
  );
  wayfindingRing.rotation.x = -Math.PI / 2;
  wayfindingRing.position.y = 0.01;
  atrium.add(wayfindingRing);

  const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.55 });

  MEDICINE_WINGS.forEach(({ section, setting }, index) => {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    const wing = new THREE.Group();
    wing.name = `medicine-wing-${section.id}`;
    wing.position.set(Math.sin(angle) * 3.6, 0, -Math.cos(angle) * 3.6);
    wing.lookAt(0, wing.position.y, 0); // Yaw-only orientation: face center without vertical tilt
    wing.userData.sectionId = section.id;

    const accent = new THREE.Color(setting.palette[0]);
    const doorway = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x0b0908, emissive: accent, emissiveIntensity: 0.22 })
    );
    doorway.position.y = 1.05;
    wing.add(doorway);

    for (const x of [-0.7, 0.7]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.2, 0.14), pillarMaterial);
      pillar.position.set(x, 1.1, 0.02);
      wing.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 0.18), pillarMaterial);
    lintel.position.y = 2.2;
    wing.add(lintel);

    const sign = createTextPanel(section.title.toUpperCase(), {
      widthMeters: 1.15,
      heightMeters: 0.15,
      fontSizePx: 26,
      align: 'center',
      background: '#241610',
      color: '#e8dcc0',
      accent: setting.palette[0],
      pixelWidth: 768,
      pixelHeight: 96,
      lines: 1,
    });
    sign.position.set(0, 2.42, 0.02);
    wing.add(sign);

    const threshold = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.12),
      new THREE.MeshBasicMaterial({ color: accent })
    );
    threshold.rotation.x = -Math.PI / 2;
    threshold.position.set(0, 0.02, 0.6);
    wing.add(threshold);

    atrium.add(wing);
  });

  root.add(atrium);
}

export async function buildHumanBodyScene(): Promise<HumanBodySceneComponents> {
  const root = new THREE.Group();
  root.name = 'human-body-module-root';
  buildMedicineAtrium(root);

  // 1. Biological Dark Lab Floor Environment
  const floorGroup = new THREE.Group();
  floorGroup.name = 'human-body-floor';

  const floorGeo = new THREE.PlaneGeometry(12, 12, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x090c15,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.05;
  floorGroup.add(floor);
  root.add(floorGroup);

  // 2. Mandatory Medical Disclaimer Plinth (Prominent at entrance)
  const disclaimerGroup = new THREE.Group();
  disclaimerGroup.name = 'medical-disclaimer-plinth';
  disclaimerGroup.position.set(0, 0.7, -0.4);

  const plinthBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.28, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 })
  );
  disclaimerGroup.add(plinthBase);

  // Disclaimer text canvas plaque
  const isBrowser = typeof document !== 'undefined';
  let plaqueTex: THREE.Texture;
  if (isBrowser) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 504, 248);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('MEDICAL & SAFETY DISCLAIMER', 20, 36);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '15px sans-serif';
      ctx.fillText('This software is designed solely for scientific education.', 20, 72);
      ctx.fillText('It does NOT provide medical advice, diagnosis, or treatment.', 20, 96);
      ctx.fillText('Always seek the guidance of a qualified healthcare professional', 20, 120);
      ctx.fillText('for any medical conditions or clinical concerns.', 20, 144);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('HIV Science: Undetectable = Untransmittable (U=U)', 20, 186);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Source: World Health Organization (WHO) & UNAIDS Guidelines', 20, 214);
    }
    plaqueTex = new THREE.CanvasTexture(canvas);
  } else {
    plaqueTex = new THREE.Texture();
  }

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.24),
    new THREE.MeshBasicMaterial({ map: plaqueTex, side: THREE.DoubleSide })
  );
  plaque.position.set(0, 0.68, 0);
  plaque.rotation.x = -Math.PI / 6; // Angled upward to user's gaze
  disclaimerGroup.add(plaque);
  root.add(disclaimerGroup);


  function buildWingRoom(id: string, setting: { palette: string[] }, angleRad: number): THREE.Group {
    const room = new THREE.Group();
    room.name = `wing-room-${id}`;
    // Center of wing room placed radially at 5.4m (extends from 3.6m door out to 7.2m)
    const r = 5.4;
    room.position.set(Math.sin(angleRad) * r, 0, -Math.cos(angleRad) * r);
    room.lookAt(Math.sin(angleRad) * 3.6, 0, -Math.cos(angleRad) * 3.6);

    const accent = new THREE.Color(setting.palette[0]);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Room floor: 3.6m wide x 3.6m deep
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 3.6), floorMat);
    floor.position.y = -0.04;
    room.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.08, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    ceiling.position.y = 2.8;
    room.add(ceiling);

    // Back wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 0.1), wallMat);
    backWall.position.set(0, 1.4, 1.8);
    room.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 3.6), wallMat);
    leftWall.position.set(-1.8, 1.4, 0);
    room.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 3.6), wallMat);
    rightWall.position.set(1.8, 1.4, 0);
    room.add(rightWall);

    // Room illumination
    const light = new THREE.PointLight(accent, 1.4, 6.0);
    light.position.set(0, 2.4, 0);
    room.add(light);

    // Central equipment table plinth
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.75, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
    );
    table.position.set(0, 0.375, 0);
    table.name = `wing-table-${id}`;
    room.add(table);

    return room;
  }

  // Instantiate dedicated rooms for each of the 6 Medicine Wings
  const wingRooms = new Map<string, THREE.Group>();
  MEDICINE_WINGS.forEach(({ section, setting }, index) => {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    const room = buildWingRoom(section.id, setting, angle);
    wingRooms.set(section.id, room);
    root.add(room);
  });

  // Body Scale Ladder Plinth in Central Atrium
  const ladderPlinth = new THREE.Group();
  ladderPlinth.name = 'body-scale-ladder-plinth';
  ladderPlinth.position.set(0, 0.05, 1.5);
  const ladderBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.6 })
  );
  ladderPlinth.add(ladderBase);
  const ladderSign = createTextPanel('BODY SCALE LADDER (Organ → Cell → Virion → Atom)', {
    widthMeters: 0.9,
    heightMeters: 0.14,
    fontSizePx: 22,
    align: 'center',
    background: '#0f766e',
    color: '#f8fafc',
    pixelWidth: 640,
    pixelHeight: 90,
  });
  ladderSign.position.set(0, 0.75, 0);
  ladderSign.rotation.x = -Math.PI / 6;
  ladderPlinth.add(ladderSign);
  root.add(ladderPlinth);

  // 3. Pulsating 4-Chamber Heart & Valve Assembly (Beat 2 - Cardiology Wing Room)
  const heartRoom = wingRooms.get('heart')!;
  const heartRoot = new THREE.Group();
  heartRoot.name = 'beating-heart-assembly';
  heartRoot.position.set(0, 1.25, 0);

  const heartAnatomy = createHeartAnatomyMesh();
  heartRoot.add(heartAnatomy);

  // Mitral valve leaflet flaps inside left ventricle
  const valveFlapMat = new THREE.MeshStandardMaterial({
    color: 0xfecdd3,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const leftLeaflet = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), valveFlapMat);
  leftLeaflet.position.set(0.06, 0.12, 0);
  leftLeaflet.rotation.y = Math.PI / 4;
  heartRoot.add(leftLeaflet);

  const rightLeaflet = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), valveFlapMat);
  rightLeaflet.position.set(0.10, 0.12, 0);
  rightLeaflet.rotation.y = -Math.PI / 4;
  heartRoot.add(rightLeaflet);
  heartRoom.add(heartRoot);

  // Hydraulic pressure slider: increases ventricular pressure (10 -> 120 mmHg)
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  sliderHandle.position.set(0.4, 0.85, 0);
  const heartPressureSlider = new SpatialSliderPrimitive(sliderHandle, {
    axis: 'y',
    minDistance: 0.75,
    maxDistance: 0.95,
    onValueChange: (val) => {
      // Scale valve leaflet closure as pressure rises
      const closureAngle = (val * Math.PI) / 3;
      leftLeaflet.rotation.z = closureAngle;
      rightLeaflet.rotation.z = -closureAngle;
    },
  });
  heartRoom.add(sliderHandle);

  // Rotary pacemaker timing dial (Challenge 1)
  const dialMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 })
  );
  dialMesh.position.set(-0.4, 0.85, 0);
  const pacemakerRotator = new SpatialRotatorPrimitive(dialMesh, { detentStepDeg: 15 });
  heartRoom.add(dialMesh);

  // 4. Microcirculation Capillary Tube & Red Blood Cell Ride (Beat 4 - Infection Prevention Wing Room)
  const infectionRoom = wingRooms.get('infection-prevention')!;
  const capillaryLoop = new THREE.Group();
  capillaryLoop.name = 'capillary-circulation-zone';
  capillaryLoop.position.set(0, 1.25, 0);

  // Transparent capillary endothelium tube
  const tubeGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 16, 1, true);
  tubeGeo.rotateZ(Math.PI / 2);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const capillaryTube = new THREE.Mesh(tubeGeo, tubeMat);
  capillaryLoop.add(capillaryTube);

  // Red blood cell biconcave discs
  const rbcList: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const rbcGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
    const rbcMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const rbc = new THREE.Mesh(rbcGeo, rbcMat);
    rbc.position.set((i - 1.5) * 0.25, 0, 0);
    rbc.rotation.y = Math.PI / 6;
    rbcList.push(rbc);
    capillaryLoop.add(rbc);
  }
  infectionRoom.add(capillaryLoop);

  // 5. Neural Axon Terminal & Synaptic Junction (Beat 4 - Brain Neurology Wing Room)
  const brainRoom = wingRooms.get('brain')!;
  const synapseRoot = new THREE.Group();
  synapseRoot.name = 'neural-synapse-zone';
  synapseRoot.position.set(0, 1.25, 0);

  // Presynaptic bouton bulb
  const boutonGeo = new THREE.SphereGeometry(0.22, 16, 16);
  boutonGeo.scale(1.2, 0.8, 1.0);
  const boutonMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.5 });
  const bouton = new THREE.Mesh(boutonGeo, boutonMat);
  bouton.position.y = 0.15;
  synapseRoot.add(bouton);

  // Postsynaptic dendritic membrane
  const postMem = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.5 })
  );
  postMem.position.y = -0.12;
  synapseRoot.add(postMem);

  // Grabbable neurotransmitter vesicles (acetylcholine spheres)
  const vesicle = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
  );
  vesicle.position.set(0, 0.08, 0);
  vesicle.name = 'neurotransmitter-vesicle';
  new SpatialGrabPrimitive(vesicle);
  synapseRoot.add(vesicle);
  brainRoom.add(synapseRoot);

  // 6. Exploded HIV Virion Model (Beat 6 - HIV Virology Wing Room)
  const hivRoom = wingRooms.get('hiv')!;
  const hivVirionRoot = new THREE.Group();
  hivVirionRoot.name = 'hiv-virion-assembly';
  hivVirionRoot.position.set(0, 1.25, 0);
  hivVirionRoot.rotation.y = Math.PI; // Face doorway

  // Outer viral lipid membrane
  const envGeo = new THREE.SphereGeometry(0.28, 20, 20);
  const envMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  const envMesh = new THREE.Mesh(envGeo, envMat);
  hivVirionRoot.add(envMesh);

  // gp120/gp41 surface glycoprotein spikes
  const spikeList: THREE.Mesh[] = [];
  for (let s = 0; s < 12; s++) {
    const spikeGeo = new THREE.ConeGeometry(0.02, 0.06, 8);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    spike.position.set(
      0.3 * Math.sin(phi) * Math.cos(theta),
      0.3 * Math.sin(phi) * Math.sin(theta),
      0.3 * Math.cos(phi)
    );
    spike.lookAt(0, 0, 0);
    spike.rotateX(Math.PI / 2);
    spikeList.push(spike);
    hivVirionRoot.add(spike);
  }

  // Central p24 conical capsid core
  const capsidGeo = new THREE.ConeGeometry(0.10, 0.22, 12);
  const capsidMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 });
  const capsidMesh = new THREE.Mesh(capsidGeo, capsidMat);
  hivVirionRoot.add(capsidMesh);

  // Internal reverse transcriptase & integrase enzyme globules
  HIV_STRUCTURAL_COMPONENTS.forEach((comp, idx) => {
    if (idx >= 2) {
      const glob = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.025, 0),
        new THREE.MeshStandardMaterial({ color: comp.color })
      );
      glob.position.set((idx - 3) * 0.05, 0, 0);
      hivVirionRoot.add(glob);
    }
  });
  hivRoom.add(hivVirionRoot);

  // Scale pinch primitive for virion exploded view
  const hivScalePinch = new SpatialScalePinchPrimitive(hivVirionRoot, {
    minScale: 0.8,
    maxScale: 2.2,
    onExplodeFraction: (frac) => {
      spikeList.forEach((spike) => {
        spike.position.setLength(0.3 + frac * 0.25);
      });
      capsidMesh.scale.setScalar(1.0 + frac * 0.5);
    },
  });

  // 7. CAR-T Cell vs Tumor Interface (Beat 5 - Cancer Oncology Wing Room)
  const cancerRoom = wingRooms.get('cancer')!;
  const carTRoot = new THREE.Group();
  carTRoot.name = 'car-t-oncology-zone';
  carTRoot.position.set(0, 1.25, 0);

  // Tumor B-cell with surface CD19 antigens
  const tumor = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.18, 1),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.7 })
  );
  tumor.position.set(-0.25, 0, 0);
  carTRoot.add(tumor);

  // Engineered CAR-T cell with scFv binding arm
  const tCell = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 })
  );
  tCell.position.set(0.25, 0, 0);

  // scFv receptor arm protruding toward tumor
  const receptorArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 })
  );
  receptorArm.position.set(-0.16, 0, 0);
  receptorArm.rotation.z = Math.PI / 2;
  tCell.add(receptorArm);
  carTRoot.add(tCell);
  cancerRoom.add(carTRoot);

  // Spine Wing Room: Vertebrae column model
  const spineRoom = wingRooms.get('spine');
  if (spineRoom) {
    const spineRoot = new THREE.Group();
    spineRoot.name = 'spine-vertebrae-assembly';
    spineRoot.position.set(0, 1.25, 0);
    for (let v = 0; v < 5; v++) {
      const vert = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
      );
      vert.position.y = (v - 2) * 0.06;
      spineRoot.add(vert);
      if (v < 4) {
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.075, 0.015, 16),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
        );
        disc.position.y = (v - 1.5) * 0.06;
        spineRoot.add(disc);
      }
    }
    spineRoom.add(spineRoot);
  }

  // 8. Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'human-body-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // Animation / Render tick handler
  let heartbeatPhase = 0;
  function update(deltaSeconds: number): void {
    // Cardiac pulse animation (72 bpm = 1.2 Hz)
    heartbeatPhase += deltaSeconds * 1.2 * Math.PI * 2;
    const pulse = 1.0 + Math.sin(heartbeatPhase) * 0.04;
    heartAnatomy.scale.set(pulse, pulse, pulse);

    // Roll red blood cells through capillary
    rbcList.forEach((rbc) => {
      rbc.position.x += 0.3 * deltaSeconds;
      if (rbc.position.x > 0.5) {
        rbc.position.x = -0.5;
      }
    });

    // Slowly revolve HIV virion
    hivVirionRoot.rotation.y += 0.3 * deltaSeconds;
  }

  function dispose(): void {
    anchorPrimitive.dispose();
  }

  return {
    root,
    heartRoot,
    capillaryLoop,
    synapseRoot,
    hivVirionRoot,
    carTRoot,
    anchorPrimitive,
    heartPressureSlider,
    hivScalePinch,
    pacemakerRotator,
    update,
    dispose,
  };
}

