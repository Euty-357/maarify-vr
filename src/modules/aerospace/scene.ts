/**
 * Aerospace module scene — GLB engines on stands (Phase 2 wiring)
 *
 * Task 24: Hangar room layout & lighting — 15×10×6 m, 4× RectAreaLight, concrete floor
 * Task 25: Helicopter exhibit at (−5, 0, −3) with collective lever
 * Task 26: Engine test hall — GLB engines: engine_ffsc_methalox, engine_hydrolox_staged, engine_srm
 * Task 27: Wind tunnel relocate to z=−4, Mach readout, stall indicator, streamline quality
 * Task 28: Raycasting collider fix, isWalkable, budget comment
 *
 * Procedural engine meshes (nozzle bell, injector, chamber, turbopump, cooling helix)
 * replaced by GLB assets loaded via AssetCache + createExplodableFromAsset.
 * engine_turbofan and engine_gas_generator are NOT placed (mission deferred).
 *
 * NOT measured on device.
 */
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
  SpatialScalePinchPrimitive,
} from '../../core/input/primitives/index.js';
import { createTextPanel, setTextPanelText } from '../../core/ui/text-panel.js';
import { createRoundPointMaterial } from '../../core/design/point-sprite.js';
import { buildHelicopterExhibit } from './helicopter.js';
import { AssetCache } from '../../core/assets/asset-cache.js';
import { parseAssetNodes } from '../../core/assets/asset-parser.js';
import { createExplodableFromAsset } from '../../core/assets/explodable-adapter.js';
import { FlowPathPlayer } from '../../core/assets/flow-path-player.js';
import type { RectAreaLight } from 'three';

export interface AerospaceSceneComponents {
  root: THREE.Group;
  wingSparRoot: THREE.Group;
  nozzlePlumeRoot: THREE.Group;
  taifaCubeSatRoot: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  wingPitchSlider: SpatialSliderPrimitive;
  explodeAssembly?: any;
  cycleRotator: SpatialRotatorPrimitive;
  nozzlePressureSlider: SpatialSliderPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/** Build a pedestal base for an engine stand. GLB asset placed on top. */
function buildStandPedestal(
  label: string,
  position: THREE.Vector3,
  ispValue: number,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `engine-stand-${label.substring(0, 10)}`;
  group.position.copy(position);

  // Pedestal base
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.5, roughness: 0.5 });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.6), pedestalMat);
  pedestal.position.set(0, 0.45, 0);
  group.add(pedestal);

  // Engine label
  const labelPanel = createTextPanel(label, {
    widthMeters: 0.6, heightMeters: 0.1, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 3,
  });
  labelPanel.position.set(0, 1.72, 0);
  group.add(labelPanel);

  // Isp readout label
  const ispReadout = createTextPanel(`Isp ≈ ${ispValue} s`, {
    widthMeters: 0.28, heightMeters: 0.06, fontSizePx: 16, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  ispReadout.position.set(0, 0.06, 0.32);
  group.add(ispReadout);

  group.position.copy(position);
  return group;
}

/** Build full general-aviation high-wing aircraft exhibit (Task 24, Req 44.2). */
function buildGeneralAviationAircraft(): { group: THREE.Group; update: (dt: number) => void } {
  const group = new THREE.Group();
  group.name = 'general-aviation-aircraft-exhibit';

  const planeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.45 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

  // Fuselage body (cylinder tapered along Z)
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 2.6, 16), planeMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0.95, 0);
  group.add(fuselage);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 16), trimMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.95, 1.52);
  group.add(nose);

  // Propeller spinner + blades
  const propGroup = new THREE.Group();
  propGroup.position.set(0, 0.95, 1.76);
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 }));
  spinner.rotation.x = -Math.PI / 2;
  propGroup.add(spinner);
  const bladeGeo = new THREE.BoxGeometry(0.04, 0.85, 0.015);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  propGroup.add(blade);
  group.add(propGroup);

  // Cockpit windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.45), glassMat);
  windshield.position.set(0, 1.15, 0.45);
  group.add(windshield);

  // High-mounted main wing
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 0.48), planeMat);
  wing.position.set(0, 1.25, 0.2);
  group.add(wing);

  // Wing struts (left and right)
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 8), trimMat);
    strut.position.set(side * 0.75, 0.98, 0.2);
    strut.rotation.z = side * 0.52;
    group.add(strut);
  }

  // Vertical tail fin + Rudder
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.55, 0.38), trimMat);
  fin.position.set(0, 1.35, -1.15);
  group.add(fin);

  // Horizontal stabilizer + Elevator
  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 0.26), planeMat);
  tailplane.position.set(0, 1.05, -1.18);
  group.add(tailplane);

  // Tricycle landing gear
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8), trimMat);
  noseStrut.position.set(0, 0.55, 0.95);
  group.add(noseStrut);
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), tireMat);
  noseWheel.rotation.z = Math.PI / 2;
  noseWheel.position.set(0, 0.32, 0.95);
  group.add(noseWheel);

  for (const side of [-1, 1]) {
    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8), trimMat);
    mainStrut.position.set(side * 0.38, 0.55, -0.05);
    mainStrut.rotation.z = -side * 0.25;
    group.add(mainStrut);
    const mainWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), tireMat);
    mainWheel.rotation.z = Math.PI / 2;
    mainWheel.position.set(side * 0.48, 0.35, -0.05);
    group.add(mainWheel);
  }

  // Aircraft Title Plaque
  const titlePlaque = createTextPanel('General Aviation Aircraft\nHigh-Wing Aerodynamic Trainer', {
    widthMeters: 0.72, heightMeters: 0.12, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8', lines: 2,
  });
  titlePlaque.position.set(0, 1.6, 1.2);
  titlePlaque.lookAt(0, 1.6, 3);
  group.add(titlePlaque);

  // Info Plaque
  const infoPlaque = createTextPanel(
    'Primary Flight Controls:\n• Ailerons on wings control Roll\n• Elevator on tail controls Pitch\n• Rudder on fin controls Yaw\nReal lift = fluid downward turning, not equal transit time.',
    {
      widthMeters: 0.85, heightMeters: 0.28, fontSizePx: 17, align: 'left',
      background: '#0f172a', color: '#f8fafc', accent: '#0284c7', lines: 5,
      pixelWidth: 720, pixelHeight: 240,
    },
  );
  infoPlaque.position.set(1.4, 1.1, 0);
  infoPlaque.lookAt(2.5, 1.1, 1.5);
  group.add(infoPlaque);

  function update(dt: number): void {
    propGroup.rotation.z += 8.0 * dt;
  }

  return { group, update };
}

