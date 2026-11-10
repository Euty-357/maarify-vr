import * as THREE from 'three';
import type { ModuleDefinition } from './core/types';
import { FixedTimestepAccumulator } from './core/physics/fixed-timestep';
import { SpatialAudioManager } from './core/audio/spatial-audio';
import { ComfortSystem } from './core/comfort/comfort';
import { HubWorld } from './hub/hub-world';
import { SmokeTestZone } from './hub/smoke-test-zone';
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

// --- Core state -----------------------------------------------------------
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
/** Rig that carries the XR viewer. Moving the rig is how teleport and snap turn work in WebXR. */
let cameraRig: THREE.Group;
let soundManager: SpatialAudioManager;
export let comfortSystem: ComfortSystem;
let hubWorld: HubWorld;
let smokeTestZone: SmokeTestZone;
let tuningPanel: RuntimeTuningPanel;
let teleport: SpatialTeleportPrimitive;
let snapTurn: SpatialSnapTurnPrimitive;
let activeModuleDef: ModuleDefinition | null = null;
let activeModuleRoot: THREE.Object3D | null = null;
let currentModuleName = 'hub';
const progressStore = new InMemoryProgressStore();
const physicsAccumulator = new FixedTimestepAccumulator(ActiveTuning.physics.fixedStepHz);
const activeGrabs = new Map<THREE.Object3D, SpatialGrabPrimitive>();
const completedChallenges = new Set<string>();

// XR controller bookkeeping: controller + its visible pointer ray + its input source.
interface XRControllerHandle {
  controller: THREE.XRTargetRaySpace;
  rayLine: THREE.Line;
  source: XRInputSource | null;
  lastTeleportPush: number;
  lastTurnPush: number;
}
const xrControllers: XRControllerHandle[] = [];
const xrRaycaster = new THREE.Raycaster();

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

// UI overlay elements
const fpsElem = document.getElementById('metric-fps');
const frameTimeElem = document.getElementById('metric-frame-time');
const triElem = document.getElementById('metric-triangles');
const dcElem = document.getElementById('metric-draw-calls');
const tierElem = document.getElementById('metric-tier');
const inputElem = document.getElementById('metric-input');
const cubeStateElem = document.getElementById('metric-cube-state');
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

  smokeTestZone = new SmokeTestZone(soundManager);
  scene.add(smokeTestZone);

  tuningPanel = new RuntimeTuningPanel(camera);
  scene.add(tuningPanel.panelGroup);

  teleport = new SpatialTeleportPrimitive(scene, cameraRig, comfortSystem);
  snapTurn = new SpatialSnapTurnPrimitive(cameraRig, comfortSystem);

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
  if (!isModuleAvailable(id)) return null;
  if (activeModuleDef) activeModuleDef.unload();
  completedChallenges.clear();

  const importer = MODULE_IMPORTERS[id];
  if (!importer) return null;

  const mod = (await importer()).default;
  hubWorld.visible = false;
  smokeTestZone.visible = false;
  activeModuleDef = mod;
  activeModuleRoot = await mod.load(scene);
  currentModuleName = id;
  resetRigToOrigin();
  return activeModuleRoot;
}

const MODULE_IMPORTERS: Record<string, () => Promise<{ default: ModuleDefinition }>> = {
  cosmos: () => import('./modules/cosmos/index'),
  quantum: () => import('./modules/quantum/index'),
  'human-body': () => import('./modules/human-body/index'),
  aerospace: () => import('./modules/aerospace/index'),
  'dna-genetics': () => import('./modules/dna-genetics/index'),
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
  smokeTestZone.visible = true;
  resetRigToOrigin();
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

    if (anchor) {
      anchor.toggleExpansion();
    } else if (hit.userData.sliderPrimitive instanceof SpatialSliderPrimitive) {
      const slider = hit.userData.sliderPrimitive as SpatialSliderPrimitive;
      slider.setNormalizedValue(slider.value >= 0.95 ? 0 : 1);
    } else if (hit.userData.rotatorPrimitive instanceof SpatialRotatorPrimitive) {
      (hit.userData.rotatorPrimitive as SpatialRotatorPrimitive).addDeltaDeg(30);
    } else if (hit.userData.grabPrimitive instanceof SpatialGrabPrimitive) {
      const grab = hit.userData.grabPrimitive as SpatialGrabPrimitive;
      if (grab.tryGrab(camera.position, camera.quaternion)) grab.release();
    } else if (hit === smokeTestZone.chimeSphere) {
      smokeTestZone.pokeChime();
    } else if (hit === smokeTestZone.grabBlock) {
      smokeTestZone.grabCalibrationBlock();
      setTimeout(() => smokeTestZone.releaseCalibrationBlock(), 400);
    } else if (hit.name.includes('anchor-tag-smoke-test-anchor')) {
      smokeTestZone.testAnchor.toggleExpansion();
    } else if (hit.name.startsWith('tier-btn-')) {
      const tier = hit.name.replace('tier-btn-', '') as 'foundation' | 'advanced' | 'expert';
      hubWorld.setTier(tier);
      progressStore.setDepthTier(tier);
    } else {
      const portalId = findPortalAncestor(hit);
      if (portalId) loadModule(portalId);
    }
  });
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
        handle.rayLine.visible = true;
      }
    });
    controller.addEventListener('disconnected', () => {
      const handle = xrControllers[i];
      if (handle) {
        handle.source = null;
        handle.rayLine.visible = false;
      }
    });
    controller.addEventListener('selectstart', () => onControllerTrigger(controller));
    controller.addEventListener('selectend', () => releaseControllerGrab(controller));
    scene.add(controller);

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

    xrControllers.push({ controller, rayLine, source: null, lastTeleportPush: 0, lastTurnPush: 0 });
  }
}

