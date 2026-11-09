import * as THREE from 'three';
import { createHeartAnatomyMesh, HIV_STRUCTURAL_COMPONENTS } from './anatomy.js';
import { getSpatialAnchors } from './anchors.js';
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

export async function buildHumanBodyScene(): Promise<HumanBodySceneComponents> {
  const root = new THREE.Group();
  root.name = 'human-body-module-root';

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
  plaque.position.set(0, 0.32, 0);
  plaque.rotation.x = -Math.PI / 6; // Angled upward to user's gaze
  disclaimerGroup.add(plaque);
  root.add(disclaimerGroup);

  // 3. Pulsating 4-Chamber Heart & Valve Assembly (Beat 2)
  const heartRoot = new THREE.Group();
  heartRoot.name = 'beating-heart-assembly';
  heartRoot.position.set(0, 1.3, -1.1);

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
  root.add(heartRoot);

  // Hydraulic pressure slider: increases ventricular pressure (10 -> 120 mmHg)
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  sliderHandle.position.set(0.3, 0.85, -0.8);
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
  root.add(sliderHandle);

  // Rotary pacemaker timing dial (Challenge 1)
  const dialMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 })
  );
  dialMesh.position.set(-0.3, 0.85, -0.8);
  const pacemakerRotator = new SpatialRotatorPrimitive(dialMesh, { detentStepDeg: 15 });
  root.add(dialMesh);

  // 4. Microcirculation Capillary Tube & Red Blood Cell Ride (Beat 4)
  const capillaryLoop = new THREE.Group();
  capillaryLoop.name = 'capillary-circulation-zone';
  capillaryLoop.position.set(1.6, 1.2, -0.5);

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
  root.add(capillaryLoop);

  // 5. Neural Axon Terminal & Synaptic Junction (Beat 4)
  const synapseRoot = new THREE.Group();
  synapseRoot.name = 'neural-synapse-zone';
  synapseRoot.position.set(-1.6, 1.2, -0.5);

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
  root.add(synapseRoot);

  // 6. Exploded HIV Virion Model (Beat 6 & U=U Reality)
  const hivVirionRoot = new THREE.Group();
  hivVirionRoot.name = 'hiv-virion-assembly';
  hivVirionRoot.position.set(0, 1.2, 1.8);
  hivVirionRoot.rotation.y = Math.PI; // Face user

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
  root.add(hivVirionRoot);

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

  // 7. CAR-T Cell vs Tumor Interface (Beat 5)
  const carTRoot = new THREE.Group();
  carTRoot.name = 'car-t-oncology-zone';
  carTRoot.position.set(-0.8, 1.2, 0.8);
  carTRoot.rotation.y = (Math.PI * 3) / 4;

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
  root.add(carTRoot);

  // 8. Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'human-body-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
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

