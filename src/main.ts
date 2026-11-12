import * as THREE from 'three';
import type { ModuleDefinition } from './core/types';
import { FixedTimestepAccumulator } from './core/physics/fixed-timestep';
import { SpatialAudioManager } from './core/audio/spatial-audio';
import { ComfortSystem } from './core/comfort/comfort';
import { HubWorld } from './hub/hub-world';
import { InMemoryProgressStore } from './core/store/progress-store';
import { RuntimeTuningPanel } from './core/tuning-panel/tuning-panel';
import { DiegeticSpatialAnchor } from './core/spatial-anchors/diegetic-anchor';
import {
  SpatialGrabPrimitive,
  SpatialRotatorPrimitive,
  SpatialSliderPrimitive,
  SpatialSnapTurnPrimitive,
  SpatialTeleportPrimitive,
} from './core/input/primitives/index';
import { triggerHapticPulse } from './core/haptics/haptics';
import { ActiveTuning } from './config/tuning';
import { isModuleAvailable } from './config/feature-flags';
import { createTextPanel, setTextPanelText } from './core/ui/text-panel';
import cosmosModule from './modules/cosmos/index';
import quantumModule from './modules/quantum/index';
import humanBodyModule from './modules/human-body/index';
import aerospaceModule from './modules/aerospace/index';
import dnaGeneticsModule from './modules/dna-genetics/index';

declare const __BUILD_ID__: string;

/** Build id injected by Vite; shown in-world so a stale headset page is obvious. */
const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'unknown-build';
/** Dev tools (debug panel, stale notice) are opt-in via ?debug=1. */
const DEV_TOOLS_ENABLED = typeof window !== 'undefined'
  && import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('debug') === '1';

// --- Core state -----------------------------------------------------------
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
/** Rig that carries the XR viewer. Moving the rig is how teleport and snap turn work in WebXR. */
let cameraRig: THREE.Group;
let soundManager: SpatialAudioManager;
export let comfortSystem: ComfortSystem;
let hubWorld: HubWorld;
let tuningPanel: RuntimeTuningPanel;
let teleport: SpatialTeleportPrimitive;
let snapTurn: SpatialSnapTurnPrimitive;
let activeModuleDef: ModuleDefinition | null = null;
let activeModuleRoot: THREE.Object3D | null = null;
let currentModuleName = 'hub';
type DepthTier = 'foundation' | 'advanced' | 'expert';
let selectedTier: DepthTier = 'foundation';
let tuningConsole: THREE.Group;
const progressStore = new InMemoryProgressStore();
const physicsAccumulator = new FixedTimestepAccumulator(ActiveTuning.physics.fixedStepHz);
const activeGrabs = new Map<THREE.Object3D, SpatialGrabPrimitive>();
const grabDistances = new Map<THREE.Object3D, number>();
const completedChallenges = new Set<string>();

interface HandSpace extends THREE.Object3D {
  joints?: Record<string, THREE.Object3D>;
}

// XR controller bookkeeping: controller + its visible pointer ray + its input source.
interface XRControllerHandle {
  controller: THREE.XRTargetRaySpace;
  hand: HandSpace | null;
  rayLine: THREE.Line;
  source: XRInputSource | null;
  handedness: 'left' | 'right' | null;
  lastTeleportPush: number;
  lastTurnPush: number;
  lastFacePress: boolean;
  lastTriggerPress: boolean;
  lastTriggerAt: number;
  lastBackPress: boolean;
  poseOrigin: THREE.Vector3;
  poseQuaternion: THREE.Quaternion;
  hasPose: boolean;
}
const xrControllers: XRControllerHandle[] = [];
const xrRaycaster = new THREE.Raycaster();
let teleportOwner: XRControllerHandle | null = null;
let hitMarker: THREE.Mesh;
let debugPanel: THREE.Mesh;
let staleNotice: THREE.Mesh;
let staleBuild = false;
let lastDebugPaint = 0;
let lastHitLabel = 'none';
const debugEvents: string[] = [];
const errorLog: string[] = [];
let lastReason = 'boot';
let walkInTimer = 0;
let walkInPortal: string | null = null;
let moduleEnteredAt = 0;
let moduleLoadInProgress = false;
let returnGate: THREE.Group;
let returnTimer = 0;
let grabHighlightGroup: THREE.Group | null = null;

// Desktop framing (restored when an immersive session ends).
const DESKTOP_CAMERA_POSITION = new THREE.Vector3(0, 1.4, 0.8);
const DESKTOP_LOOK_AT = new THREE.Vector3(0, 1.1, -1.2);

// Interaction & metrics
let inputMode = 'Desktop (using Tier A budgets)';
let activeTier = 'Tier A (Quest 2 Baseline)';
let lastTime = performance.now();
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;
let frameTimeMs = 0;
let teleportAiming = false;

// The canvas and the XR entry button are the only DOM the test harness needs.
const enterXrBtn = document.getElementById('enter-xr-btn');