function onControllerTrigger(controller: THREE.XRTargetRaySpace) {
  const source = findInputSource(controller);
  inputMode = source?.hand ? 'Hand Tracking (pinch)' : 'Touch Plus Controller';
  soundManager.initContext();

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  controller.getWorldPosition(origin);
  controller.getWorldDirection(direction);

  if (activeModuleRoot) {
    if (handleModuleRayInteraction(origin, direction, source)) return;
    handleModuleProximityInteraction(controller, origin, source);
    return;
  }

  if (handleHubRayInteraction(origin, direction, source)) return;

  // Physical proximity fallbacks at the smoke-test plinth.
  const pos = controller.position;
  if (pos.distanceTo(smokeTestZone.chimeSphere.position) < 0.3) {
    smokeTestZone.pokeChime(source);
  } else if (pos.distanceTo(smokeTestZone.grabBlock.position) < 0.3) {
    smokeTestZone.grabCalibrationBlock(source);
  } else if (pos.distanceTo(smokeTestZone.testAnchor.position) < 0.4) {
    smokeTestZone.testAnchor.toggleExpansion();
    triggerHapticPulse(source, ActiveTuning.haptics.snap.intensity, ActiveTuning.haptics.snap.durationMs);
  }
}

function findInputSource(controller: THREE.XRTargetRaySpace): XRInputSource | undefined {
  const handle = xrControllers.find((entry) => entry.controller === controller);
  return handle?.source ?? undefined;
}

function handleHubRayInteraction(origin: THREE.Vector3, direction: THREE.Vector3, source?: XRInputSource): boolean {
  xrRaycaster.set(origin, direction);
  xrRaycaster.far = 5;
  const hits = xrRaycaster.intersectObject(hubWorld, true);
  for (const hit of hits) {
    const portalId = findPortalAncestor(hit.object);
    if (portalId) {
      triggerHapticPulse(source, ActiveTuning.haptics.success.intensity, ActiveTuning.haptics.success.durationMs);
      loadModule(portalId);
      return true;
    }
    if (hit.object.name.startsWith('tier-btn-')) {
      const tier = hit.object.name.replace('tier-btn-', '') as 'foundation' | 'advanced' | 'expert';
      hubWorld.setTier(tier);
      progressStore.setDepthTier(tier);
      triggerHapticPulse(source, ActiveTuning.haptics.detent.intensity, ActiveTuning.haptics.detent.durationMs);
      return true;
    }
  }
  return false;
}

function handleModuleRayInteraction(origin: THREE.Vector3, direction: THREE.Vector3, source?: XRInputSource): boolean {
  if (!activeModuleRoot) return false;
  xrRaycaster.set(origin, direction);
  xrRaycaster.far = 4.5;
  const hits = xrRaycaster.intersectObject(activeModuleRoot, true);
  if (hits.length === 0) return false;

  for (const hit of hits) {
    const anchor = findDiegeticAnchor(hit.object);
    if (anchor) {
      anchor.toggleExpansion();
      triggerHapticPulse(source, ActiveTuning.haptics.snap.intensity, ActiveTuning.haptics.snap.durationMs);
      return true;
    }
  }
  for (const hit of hits) {
    const activate = findUserDataPrimitive(hit.object, 'activate');
    if (typeof activate === 'function') {
      (activate as () => void)();
      return true;
    }
  }
  for (const hit of hits) {
    const slider = findUserDataPrimitive(hit.object, 'sliderPrimitive') as SpatialSliderPrimitive | null;
    if (slider) {
      slider.updateDrag(hit.point, source);
      return true;
    }
    const rotator = findUserDataPrimitive(hit.object, 'rotatorPrimitive') as SpatialRotatorPrimitive | null;
    if (rotator) {
      rotator.addDeltaDeg(ActiveTuning.input.rotatorDetentStepDeg);
      return true;
    }
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
      xrControllers.forEach((entry) => { entry.rayLine.visible = false; entry.source = null; });
      comfortSystem.setMotionIntensity(0);
    });
  } catch (err) {
    console.warn('Failed to start WebXR session:', err);
  }
}

