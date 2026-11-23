import * as THREE from 'three';
import { getSpatialAnchors } from './anchors.js';
import { MEDICINE_WINGS } from './sections.js';
import { BloodFlowSystem } from './blood-flow.js';
import { createTextPanel } from '../../core/ui/text-panel.js';
import {
  SpatialAnchorPrimitive,
  SpatialSliderPrimitive,
  SpatialScalePinchPrimitive,
  SpatialGrabPrimitive,
  SpatialRotatorPrimitive,
} from '../../core/input/primitives/index.js';
import { AssetCache } from '../../core/assets/asset-cache.js';
import { parseAssetNodes } from '../../core/assets/asset-parser.js';
import { createExplodableFromAsset } from '../../core/assets/explodable-adapter.js';
import { FlowPathPlayer } from '../../core/assets/flow-path-player.js';

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
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.1 }),
  );
  floor.position.y = -0.04;
  atrium.add(floor);

  const wayfindingRing = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.42, 48),
    new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide }),
  );
  wayfindingRing.rotation.x = -Math.PI / 2;
  wayfindingRing.position.y = 0.01;
  atrium.add(wayfindingRing);

  // Reception desk — positioned in front of entrance, clear of world origin spawn
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.6), deskMat);
  desk.position.set(0, 0.45, -1.8);
  desk.name = 'reception-desk';
  atrium.add(desk);

  const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.55 });

  MEDICINE_WINGS.forEach(({ section, setting }, index) => {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    const wing = new THREE.Group();
    wing.name = `medicine-wing-${section.id}`;
    wing.position.set(Math.sin(angle) * 3.6, 0, -Math.cos(angle) * 3.6);
    wing.rotation.y = Math.atan2(-wing.position.x, -wing.position.z);
    wing.userData.sectionId = section.id;

    const accent = new THREE.Color(setting.palette[0]);
    const doorway = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x0b0908, emissive: accent, emissiveIntensity: 0.22 }),
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
      widthMeters: 1.15, heightMeters: 0.15, fontSizePx: 26, align: 'center',
      background: '#241610', color: '#e8dcc0', accent: setting.palette[0],
      pixelWidth: 768, pixelHeight: 96, lines: 1,
    });
    sign.position.set(0, 2.42, 0.02);
    wing.add(sign);

    const threshold = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.12),
      new THREE.MeshBasicMaterial({ color: accent }),
    );
    threshold.rotation.x = -Math.PI / 2;
    threshold.position.set(0, 0.02, 0.6);
    wing.add(threshold);

    atrium.add(wing);
  });

  const boundaryRing = new THREE.Mesh(
    new THREE.RingGeometry(4.65, 4.7, 64),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  boundaryRing.rotation.x = -Math.PI / 2;
  boundaryRing.position.y = 0.002;
  atrium.add(boundaryRing);

  root.add(atrium);
}

function buildWingRoom(id: string, setting: { palette: string[] }, angleRad: number, label: string): THREE.Group {
  const room = new THREE.Group();
  room.name = `wing-room-${id}`;
  const r = 5.4;
  room.position.set(Math.sin(angleRad) * r, 0, -Math.cos(angleRad) * r);
  room.rotation.y = Math.atan2(-Math.sin(angleRad), Math.cos(angleRad));

  // Floor — clinical white hospital tile
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.05 });
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 0);
  room.add(floorMesh);

  // Ceiling — clean hospital white
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ceilMat);
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.set(0, 3, 0);
  room.add(ceilMesh);

  // Wall material — bright hospital white, DoubleSide so walls render from both inside and outside
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide });

  // Back wall (z = -3, faces +Z into room)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), wallMat);
  backWall.position.set(0, 1.5, -3);
  room.add(backWall);

  // Accent strip — colored by wing palette for visual room identity
  const accentColor = new THREE.Color(setting.palette[0]);
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor, emissive: accentColor, emissiveIntensity: 0.35,
    roughness: 0.5, side: THREE.DoubleSide,
  });
  const accentStrip = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.18), accentMat);
  accentStrip.position.set(0, 0.2, -2.98); // just in front of back wall, near floor
  room.add(accentStrip);

  // Left wall (x = -3, faces +X into room)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), wallMat);
  leftWall.position.set(-3, 1.5, 0);
  leftWall.rotation.y = Math.PI / 2;
  room.add(leftWall);

  // Right wall (x = +3, faces -X into room)
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), wallMat);
  rightWall.position.set(3, 1.5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  room.add(rightWall);

  // Fourth wall (atrium doorway side, z = +3): omitted intentionally

  // Ceiling point light
  const light = new THREE.PointLight(0xffffff, 1.0, 8);
  light.position.set(0, 2.8, 0);
  room.add(light);

  // Wing label panel
  const wingLabel = createTextPanel(label, {
    widthMeters: 1.4, heightMeters: 0.14, fontSizePx: 26, align: 'center',
    background: '#0f172a', color: '#e8dcc0', accent: setting.palette[0],
  });
  wingLabel.position.set(0, 2.9, 2.8);
  wingLabel.lookAt(0, 2.9, 0);
  room.add(wingLabel);

  return room;
}