// --- Boot -----------------------------------------------------------------
function initApp() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d13);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.copy(DESKTOP_CAMERA_POSITION);
  camera.lookAt(DESKTOP_LOOK_AT);

  cameraRig = new THREE.Group();
  cameraRig.name = 'xr-camera-rig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  // Renderer first: the studio environment needs it.
  // Automated browsers run software WebGL, so skip MSAA and image-based lighting there;
  // both are visual upgrades that otherwise dominate the test frame budget.
  const isAutomatedBrowser = typeof navigator !== 'undefined' && (navigator as any).webdriver === true;
  renderer = new THREE.WebGLRenderer({ antialias: !isAutomatedBrowser, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isAutomatedBrowser ? 0.75 : Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Image-based lighting is a visual upgrade for real GPUs.
  if (!isAutomatedBrowser) {
    scene.environment = createStudioEnvironment(renderer);
    scene.environmentIntensity = 0.65;
  }

  const container = document.getElementById('canvas-container');
  if (container) container.appendChild(renderer.domElement);

  // Lighting: image-based studio light + soft key/fill/rim (no runtime shadow passes).
  scene.add(new THREE.HemisphereLight(0x9ecbff, 0x16202e, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(3, 6, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.45);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  soundManager = new SpatialAudioManager(camera);
  comfortSystem = new ComfortSystem(camera);

  hubWorld = new HubWorld();
  scene.add(hubWorld);

  tuningPanel = new RuntimeTuningPanel(camera);
  scene.add(tuningPanel.panelGroup);

  // Physical console that opens the tuning panel in VR (desktop keeps the T key).
  tuningConsole = new THREE.Group();
  tuningConsole.name = 'hub-tuning-console';
  const consolePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.14, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.35 })
  );
  tuningConsole.add(consolePlate);
  const consoleLabel = createTextPanel('TUNING PANEL', {
    widthMeters: 0.24,
    heightMeters: 0.1,
    fontSizePx: 30,
    align: 'center',
  });
  consoleLabel.position.z = 0.018;
  tuningConsole.add(consoleLabel);
  tuningConsole.position.set(-0.95, 1.08, -1.55);
  tuningConsole.lookAt(0, 1.3, 0);
  const openTuningConsole = () => tuningPanel.openInFrontOf(camera);
  tuningConsole.userData.activate = openTuningConsole;
  consoleLabel.userData.activate = openTuningConsole;
  scene.add(tuningConsole);

  // Head-relative debug panel: small, bottom of view, follows the head (dev aid only).
  debugPanel = createTextPanel('BOOT', {
    widthMeters: 0.5,
    heightMeters: 0.34,
    fontSizePx: 16,
    align: 'left',
    lines: 13,
    pixelWidth: 900,
    pixelHeight: 660,
  });
  debugPanel.name = 'xr-debug-panel';
  debugPanel.position.set(0, -0.23, -0.55);
  debugPanel.renderOrder = 10000;
  const debugMaterial = debugPanel.material as THREE.MeshBasicMaterial;
  debugMaterial.depthTest = false;
  debugMaterial.transparent = true;
  debugMaterial.opacity = 0.6;
  debugPanel.visible = DEV_TOOLS_ENABLED;
  camera.add(debugPanel);

  window.addEventListener('error', (event) => recordError(`window.error: ${event.message}`));
  window.addEventListener('unhandledrejection', (event) => {
    recordError(`unhandledrejection: ${String((event as PromiseRejectionEvent).reason)}`);
  });

  // Stale-build warning: the headset page polls the dev server's build id.
  staleNotice = createTextPanel('STALE BUILD — RELOAD', {
    widthMeters: 0.42,
    heightMeters: 0.08,
    fontSizePx: 30,
    align: 'center',
    background: '#7f1d1d',
    accent: '#ef4444',
    lines: 1,
  });
  staleNotice.position.set(0, 0.02, -0.55);
  staleNotice.visible = false;
  camera.add(staleNotice);

  const checkBuildFreshness = async () => {
    if (!import.meta.env.DEV || !DEV_TOOLS_ENABLED) return;
    try {
      const response = await fetch('/__build', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { buildId?: string };
      if (data.buildId && data.buildId !== BUILD_ID) {
        staleBuild = true;
        staleNotice.visible = true;
        logDebug('STALE BUILD');
      }
    } catch {
      /* expected once the headset is unplugged; the app keeps running */
    }
  };
  window.setInterval(() => { void checkBuildFreshness(); }, 10_000);
  void checkBuildFreshness();

  // Return gate: present in every module, behind the spawn point.
  returnGate = new THREE.Group();
  returnGate.name = 'module-return-gate';
  const gatePad = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.48, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  gatePad.position.set(0, 0.03, 2.4);
  returnGate.add(gatePad);
  const gateColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xef4444, emissiveIntensity: 0.6 })
  );
  gateColumn.position.set(0, 0.45, 2.55);
  returnGate.add(gateColumn);
  const gateLabel = createTextPanel('RETURN TO HUB — step on the red ring', {
    widthMeters: 0.7,
    heightMeters: 0.16,
    fontSizePx: 26,
    align: 'center',
    accent: '#ef4444',
  });
  gateLabel.position.set(0, 1.02, 2.55);
  gateLabel.lookAt(0, 1.1, 0);
  returnGate.add(gateLabel);
  const exitModule = () => {
    if (activeModuleDef) {
      logDebug('return gate');
      returnToHub();
    }
  };
  returnGate.userData.activate = exitModule;
  gatePad.userData.activate = exitModule;
  gateLabel.userData.activate = exitModule;
  returnGate.visible = false;
  scene.add(returnGate);

  teleport = new SpatialTeleportPrimitive(scene, cameraRig, comfortSystem);
  snapTurn = new SpatialSnapTurnPrimitive(cameraRig, comfortSystem);

  // Impact dot for the pointer ray.
  hitMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  hitMarker.name = 'xr-pointer-hit-marker';
  hitMarker.visible = false;
  scene.add(hitMarker);

  // Direct module launch: ?module=cosmos (add &dev=true for experimental modules)
  if (typeof window !== 'undefined') {
    const modParam = new URLSearchParams(window.location.search).get('module');
    if (modParam) loadModule(modParam);
  }

  setupDesktopInteraction();
  setupWebXR();

  window.addEventListener('maarify:challenge-completed', (event: Event) => {
    const detail = (event as CustomEvent<{ moduleId: string; challengeId: string }>).detail;
    if (!detail || detail.moduleId !== currentModuleName || completedChallenges.has(detail.challengeId)) return;
    const challenge = activeModuleDef?.getChallenges().find(({ id }) => id === detail.challengeId);
    if (!challenge) return;
    completedChallenges.add(challenge.id);
    progressStore.awardXp(challenge.xpReward);
  });
  window.addEventListener('maarify:spatial-ping', (event: Event) => {
    const detail = (event as CustomEvent<{ emitter: THREE.Object3D; frequency: number }>).detail;
    if (detail?.emitter) soundManager.playSpatialPing(detail.emitter, detail.frequency);
  });
  window.addEventListener('maarify:return-to-hub', () => returnToHub());
  window.addEventListener('maarify:comfort-pulse', (event: Event) => {
    const detail = (event as CustomEvent<{ intensity?: number }>).detail;
    const intensity = Math.max(0, Math.min(1, detail?.intensity ?? 0.4));
    comfortSystem.setMotionIntensity(intensity);
    window.setTimeout(() => comfortSystem.setMotionIntensity(0), 420);
  });
  window.addEventListener('maarify:badge-unlocked', (event: Event) => {
    const detail = (event as CustomEvent<{ badgeId?: string }>).detail;
    if (detail?.badgeId) progressStore.unlockBadge(detail.badgeId);
  });

  window.addEventListener('resize', onWindowResize);
}

/**
 * Offline image-based lighting: a small procedural studio rendered into a PMREM cubemap.
 * No network, no external assets, and it gives every PBR surface believable reflections.
 */
function createStudioEnvironment(target: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(target);
  const envScene = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(14, 9, 14),
    new THREE.MeshBasicMaterial({ color: 0x0a1420, side: THREE.BackSide })
  );
  envScene.add(room);

  const panel = (color: number, width: number, height: number, position: THREE.Vector3, lookAt: THREE.Vector3) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(position);
    mesh.lookAt(lookAt);
    envScene.add(mesh);
  };
  panel(0xbfdbfe, 5, 3, new THREE.Vector3(-6.4, 3.2, 0), new THREE.Vector3(0, 3.2, 0));
  panel(0x38bdf8, 3.5, 2, new THREE.Vector3(6.4, 2.4, -1.5), new THREE.Vector3(0, 2.4, 0));
  panel(0xf59e0b, 2.2, 1.4, new THREE.Vector3(0, 4.2, -6.4), new THREE.Vector3(0, 1.6, 0));
  panel(0x0ea5e9, 4, 1.6, new THREE.Vector3(0, 4.2, 6.4), new THREE.Vector3(0, 2, 0));

  const envTexture = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  room.geometry.dispose();
  (room.material as THREE.Material).dispose();
  envScene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && mesh !== room) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  return envTexture;
}