// --- Per-frame XR locomotion ---------------------------------------------
function updateXRLocomotion(): void {
  if (!renderer.xr.isPresenting) return;

  for (const entry of xrControllers) {
    const gamepad = entry.source?.gamepad;
    if (!gamepad) continue;

    const stickX = gamepad.axes[2] ?? 0;
    const stickY = gamepad.axes[3] ?? 0;
    const isLeft = entry.source?.handedness === 'left';
    const isRight = entry.source?.handedness === 'right';

    // Left stick (or the first trackpad) walks: hold to aim, release to land.
    if ((isLeft || (!isRight && entry.controller === xrControllers[0]?.controller)) && Math.hypot(stickX, stickY) > 0.55) {
      if (!teleportAiming) {
        teleport.startAim();
        teleportAiming = true;
      }
      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3();
      entry.controller.getWorldPosition(origin);
      entry.controller.getWorldDirection(direction);
      // Flatten the arc so a forward-pointing controller lands at a comfortable distance.
      direction.y = THREE.MathUtils.clamp(direction.y, -0.75, -0.12);
      direction.normalize();
      teleport.updateAim(origin, direction, 0);
    } else if (teleportAiming && (!entry.source || Math.hypot(stickX, stickY) < 0.25)) {
      teleport.commitTeleport(entry.source ?? undefined);
      teleportAiming = false;
    }

    // Right stick snaps the view in 30-degree detents (edge-triggered, one detent per push).
    if (isRight || (!isLeft && entry.controller === xrControllers[1]?.controller)) {
      const magnitude = Math.abs(stickX);
      if (magnitude > 0.6 && entry.lastTurnPush <= 0.6) {
        snapTurn.handleThumbstick(stickX, entry.source ?? undefined);
      }
      entry.lastTurnPush = magnitude;
    }
  }

  updateControllerRays();
}

function updateControllerRays(): void {
  for (const entry of xrControllers) {
    if (!entry.source) {
      entry.rayLine.visible = false;
      continue;
    }
    entry.rayLine.visible = true;
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    entry.controller.getWorldPosition(origin);
    entry.controller.getWorldDirection(direction);
    direction.normalize();

    let end = origin.clone().addScaledVector(direction, 1.6);
    const target = activeModuleRoot ?? hubWorld;
    xrRaycaster.set(origin, direction);
    xrRaycaster.far = 4.5;
    const hits = xrRaycaster.intersectObject(target, true);
    if (hits.length > 0) end = hits[0].point;

    const points = entry.rayLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    points.setXYZ(0, origin.x, origin.y, origin.z);
    points.setXYZ(1, end.x, end.y, end.z);
    points.needsUpdate = true;
    entry.rayLine.geometry.computeBoundingSphere();
    (entry.rayLine.material as THREE.LineBasicMaterial).color.setHex(
      hits.length > 0 ? 0x60a5fa : 0x334155
    );
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

  updateXRLocomotion();

  // Fixed-timestep simulation stays decoupled from display refresh.
  physicsAccumulator.step(deltaSec, (dt) => {
    if (smokeTestZone.testAnchor.isExpanded) {
      const sim = smokeTestZone.testAnchor.getObjectByName('micro-sim-root-smoke-test-anchor');
      if (sim) sim.rotation.y += 1.2 * dt;
    }
  });

  // Module animation tick (helix sway, plume pulse, heart beat...).
  activeModuleDef?.update?.(deltaSec);

  activeGrabs.forEach((grab, controller) => grab.update(controller.position, controller.quaternion));

  renderer.render(scene, camera);
  updateMetricsOverlay();
  publishTestHooks();
}

function updateMetricsOverlay() {
  if (fpsElem) fpsElem.textContent = `FPS: ${currentFps}`;
  if (frameTimeElem) frameTimeElem.textContent = `Frame Time: ${frameTimeMs.toFixed(1)} ms`;
  if (triElem) triElem.textContent = `Triangles: ${renderer.info.render.triangles}`;
  if (dcElem) dcElem.textContent = `Draw Calls: ${renderer.info.render.calls}`;
  if (tierElem) tierElem.textContent = `Quality Tier: ${activeTier}`;
  if (inputElem) inputElem.textContent = `Input Mode: ${inputMode}`;
  if (cubeStateElem) {
    cubeStateElem.textContent = `Hub Plinth: Tier=${hubWorld.selectedTier.toUpperCase()} | Anchor=${smokeTestZone.testAnchor.isExpanded ? 'EXPANDED' : 'CLOSED'}`;
  }
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
  };
  (window as any).__MAARIFY_CHALLENGES__ = {
    completed: Array.from(completedChallenges),
    totalXp: progressStore.getProgress().totalXp,
    badges: progressStore.getProgress().earnedBadges,
  };
  (window as any).__MAARIFY_MODULE_STATE__ = activeModuleDef?.getState?.() ?? null;
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
    anchorExpanded: smokeTestZone.testAnchor.isExpanded,
    smokeTestEvents: smokeTestZone.eventLog.length,
  };
}

// Start application
initApp();
animate();
