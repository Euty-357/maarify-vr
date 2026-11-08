import * as THREE from 'three';
import { FixedTimestepAccumulator } from './core/physics/fixed-timestep';

// App state
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let cube: THREE.Mesh;
let isGrabbed = false;
let inputMode = 'Desktop Fallback';
let activeTier = 'Tier A (Quest 2 Baseline)';

// Fixed timestep accumulator for deterministic physics
const physicsAccumulator = new FixedTimestepAccumulator(120);

// Metrics
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

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d13);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.4, 1.5);

  // Lighting (Simple directional + ambient - no heavy realtime shadow maps)
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
  dirLight.position.set(2, 4, 3);
  scene.add(dirLight);

  // Floor grid for spatial orientation
  const grid = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
  grid.position.y = 0;
  scene.add(grid);

  // Hello-Cube (Grabbable WebXR spatial element)
  const cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.2,
    roughness: 0.4,
    wireframe: false,
  });
  cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(0, 1.3, -0.8);
  cube.name = 'grabbable-hello-cube';
  scene.add(cube);

  // Contact shadow disk beneath cube
  const shadowGeo = new THREE.RingGeometry(0.01, 0.25, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.4,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.005, -0.8);
  scene.add(shadowMesh);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  const container = document.getElementById('canvas-container');
  if (container) {
    container.appendChild(renderer.domElement);
  }

  // Setup desktop pointer fallback interaction
  setupDesktopInteraction();

  // Setup WebXR Controllers & Session
  setupWebXR();

  window.addEventListener('resize', onWindowResize);
}

function setupDesktopInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('pointerdown', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);

    if (intersects.length > 0) {
      isGrabbed = !isGrabbed;
      const mat = cube.material as THREE.MeshStandardMaterial;
      mat.color.setHex(isGrabbed ? 0x10b981 : 0x3b82f6); // Green on grab, blue on release
    }
  });
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

  // Setup Controller 0 and 1
  const controller0 = renderer.xr.getController(0);
  controller0.addEventListener('selectstart', () => onControllerSelect(controller0));
  controller0.addEventListener('selectend', () => onControllerRelease(controller0));
  scene.add(controller0);

  const controller1 = renderer.xr.getController(1);
  controller1.addEventListener('selectstart', () => onControllerSelect(controller1));
  controller1.addEventListener('selectend', () => onControllerRelease(controller1));
  scene.add(controller1);
}

function onControllerSelect(controller: THREE.XRTargetRaySpace) {
  inputMode = 'Touch Plus Controller / Hand';
  const pos = controller.position;
  // If close enough to cube, grab
  if (pos.distanceTo(cube.position) < 0.6) {
    isGrabbed = true;
    const mat = cube.material as THREE.MeshStandardMaterial;
    mat.color.setHex(0x10b981);
  }
}

function onControllerRelease(_controller: THREE.XRTargetRaySpace) {
  if (isGrabbed) {
    isGrabbed = false;
    const mat = cube.material as THREE.MeshStandardMaterial;
    mat.color.setHex(0x3b82f6);
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

      // Check supported frame rates
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

  // Deterministic physics step decoupled from render frame rate
  physicsAccumulator.step(deltaSec, (dt) => {
    if (!isGrabbed) {
      cube.rotation.x += 0.5 * dt;
      cube.rotation.y += 0.8 * dt;
    }
  });

  // Render scene
  renderer.render(scene, camera);

  // Update dev overlay metrics
  updateMetricsOverlay();

  // Expose camera manipulation helper for Playwright multi-pose testing
  (window as any).__MAARIFY_SET_CAMERA__ = (pos: [number, number, number], rotDeg: [number, number, number]) => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(
      (rotDeg[0] * Math.PI) / 180,
      (rotDeg[1] * Math.PI) / 180,
      (rotDeg[2] * Math.PI) / 180
    );
  };

  // Expose global metrics for Playwright automated verification
  (window as any).__MAARIFY_METRICS__ = {
    fps: currentFps,
    frameTimeMs: Number(frameTimeMs.toFixed(2)),
    triangles: renderer.info.render.triangles,
    drawCalls: renderer.info.render.calls,
    isGrabbed,
    inputMode,
    activeTier,
  };
}

function updateMetricsOverlay() {
  if (fpsElem) fpsElem.textContent = `FPS: ${currentFps}`;
  if (frameTimeElem) frameTimeElem.textContent = `Frame Time: ${frameTimeMs.toFixed(1)} ms`;
  if (triElem) triElem.textContent = `Triangles: ${renderer.info.render.triangles}`;
  if (dcElem) dcElem.textContent = `Draw Calls: ${renderer.info.render.calls}`;
  if (tierElem) tierElem.textContent = `Quality Tier: ${activeTier}`;
  if (inputElem) inputElem.textContent = `Input Mode: ${inputMode}`;
  if (cubeStateElem) cubeStateElem.textContent = `Cube State: ${isGrabbed ? 'Grabbed (Green)' : 'Resting (Blue)'}`;
}

// Start application
initScene();
animate();