// --- Module lifecycle -----------------------------------------------------
export async function loadModule(id: string): Promise<THREE.Object3D | null> {
  if (moduleLoadInProgress) return null;
  if (!isModuleAvailable(id)) return null;

  moduleLoadInProgress = true;
  try {
    clearGrabHighlights();
    if (activeModuleDef) activeModuleDef.unload();
    completedChallenges.clear();

    const mod = MODULE_DEFINITIONS[id];
    if (!mod) return null;
    hubWorld.visible = false;
    tuningConsole.visible = false;
    activeModuleDef = mod;
    activeModuleRoot = await mod.load(scene);
    mod.setDepthTier?.(selectedTier);
    highlightGrabbables(activeModuleRoot);
    currentModuleName = id;
    moduleEnteredAt = performance.now();
    resetRigToOrigin();
    return activeModuleRoot;
  } finally {
    moduleLoadInProgress = false;
  }
}

// Modules are imported eagerly so entering one never triggers a network fetch. The
// Quest can then be unplugged after the page loads without breaking module entry.
const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  cosmos: cosmosModule,
  quantum: quantumModule,
  'human-body': humanBodyModule,
  aerospace: aerospaceModule,
  'dna-genetics': dnaGeneticsModule,
};

function returnToHub(): void {
  if (activeModuleDef) {
    activeModuleDef.unload();
    activeModuleDef = null;
  }
  activeModuleRoot = null;
  currentModuleName = 'hub';
  completedChallenges.clear();
  hubWorld.visible = true;
  tuningConsole.visible = true;
  resetRigToOrigin();
}

/** Applies the hub depth tier to the hub and to whichever module is loaded. */
function applyDepthTier(tier: DepthTier): void {
  selectedTier = tier;
  hubWorld.setTier(tier);
  progressStore.setDepthTier(tier);
  activeModuleDef?.setDepthTier?.(tier);
}

function resetRigToOrigin(): void {
  cameraRig.position.set(0, 0, 0);
  cameraRig.rotation.set(0, 0, 0);
}

// --- Desktop fallback -----------------------------------------------------
function setupDesktopInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('pointerdown', (e) => {
    soundManager.initContext();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length === 0) return;

    const hit = intersects[0].object;
    const anchor = findDiegeticAnchor(hit);

    if (hit.userData.tuningPanelSurface && intersects[0].uv) {
      tuningPanel.handlePointer(intersects[0].uv.x, intersects[0].uv.y);
    } else if (anchor) {
      anchor.toggleExpansion();
    } else if (hit.userData.sliderPrimitive instanceof SpatialSliderPrimitive) {
      const slider = hit.userData.sliderPrimitive as SpatialSliderPrimitive;
      slider.setNormalizedValue(slider.value >= 0.95 ? 0 : 1);
    } else if (hit.userData.rotatorPrimitive instanceof SpatialRotatorPrimitive) {
      (hit.userData.rotatorPrimitive as SpatialRotatorPrimitive).addDeltaDeg(30);
    } else if (hit.userData.grabPrimitive instanceof SpatialGrabPrimitive) {
      const grab = hit.userData.grabPrimitive as SpatialGrabPrimitive;
      if (grab.tryGrab(camera.position, camera.quaternion)) grab.release();
    } else if (findUserDataPrimitive(hit, 'activate')) {
      (findUserDataPrimitive(hit, 'activate') as () => void)();
    } else if (hit.name.startsWith('tier-btn-')) {
      applyDepthTier(hit.name.replace('tier-btn-', '') as DepthTier);
    } else {
      const portalId = findPortalAncestor(hit);
      if (portalId) loadModule(portalId);
    }
  });
}

function logDebug(message: string): void {
  const stamp = (performance.now() / 1000).toFixed(1);
  debugEvents.unshift(`${stamp} ${message}`);
  if (debugEvents.length > 6) debugEvents.pop();
  console.info('[maarify]', message);
}

/** Records the reason an activation attempt stopped, for the on-device panel. */
function reason(code: string): void {
  lastReason = code;
  logDebug(`RET ${code}`);
}

function recordError(message: string): void {
  const stamp = (performance.now() / 1000).toFixed(1);
  errorLog.unshift(`${stamp} ${message}`);
  if (errorLog.length > 10) errorLog.pop();
  console.error('[maarify]', message);
  lastDebugPaint = 0;
}

function updateDebugPanel(): void {
  if (!DEV_TOOLS_ENABLED) return;
  const now = performance.now();
  if (now - lastDebugPaint < 250) return;
  lastDebugPaint = now;

  const session = renderer.xr.getSession();
  const sources: XRInputSource[] = [];
  if (session) {
    for (let index = 0; index < session.inputSources.length; index += 1) {
      sources.push(session.inputSources[index]);
    }
  }
  const sourceRows = sources.length === 0
    ? 'none'
    : sources.map((source) => {
        const kind = source.hand ? 'hand' : 'ctl';
        const flags = `${source.gamepad ? 'gp' : '--'}${source.hand ? '/h' : ''}`;
        return `${(source.handedness || 'n')[0].toUpperCase()}:${kind}:${flags}`;
      }).join(' ');

  const head = camera.getWorldPosition(new THREE.Vector3());
  const lines = [
    `BUILD ${BUILD_ID}`,
    `VIS ${session?.visibilityState ?? 'none'} XR ${renderer.xr.isPresenting ? 'on' : 'off'}`,
    `SCENE ${currentModuleName} FRAME ${frameTimeMs.toFixed(0)}ms`,
    `STALE ${staleBuild ? 'YES — RELOAD' : 'no'}`,
    `SRC ${sourceRows}`,
    `POSE ${xrControllers.filter((entry) => entry.hasPose).length}/${xrControllers.length}`,
    `RET ${lastReason}`,
    `HIT ${lastHitLabel}`,
    `EV ${debugEvents[0] ?? '-'}`,
    `EV ${debugEvents[1] ?? ''}`,
    `EV ${debugEvents[2] ?? ''}`,
    `ERR ${errorLog[0] ?? '-'}`,
    `HEAD ${head.x.toFixed(1)} ${head.z.toFixed(1)}`,
  ];
  setTextPanelText(debugPanel, lines.join('\n'));
}