export async function buildAerospaceScene(): Promise<AerospaceSceneComponents> {
  const root = new THREE.Group();
  root.name = 'aerospace-module-root';

  // ─────────────────────────────────────────────────────────────────────────
  // Task 24.1: Hangar room — 15 m wide × 10 m deep × 6 m tall (Req 44.1)
  // ─────────────────────────────────────────────────────────────────────────
  const floorGroup = new THREE.Group();
  floorGroup.name = 'aerospace-hangar-floor';

  // Floor: polished concrete color: 0x4a5568, roughness: 0.65 (Req 44.6)
  const floorGeo = new THREE.PlaneGeometry(15, 10, 1, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.65, metalness: 0.1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.02, 0);
  floorGroup.add(floor);

  // Runway centre-line stripe
  const lineGeo = new THREE.PlaneGeometry(0.2, 9);
  lineGeo.rotateX(-Math.PI / 2);
  const lineMesh = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0xddaa33 }));
  lineMesh.position.set(0, -0.01, 0);
  floorGroup.add(lineMesh);
  root.add(floorGroup);

  // Hangar walls (steel panels)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.7 });
  // Back wall (z = -5)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 6), wallMat);
  backWall.position.set(0, 3, -5);
  root.add(backWall);
  // Left wall (x = -7.5)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat);
  leftWall.position.set(-7.5, 3, 0);
  leftWall.rotation.y = Math.PI / 2;
  root.add(leftWall);
  // Right wall (x = +7.5)
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat);
  rightWall.position.set(7.5, 3, 0);
  rightWall.rotation.y = -Math.PI / 2;
  root.add(rightWall);
  // Ceiling
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6, 0);
  root.add(ceiling);

  // Task 24.1: 4× RectAreaLight at y=5, spaced 3 m apart (Req 44.5)
  const rectLights: RectAreaLight[] = [];
  for (let li = 0; li < 4; li++) {
    const xPos = -4.5 + li * 3;
    const rectLight = new THREE.RectAreaLight(0xffffff, 6, 2.5, 1.0);
    rectLight.position.set(xPos, 5, 0);
    rectLight.rotation.x = -Math.PI / 2;
    root.add(rectLight);
    rectLights.push(rectLight);

    // Visible ceiling fixture mesh
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.08, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.35 }),
    );
    fixture.position.set(xPos, 5.96, 0);
    root.add(fixture);
  }

  // Boundary ring on floor (Req 63 isWalkable visual)
  const boundaryRing = new THREE.Mesh(
    new THREE.RingGeometry(7.0, 7.1, 64),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  boundaryRing.rotation.x = -Math.PI / 2;
  boundaryRing.position.y = 0.002;
  root.add(boundaryRing);

  // Safety scope notice plinth at entrance
  const safetyPlinthGroup = new THREE.Group();
  safetyPlinthGroup.name = 'propulsion-safety-plinth';
  safetyPlinthGroup.position.set(0, 0, 3.5);

  const plinthColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.7, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a2636, metalness: 0.5, roughness: 0.4 }),
  );
  plinthColumn.position.y = 0.35;
  safetyPlinthGroup.add(plinthColumn);

  let safetyTexture: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 496, 240);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AEROSPACE & PROPULSION SCOPE', 256, 45);
      ctx.fillStyle = '#f8fafc'; ctx.font = '15px sans-serif';
      ctx.fillText('System-level principles, cycle thermodynamics,', 256, 85);
      ctx.fillText('and flow paths only. Strictly NO propellant', 256, 115);
      ctx.fillText('formulations, chemical mixing, ignition details,', 256, 145);
      ctx.fillText('or fabrication instructions.', 256, 175);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'italic 13px sans-serif';
      ctx.fillText('Kenya Space Agency • historic Malindi range', 256, 215);
      safetyTexture = new THREE.CanvasTexture(canvas);
    }
  }
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.24),
    new THREE.MeshBasicMaterial({ map: safetyTexture, side: THREE.DoubleSide }),
  );
  signMesh.position.set(0, 0.78, 0);
  signMesh.rotation.x = -Math.PI / 6;
  safetyPlinthGroup.add(signMesh);
  root.add(safetyPlinthGroup);

  // ─────────────────────────────────────────────────────────────────────────
  // Task 24.2: Zone positions (Req 44.2–44.4)
  // Aircraft zone: x = −5; Engine test hall: x = +5; Wind tunnel: z = −5
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // Task 25: Helicopter exhibit at (−5, 0, −3) (Req 45)
  // ─────────────────────────────────────────────────────────────────────────
  const helicopterExhibit = buildHelicopterExhibit();
  helicopterExhibit.group.position.set(-5, 0, -3);
  root.add(helicopterExhibit.group);

  // Task 24: Fixed-Wing General Aviation Aircraft exhibit at (−5, 0, 0.5) (Req 44.2)
  const aircraftExhibit = buildGeneralAviationAircraft();
  aircraftExhibit.group.position.set(-5, 0, 0.5);
  root.add(aircraftExhibit.group);

  // Zone label
  const aircraftZoneLabel = createTextPanel('AIRCRAFT ZONE', {
    widthMeters: 0.5, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  aircraftZoneLabel.position.set(-5, 2.5, -1);
  root.add(aircraftZoneLabel);

  // ─────────────────────────────────────────────────────────────────────────
  // Task 26: Engine test hall — 3 engine stands (Req 46)
  // ─────────────────────────────────────────────────────────────────────────
  const engineZoneLabel = createTextPanel('ENGINE TEST HALL', {
    widthMeters: 0.5, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  engineZoneLabel.position.set(5, 2.5, -1);
  root.add(engineZoneLabel);

  // Three engine stands (Req 46.1-46.5)
  // fuel = orange 0xff7700, oxidiser = cyan 0x22d3ee
  const engineStands: THREE.Group[] = [];

  const raptorStand = buildStandPedestal(
    'Raptor-class FFSC\nMethalox Engine',
    new THREE.Vector3(3, 0, -1),
    380,
  );
  root.add(raptorStand);
  engineStands.push(raptorStand);

  const hydroloxStand = buildStandPedestal(
    'Hydrolox Staged\nCombustion Engine\n(e.g. Vinci/RL-10)',
    new THREE.Vector3(5, 0, -1),
    450,
  );
  root.add(hydroloxStand);
  engineStands.push(hydroloxStand);

  const srmStand = buildStandPedestal(
    'Solid Rocket Motor\n(Shuttle SRB-class)',
    new THREE.Vector3(7, 0, -1),
    270,
  );
  root.add(srmStand);
  engineStands.push(srmStand);

  // ─── GLB Engine assets ───────────────────────────────────────────────────
  // Load all three engines via AssetCache. Each engine is placed at y=0.9 (top of pedestal).
  // Explode lever on each pedestal drives setExplodeAmount(). Pinch-pull wired.
  // Flow paths (fuel=orange, oxidiser=cyan) played on liquid engines; none on SRM.
  // Label shows part.label only (not description). Safety scope: system-level only (D-013).
  const assetCache = new AssetCache();
  const glbDisposals: Array<() => void> = [];
  let primaryExplodeAssembly: any = null;

  async function placeGlbEngine(options: {
    url: string;
    _standGroup: THREE.Group;
    standPos: THREE.Vector3;
    engineLabel: string;
    ispValue: number;
    hasFlows: boolean;
    fuelFlowName?: string;
    oxFlowName?: string;
  }): Promise<void> {
    const { url, standPos, engineLabel, ispValue, hasFlows, fuelFlowName, oxFlowName } = options;
    try {
      const loaded = await assetCache.load(url);
      const engineScene = loaded.scene.clone();

      // Scale to fit on pedestal (engines authored ~1 m; pedestal top at y=0.9)
      const box = new THREE.Box3().setFromObject(engineScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 0.9; // metres — fits on pedestal
      const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
      engineScene.scale.setScalar(scaleFactor);

      // Centre X/Z, place on pedestal top (y=0.9)
      const scaledBox = new THREE.Box3().setFromObject(engineScene);
      engineScene.position.set(
        standPos.x - (scaledBox.min.x + scaledBox.max.x) / 2,
        0.9 - scaledBox.min.y,
        standPos.z - (scaledBox.min.z + scaledBox.max.z) / 2,
      );
      // Face +Z toward learner (engines authored front = +Z per CONVENTIONS.md)
      root.add(engineScene);

      // Parse the placed scene instance so parts bind to actual cloned meshes
      const parsed = parseAssetNodes(engineScene);

      // Wire explodable adapter
      const assembly = createExplodableFromAsset(parsed, engineScene as unknown as THREE.Group, {
        onEvent: (ev) => {
          if (ev.type === 'tap') {
            // Show diegetic label next to tapped part (label only, not description per rules)
            const labelTag = createTextPanel(ev.part.label, {
              widthMeters: 0.22, heightMeters: 0.06, fontSizePx: 14, align: 'center',
              background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8',
            });
            const worldPos = new THREE.Vector3();
            ev.part.object.getWorldPosition(worldPos);
            labelTag.position.copy(worldPos).add(new THREE.Vector3(0, 0.12, 0));
            root.add(labelTag);
            // Auto-remove label after 4 s
            setTimeout(() => { root.remove(labelTag); }, 4000);
          }
        },
      });
      engineScene.userData.explodableAssembly = assembly;
      if (!primaryExplodeAssembly) primaryExplodeAssembly = assembly;

      // Two-handed pinch-pull explode gesture (or direct tap/click on desktop) — NO LEVERS
      const scalePinch = new SpatialScalePinchPrimitive(engineScene as unknown as THREE.Group, {
        minScale: 0.8, maxScale: 1.4, preventObjectScale: true,
        onExplodeFraction: (frac) => {
          assembly.setExplodeAmount(frac);
        },
      });
      engineScene.userData.scalePinchPrimitive = scalePinch;

      // ISP readout label below lever
      const ispPanel = createTextPanel(`${engineLabel}\nIsp ≈ ${ispValue} s`, {
        widthMeters: 0.3, heightMeters: 0.08, fontSizePx: 13, align: 'center',
        background: '#0f172a', color: '#38bdf8', accent: '#38bdf8', lines: 2,
      });
      ispPanel.position.set(standPos.x, 1.85, standPos.z);
      root.add(ispPanel);

      // Flow paths on liquid engines (orange = fuel, cyan = oxidiser)
      const flowPlayers: FlowPathPlayer[] = [];
      if (hasFlows) {
        const fuelFlow = loaded.parsed.flows.find((f) => f.flowName === (fuelFlowName ?? 'flow-fuel'));
        const oxFlow = loaded.parsed.flows.find((f) => f.flowName === (oxFlowName ?? 'flow-oxidiser'));
        if (fuelFlow) {
          const fp = new FlowPathPlayer({ flowPath: fuelFlow.flowPath, flowColor: 0xff7700, particleCount: 24, speed: 0.12 });
          // Transform path by engine world matrix (apply engine position/scale)
          fp.mesh.position.copy(engineScene.position);
          fp.mesh.scale.copy(engineScene.scale);
          root.add(fp.mesh);
          flowPlayers.push(fp);
        }
        if (oxFlow) {
          const fp = new FlowPathPlayer({ flowPath: oxFlow.flowPath, flowColor: 0x22d3ee, particleCount: 24, speed: 0.12 });
          fp.mesh.position.copy(engineScene.position);
          fp.mesh.scale.copy(engineScene.scale);
          root.add(fp.mesh);
          flowPlayers.push(fp);
        }
      }

      glbDisposals.push(() => {
        assetCache.release(url);
        for (const fp of flowPlayers) {
          fp.mesh.parent?.remove(fp.mesh);
          (fp.mesh.geometry as THREE.BufferGeometry).dispose();
        }
        if (engineScene.parent) engineScene.parent.remove(engineScene);
        ispPanel.parent?.remove(ispPanel);
      });
    } catch (err) {
      // Diegetic error plaque on load failure
      const errPlaque = createTextPanel(`⚠ Failed to load\n${engineLabel}`, {
        widthMeters: 0.4, heightMeters: 0.1, fontSizePx: 14, align: 'center',
        background: '#7f1d1d', color: '#fecaca', accent: '#ef4444', lines: 2,
      });
      errPlaque.position.set(standPos.x, 1.5, standPos.z);
      root.add(errPlaque);
      console.warn('[Aerospace] GLB load failed:', err);
    }
  }

  // Fire all three engine loads in parallel
  await Promise.all([
    placeGlbEngine({
      url: '/models/aerospace/engine_ffsc_methalox.glb',
      _standGroup: raptorStand,
      standPos: new THREE.Vector3(3, 0, -1),
      engineLabel: 'FFSC Methalox',
      ispValue: 380,
      hasFlows: true,
    }),
    placeGlbEngine({
      url: '/models/aerospace/engine_hydrolox_staged.glb',
      _standGroup: hydroloxStand,
      standPos: new THREE.Vector3(5, 0, -1),
      engineLabel: 'Hydrolox Staged',
      ispValue: 450,
      hasFlows: true,
    }),
    placeGlbEngine({
      url: '/models/aerospace/engine_srm.glb',
      _standGroup: srmStand,
      standPos: new THREE.Vector3(7, 0, -1),
      engineLabel: 'Solid Rocket Motor',
      ispValue: 270,
      hasFlows: false, // SRM has no liquid flow paths
    }),
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Task 27: Wind tunnel section at z=−4 (Req 47, 49, 50)
  // ─────────────────────────────────────────────────────────────────────────

  // Wind tunnel section sign (Req 47.1)
  const windTunnelSign = createTextPanel('WIND TUNNEL TEST SECTION', {
    widthMeters: 0.7, heightMeters: 0.09, fontSizePx: 20, align: 'center',
    background: '#1e293b', color: '#fbbf24', accent: '#fbbf24',
  });
  windTunnelSign.position.set(0, 2.2, -3.6);
  root.add(windTunnelSign);

  // Aircraft Wing Spar & Transonic Wind Tunnel (now at z=−4)
  const wingSparRoot = new THREE.Group();
  wingSparRoot.name = 'wing-spar-station';
  wingSparRoot.position.set(0, 1.2, -4);  // Task 27.1: z=−4

  // Wing geometry: NACA 0012 stylized symmetrical aerofoil section
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.4, 0);
  wingShape.bezierCurveTo(0.3, 0.08, -0.1, 0.07, -0.4, 0.01);
  wingShape.bezierCurveTo(-0.45, 0.0, -0.45, -0.01, -0.4, -0.01);
  wingShape.bezierCurveTo(-0.1, -0.07, 0.3, -0.08, 0.4, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { steps: 1, depth: 0.8, bevelEnabled: false });
  wingGeo.center();
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
  const wingMesh = new THREE.Mesh(wingGeo, wingMat);
  wingMesh.name = 'aerofoil-mesh';
  wingSparRoot.add(wingMesh);

  // Task 27.2: Streamlines as LineSegments with colour gradient (Req 49.1-49.3)
  const streamlineGroup = new THREE.Group();
  streamlineGroup.name = 'wind-tunnel-streamlines';
  const numStreamlines = 16;
  let flowEnabled = true;
  let aerofoilPitch = 0;
  const STALL_ANGLE = 15;

  // Build streamline geometry with per-vertex colours (blue upstream, white mid, red stalled)
  const streamlinePositions: number[] = [];
  const streamlineColors: number[] = [];
  for (let i = 0; i < numStreamlines; i++) {
    const yOffset = -0.22 + (i / (numStreamlines - 1)) * 0.44;
    const zOffset = ((i % 4) - 1.5) * 0.22;
    const points: THREE.Vector3[] = [];
    for (let x = -1.2; x <= 1.2; x += 0.1) {
      const distFromWing = Math.hypot(x, yOffset);
      const deflection = yOffset > 0 ? Math.exp(-distFromWing * 4) * 0.08 : -Math.exp(-distFromWing * 4) * 0.04;
      points.push(new THREE.Vector3(x, yOffset + deflection, zOffset));
    }
    for (let pi = 0; pi < points.length - 1; pi++) {
      streamlinePositions.push(...points[pi].toArray(), ...points[pi + 1].toArray());
      // Colour: upstream blue (x<-0.4), mid white (-0.4 to 0.4), downstream depends on stall
      const isUpstream = points[pi].x < -0.4;
      const r = isUpstream ? 0.23 : 1.0;
      const g = isUpstream ? 0.51 : 1.0;
      const b = isUpstream ? 0.96 : 1.0;
      streamlineColors.push(r, g, b, r, g, b);
    }
  }
  const streamlineGeo = new THREE.BufferGeometry();
  streamlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(streamlinePositions, 3));
  streamlineGeo.setAttribute('color', new THREE.Float32BufferAttribute(streamlineColors, 3));
  const streamlineMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false,
  });
  const streamlineRibbons = new THREE.LineSegments(streamlineGeo, streamlineMat);
  streamlineRibbons.name = 'wind-tunnel-streamline-ribbons';
  streamlineRibbons.userData.streamlineCount = numStreamlines;
  streamlineRibbons.raycast = () => {};
  streamlineGroup.add(streamlineRibbons);

  // Smoke particles
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
  // Round points via the shared material: a bare PointsMaterial renders squares.
  const particleMat = createRoundPointMaterial({
    color: 0x7dd3fc,
    size: 0.028,
    opacity: 0.85,
    additive: false,
    depthWrite: false,
  });
  const smokeParticles = new THREE.Points(particleGeo, particleMat);
  smokeParticles.name = 'wind-tunnel-particles';
  smokeParticles.raycast = () => {};
  streamlineGroup.add(smokeParticles);
  wingSparRoot.add(streamlineGroup);

  // Simplified fluid model label
  const modelNotice = createTextPanel('SIMPLIFIED MODEL — NOT ENGINEERING CFD', {
    widthMeters: 0.9, heightMeters: 0.1, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#38bdf8', lines: 1,
  });
  modelNotice.position.set(0, 0.55, 0);
  wingSparRoot.add(modelNotice);

  // Task 27.1: Mach number readout panel (Req 47.2)
  const machReadout = createTextPanel('Mach 0.0\nSubsonic', {
    widthMeters: 0.3, heightMeters: 0.08, fontSizePx: 18, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  machReadout.position.set(0.9, 0.4, 0);
  wingSparRoot.add(machReadout);

  // Task 27.1: Stall angle indicator — red when pitch > stall angle (Req 47.3)
  const stallIndicatorMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 });
  const stallIndicator = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), stallIndicatorMat);
  stallIndicator.position.set(-0.9, 0.3, 0);
  wingSparRoot.add(stallIndicator);
  const stallLabel = createTextPanel('STALL: OK', {
    widthMeters: 0.2, heightMeters: 0.05, fontSizePx: 14, align: 'center',
    background: '#0f172a', color: '#22c55e',
  });
  stallLabel.position.set(-0.9, 0.42, 0);
  wingSparRoot.add(stallLabel);

  // Flow on/off slider
  const flowSliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  flowSliderTrack.position.set(-1.0, -0.45, 0.6);
  wingSparRoot.add(flowSliderTrack);
  const flowHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5 }),
  );
  flowHandle.name = 'wind-tunnel-flow-slider';
  flowHandle.position.set(-1.0, -0.42, 0.6);
  wingSparRoot.add(flowHandle);
  new SpatialSliderPrimitive(flowHandle, {
    axis: 'z', minDistance: 0.52, maxDistance: 0.68,
    onValueChange: (val) => { flowEnabled = val > 0.15; streamlineGroup.visible = flowEnabled; },
  });
  // Label (Req 50)
  const flowLbl = createTextPanel('Flow On/Off\n(slide to control flow)', {
    widthMeters: 0.22, heightMeters: 0.06, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  flowLbl.position.set(-1.0, -0.2, 0.6);
  wingSparRoot.add(flowLbl);

  // Density slider
  const densitySliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  densitySliderTrack.position.set(-0.72, -0.45, 0.6);
  wingSparRoot.add(densitySliderTrack);
  const densityHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.5 }),
  );
  densityHandle.name = 'wind-tunnel-density-slider';
  densityHandle.position.set(-0.72, -0.42, 0.6);
  wingSparRoot.add(densityHandle);
  new SpatialSliderPrimitive(densityHandle, {
    axis: 'z', minDistance: 0.52, maxDistance: 0.68,
    onValueChange: (val) => {
      const density = 0.25 + val * 0.75;
      streamlineMat.opacity = density;
      particleMat.opacity = density;
      smokeParticles.visible = val > 0.05;
    },
  });
  // Label (Req 50)
  const densityLbl = createTextPanel('Flow Density\n(slide opacity 0–100%)', {
    widthMeters: 0.22, heightMeters: 0.06, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  densityLbl.position.set(-0.72, -0.2, 0.6);
  wingSparRoot.add(densityLbl);

  // Wing Pitch Slider with Mach readout update (Req 47.2, 47.3, 50)
  const pitchHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 }),
  );
  pitchHandle.position.set(-1.4, -0.5, 0.6);
  wingSparRoot.add(pitchHandle);
  // Label (Req 50)
  const pitchLbl = createTextPanel('Pitch — angle of attack\n(−5° to 25°)', {
    widthMeters: 0.26, heightMeters: 0.06, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  pitchLbl.position.set(-1.4, -0.3, 0.6);
  wingSparRoot.add(pitchLbl);

  const wingPitchSlider = new SpatialSliderPrimitive(pitchHandle, {
    axis: 'x',
    minDistance: -1.6,
    maxDistance: -1.2,
    onValueChange: (normalizedVal) => {
      const deg = -5 + normalizedVal * 30;
      aerofoilPitch = deg;
      wingMesh.rotation.z = -(deg * Math.PI) / 180;
      const aero = calculateAerodynamics(deg, 1680);

      // Task 27.1: Mach readout (Req 47.2) — slider maps to Mach 0.1–0.9
      const mach = 0.1 + normalizedVal * 0.8;
      const regime = mach < 0.8 ? 'Subsonic' : mach < 1.0 ? 'Transonic' : 'Supersonic';
      setTextPanelText(machReadout, `Mach ${mach.toFixed(2)}\n${regime}`);

      // Task 27.1: Stall indicator (Req 47.3)
      if (aero.isStalled) {
        stallIndicatorMat.color.setHex(0xff0000);
        setTextPanelText(stallLabel, 'STALL: ⚠');
      } else {
        stallIndicatorMat.color.setHex(0x22c55e);
        setTextPanelText(stallLabel, 'STALL: OK');
      }

      // Task 27.2: Update streamline vertex colours based on stall (Req 49.2)
      const colorsAttr = streamlineGeo.getAttribute('color') as THREE.BufferAttribute;
      const positions2 = streamlineGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let vi = 0; vi < colorsAttr.count; vi++) {
        const xPos = positions2.getX(vi);
        if (xPos < -0.4) {
          // Upstream: blue
          colorsAttr.setXYZ(vi, 0.23, 0.51, 0.96);
        } else if (aero.isStalled && xPos > 0.0) {
          // Separated: red
          colorsAttr.setXYZ(vi, 0.94, 0.26, 0.26);
        } else {
          // Attached: white
          colorsAttr.setXYZ(vi, 1.0, 1.0, 1.0);
        }
      }
      colorsAttr.needsUpdate = true;

      particleMat.color.setHex(aero.isStalled ? 0xef4444 : 0x7dd3fc);
    },
  });
  root.add(wingSparRoot);

  // ─────────────────────────────────────────────────────────────────────────
  // Nozzle plume (shock diamonds) — kept for the backpressure slider demo
  // Now positioned in engine test hall near stand 2 (hydrolox)
  // ─────────────────────────────────────────────────────────────────────────
  const cycleDialGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
  const cycleDial = new THREE.Mesh(cycleDialGeo, new THREE.MeshStandardMaterial({ color: 0x475569 }));
  cycleDial.position.set(5.6, 0.8, -1.0);
  root.add(cycleDial);
  const cycleDialLbl = createTextPanel('Engine Cycle dial — rotate to change combustion cycle', {
    widthMeters: 0.4, heightMeters: 0.07, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  cycleDialLbl.position.set(5.6, 1.1, -1.0);
  root.add(cycleDialLbl);

  const cycleKeys = Object.keys(ROCKET_ENGINE_CYCLES);
  const cycleRotator = new SpatialRotatorPrimitive(cycleDial, {
    detentStepDeg: 45,
    onRotate: (angleDeg) => {
      const step = 360 / cycleKeys.length;
      const idx = Math.abs(Math.round(angleDeg / step)) % cycleKeys.length;
      const cycle = ROCKET_ENGINE_CYCLES[cycleKeys[idx]];
      const dialMat = cycleDial.material as THREE.MeshStandardMaterial;
      if (cycle.id.includes('fuel-rich')) dialMat.color.setHex(0xf97316);
      else if (cycle.id.includes('oxidizer-rich')) dialMat.color.setHex(0x06b6d4);
      else if (cycle.id.includes('full-flow')) dialMat.color.setHex(0x8b5cf6);
      else dialMat.color.setHex(0x0284c7);
    },
  });

  // Nozzle plume (shock diamonds)
  const nozzlePlumeRoot = new THREE.Group();
  nozzlePlumeRoot.name = 'nozzle-shock-diamonds-plume';
  nozzlePlumeRoot.position.set(5.0, 0.85, -1.3);
  const diamondMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const dMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.045 - i * 0.005, 0),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.85 }),
    );
    dMesh.position.y = -0.06 - i * 0.08;
    diamondMeshes.push(dMesh);
    nozzlePlumeRoot.add(dMesh);
  }
  root.add(nozzlePlumeRoot);

  // Backpressure slider
  const pressureHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4 }),
  );
  pressureHandle.position.set(6.4, 0.7, -0.9);
  root.add(pressureHandle);
  // Label (Req 50)
  const pressureLbl = createTextPanel('Backpressure slider\n(0 = vacuum, max = sea-level 1.013 bar)', {
    widthMeters: 0.34, heightMeters: 0.07, fontSizePx: 13, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  pressureLbl.position.set(6.4, 1.0, -0.9);
  root.add(pressureLbl);

  const nozzlePressureSlider = new SpatialSliderPrimitive(pressureHandle, {
    axis: 'y', minDistance: 0.6, maxDistance: 0.85,
    onValueChange: (norm) => {
      const bar = norm * 1.013;
      const state = evaluateNozzleExpansion(50.0, bar, 100);
      diamondMeshes.forEach((mesh, idx) => {
        mesh.visible = idx < state.shockDiamondCount;
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(
          state.expansionRegime === 'overexpanded' ? 0x38bdf8 : 0xf97316,
        );
      });
    },
  });

  // Taifa-1 CubeSat (kept, repositioned slightly)
  const taifaCubeSatRoot = new THREE.Group();
  taifaCubeSatRoot.name = 'taifa-1-cubesat';
  taifaCubeSatRoot.position.set(-5.0, 1.8, -0.6);  // aircraft zone
  const busMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
  taifaCubeSatRoot.add(busMesh);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), solarMat);
    panel.position.set(side * 0.16, 0, 0);
    panel.rotation.y = side * Math.PI / 8;
    taifaCubeSatRoot.add(panel);
  }
  root.add(taifaCubeSatRoot);

  // Diegetic Spatial Anchors
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'aerospace-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  getSpatialAnchors().forEach((def) => anchorPrimitive.registerAnchor(def, 'foundation'));
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // ─────────────────────────────────────────────────────────────────────────
  // Update loop
  // ─────────────────────────────────────────────────────────────────────────
  let time = 0;
  const update = (deltaSeconds: number): void => {
    time += deltaSeconds;

    // Helicopter rotor animation
    helicopterExhibit.update(deltaSeconds);

    // Aircraft propeller animation
    aircraftExhibit.update(deltaSeconds);

    // Taifa-1 orbital tumbling
    taifaCubeSatRoot.rotation.y += deltaSeconds * 0.25;

    // Pulse shock diamonds
    diamondMeshes.forEach((mesh, idx) => {
      const s = 1.0 + Math.sin(time * 8 + idx * 0.7) * 0.12;
      mesh.scale.set(s, s * 1.4, s);
    });

    // Task 27.2: Animate streamlines by scrolling along X (Req 49.3)
    if (flowEnabled) {
      streamlineRibbons.position.x = (streamlineRibbons.position.x + deltaSeconds * 1.2) % 0.4;

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

    // Stall visual shake
    if (aerofoilPitch > STALL_ANGLE) {
      streamlineRibbons.position.y = (Math.random() - 0.5) * 0.08;
      streamlineRibbons.rotation.z = (Math.random() - 0.5) * 0.2;
    } else {
      streamlineRibbons.position.y = 0;
      streamlineRibbons.rotation.z = 0;
    }
  };

  const dispose = (): void => {
    wingPitchSlider.handleMesh.parent?.remove(wingPitchSlider.handleMesh);
    cycleRotator.dialObject.parent?.remove(cycleRotator.dialObject);
    nozzlePressureSlider.handleMesh.parent?.remove(nozzlePressureSlider.handleMesh);
    anchorPrimitive.dispose();
    if (safetyTexture) safetyTexture.dispose();
    // Release GLB engines and their flows
    for (const cleanup of glbDisposals) cleanup();
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else if (mesh.material) (mesh.material as THREE.Material).dispose();
      }
    });
    rectLights.forEach((l) => l.dispose());
  };

  return {
    root,
    wingSparRoot,
    nozzlePlumeRoot,
    taifaCubeSatRoot,
    anchorPrimitive,
    wingPitchSlider,
    explodeAssembly: primaryExplodeAssembly,
    cycleRotator,
    nozzlePressureSlider,
    update,
    dispose,
  };
}

/*
 * BUDGET ESTIMATE (NOT measured on device):
 * Hangar room (floor + 3 walls + ceiling + 4 light fixtures): ~600 tris
 * Safety plinth + sign: ~80 tris
 * Helicopter exhibit: ~444 tris
 * 3 engine stand pedestals (box each): ~300 tris
 * GLB engines (3 × ~20k tris avg): ~60,000 tris — well under 180-draw ceiling
 * Wind tunnel aerofoil (ExtrudeGeometry): ~800 tris
 * Streamline LineSegments (16 × 24 segments): 0 tris (lines)
 * Smoke particles: 0 tris (points)
 * Taifa-1 CubeSat: ~40 tris
 * Text panels (~40 × 2 tris): ~80 tris
 * Triangles total: ~62,000 / working target 150,000 / ceiling 250,000
 * Draw calls: ~70 / working target 108 / ceiling 180
 * NOT measured on device.
 */
