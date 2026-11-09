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

// Core State
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let soundManager: SpatialAudioManager;
export let comfortSystem: ComfortSystem;
let hubWorld: HubWorld;
let smokeTestZone: SmokeTestZone;
let tuningPanel: RuntimeTuningPanel;
let activeModuleDef: ModuleDefinition | null = null;
let activeModuleRoot: THREE.Object3D | null = null;
let currentModuleName = 'hub';
const progressStore = new InMemoryProgressStore();
const physicsAccumulator = new FixedTimestepAccumulator(120);

// Interaction & Metrics
let inputMode = 'Desktop (using Tier A budgets)';
let activeTier = 'Tier A (Quest 2 Baseline)';
let lastTime = performance.now();
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;
let frameTimeMs = 0;

// UI Overlay Elements
const fpsElem = document.getElementById('metric-fps');
const frameTimeElem = document.getElementById('metric-frame-time');
const triElem = document.getElementById('metric-triangles');
const dcElem = document.getElementById('metric-draw-calls');
const tierElem = document.getElementById('metric-tier');
const inputElem = document.getElementById('metric-input');
const cubeStateElem = document.getElementById('metric-cube-state');
const enterXrBtn = document.getElementById('enter-xr-btn');

function initApp() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d13);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.4, 0.8);
  camera.lookAt(0, 1.1, -1.2);

  // Lighting: High-clarity ambient + key + fill + rim lights (no runtime shadow passes)
  const ambient = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(3, 6, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.6);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  // Initialize Core Subsystems
  soundManager = new SpatialAudioManager(camera);
  comfortSystem = new ComfortSystem(camera);

  // Initialize Hub World with 7 Physical Portals
  hubWorld = new HubWorld();
  scene.add(hubWorld);

  // Initialize Hub Device Smoke-Test Zone
  smokeTestZone = new SmokeTestZone(soundManager);
  scene.add(smokeTestZone);

  // Initialize Runtime Tuning Panel
  tuningPanel = new RuntimeTuningPanel(camera);
  scene.add(tuningPanel.panelGroup);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  const container = document.getElementById('canvas-container');
  if (container) {
    container.appendChild(renderer.domElement);
  }

  // Check URL query for direct module launch (e.g. ?module=cosmos)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const modParam = params.get('module');
    if (modParam) {
      loadModule(modParam);
    }
  }

  // Setup desktop interaction fallback
  setupDesktopInteraction();

  // Setup WebXR & Touch Plus controllers
  setupWebXR();

  window.addEventListener('resize', onWindowResize);
}

export async function loadModule(id: string): Promise<THREE.Object3D | null> {
  if (activeModuleDef) {
    activeModuleDef.unload();
  }

  if (id === 'cosmos') {
    const mod = (await import('./modules/cosmos/index')).default;
    hubWorld.visible = false;
    smokeTestZone.visible = false;
    activeModuleDef = mod;
    activeModuleRoot = await mod.load(scene);
    currentModuleName = id;
    return activeModuleRoot;
  } else if (id === 'quantum') {
    const mod = (await import('./modules/quantum/index')).default;
    hubWorld.visible = false;
    smokeTestZone.visible = false;
    activeModuleDef = mod;
    activeModuleRoot = await mod.load(scene);
    currentModuleName = id;
    return activeModuleRoot;
  } else if (id === 'human-body') {
    const mod = (await import('./modules/human-body/index')).default;
    hubWorld.visible = false;
    smokeTestZone.visible = false;
    activeModuleDef = mod;
    activeModuleRoot = await mod.load(scene);
    currentModuleName = id;
    return activeModuleRoot;
  } else if (id === 'aerospace') {
    const mod = (await import('./modules/aerospace/index')).default;
    hubWorld.visible = false;
    smokeTestZone.visible = false;
    activeModuleDef = mod;
    activeModuleRoot = await mod.load(scene);
    currentModuleName = id;
    return activeModuleRoot;
  }
  return null;
}

function setupDesktopInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('pointerdown', (e) => {
    soundManager.initContext();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const anchor = findDiegeticAnchor(hit);

      // 1. Chime Sphere Poke
      if (anchor) {
        anchor.toggleExpansion();
      } else if (hit === smokeTestZone.chimeSphere) {
        smokeTestZone.pokeChime();
      }
      // 2. Calibration Cube Grab Toggle
      else if (hit === smokeTestZone.grabBlock) {
        smokeTestZone.grabCalibrationBlock();
        setTimeout(() => smokeTestZone.releaseCalibrationBlock(), 400);
      }
      // 3. Spatial Anchor Toggle
      else if (hit.name.includes('anchor-tag-smoke-test-anchor')) {
        smokeTestZone.testAnchor.toggleExpansion();
      }
      // 4. Depth Tier Buttons
      else if (hit.name.startsWith('tier-btn-')) {
        const tier = hit.name.replace('tier-btn-', '') as 'foundation' | 'advanced' | 'expert';
        hubWorld.setTier(tier);
        progressStore.setDepthTier(tier);
      }
      // 5. Hub Portal Click
      else if (hit.name.includes('cosmos') || hit.parent?.name.includes('cosmos')) {
        loadModule('cosmos');
      } else if (hit.name.includes('quantum') || hit.parent?.name.includes('quantum')) {
        loadModule('quantum');
      } else if (hit.name.includes('human-body') || hit.parent?.name.includes('human-body')) {
        loadModule('human-body');
      } else if (hit.name.includes('aerospace') || hit.parent?.name.includes('aerospace')) {
        loadModule('aerospace');
      }
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

function setupWebXR() {
  if ('xr' in navigator && enterXrBtn) {
    (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
      if (supported) {
        enterXrBtn.textContent = 'Enter WebXR (Quest 3)';
        enterXrBtn.addEventListener('click', onEnterVR);
      } else {
        enterXrBtn.textContent = 'WebXR Not Available (Desktop Mode)';
      }
    });
  }

  // Setup WebXR Controllers
  const c0 = renderer.xr.getController(0);
  c0.addEventListener('selectstart', () => onControllerTrigger(c0));
  scene.add(c0);

  const c1 = renderer.xr.getController(1);
  c1.addEventListener('selectstart', () => onControllerTrigger(c1));
  scene.add(c1);
}

function onControllerTrigger(controller: THREE.XRTargetRaySpace) {
  inputMode = 'Touch Plus / Optical Hand Tracking';
  soundManager.initContext();

  const pos = controller.position;
  // If close to chime sphere, poke
  if (pos.distanceTo(smokeTestZone.chimeSphere.position) < 0.3) {
    smokeTestZone.pokeChime();
  }
  // If close to grab block, grab
  else if (pos.distanceTo(smokeTestZone.grabBlock.position) < 0.3) {
    smokeTestZone.grabCalibrationBlock();
  }
  // Spatial anchor toggle
  else if (pos.distanceTo(smokeTestZone.testAnchor.position) < 0.4) {
    smokeTestZone.testAnchor.toggleExpansion();
  }
}

async function onEnterVR() {
  if ('xr' in navigator) {
    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', {
        optionalFeatures: [
          'local-floor',
          'bounded-floor',
          'hand-tracking',
          'hit-test',
        ],
      });

      await renderer.xr.setSession(session);
      inputMode = 'WebXR Immersive Session';
      activeTier = 'Tier B (Quest 3 / 3S Detected)';

      if (session.supportedFrameRates && session.updateTargetFrameRate) {
        const rates = session.supportedFrameRates;
        if (rates.includes(90)) {
          session.updateTargetFrameRate(90).catch(() => {});
        } else if (rates.includes(72)) {
          session.updateTargetFrameRate(72).catch(() => {});
        }
      }

      session.addEventListener('end', () => {
        inputMode = 'Desktop Fallback';
        activeTier = 'Tier A (Quest 2 Baseline)';
      });
    } catch (err) {
      console.warn('Failed to start WebXR session:', err);
    }
  }
}

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
  const deltaSec = (now - lastTime) / 1000;
  frameTimeMs = now - lastTime;
  lastTime = now;

  frameCount++;
  if (now - lastFpsUpdate >= 500) {
    currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
  }

  // Physics update decoupled from refresh rate
  physicsAccumulator.step(deltaSec, (dt) => {
    // Rotate micro-sim torus when expanded
    if (smokeTestZone.testAnchor.isExpanded) {
      const sim = smokeTestZone.testAnchor.getObjectByName('micro-sim-root-smoke-test-anchor');
      if (sim) {
        sim.rotation.y += 1.2 * dt;
      }
    }
  });

  // Render scene graph
  renderer.render(scene, camera);

  // Update dev overlay metrics
  updateMetricsOverlay();

  // Expose camera pose manipulation helper for Playwright matrix screenshots
  (window as any).__MAARIFY_SET_CAMERA__ = (pos: [number, number, number], rotDeg: [number, number, number]) => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(
      (rotDeg[0] * Math.PI) / 180,
      (rotDeg[1] * Math.PI) / 180,
      (rotDeg[2] * Math.PI) / 180
    );
  };

  // Global test hook for automated verification
  (window as any).__MAARIFY_LOAD_MODULE__ = loadModule;
  (window as any).__MAARIFY_AUDIT__ = {
    anchors: activeModuleDef?.getSpatialAnchors().map((anchor) => anchor.id) ?? [],
    challenges: activeModuleDef?.getChallenges().map((challenge) => ({
      id: challenge.id,
      seatedCompatible: challenge.seatedCompatible,
      xpReward: challenge.xpReward,
    })) ?? [],
  };
  (window as any).__MAARIFY_TOGGLE_ANCHOR__ = (id: string) => {
    const anchor = activeModuleRoot?.getObjectByName(`diegetic-anchor-${id}`);
    if (!(anchor instanceof DiegeticSpatialAnchor)) return false;
    anchor.toggleExpansion();
    return anchor.isExpanded;
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

// Start application
initApp();
animate();