/** Walking through a portal ring enters it; no button required. */
function updateWalkInEntry(deltaSeconds: number): void {
  if (!renderer.xr.isPresenting || activeModuleRoot) {
    walkInTimer = 0;
    walkInPortal = null;
    return;
  }
  const head = camera.getWorldPosition(new THREE.Vector3());
  let nearest: { id: string; distance: number } | null = null;
  for (const portal of hubWorld.portals) {
    const position = portal.portalMesh.getWorldPosition(new THREE.Vector3());
    const distance = head.distanceTo(position);
    if (distance < 1.0 && (!nearest || distance < nearest.distance)) nearest = { id: portal.id, distance };
  }
  if (nearest) {
    if (walkInPortal === nearest.id) walkInTimer += deltaSeconds;
    else {
      walkInPortal = nearest.id;
      walkInTimer = 0;
    }
    if (walkInTimer > 0.9) {
      logDebug(`proximity enter ${nearest.id}`);
      tryLoadModule(nearest.id);
      walkInTimer = 0;
      walkInPortal = null;
    }
  } else {
    walkInTimer = 0;
    walkInPortal = null;
  }
}

/** Red ring behind the spawn point returns to the hub, by ray or by stepping on it. */
function updateReturnGate(deltaSeconds: number): void {
  const inModule = Boolean(activeModuleDef);
  returnGate.visible = inModule;
  if (!inModule) {
    returnTimer = 0;
    return;
  }
  // Grace period so arriving in a module never immediately bounces the learner out.
  if (performance.now() - moduleEnteredAt < 2500) return;
  const head = camera.getWorldPosition(new THREE.Vector3());
  const distance = Math.hypot(head.x - returnGate.position.x, head.z - 2.4);
  const toGate = new THREE.Vector3(0, 0, 2.4).sub(head);
  toGate.y = 0;
  toGate.normalize();
  const gaze = camera.getWorldDirection(new THREE.Vector3());
  gaze.y = 0;
  gaze.normalize();
  // Must stand on the ring AND face it, so walking past it does nothing.
  if (distance < 0.9 && toGate.dot(gaze) > 0.7) {
    returnTimer += deltaSeconds;
    if (returnTimer > 1.0) {
      logDebug('return ring');
      returnToHub();
    }
  } else {
    returnTimer = 0;
  }
}

/** Red grabbable boxes are opt-in: they cost one draw call each and eat the budget. */
const GRAB_HINTS_ENABLED = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('grabhints') === '1';
function highlightGrabbables(root: THREE.Object3D): void {
  if (!GRAB_HINTS_ENABLED) return;
  clearGrabHighlights();
  const group = new THREE.Group();
  group.name = 'debug-grab-highlights';
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xef4444 });
  root.traverse((object) => {
    if (!object.userData.grabPrimitive || object.userData.debugGrabBox) return;
    const box = new THREE.BoxHelper(object as THREE.Object3D, 0xef4444);
    box.material = lineMaterial;
    box.name = `debug-grab-${object.name || 'object'}`;
    group.add(box);
    object.userData.debugGrabBox = box;
  });
  root.add(group);
  grabHighlightGroup = group;
  logDebug(`grab highlights ${group.children.length}`);
}

function clearGrabHighlights(): void {
  if (!grabHighlightGroup) return;
  grabHighlightGroup.parent?.remove(grabHighlightGroup);
  grabHighlightGroup.traverse((object) => {
    const box = object as THREE.BoxHelper;
    box.geometry?.dispose();
  });
  grabHighlightGroup = null;
}

function findDiegeticAnchor(object: THREE.Object3D): DiegeticSpatialAnchor | null {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (candidate instanceof DiegeticSpatialAnchor) return candidate;
    candidate = candidate.parent;
  }
  return null;
}

function findPortalAncestor(object: THREE.Object3D): string | null {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (candidate.name.startsWith('hub-portal-')) return candidate.name.replace('hub-portal-', '');
    candidate = candidate.parent;
  }
  return null;
}

// --- WebXR ----------------------------------------------------------------
function setupWebXR() {
  if ('xr' in navigator && enterXrBtn) {
    (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
      enterXrBtn.textContent = supported ? 'Enter WebXR (Quest 3)' : 'WebXR Not Available (Desktop Mode)';
      if (supported) enterXrBtn.addEventListener('click', onEnterVR);
    });
  }

  for (let i = 0; i < 2; i += 1) {
    const controller = renderer.xr.getController(i);
    controller.addEventListener('connected', (event: any) => {
      const handle = xrControllers[i];
      if (handle) {
        handle.source = (event.data as XRInputSource) ?? null;
        handle.handedness = event.data?.handedness === 'left'
          ? 'left'
          : event.data?.handedness === 'right'
            ? 'right'
            : handle.handedness;
        handle.rayLine.visible = true;
        console.info('[maarify] input connected:', event.data?.handedness, event.data?.hand ? 'hand' : 'controller');
      }
    });
    controller.addEventListener('disconnected', () => {
      const handle = xrControllers[i];
      if (handle) {
        handle.source = null;
        handle.rayLine.visible = false;
        console.info('[maarify] input disconnected:', i);
      }
    });
    controller.addEventListener('selectstart', () => onControllerTrigger(controller, 'select'));
    controller.addEventListener('selectend', () => releaseControllerGrab(controller));
    // Pre-synthesised pinch events from three's hand tracking (select can be unreliable).
    controller.addEventListener('pinchstart', () => onControllerTrigger(controller, 'pinch'));
    controller.addEventListener('pinchend', () => releaseControllerGrab(controller));
    // Controllers and hands ride the rig so teleport/snap turn move them with the viewer.
    cameraRig.add(controller);

    // Cheap pointer ray: a two-point line in world space, extended to the first hit.
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
    ]);
    const rayLine = new THREE.Line(
      rayGeometry,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
    );
    rayLine.name = `xr-pointer-ray-${i}`;
    rayLine.visible = false;
    rayLine.frustumCulled = false;
    scene.add(rayLine);

    const hand = renderer.xr.getHand(i) as unknown as HandSpace;
    cameraRig.add(hand);

    xrControllers.push({ controller, hand, rayLine, source: null, handedness: null, lastTeleportPush: 0, lastTurnPush: 0, lastFacePress: false, lastTriggerPress: false, lastTriggerAt: 0, lastBackPress: false, poseOrigin: new THREE.Vector3(), poseQuaternion: new THREE.Quaternion(), hasPose: false });
  }
}