export async function buildHumanBodyScene(): Promise<HumanBodySceneComponents> {
  const root = new THREE.Group();
  root.name = 'human-body-module-root';
  buildMedicineAtrium(root);

  // Floor environment
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x090c15, roughness: 0.8, metalness: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  root.add(floor);

  // Medical disclaimer plinth
  const disclaimerGroup = new THREE.Group();
  disclaimerGroup.name = 'medical-disclaimer-plinth';
  disclaimerGroup.position.set(0, 0.7, -0.4);
  const disclaimerPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.28, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 }),
  );
  disclaimerGroup.add(disclaimerPlinth);
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 504, 248);
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText('MEDICAL & SAFETY DISCLAIMER', 20, 36);
      ctx.fillStyle = '#f8fafc'; ctx.font = '15px sans-serif';
      ctx.fillText('This software is designed solely for scientific education.', 20, 72);
      ctx.fillText('It does NOT provide medical advice, diagnosis, or treatment.', 20, 96);
      ctx.fillText('Always seek guidance from a qualified healthcare professional.', 20, 120);
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText('HIV Science: Undetectable = Untransmittable (U=U)', 20, 162);
      ctx.fillStyle = '#94a3b8'; ctx.font = '13px sans-serif';
      ctx.fillText('Source: WHO & UNAIDS. Human-expert review recommended before public release.', 20, 194);
    }
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.24),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide }),
    );
    plaque.position.set(0, 0.68, 0);
    plaque.rotation.x = -Math.PI / 6;
    disclaimerGroup.add(plaque);
  }
  root.add(disclaimerGroup);

  // GLB asset cache for heart_cutaway, hiv_virion_cutaway, hiv_art_bench
  const assetCache = new AssetCache();
  const glbDisposals: Array<() => void> = [];

  async function placeHumanBodyAsset(url: string, container: THREE.Group, position: THREE.Vector3, options?: {
    rotationY?: number;
    fitToHeight?: number;
    explodable?: boolean;
    hasFlows?: boolean;
    label?: string;
    onLoaded?: (scene: THREE.Object3D, assembly?: any) => void;
  }): Promise<void> {
    try {
      const loaded = await assetCache.load(url);
      const assetScene = loaded.scene.clone();

      // Parse the freshly cloned scene so parts bind directly to actual cloned meshes
      const parsed = parseAssetNodes(assetScene);

      // Scale to fit
      const box = new THREE.Box3().setFromObject(assetScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = options?.fitToHeight ?? 0.4;
      const scaleFactor = maxDim > 0 ? targetHeight / maxDim : 1;
      assetScene.scale.setScalar(scaleFactor);

      // Centre X/Z, place with bottom at position.y
      const scaledBox = new THREE.Box3().setFromObject(assetScene);
      assetScene.position.set(
        position.x - (scaledBox.min.x + scaledBox.max.x) / 2,
        position.y - scaledBox.min.y,
        position.z - (scaledBox.min.z + scaledBox.max.z) / 2,
      );
      if (options?.rotationY) assetScene.rotation.y = options.rotationY;
      container.add(assetScene);

      let assembly: any = null;
      if (options?.explodable) {
        assembly = createExplodableFromAsset(parsed, assetScene as unknown as THREE.Group, {
          onEvent: (ev) => {
            if (ev.type === 'tap') {
              // Show label only (not description per content rules)
              const tag = createTextPanel(ev.part.label, {
                widthMeters: 0.22, heightMeters: 0.06, fontSizePx: 14, align: 'center',
                background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8',
              });
              const wp = new THREE.Vector3();
              ev.part.object.getWorldPosition(wp);
              tag.position.copy(wp).add(new THREE.Vector3(0, 0.1, 0));
              container.add(tag);
              setTimeout(() => { container.remove(tag); }, 4000);
            }
          },
        });
        const pinch = new SpatialScalePinchPrimitive(assetScene as unknown as THREE.Group, {
          minScale: 0.8, maxScale: 2.0, preventObjectScale: true,
          onExplodeFraction: (frac) => assembly.setExplodeAmount(frac),
        });
        assetScene.userData.explodableAssembly = assembly;
        assetScene.userData.scalePinchPrimitive = pinch;
      }

      const flowPlayers: FlowPathPlayer[] = [];
      if (options?.hasFlows) {
        for (const flow of parsed.flows) {
          const colorHex = flow.flowColor ?? 0x38bdf8;
          const fp = new FlowPathPlayer({ flowPath: flow.flowPath, flowColor: colorHex, particleCount: 24, speed: 0.1 });
          fp.mesh.position.copy(assetScene.position);
          fp.mesh.scale.copy(assetScene.scale);
          container.add(fp.mesh);
          flowPlayers.push(fp);
        }
      }

      options?.onLoaded?.(assetScene, assembly);

      glbDisposals.push(() => {
        assetCache.release(url);
        for (const fp of flowPlayers) {
          fp.mesh.parent?.remove(fp.mesh);
          (fp.mesh.geometry as THREE.BufferGeometry).dispose();
        }
        if (assetScene.parent) assetScene.parent.remove(assetScene);
      });
    } catch (err) {
      const errPlaque = createTextPanel(`⚠ Failed to load\n${options?.label ?? url.split('/').pop()}`, {
        widthMeters: 0.4, heightMeters: 0.1, fontSizePx: 14, align: 'center',
        background: '#7f1d1d', color: '#fecaca', accent: '#ef4444', lines: 2,
      });
      errPlaque.position.copy(position).add(new THREE.Vector3(0, 0.6, 0));
      container.add(errPlaque);
      console.warn('[HumanBody] GLB load failed:', err);
    }
  }

  // Build wing rooms
  const wingRooms = new Map<string, THREE.Group>();
  MEDICINE_WINGS.forEach(({ section, setting }, index) => {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    const room = buildWingRoom(section.id, setting, angle, section.title.toUpperCase() + ' WING');
    wingRooms.set(section.id, room);
    root.add(room);
  });

  // ─────────────────────────────────────────────────────────────
  // HEART WING — GLB heart_cutaway
  // ─────────────────────────────────────────────────────────────
  const heartRoom = wingRooms.get('heart')!;
  // heartRoot is a stable reference for blood flow origin
  const heartRoot = new THREE.Group();
  heartRoot.name = 'beating-heart-assembly';
  heartRoot.position.set(0, 0, 0);
  heartRoom.add(heartRoot);

  // Load heart_cutaway GLB — placed at y=0.9 (pedestal level), facing learner (+Z)
  await placeHumanBodyAsset(
    '/models/human-body/heart_cutaway.glb',
    heartRoot,
    new THREE.Vector3(0, 0.9, 0),
    {
      fitToHeight: 0.4, // heart authored at 0.32 m; fit to 0.4 m
      explodable: true,
      hasFlows: true,   // flow-deoxygenated (blue) + flow-oxygenated (red) from asset
      label: 'Heart Cutaway',
    },
  );

  const bloodFlow = new BloodFlowSystem();
  bloodFlow.group.position.set(0, 0.9, 0);
  heartRoom.add(bloodFlow.group);

  // ECG readout label
  const ecgLabel = createTextPanel('ECG / Pressure Monitor\n━━━━━━━━━━━━━━━━\nRate: 72 bpm\nSystolic: 120 mmHg\nDiastolic: 80 mmHg\n\nSimplified model.', {
    widthMeters: 0.68, heightMeters: 0.38, fontSizePx: 20, align: 'left',
    background: '#0f172a', color: '#10b981', accent: '#10b981', lines: 7, pixelWidth: 580, pixelHeight: 320,
  });
  ecgLabel.position.set(1.2, 1.3, 0); ecgLabel.lookAt(1.2, 1.3, -3);
  heartRoom.add(ecgLabel);

  // Heart rate slider
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xef4444 }),
  );
  sliderHandle.position.set(0.4, 0.85, 0);
  const heartPressureSlider = new SpatialSliderPrimitive(sliderHandle, {
    axis: 'y', minDistance: 0.75, maxDistance: 0.95,
    onValueChange: (val) => {
      bloodFlow.setHeartRate(val);
    },
  });
  heartRoom.add(sliderHandle);

  // Pacemaker dial
  const dialMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 }),
  );
  dialMesh.position.set(-0.4, 0.85, 0);
  const pacemakerRotator = new SpatialRotatorPrimitive(dialMesh, { detentStepDeg: 15 });
  heartRoom.add(dialMesh);

  // Dr. Amani hint panels (Req 32.1) — y=1.6, z=1.5, never head-locked
  const heartHint = createTextPanel(
    'Dr. Amani: "Your heart beats ~100,000 times a day.\nAdjust the slider to see how rate affects valve closure."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#fecdd3', accent: '#10b981', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  heartHint.position.set(0, 1.6, 1.5);
  heartRoom.add(heartHint);

  // ─────────────────────────────────────────────────────────────
  // BRAIN WING — lobes, synapse, stroke scenario
  // ─────────────────────────────────────────────────────────────
  const brainRoom = wingRooms.get('brain')!;
  const synapseRoot = new THREE.Group();
  synapseRoot.name = 'neural-synapse-zone';
  synapseRoot.position.set(0, 1.25, 0);

  // Simplified brain hemispheres with lobe colour coding
  const lobes: { name: string; color: number; pos: [number, number, number]; scale: [number, number, number]; func: string }[] = [
    { name: 'frontal',        color: 0xf97316, pos: [0, 0.1, 0.2],     scale: [0.3, 0.26, 0.28],  func: 'Frontal lobe: decision-making, speech production, motor control' },
    { name: 'parietal',       color: 0x3b82f6, pos: [0, 0.2, -0.1],    scale: [0.28, 0.22, 0.24], func: 'Parietal lobe: sensation, spatial awareness, navigation' },
    { name: 'temporal-left',  color: 0x10b981, pos: [-0.28, -0.05, 0], scale: [0.16, 0.18, 0.26], func: 'Left temporal lobe: language comprehension, verbal memory' },
    { name: 'temporal-right', color: 0x10b981, pos: [0.28, -0.05, 0],  scale: [0.16, 0.18, 0.26], func: 'Right temporal lobe: music, face recognition, emotion' },
    { name: 'occipital',      color: 0xa855f7, pos: [0, -0.02, -0.28], scale: [0.26, 0.2, 0.2],   func: 'Occipital lobe: visual processing, colour and motion detection' },
    { name: 'cerebellum',     color: 0xf59e0b, pos: [0, -0.2, -0.22],  func: 'Cerebellum: coordination, balance, fine motor learning', scale: [0.22, 0.14, 0.16] },
  ];
  const lobePulseStates: Array<{ mat: THREE.MeshStandardMaterial; elapsed: number; tooltip: THREE.Object3D }> = [];
  lobes.forEach((lobe) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 12),
      new THREE.MeshStandardMaterial({ color: lobe.color, roughness: 0.6, transparent: true, opacity: 0.85 }),
    );
    mesh.scale.set(...lobe.scale);
    mesh.position.set(...lobe.pos);
    mesh.name = `brain-lobe-${lobe.name}`;
    mesh.userData['brainLobe'] = lobe.name;
    mesh.userData['lobeFunction'] = lobe.func;
    synapseRoot.add(mesh);
  });

  // Lobe tooltip panel
  const lobeTooltip = createTextPanel('', {
    widthMeters: 0.7, heightMeters: 0.12, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#e2e8f0', accent: '#3b82f6',
    pixelWidth: 580, pixelHeight: 96, lines: 2,
  });
  lobeTooltip.name = 'lobe-tooltip';
  lobeTooltip.position.set(0, 0.85, 0);
  lobeTooltip.visible = false;
  synapseRoot.add(lobeTooltip);

  // Wire activate handlers (second pass, after lobeTooltip exists)
  synapseRoot.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const lobeFunc = child.userData['lobeFunction'] as string | undefined;
    if (!lobeFunc) return;
    const captureMat = child.material as THREE.MeshStandardMaterial;
    const captureHex = captureMat.color.getHex();
    child.userData['activate'] = () => {
      captureMat.emissive.setHex(captureHex);
      lobePulseStates.push({ mat: captureMat, elapsed: 0, tooltip: lobeTooltip });
      lobeTooltip.visible = true;
    };
  });

  // Lobe legend
  const lobeKey = createTextPanel('Brain Lobes\nOrange: Frontal (planning, speech)\nBlue: Parietal (sensation, space)\nGreen: Temporal (memory, language)\nPurple: Occipital (vision)\nYellow: Cerebellum (coordination)\nSimplified model.', {
    widthMeters: 0.68, heightMeters: 0.36, fontSizePx: 18, align: 'left',
    background: '#0f172a', color: '#e2e8f0', accent: '#3b82f6', lines: 7, pixelWidth: 580, pixelHeight: 300,
  });
  lobeKey.position.set(1.2, 1.3, 0); lobeKey.lookAt(1.2, 1.3, -3);
  brainRoom.add(lobeKey);

  // Neurotransmitter vesicle — grabbable
  const bouton = new THREE.Mesh(
    (() => { const g = new THREE.SphereGeometry(0.22, 16, 16); g.scale(1.2, 0.8, 1.0); return g; })(),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.5 }),
  );
  bouton.position.set(0, 0.55, 0);
  synapseRoot.add(bouton);

  const vesicle = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
  );
  vesicle.position.set(0, 0.42, 0);
  vesicle.name = 'neurotransmitter-vesicle';
  new SpatialGrabPrimitive(vesicle);
  synapseRoot.add(vesicle);
  brainRoom.add(synapseRoot);

  // Dr. Amani hint panels (Req 32.1) — y=1.6, z=1.5, never head-locked
  const brainHint = createTextPanel(
    'Dr. Amani: "Touch a lobe to light it up.\nEach region has a specialised role — but the brain is highly interconnected."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#bfdbfe', accent: '#3b82f6', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  brainHint.position.set(0, 1.6, 1.5);
  brainRoom.add(brainHint);

  // ─────────────────────────────────────────────────────────────
  // SPINE WING — full vertebral column, X-ray mode, disc herniation
  // ─────────────────────────────────────────────────────────────
  const spineRoom = wingRooms.get('spine')!;
  const spineRoot = new THREE.Group();
  spineRoot.name = 'spine-vertebrae-assembly';
  spineRoot.position.set(0, 0.5, 0);

  const regionData: { count: number; color: number; label: string; spacing: number }[] = [
    { count: 7, color: 0xf59e0b, label: 'Cervical', spacing: 0.072 },
    { count: 12, color: 0xfef3c7, label: 'Thoracic', spacing: 0.062 },
    { count: 5, color: 0xd97706, label: 'Lumbar', spacing: 0.082 },
    { count: 1, color: 0x94a3b8, label: 'Sacrum', spacing: 0.09 },
  ];
  let spineY = 1.4;
  regionData.forEach((region) => {
    for (let v = 0; v < region.count; v++) {
      const vert = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055 + (v < 2 ? 0 : 0.01), 0.055 + (v < 2 ? 0 : 0.01), 0.038, 16),
        new THREE.MeshStandardMaterial({ color: region.color, roughness: 0.6 }),
      );
      vert.position.y = spineY;
      spineRoot.add(vert);
      if (v < region.count - 1) {
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.052, 0.052, 0.014, 16),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, transparent: true, opacity: 0.85 }),
        );
        disc.position.y = spineY - region.spacing * 0.5;
        spineRoot.add(disc);
      }
      spineY -= region.spacing;
    }
  });

  // Spinal cord
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.4, -0.01),
    new THREE.Vector3(0, 0.6, -0.015),
    new THREE.Vector3(0, -0.1, -0.01),
  ]);
  const cord = new THREE.Mesh(
    new THREE.TubeGeometry(cordCurve, 24, 0.014, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 }),
  );
  cord.name = 'spinal-cord';
  spineRoot.add(cord);

  // Disc herniation indicator
  const herniatedDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.016, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, transparent: true, opacity: 0.9 }),
  );
  herniatedDisc.position.set(0.04, 0.4, 0); // Lumbar region
  herniatedDisc.scale.set(1.35, 1, 1.35); // bulging outward
  spineRoot.add(herniatedDisc);

  spineRoom.add(spineRoot);

  // ── X-ray mode toggle ──────────────────────────────────────────
  // Collect all vertebra, disc, cord, and herniated-disc meshes
  const spineToggleMeshes: THREE.Mesh[] = [];
  spineRoot.traverse((obj) => {
    if (obj instanceof THREE.Mesh) spineToggleMeshes.push(obj);
  });
  let xrayModeActive = false;

  const xrayButtonMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, emissive: new THREE.Color(0x0369a1), emissiveIntensity: 0.5 });
  const xrayButton = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.05), xrayButtonMat);
  xrayButton.name = 'xray-toggle-button';
  xrayButton.position.set(-0.8, 1.1, 0.5);
  xrayButton.lookAt(-0.8, 1.1, 3);
  xrayButton.userData['activate'] = () => {
    xrayModeActive = !xrayModeActive;
    xrayButtonMat.emissiveIntensity = xrayModeActive ? 0.9 : 0.5;
    xrayButtonMat.color.setHex(xrayModeActive ? 0x38bdf8 : 0x0369a1);
    spineToggleMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (m.name === 'spinal-cord' || m.geometry instanceof THREE.TubeGeometry) {
        // spinal cord
        mat.emissive.setHex(xrayModeActive ? 0xffd700 : 0x000000);
        mat.emissiveIntensity = xrayModeActive ? 0.8 : 0;
      } else if (m === herniatedDisc) {
        mat.emissive.setHex(xrayModeActive ? 0xff2222 : 0x000000);
        mat.emissiveIntensity = xrayModeActive ? 0.9 : 0;
        mat.transparent = true;
        mat.opacity = xrayModeActive ? 0.9 : 0.9;
      } else {
        // vertebrae and discs
        mat.transparent = true;
        mat.opacity = xrayModeActive ? 0.3 : 1.0;
        if (!xrayModeActive) mat.transparent = false;
        mat.needsUpdate = true;
      }
    });
  };
  spineRoom.add(xrayButton);

  const xrayToggleLabel = createTextPanel('X-RAY MODE (CLICK)', {
    widthMeters: 0.30, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  xrayToggleLabel.position.set(-0.8, 1.25, 0.5);
  xrayToggleLabel.lookAt(-0.8, 1.25, 3);
  spineRoom.add(xrayToggleLabel);

  // X-ray plinth label — faces room doorway (+Z)
  const xrayLabel = createTextPanel(
    'Vertebral Column\nCervical (C1–C7): neck & skull support\nThoracic (T1–T12): ribs attach here\nLumbar (L1–L5): weight-bearing, largest\nSacrum: fused, pelvic attachment\n\nRed disc = herniated L4/L5 (simplified model)',
    { widthMeters: 0.72, heightMeters: 0.36, fontSizePx: 18, align: 'left', background: '#0f172a', color: '#fef3c7', accent: '#f59e0b', lines: 7, pixelWidth: 600, pixelHeight: 300 },
  );
  xrayLabel.position.set(1.2, 1.3, 0); xrayLabel.lookAt(1.2, 1.3, 3);
  spineRoom.add(xrayLabel);

  // Dr. Amani hint panels (Req 32.1) — faces room doorway (+Z)
  const spineHint = createTextPanel(
    'Dr. Amani: "Press X-RAY to reveal the spinal cord.\nThe red disc shows a herniated L4/L5 — a common cause of back pain."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#fef3c7', accent: '#f59e0b', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  spineHint.position.set(0, 1.8, 1.5);
  spineHint.lookAt(0, 1.8, 3);
  spineRoom.add(spineHint);

  // ─────────────────────────────────────────────────────────────
  // CANCER WING — cell cycle, CAR-T, treatment choices
  // ─────────────────────────────────────────────────────────────
  const cancerRoom = wingRooms.get('cancer')!;
  const carTRoot = new THREE.Group();
  carTRoot.name = 'car-t-oncology-zone';
  carTRoot.position.set(0, 1.25, 0);

  // Tumour cell
  const tumor = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.18, 1),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.7 }),
  );
  tumor.position.set(-0.25, 0, 0);
  carTRoot.add(tumor);

  // CAR-T cell
  const tCell = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 }),
  );
  tCell.position.set(0.25, 0, 0);
  const receptorArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 }),
  );
  receptorArm.position.set(-0.16, 0, 0); receptorArm.rotation.z = Math.PI / 2;
  tCell.add(receptorArm); carTRoot.add(tCell);

  // ── Mutation dial (Requirements 29.1–29.4) ────────────────────
  function makeDisplacedSphere(seed: number, amplitude: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(0.18, 12, 10);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    for (let vi = 0; vi < pos.count; vi++) {
      const x = pos.getX(vi); const y = pos.getY(vi); const z = pos.getZ(vi);
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      const disp = amplitude * (Math.sin(x * seed * 7.3) * Math.cos(y * seed * 5.1) + Math.sin(z * seed * 6.7));
      const s = 1 + disp / len;
      pos.setXYZ(vi, x * s, y * s, z * s);
    }
    geo.computeVertexNormals();
    return geo;
  }
  const tumorGeos: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry] = [
    new THREE.SphereGeometry(0.18, 16, 12),
    makeDisplacedSphere(2, 0.04),
    makeDisplacedSphere(3, 0.09),
  ];

  const mutationStateLabel = createTextPanel('Normal cell', {
    widthMeters: 0.5, heightMeters: 0.1, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#e9d5ff', accent: '#a855f7',
  });
  mutationStateLabel.position.set(-0.25, 0.5, 0);
  carTRoot.add(mutationStateLabel);

  const mutationDialLabel = createTextPanel('MUTATION DIAL', {
    widthMeters: 0.3, heightMeters: 0.07, fontSizePx: 16, align: 'center',
    background: '#0f172a', color: '#a855f7', accent: '#a855f7',
  });
  mutationDialLabel.position.set(-0.25, 0.42, 0);
  carTRoot.add(mutationDialLabel);

  const mutationDialMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.6 }),
  );
  mutationDialMesh.name = 'mutation-dial';
  mutationDialMesh.position.set(-0.25, 0.3, 0);
  let currentMutationStep = 0;
  new SpatialRotatorPrimitive(mutationDialMesh, { detentStepDeg: 120 });
  mutationDialMesh.userData['activate'] = () => {
    currentMutationStep = (currentMutationStep + 1) % 3;
    (tumor as THREE.Mesh<THREE.BufferGeometry>).geometry = tumorGeos[currentMutationStep]!;
  };
  carTRoot.add(mutationDialMesh);

  cancerRoom.add(carTRoot);

  // Cell cycle diagram — 4 phases as coloured sectors
  const cellCycleGroup = new THREE.Group();
  cellCycleGroup.name = 'cell-cycle-diagram';
  cellCycleGroup.position.set(-1.1, 1.1, 0);
  const phases: { name: string; color: number; angle: number }[] = [
    { name: 'G1', color: 0xf59e0b, angle: Math.PI * 0.5 },
    { name: 'S', color: 0x3b82f6, angle: Math.PI * 0.5 },
    { name: 'G2', color: 0x10b981, angle: Math.PI * 0.4 },
    { name: 'M', color: 0xef4444, angle: Math.PI * 0.6 },
  ];
  let phaseStart = 0;
  phases.forEach((ph) => {
    const geo = new THREE.CircleGeometry(0.22, 12, phaseStart, ph.angle);
    const sector = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ph.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    sector.rotation.x = Math.PI / 2;
    cellCycleGroup.add(sector);
    phaseStart += ph.angle;
  });
  cancerRoom.add(cellCycleGroup);

  const cycleLabel = createTextPanel(
    'Cell Cycle (simplified model)\nG1: Growth | S: DNA Replication\nG2: Check | M: Mitosis (division)\n\nCancer = uncontrolled cycling.\nImmunotherapy (CAR-T) targets tumour antigens.',
    { widthMeters: 0.72, heightMeters: 0.3, fontSizePx: 18, align: 'left', background: '#0f172a', color: '#e9d5ff', accent: '#a855f7', lines: 5, pixelWidth: 580, pixelHeight: 240 },
  );
  cycleLabel.position.set(1.2, 1.3, 0); cycleLabel.lookAt(1.2, 1.3, -3);
  cancerRoom.add(cycleLabel);

  // Dr. Amani hint panels (Req 32.1) — y=1.6, z=1.5, never head-locked
  const cancerHint = createTextPanel(
    'Dr. Amani: "Turn the dial to advance through cell changes.\nCAR-T therapy engineers your own immune cells to fight cancer."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#e9d5ff', accent: '#a855f7', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  cancerHint.position.set(0, 1.6, 1.5);
  cancerRoom.add(cancerHint);

  // ─────────────────────────────────────────────────────────────
  // HIV WING — GLB assets
  // ─────────────────────────────────────────────────────────────
  const hivRoom = wingRooms.get('hiv')!;
  const hivVirionRoot = new THREE.Group();
  hivVirionRoot.name = 'hiv-virion-assembly';
  hivVirionRoot.position.set(0, 1.25, 0);
  hivVirionRoot.rotation.y = Math.PI;
  hivRoom.add(hivVirionRoot);

  const hivScalePinch = new SpatialScalePinchPrimitive(hivVirionRoot, {
    minScale: 0.8, maxScale: 2.2,
  });

  // Load HIV GLB assets in parallel
  await Promise.all([
    placeHumanBodyAsset(
      '/models/human-body/hiv_virion_cutaway.glb',
      hivVirionRoot,
      new THREE.Vector3(0, 0, 0),
      {
        fitToHeight: 0.5,
        explodable: true,
        label: 'HIV Virion Cutaway',
        onLoaded: (sc) => {
          hivVirionRoot.userData.explodableAssembly = sc.userData.explodableAssembly;
        },
      },
    ),
    placeHumanBodyAsset(
      '/models/human-body/hiv_art_bench.glb',
      hivRoom,
      new THREE.Vector3(-1.2, 0.0, 0.5),
      { fitToHeight: 0.8, label: 'ART Drug Bench' },
    ),
    placeHumanBodyAsset(
      '/models/human-body/hiv_integrase_insti.glb',
      hivRoom,
      new THREE.Vector3(1.2, 0.85, 0.5),
      { fitToHeight: 0.4, label: 'Integrase INSTI' },
    ),
    placeHumanBodyAsset(
      '/models/human-body/hiv_cd4_cell.glb',
      hivRoom,
      new THREE.Vector3(-1.0, 1.1, -1.0),
      { fitToHeight: 0.5, label: 'CD4 T-Cell' },
    ),
    placeHumanBodyAsset(
      '/models/human-body/hiv_cd8_ctl.glb',
      hivRoom,
      new THREE.Vector3(1.0, 1.1, -1.0),
      { fitToHeight: 0.5, label: 'CD8 CTL' },
    ),
  ]);

  // Viral load canvas graph (Requirements 30.1, 30.2)
  if (typeof document !== 'undefined') {
    const vlCanvas = document.createElement('canvas');
    vlCanvas.width = 640;
    vlCanvas.height = 400;
    const vlCtx = vlCanvas.getContext('2d')!;

    // Background
    vlCtx.fillStyle = '#0f172a';
    vlCtx.fillRect(0, 0, 640, 400);

    // Border
    vlCtx.strokeStyle = '#334155';
    vlCtx.lineWidth = 2;
    vlCtx.strokeRect(60, 30, 560, 290);

    // Axes
    vlCtx.strokeStyle = '#94a3b8';
    vlCtx.lineWidth = 1.5;
    // Y axis
    vlCtx.beginPath(); vlCtx.moveTo(60, 30); vlCtx.lineTo(60, 320); vlCtx.stroke();
    // X axis
    vlCtx.beginPath(); vlCtx.moveTo(60, 320); vlCtx.lineTo(620, 320); vlCtx.stroke();

    // Axis labels
    vlCtx.fillStyle = '#94a3b8';
    vlCtx.font = '14px sans-serif';
    vlCtx.fillText('Viral Load (copies/mL)', 8, 185);
    vlCtx.fillText('Weeks', 290, 348);
    // X tick labels
    for (const [label, x] of [['0', 60], ['4', 165], ['12', 272], ['24', 436], ['52', 620]] as [string, number][]) {
      vlCtx.fillText(label, x - 5, 338);
    }
    // Y tick labels
    vlCtx.fillText('High', 10, 60);
    vlCtx.fillText('Detect.', 10, 230);
    vlCtx.fillText('Undect.', 6, 310);

    // Undetectable threshold line (dashed)
    vlCtx.setLineDash([6, 4]);
    vlCtx.strokeStyle = '#10b981';
    vlCtx.lineWidth = 1;
    vlCtx.beginPath(); vlCtx.moveTo(60, 300); vlCtx.lineTo(620, 300); vlCtx.stroke();
    vlCtx.setLineDash([]);
    vlCtx.fillStyle = '#10b981';
    vlCtx.font = '12px sans-serif';
    vlCtx.fillText('Undetectable threshold', 400, 295);

    // Viral load curve using quadratic bezier segments
    // Peaks at week 0 (~week 2 of acute infection), drops after ART onset (week 4), reaches undetectable by week 24
    vlCtx.strokeStyle = '#ef4444';
    vlCtx.lineWidth = 2.5;
    vlCtx.beginPath();
    vlCtx.moveTo(60, 310);           // start: near-undetectable (pre-peak, simplified)
    vlCtx.quadraticCurveTo(80, 20, 165, 55);   // rise to acute peak (week ~2–3)
    vlCtx.quadraticCurveTo(200, 80, 220, 230); // set-point after acute (pre-ART)
    vlCtx.quadraticCurveTo(280, 240, 340, 295); // ART initiated ~week 4-8, rapid drop
    vlCtx.quadraticCurveTo(390, 302, 440, 302); // approaching undetectable
    vlCtx.lineTo(620, 302);          // maintained undetectable from week ~24
    vlCtx.stroke();

    // ART onset annotation
    vlCtx.strokeStyle = '#fbbf24';
    vlCtx.lineWidth = 1;
    vlCtx.setLineDash([4, 3]);
    vlCtx.beginPath(); vlCtx.moveTo(165, 30); vlCtx.lineTo(165, 320); vlCtx.stroke();
    vlCtx.setLineDash([]);
    vlCtx.fillStyle = '#fbbf24';
    vlCtx.font = '12px sans-serif';
    vlCtx.fillText('ART start', 170, 50);

    // U=U label
    vlCtx.fillStyle = '#10b981';
    vlCtx.font = 'bold 15px sans-serif';
    vlCtx.fillText('U=U — Undetectable = Untransmittable (WHO/UNAIDS)', 30, 378);

    const vlTexture = new THREE.CanvasTexture(vlCanvas);
    const vlPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshBasicMaterial({ map: vlTexture, side: THREE.DoubleSide }),
    );
    vlPanel.name = 'viral-load-graph';
    vlPanel.position.set(-1.4, 1.3, 0);
    vlPanel.lookAt(-1.4, 1.3, -3);
    hivRoom.add(vlPanel);
  }

  const hivLabel = createTextPanel(
    'HIV Virion (simplified model)\nRed spikes = gp120/gp41 (entry — blocked by entry inhibitors)\nBlue cone = p24 capsid (blocked by lenacapavir)\nGreen = Reverse Transcriptase (NRTIs/NNRTIs)\nYellow = Integrase (INSTIs e.g. dolutegravir)\nPurple = Protease (PIs e.g. darunavir)\n\nU=U: effective ART prevents onward transmission (WHO/UNAIDS).',
    { widthMeters: 0.9, heightMeters: 0.46, fontSizePx: 17, align: 'left', background: '#0f172a', color: '#99f6e4', accent: '#0f766e', lines: 8, pixelWidth: 720, pixelHeight: 380 },
  );
  hivLabel.position.set(1.4, 1.3, 0); hivLabel.lookAt(1.4, 1.3, -3);
  hivRoom.add(hivLabel);

  // Dr. Amani hint panels (Req 32.1) — y=1.6, z=1.5, never head-locked
  const hivHint = createTextPanel(
    'Dr. Amani: "Pinch and pull to explode the virion.\nWith effective ART, viral load becomes undetectable (U=U, WHO/UNAIDS)."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#99f6e4', accent: '#0f766e', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  hivHint.position.set(0, 1.6, 1.5);
  hivRoom.add(hivHint);

  // ─────────────────────────────────────────────────────────────
  // INFECTION PREVENTION WING — hand hygiene, PPE, herd immunity
  // ─────────────────────────────────────────────────────────────
  const infectionRoom = wingRooms.get('infection-prevention')!;
  const capillaryLoop = new THREE.Group();
  capillaryLoop.name = 'capillary-circulation-zone';
  capillaryLoop.position.set(0, 1.25, 0);

  // Chain of infection — 6 interactive nodes in a ring (Requirements 31.1–31.3)
  const chainLabels = [
    'Infectious\nagent',
    'Reservoir',
    'Portal of\nexit',
    'Mode of\ntransmission',
    'Portal of\nentry',
    'Susceptible\nhost',
  ] as const;
  const chainNodeMeshes: THREE.Mesh[] = [];
  const chainSlotPositions: THREE.Vector3[] = [];
  const chainSlotOccupied: boolean[] = new Array(6).fill(true) as boolean[];

  // Status label
  const chainStatusLabel = createTextPanel('Chain of Infection', {
    widthMeters: 0.6, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#bbf7d0', accent: '#15803d',
  });
  chainStatusLabel.position.set(0, 1.5, 0);
  capillaryLoop.add(chainStatusLabel);

  // Build 6 nodes in a ring at y=1.0
  for (let ni = 0; ni < 6; ni++) {
    const angle = (ni / 6) * Math.PI * 2;
    const nx = Math.cos(angle) * 0.65;
    const nz = Math.sin(angle) * 0.65;
    const slotPos = new THREE.Vector3(nx, 1.0, nz);
    chainSlotPositions.push(slotPos);

    const nodeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 }),
    );
    nodeMesh.position.copy(slotPos);
    nodeMesh.name = `chain-node-${ni}`;

    const nodeLabel = createTextPanel(chainLabels[ni] ?? '', {
      widthMeters: 0.25, heightMeters: 0.1, fontSizePx: 16, align: 'center',
      background: '#0f172a', color: '#bbf7d0', accent: '#15803d', lines: 2,
    });
    nodeLabel.position.set(0, 0.14, 0);
    nodeMesh.add(nodeLabel);

    // Grab + snap-back using SpatialGrabPrimitive constructor callbacks
    const captureSlotIndex = ni;
    const captureSlotPos = slotPos.clone();
    new SpatialGrabPrimitive(nodeMesh, {
      onGrab: () => {
        chainSlotOccupied[captureSlotIndex] = false;
        updateChainStatus();
      },
      onRelease: () => {
        nodeMesh.position.copy(captureSlotPos);
        chainSlotOccupied[captureSlotIndex] = true;
        updateChainStatus();
      },
    });

    chainNodeMeshes.push(nodeMesh);
    capillaryLoop.add(nodeMesh);
  }

  function updateChainStatus(): void {
    const allInPlace = chainSlotOccupied.every(Boolean);
    chainStatusLabel.visible = true;
    const meshChild = chainStatusLabel.children[0];
    if (meshChild instanceof THREE.Mesh && 'color' in meshChild.material) {
      (meshChild.material as THREE.MeshBasicMaterial).color.setHex(allInPlace ? 0x10b981 : 0xef4444);
    }
  }

  // Suppress unused-variable warnings — arrays used by grab callbacks above
  void chainNodeMeshes;

  infectionRoom.add(capillaryLoop);

  // Hand-hygiene station
  const handStation = new THREE.Group();
  handStation.name = 'hand-hygiene-station';
  handStation.position.set(-1.0, 0.0, 0.8);
  const dispenser = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.3 }));
  dispenser.position.y = 0.9;
  handStation.add(dispenser);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 }));
  nozzle.position.set(0, 0.72, 0.09); nozzle.rotation.x = Math.PI / 4;
  handStation.add(nozzle);
  nozzle.userData.activate = () => { nozzle.material.color.setHex(0x38bdf8); window.setTimeout(() => { (nozzle.material as THREE.MeshStandardMaterial).color.setHex(0x374151); }, 500); };
  const handStationBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 }));
  handStationBase.position.set(0, 0.3, 0);
  handStation.add(handStationBase);
  infectionRoom.add(handStation);

  // PPE rack
  const ppeRack = new THREE.Group();
  ppeRack.name = 'ppe-rack';
  ppeRack.position.set(1.2, 0, 0.8);
  const ppeShelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 }));
  ppeShelf.position.set(0, 1.4, 0);
  ppeRack.add(ppeShelf);
  const ppeItems: { label: string; color: number; x: number }[] = [
    { label: 'Gloves', color: 0x94a3b8, x: -0.38 },
    { label: 'Mask', color: 0xe2e8f0, x: -0.13 },
    { label: 'Gown', color: 0x3b82f6, x: 0.13 },
    { label: 'Shield', color: 0xbfdbfe, x: 0.38 },
  ];
  ppeItems.forEach((item) => {
    const ppe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: item.color, transparent: true, opacity: 0.9 }));
    ppe.position.set(item.x, 1.28, 0);
    ppe.name = `ppe-${item.label.toLowerCase()}`;
    new SpatialGrabPrimitive(ppe);
    ppeRack.add(ppe);
  });
  infectionRoom.add(ppeRack);

  // Herd immunity crowd simulation — 24 small figures, toggleable vaccination
  const herdRoot = new THREE.Group();
  herdRoot.name = 'herd-immunity-crowd';
  herdRoot.position.set(0, 0.0, -1.2);
  const figCount = 24;
  const vaccinatedFraction = 0.75; // 75% vaccinated baseline
  for (let fi = 0; fi < figCount; fi++) {
    const isVaccinated = fi / figCount < vaccinatedFraction;
    const fig = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.09, 4, 8),
      new THREE.MeshStandardMaterial({ color: isVaccinated ? 0x10b981 : 0xef4444, roughness: 0.6 }),
    );
    const angle = (fi / figCount) * Math.PI * 2;
    fig.position.set(Math.cos(angle) * 0.65 + (Math.random() - 0.5) * 0.2, 0.08, Math.sin(angle) * 0.5 + (Math.random() - 0.5) * 0.15);
    fig.name = `herd-figure-${fi}`;
    herdRoot.add(fig);
  }
  infectionRoom.add(herdRoot);

  const herdLabel = createTextPanel(
    'Herd Immunity Crowd (simplified model)\nGreen = vaccinated | Red = susceptible\n75% vaccination → protects the unvaccinated\n\nHand hygiene (WHO 5 Moments), PPE donning/doffing,\ntransmission routes, and outbreak investigation\nare education-only content. Never culture or enhance pathogens.',
    { widthMeters: 0.88, heightMeters: 0.36, fontSizePx: 17, align: 'left', background: '#0f172a', color: '#bbf7d0', accent: '#15803d', lines: 7, pixelWidth: 700, pixelHeight: 290 },
  );
  herdLabel.position.set(1.4, 1.3, 0); herdLabel.lookAt(1.4, 1.3, -3);
  infectionRoom.add(herdLabel);

  // Dr. Amani hint panels (Req 32.1) — y=1.6, z=1.5, never head-locked
  const infectionHint = createTextPanel(
    'Dr. Amani: "Activate a chain node to break the infection route.\nRemoving any link stops the outbreak — this is contact tracing in action."',
    { widthMeters: 0.9, heightMeters: 0.14, fontSizePx: 18, align: 'center',
      background: '#0f172a', color: '#bbf7d0', accent: '#15803d', lines: 2, pixelWidth: 720, pixelHeight: 110 },
  );
  infectionHint.position.set(0, 1.6, 1.5);
  infectionRoom.add(infectionHint);

  // ─────────────────────────────────────────────────────────────
  // SPATIAL ANCHORS
  // ─────────────────────────────────────────────────────────────
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'human-body-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  getSpatialAnchors().forEach((def) => anchorPrimitive.registerAnchor(def, 'foundation'));
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // ─────────────────────────────────────────────────────────────
  // ANIMATION
  // ─────────────────────────────────────────────────────────────
  let heartbeatPhase = 0;
  function update(deltaSeconds: number): void {
    for (let pi = lobePulseStates.length - 1; pi >= 0; pi--) {
      const ps = lobePulseStates[pi]!;
      ps.elapsed += deltaSeconds;
      const t = ps.elapsed / 0.4;
      ps.mat.emissiveIntensity = t < 0.5 ? t * 2 * 0.9 : Math.max(0, (1 - t) * 2 * 0.9);
      if (ps.elapsed >= 0.4) {
        ps.mat.emissiveIntensity = 0;
        ps.tooltip.visible = false;
        lobePulseStates.splice(pi, 1);
      }
    }

    heartbeatPhase += deltaSeconds * 1.2 * Math.PI * 2;
    const pulse = 1.0 + Math.sin(heartbeatPhase) * 0.04;
    heartRoot.scale.set(pulse, pulse, pulse);

    hivVirionRoot.rotation.y += 0.3 * deltaSeconds;
    tumor.rotation.y += 0.1 * deltaSeconds;
    bloodFlow.update(deltaSeconds);
  }

  function dispose(): void {
    bloodFlow.dispose();
    anchorPrimitive.dispose();
    for (const cleanup of glbDisposals) cleanup();
  }

  return {
    root, heartRoot, capillaryLoop, synapseRoot, hivVirionRoot, carTRoot,
    anchorPrimitive, heartPressureSlider, hivScalePinch, pacemakerRotator,
    update, dispose,
  };
}

/*
 * BUDGET ESTIMATE (NOT measured on device):
 * Atrium: ~1,200 tris (floor cylinder, 6 wings × doorway/pillars/lintel/sign/threshold)
 * Wing rooms: 6 × ~200 tris (floor, ceiling, 3 walls) = ~1,200 tris
 * Heart assembly: ~800 tris (anatomy mesh, leaflets, slider, dial)
 * Blood flow: 96 points (2 × Points draw calls, negligible tris)
 * Brain: ~1,200 tris (6 lobe spheres + bouton + vesicle)
 * Spine: ~1,600 tris (25 vertebrae + 24 discs + cord tube + herniated disc)
 * Cancer: ~1,400 tris (tumor, CAR-T cell, receptor arm, cycle sectors, mutation dial)
 * HIV: ~900 tris (virion sphere wireframe, 12 spikes, capsid, bench pegs)
 * Infection Prevention: ~800 tris (6 chain nodes, dispenser, PPE rack, 24 figures)
 * Labels / text panels: ~40 panels × 2 tris = ~80 tris
 * Triangles total: ~9,280 / working target 150,000 / ceiling 250,000
 * Draw calls: ~55 / working target 108 / ceiling 180
 */