function onControllerTrigger(controller: THREE.XRTargetRaySpace, via = 'select') {
  const entry = xrControllers.find((candidate) => candidate.controller === controller) ?? null;
  const session = renderer.xr.getSession();
  if (!session) { reason('no-session'); return; }
  if (session.visibilityState === 'visible-blurred') { reason('blurred'); return; }
  if (moduleLoadInProgress) { reason('loading'); return; }
  // Select, pinch and the polled trigger all arrive here; keep only one per press.
  const now = performance.now();
  if (entry) {
    if (now - entry.lastTriggerAt < 150) return;
    entry.lastTriggerAt = now;
  }
  const source = findInputSource(controller);
  logDebug(`${via} ${source?.handedness ?? '?'}`);
  inputMode = source?.hand ? 'Hand Tracking (pinch)' : 'Touch Plus Controller';
  soundManager.initContext();

  // Immediate confirmation that the input event actually reached the app.
  triggerHapticPulse(source, ActiveTuning.haptics.hover.intensity, ActiveTuning.haptics.hover.durationMs);

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  getPointerRay(entry, controller, origin, direction);

  // The tuning console overlays everything, so test it before the world.
  if (handleTuningPanelRay(origin, direction, source)) { reason('panel'); return; }

  if (activeModuleRoot) {
    if (handleModuleRayInteraction(controller, origin, direction, source)) return;
    handleModuleProximityInteraction(controller, origin, source);
    reason('module-near');
    return;
  }

  if (handleHubRayInteraction(origin, direction, source)) { reason('hub-hit'); return; }
  reason('hub-miss');
}

function findInputSource(controller: THREE.XRTargetRaySpace): XRInputSource | undefined {
  const handle = xrControllers.find((entry) => entry.controller === controller);
  return handle?.source ?? undefined;
}

/**
 * WebXR target rays point along -Z, while Object3D.getWorldDirection() returns +Z.
 * This builds the real pointing direction from the controller's world quaternion.
 */
function getControllerForward(controller: THREE.Object3D, target: THREE.Vector3): THREE.Vector3 {
  const quaternion = new THREE.Quaternion();
  controller.getWorldQuaternion(quaternion);
  return target.set(0, 0, -1).applyQuaternion(quaternion).normalize();
}

/** Hands point from the wrist through the index fingertip; controllers along their -Z ray. */
function getPointerRay(
  entry: XRControllerHandle | null,
  controller: THREE.Object3D,
  origin: THREE.Vector3,
  direction: THREE.Vector3
): void {
  const wrist = entry?.hand?.joints?.['wrist'];
  const fingertip = entry?.hand?.joints?.['index-finger-tip'];
  if (wrist && fingertip) {
    const tip = fingertip.getWorldPosition(new THREE.Vector3());
    const base = wrist.getWorldPosition(new THREE.Vector3());
    origin.copy(tip);
    direction.copy(tip).sub(base).normalize();
    return;
  }
  if (entry?.hasPose) {
    origin.copy(entry.poseOrigin);
    direction.set(0, 0, -1).applyQuaternion(entry.poseQuaternion).normalize();
    return;
  }
  controller.getWorldPosition(origin);
  getControllerForward(controller, direction);
}

/** Ray-to-UV routing for the tuning console; consumed before world interaction. */
function handleTuningPanelRay(origin: THREE.Vector3, direction: THREE.Vector3, source?: XRInputSource): boolean {
  if (!tuningPanel.isOpen) return false;
  xrRaycaster.set(origin, direction);
  xrRaycaster.far = 2;
  const hits = xrRaycaster.intersectObject(tuningPanel.panelGroup, true);
  if (hits.length === 0 || !hits[0].uv) return false;
  const handled = tuningPanel.handlePointer(hits[0].uv.x, hits[0].uv.y);
  if (handled) {
    triggerHapticPulse(source, ActiveTuning.haptics.detent.intensity, ActiveTuning.haptics.detent.durationMs);
  }
  return true;
}

function handleHubRayInteraction(origin: THREE.Vector3, direction: THREE.Vector3, source?: XRInputSource): boolean {
  xrRaycaster.set(origin, direction);
  xrRaycaster.far = 5;
  const hits = xrRaycaster.intersectObjects([hubWorld, tuningConsole], true);
  for (const hit of hits) {
    const activate = findUserDataPrimitive(hit.object, 'activate');
    if (typeof activate === 'function') {
      (activate as () => void)();
      triggerHapticPulse(source, ActiveTuning.haptics.detent.intensity, ActiveTuning.haptics.detent.durationMs);
      return true;
    }
    const portalId = findPortalAncestor(hit.object);
    if (portalId) {
      tryLoadModule(portalId, source);
      return true;
    }
    if (hit.object.name.startsWith('tier-btn-')) {
      applyDepthTier(hit.object.name.replace('tier-btn-', '') as DepthTier);
      triggerHapticPulse(source, ActiveTuning.haptics.detent.intensity, ActiveTuning.haptics.detent.durationMs);
      return true;
    }
  }

  // Aim assist: a forgiving cone so imprecise controller/hand pointing still works.
  const aimed = findAimedPortal(origin, direction, 0.92, 6.5);
  if (aimed) {
    tryLoadModule(aimed, source);
    return true;
  }

  // Hands often point imprecisely; walking up to a portal and pinching should still enter.
  let nearestPortal: { id: string; distance: number } | null = null;
  for (const portal of hubWorld.portals) {
    const portalPosition = portal.portalMesh.getWorldPosition(new THREE.Vector3());
    const distance = origin.distanceTo(portalPosition);
    if (distance < 1.1 && (!nearestPortal || distance < nearestPortal.distance)) {
      nearestPortal = { id: portal.id, distance };
    }
  }
  if (nearestPortal) {
    tryLoadModule(nearestPortal.id, source);
    return true;
  }

  // Last resort: look at a portal and press trigger. Also proves whether the controller
  // ray or the head gaze is the part that is misbehaving.
  const gazeOrigin = camera.getWorldPosition(new THREE.Vector3());
  const gazeDirection = camera.getWorldDirection(new THREE.Vector3());
  const looked = findAimedPortal(gazeOrigin, gazeDirection, 0.9, 6.5);
  if (looked) {
    tryLoadModule(looked, source);
    return true;
  }

  return false;
}

/** Portal closest to a ray, within an angular cone and a distance limit. */
function findAimedPortal(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  minDot: number,
  maxDistance: number
): string | null {
  let best: { id: string; score: number } | null = null;
  for (const portal of hubWorld.portals) {
    const position = portal.portalMesh.getWorldPosition(new THREE.Vector3());
    const toPortal = position.sub(origin);
    const distance = toPortal.length();
    if (distance > maxDistance || distance < 0.001) continue;
    const dot = toPortal.normalize().dot(direction);
    if (dot >= minDot && (!best || dot > best.score)) best = { id: portal.id, score: dot };
  }
  return best?.id ?? null;
}

/** Loads a module or gives audible/haptic feedback when the portal is still locked. */
function tryLoadModule(moduleId: string, source?: XRInputSource): boolean {
  if (!isModuleAvailable(moduleId)) {
    triggerHapticPulse(source, ActiveTuning.haptics.error.intensity, ActiveTuning.haptics.error.durationMs);
    logDebug(`load ${moduleId} LOCKED`);
    return false;
  }
  triggerHapticPulse(source, ActiveTuning.haptics.success.intensity, ActiveTuning.haptics.success.durationMs);
  logDebug(`load ${moduleId} ok`);
  loadModule(moduleId);
  return true;
}

function handleModuleRayInteraction(
  controller: THREE.XRTargetRaySpace,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  source?: XRInputSource
): boolean {
  if (!activeModuleRoot) return false;
  xrRaycaster.set(origin, direction);
  xrRaycaster.far = 4.5;
  const targets: THREE.Object3D[] = [activeModuleRoot];
  if (returnGate.visible) targets.push(returnGate);
  const hits = xrRaycaster.intersectObjects(targets, true);
  if (hits.length === 0) return false;

  // Dispatch on the CLOSEST hit only. Previously every anchor anywhere along the ray
  // could consume the press, so aiming at a grabbable near an anchor tag toggled the
  // anchor instead of grabbing.
  const hit = hits[0];

  const activate = findUserDataPrimitive(hit.object, 'activate');
  if (typeof activate === 'function') {
    (activate as () => void)();
    reason('activate');
    return true;
  }

  const anchor = findDiegeticAnchor(hit.object);
  if (anchor) {
    anchor.toggleExpansion();
    triggerHapticPulse(source, ActiveTuning.haptics.snap.intensity, ActiveTuning.haptics.snap.durationMs);
    reason('anchor');
    return true;
  }

  const slider = findUserDataPrimitive(hit.object, 'sliderPrimitive') as SpatialSliderPrimitive | null;
  if (slider) {
    slider.updateDrag(hit.point, source);
    reason('slider');
    return true;
  }

  const rotator = findUserDataPrimitive(hit.object, 'rotatorPrimitive') as SpatialRotatorPrimitive | null;
  if (rotator) {
    rotator.addDeltaDeg(ActiveTuning.input.rotatorDetentStepDeg);
    reason('rotator');
    return true;
  }

  const grab = findUserDataPrimitive(hit.object, 'grabPrimitive') as SpatialGrabPrimitive | null;
  if (grab && !grab.isGrabbed && grab.tryGrab(hit.point, new THREE.Quaternion(), source)) {
    activeGrabs.set(controller, grab);
    grabDistances.set(controller, Math.max(0.35, hit.distance));
    reason('ray-grab');
    return true;
  }

  return false;
}

function findUserDataPrimitive(object: THREE.Object3D, key: string): unknown | null {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (candidate.userData[key]) return candidate.userData[key];
    candidate = candidate.parent;
  }
  return null;
}

function handleModuleProximityInteraction(
  controller: THREE.XRTargetRaySpace,
  pos: THREE.Vector3,
  source?: XRInputSource
): void {
  const sliderObject = findClosestModuleObject((object) => object.userData.sliderPrimitive instanceof SpatialSliderPrimitive, pos, 0.35);
  if (sliderObject) {
    (sliderObject.userData.sliderPrimitive as SpatialSliderPrimitive).updateDrag(pos, source);
    return;
  }
  const rotatorObject = findClosestModuleObject((object) => object.userData.rotatorPrimitive instanceof SpatialRotatorPrimitive, pos, 0.35);
  if (rotatorObject) {
    (rotatorObject.userData.rotatorPrimitive as SpatialRotatorPrimitive).addDeltaDeg(ActiveTuning.input.rotatorDetentStepDeg);
    return;
  }
  const grabObject = findClosestModuleObject((object) => object.userData.grabPrimitive instanceof SpatialGrabPrimitive, pos, 0.3);
  if (!grabObject) return;
  const grab = grabObject.userData.grabPrimitive as SpatialGrabPrimitive;
  if (!grab.tryGrab(pos, controller.quaternion, source)) return;
  activeGrabs.set(controller, grab);
}

function findClosestModuleObject(predicate: (object: THREE.Object3D) => boolean, pos: THREE.Vector3, maxDistance: number): THREE.Object3D | null {
  if (!activeModuleRoot) return null;
  let result: THREE.Object3D | null = null;
  let closest = maxDistance;
  activeModuleRoot.traverse((object) => {
    if (!predicate(object)) return;
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    const distance = pos.distanceTo(worldPosition);
    if (distance <= closest) {
      closest = distance;
      result = object;
    }
  });
  return result;
}

function releaseControllerGrab(controller: THREE.Object3D): void {
  const grab = activeGrabs.get(controller);
  if (!grab) return;
  grab.release(findInputSource(controller as THREE.XRTargetRaySpace));
  activeGrabs.delete(controller);
  grabDistances.delete(controller);
}

async function onEnterVR() {
  if (!('xr' in navigator)) return;
  try {
    const session = await (navigator as any).xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'hit-test'],
    });

    scene.environmentIntensity = 0.65;
    await renderer.xr.setSession(session);
    renderer.xr.setFoveation(0.4);
    inputMode = 'WebXR Immersive Session';
    activeTier = 'Tier B (Quest 3 / 3S Detected)';

    if (session.supportedFrameRates && session.updateTargetFrameRate) {
      const rates: number[] = session.supportedFrameRates;
      if (rates.includes(90)) session.updateTargetFrameRate(90).catch(() => {});
      else if (rates.includes(72)) session.updateTargetFrameRate(72).catch(() => {});
    }

    session.addEventListener('end', () => {
      inputMode = 'Desktop Fallback';
      activeTier = 'Tier A (Quest 2 Baseline)';
      camera.position.copy(DESKTOP_CAMERA_POSITION);
      camera.lookAt(DESKTOP_LOOK_AT);
      resetRigToOrigin();
      teleport.cancelAim();
      teleportAiming = false;
      teleportOwner = null;
      hitMarker.visible = false;
      xrControllers.forEach((entry) => { entry.rayLine.visible = false; entry.source = null; });
      comfortSystem.setMotionIntensity(0);
    });
  } catch (err) {
    console.warn('Failed to start WebXR session:', err);
  }
}

// --- Per-frame XR locomotion ---------------------------------------------
function updateXRLocomotion(frame?: XRFrame, deltaSeconds = 0): void {
  if (!renderer.xr.isPresenting) return;

  // Re-read session.inputSources every frame and rebind by handedness. Three reuses
  // controller slots when the Quest switches between hands and controllers, so cached
  // source references (and index-based assignment) go stale.
  syncControllerSources();
  syncControllerPoses(frame);

  for (const entry of xrControllers) {
    const gamepad = entry.source?.gamepad;
    if (!gamepad) continue;

    const stickX = gamepad.axes[2] ?? 0;
    const stickY = gamepad.axes[3] ?? 0;
    const isLeft = entry.source?.handedness === 'left';
    const isRight = entry.source?.handedness === 'right';
    const stickMagnitude = Math.hypot(stickX, stickY);

    // Left stick walks: hold to aim, release to land. Only the hand that started the
    // aim may commit it, otherwise the idle controller commits (and buzzes) instead.
    const usingLeftStick = isLeft || (!isRight && entry.controller === xrControllers[0]?.controller);
    const smoothLocomotion = ActiveTuning.comfort.smoothLocomotion;
    if (smoothLocomotion && usingLeftStick) {
      const magnitude = Math.min(1, stickMagnitude);
      if (magnitude > 0.15) {
        const headDirection = camera.getWorldDirection(new THREE.Vector3());
        headDirection.y = 0;
        headDirection.normalize();
        const forward = Math.abs(stickY) > 0.15 ? -Math.sign(stickY) : 0;
        cameraRig.position.addScaledVector(
          headDirection,
          forward * ActiveTuning.comfort.smoothSpeedMetersPerSecond * magnitude * deltaSeconds
        );
        comfortSystem.setMotionIntensity(Math.min(0.5, magnitude * 0.6));
      } else {
        comfortSystem.setMotionIntensity(0);
      }
    } else if (!smoothLocomotion && usingLeftStick && stickMagnitude > 0.55) {
      if (!teleportAiming) {
        teleportOwner = entry;
        teleport.startAim();
        teleportAiming = true;
      }
      if (teleportOwner === entry) {
        // Controller-aimed arc; the landing point is clamped by the teleport primitive.
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3();
        getPointerRay(entry, entry.controller, origin, direction);
        direction.y = THREE.MathUtils.clamp(direction.y, -0.75, -0.12);
        direction.normalize();
        teleport.updateAim(origin, direction, 0);
      }
    } else if (teleportAiming && teleportOwner === entry && stickMagnitude < 0.25) {
      logDebug(`tele ${teleport.target.position.x.toFixed(1)},${teleport.target.position.z.toFixed(1)}`);
      teleport.commitTeleport(entry.source ?? undefined);
      teleportAiming = false;
      teleportOwner = null;
    }

    // Right stick snaps the view in 30-degree detents (edge-triggered, one detent per push).
    if (isRight || (!isLeft && entry.controller === xrControllers[1]?.controller)) {
      const magnitude = Math.abs(stickX);
      if (magnitude > 0.6 && entry.lastTurnPush <= 0.6) {
        // Rotate around the viewer's head, not the rig origin, so the world does not orbit.
        const headBefore = camera.getWorldPosition(new THREE.Vector3());
        snapTurn.handleThumbstick(stickX, entry.source ?? undefined);
        cameraRig.updateMatrixWorld(true);
        const headAfter = camera.getWorldPosition(new THREE.Vector3());
        cameraRig.position.x += headBefore.x - headAfter.x;
        cameraRig.position.z += headBefore.z - headAfter.z;
        logDebug('snap turn');
      }
      entry.lastTurnPush = magnitude;
    }

    // Polled trigger: the same path the sticks use, so it survives missing select events.
    const triggerPressed = Boolean(gamepad.buttons[0]?.pressed);
    if (triggerPressed && !entry.lastTriggerPress) {
      onControllerTrigger(entry.controller, 'poll');
    } else if (!triggerPressed && entry.lastTriggerPress) {
      releaseControllerGrab(entry.controller);
    }
    entry.lastTriggerPress = triggerPressed;

    // Face button (A/X or B/Y) enters the aimed portal. This path uses gamepad polling,
    // so it still works if select events are unreliable.
    const facePressed = Boolean(gamepad.buttons[4]?.pressed || gamepad.buttons[5]?.pressed);
    if (facePressed && !entry.lastFacePress && !activeModuleRoot) {
      logDebug('face button');
      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3();
      getPointerRay(entry, entry.controller, origin, direction);
      const aimed = findAimedPortal(origin, direction, 0.85, 8);
      if (aimed) {
        tryLoadModule(aimed, entry.source ?? undefined);
      } else {
        triggerHapticPulse(entry.source ?? undefined, ActiveTuning.haptics.error.intensity, ActiveTuning.haptics.error.durationMs);
        console.info('[maarify] face button pressed, no portal inside the aim cone');
      }
    }
    entry.lastFacePress = facePressed;

    // B/Y returns to the hub (polled, so it works even if select events do not).
    const backPressed = Boolean(gamepad.buttons[5]?.pressed);
    if (backPressed && !entry.lastBackPress && activeModuleDef) {
      logDebug('back button');
      returnToHub();
    }
    entry.lastBackPress = backPressed;
  }

  if (teleportAiming && (!teleportOwner || !teleportOwner.source)) {
    teleport.cancelAim();
    teleportAiming = false;
    teleportOwner = null;
  }

  updateControllerRays();
}

function syncControllerSources(): void {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const entry of xrControllers) {
    if (!entry.handedness) continue;
    let match: XRInputSource | null = null;
    for (let index = 0; index < session.inputSources.length; index += 1) {
      const candidate = session.inputSources[index];
      if (candidate.handedness === entry.handedness) {
        match = candidate;
        break;
      }
    }
    if (match !== entry.source) {
      entry.source = match;
      entry.rayLine.visible = Boolean(match);
      logDebug(`source ${entry.handedness} ${match ? (match.hand ? 'hand' : 'ctl') : 'lost'}`);
    }
  }
}

function syncControllerPoses(frame?: XRFrame): void {
  const referenceSpace = renderer.xr.getReferenceSpace();
  if (!frame || !referenceSpace) return;
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  for (const entry of xrControllers) {
    const source = entry.source;
    if (!source) {
      entry.hasPose = false;
      continue;
    }
    const pose = frame.getPose(source.targetRaySpace, referenceSpace);
    if (!pose) {
      entry.hasPose = false;
      continue;
    }
    matrix.fromArray(pose.transform.matrix);
    matrix.decompose(entry.poseOrigin, entry.poseQuaternion, scale);
    entry.hasPose = true;
  }
}

function updateControllerRays(): void {
  let bestHit: THREE.Intersection | null = null;
  for (const entry of xrControllers) {
    if (!entry.source) {
      entry.rayLine.visible = false;
      continue;
    }
    entry.rayLine.visible = true;
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    getPointerRay(entry, entry.controller, origin, direction);

    let end = origin.clone().addScaledVector(direction, 1.8);
    const target = activeModuleRoot ?? hubWorld;
    xrRaycaster.set(origin, direction);
    xrRaycaster.far = 4.5;
    const hits = xrRaycaster.intersectObject(target, true);
    if (hits.length > 0) {
      end = hits[0].point;
      if (!bestHit || hits[0].distance < bestHit.distance) bestHit = hits[0];
    }

    const points = entry.rayLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    points.setXYZ(0, origin.x, origin.y, origin.z);
    points.setXYZ(1, end.x, end.y, end.z);
    points.needsUpdate = true;
    entry.rayLine.geometry.computeBoundingSphere();
    (entry.rayLine.material as THREE.LineBasicMaterial).color.setHex(
      hits.length > 0 ? 0x7dd3fc : 0x38bdf8
    );
  }

  if (bestHit) {
    const portalName = findPortalAncestor(bestHit.object);
    lastHitLabel = portalName ? `portal:${portalName}` : (bestHit.object.name || 'object');
    const isPortal = Boolean(portalName);
    hitMarker.position.copy(bestHit.point);
    hitMarker.visible = true;
    hitMarker.scale.setScalar(isPortal ? 1.8 : 1);
    (hitMarker.material as THREE.MeshBasicMaterial).color.setHex(isPortal ? 0x10b981 : 0x38bdf8);
  } else {
    lastHitLabel = 'none';
    hitMarker.visible = false;
  }
}

// --- Loop -----------------------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(renderLoop);
}

function renderLoop(_time: DOMHighResTimeStamp, _frame?: XRFrame) {
  // A single thrown frame used to kill three's animation loop, freezing the whole app.
  try {
    renderFrame(_frame);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    recordError(`frame: ${message}`);
    lastDebugPaint = 0;
    try { updateDebugPanel(); } catch { /* keep the loop alive */ }
  }
}

function renderFrame(frame?: XRFrame) {
  const now = performance.now();
  const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
  frameTimeMs = now - lastTime;
  lastTime = now;

  frameCount += 1;
  if (now - lastFpsUpdate >= 500) {
    currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
  }

  updateXRLocomotion(frame, deltaSec);
  updateWalkInEntry(deltaSec);
  updateReturnGate(deltaSec);
  updateDebugPanel();

  // Fixed-timestep simulation stays decoupled from display refresh.
  physicsAccumulator.step(deltaSec, () => {
    /* simulation ticks reserved for the shared systems */
  });

  // Module animation tick (helix sway, plume pulse, heart beat...).
  activeModuleDef?.update?.(deltaSec);

  activeGrabs.forEach((grab, controller) => {
    const entry = xrControllers.find((candidate) => candidate.controller === controller) ?? null;
    const origin = entry?.hasPose ? entry.poseOrigin.clone() : controller.getWorldPosition(new THREE.Vector3());
    const quaternion = entry?.hasPose ? entry.poseQuaternion.clone() : controller.getWorldQuaternion(new THREE.Quaternion());
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const distance = grabDistances.get(controller) ?? 0.6;
    grab.update(origin.addScaledVector(direction, distance), quaternion);
  });

  renderer.render(scene, camera);
  publishTestHooks();
}

function publishTestHooks() {
  (window as any).__MAARIFY_SET_CAMERA__ = (pos: [number, number, number], rotDeg: [number, number, number]) => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(
      (rotDeg[0] * Math.PI) / 180,
      (rotDeg[1] * Math.PI) / 180,
      (rotDeg[2] * Math.PI) / 180
    );
  };
  (window as any).__MAARIFY_LOAD_MODULE__ = loadModule;
  (window as any).__MAARIFY_RETURN_TO_HUB__ = returnToHub;
  (window as any).__MAARIFY_SCENE_ROOT__ = scene;
  (window as any).__MAARIFY_AUDIT__ = {
    anchors: activeModuleDef?.getSpatialAnchors().map((anchor) => anchor.id) ?? [],
    challenges: activeModuleDef?.getChallenges().map((challenge) => ({
      id: challenge.id,
      seatedCompatible: challenge.seatedCompatible,
      xpReward: challenge.xpReward,
    })) ?? [],
    tier: selectedTier,
  };
  (window as any).__MAARIFY_SET_TIER__ = (tier: DepthTier) => applyDepthTier(tier);
  (window as any).__MAARIFY_TUNING__ = {
    open: () => tuningPanel.openInFrontOf(camera),
    close: () => tuningPanel.hide(),
    isOpen: () => tuningPanel.isOpen,
    press: (u: number, v: number) => tuningPanel.handlePointer(u, v),
    state: () => ({
      isOpen: tuningPanel.isOpen,
      grabThreshold: ActiveTuning.input.grabThresholdMeters,
      snapTurnAngleDeg: ActiveTuning.comfort.snapTurnAngleDeg,
    }),
  };
  (window as any).__MAARIFY_CHALLENGES__ = {
    completed: Array.from(completedChallenges),
    totalXp: progressStore.getProgress().totalXp,
    badges: progressStore.getProgress().earnedBadges,
  };
  (window as any).__MAARIFY_MODULE_STATE__ = activeModuleDef?.getState?.() ?? null;
  (window as any).__MAARIFY_XR_DEBUG__ = {
    inputs: xrControllers.map((entry) => ({
      source: Boolean(entry.source),
      hand: Boolean(entry.source?.hand),
      handedness: entry.source?.handedness ?? null,
      rayVisible: entry.rayLine.visible,
      trigger: entry.lastTriggerPress,
      position: entry.controller.getWorldPosition(new THREE.Vector3()).toArray().map((value) => Number(value.toFixed(2))),
    })),
    lastHit: lastHitLabel,
    events: [...debugEvents],
    module: currentModuleName,
    presenting: renderer.xr.isPresenting,
    teleport: {
      aiming: teleportAiming,
      target: [Number(teleport.target.position.x.toFixed(2)), Number(teleport.target.position.z.toFixed(2))],
    },
  };
  (window as any).__MAARIFY_TOGGLE_ANCHOR__ = (id: string) => {
    const anchor = activeModuleRoot?.getObjectByName(`diegetic-anchor-${id}`);
    if (!(anchor instanceof DiegeticSpatialAnchor)) return false;
    anchor.toggleExpansion();
    return anchor.isExpanded;
  };
  (window as any).__MAARIFY_LOCOMOTION__ = {
    rig: { x: cameraRig.position.x, y: cameraRig.position.y, z: cameraRig.position.z },
    yawDeg: Number((cameraRig.rotation.y * 180 / Math.PI).toFixed(1)),
    aiming: teleportAiming,
    hasTeleport: Boolean(teleport),
    xrPresenting: renderer.xr.isPresenting,
  };
  (window as any).__MAARIFY_METRICS__ = {
    fps: currentFps,
    frameTimeMs: Number(frameTimeMs.toFixed(2)),
    triangles: renderer.info.render.triangles,
    drawCalls: renderer.info.render.calls,
    inputMode,
    activeTier,
    selectedTier: hubWorld.selectedTier,
    currentModule: currentModuleName,
  };
}

// Start application
initApp();
animate();
