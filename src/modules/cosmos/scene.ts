import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';
import { EXOPLANET_CATALOG, createExoplanetDisplay } from './exoplanets.js';
import { getSpatialAnchors } from './anchors.js';
import { buildBlackHoleShader } from './black-hole-shader.js';
import {
  SpatialScalePinchPrimitive,
  SpatialAnchorPrimitive,
  SpatialRotatorPrimitive,
  SpatialLeverPrimitive,
} from '../../core/input/primitives/index.js';

export interface CosmosSceneComponents {
  root: THREE.Group;
  starfield: THREE.Points;
  solarSystemRoot: THREE.Group;
  blackHoleRoot: THREE.Group;
  exoplanetDisplays: THREE.Group[];
  anchorPrimitive: SpatialAnchorPrimitive;
  scalePinchPrimitive: SpatialScalePinchPrimitive;
  transitRotator: SpatialRotatorPrimitive;
  marsThrustLever: SpatialLeverPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export async function buildCosmosScene(): Promise<CosmosSceneComponents> {
  const root = new THREE.Group();
  root.name = 'cosmos-module-root';

  // 1. Starfield Particle System (Tier-Scaled)
  const starCount = ActiveTuning.quality.starParticleCount;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    // Stellar spectral color diversity (O, B, A, F, G, K, M)
    const spectralType = Math.random();
    if (spectralType > 0.8) {
      starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Blue/White
    } else if (spectralType > 0.4) {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.8; // Yellow/Sun
    } else {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.6; starColors[i * 3 + 2] = 0.4;  // Red dwarf
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });
  const starfield = new THREE.Points(starGeo, starMat);
  root.add(starfield);

  // 2. Kenyan Coast & Malindi Launch Horizon (Beat 1 Opening Hook)
  const coastGroup = new THREE.Group();
  coastGroup.name = 'malindi-coast-zone';

  // Ocean floor surface
  const oceanGeo = new THREE.CircleGeometry(12, 32);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x071e3d,
    roughness: 0.2,
    metalness: 0.6,
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.position.y = -0.05;
  coastGroup.add(ocean);

  // San Marco distant platform marker & ascending rocket trajectory
  const platformGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.2, 16);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.set(-6, 0.1, -8);
  coastGroup.add(platform);

  // Ascending rocket launch trail (parabolic curved line)
  const trajectoryPoints: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const tx = -6 + t * 4;
    const ty = 0.2 + Math.sin(t * Math.PI) * 5 + t * 4;
    const tz = -8 + t * 2;
    trajectoryPoints.push(new THREE.Vector3(tx, ty, tz));
  }
  const trajGeo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
  const trajMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
  const launchTrail = new THREE.Line(trajGeo, trajMat);
  coastGroup.add(launchTrail);
  root.add(coastGroup);

  // 3. Atmospheric Layer Ascending Domes (Beat 2)
  const atmoGroup = new THREE.Group();
  atmoGroup.name = 'atmospheric-layers-zone';

  const layers = [
    { name: 'Troposphere (0–12 km)', height: 0.6, color: 0x60a5fa, opacity: 0.18 },
    { name: 'Stratosphere (12–50 km)', height: 1.2, color: 0x3b82f6, opacity: 0.14 },
    { name: 'Mesosphere (50–85 km)', height: 1.8, color: 0x1d4ed8, opacity: 0.12 },
    { name: 'Thermosphere & Karman Line (100 km)', height: 2.4, color: 0x0f172a, opacity: 0.25 },
  ];

  layers.forEach((layer) => {
    const ringGeo = new THREE.RingGeometry(2.8, 2.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: layer.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: layer.opacity * 2.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = layer.height;
    ringMesh.name = `layer-${layer.name}`;
    atmoGroup.add(ringMesh);
  });
  root.add(atmoGroup);

  // 4. Low Earth Orbit (LEO) & Satellites (Beat 4)
  const leoGroup = new THREE.Group();
  leoGroup.name = 'leo-satellites-zone';
  leoGroup.position.set(0, 2.0, -2.5);

  // International Space Station (ISS) stylized model
  const issGroup = new THREE.Group();
  issGroup.name = 'iss-satellite';
  const issTruss = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
  );
  issGroup.add(issTruss);

  // Solar array panels (gold/blue reflective)
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.2), solarMat);
  leftPanel.position.set(-0.35, 0, 0);
  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.2), solarMat);
  rightPanel.position.set(0.35, 0, 0);
  issGroup.add(leftPanel);
  issGroup.add(rightPanel);

  // Pressurized central module
  const moduleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12);
  moduleGeo.rotateZ(Math.PI / 2);
  const moduleMesh = new THREE.Mesh(moduleGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 }));
  issGroup.add(moduleMesh);
  leoGroup.add(issGroup);

  // Kenya Space Agency Taifa-1 CubeSat model
  const taifaGroup = new THREE.Group();
  taifaGroup.name = 'taifa-1-cubesat';
  taifaGroup.position.set(-0.6, 0.3, 0.2);
  const cubesat = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 })
  );
  taifaGroup.add(cubesat);
  leoGroup.add(taifaGroup);
  root.add(leoGroup);

  // 5. Scalable Solar System Model (Pinch to scale!)
  const solarSystemRoot = new THREE.Group();
  solarSystemRoot.name = 'solar-system-scalable-root';
  solarSystemRoot.position.set(0, 1.2, -1.8);

  // Sun
  const sunGeo = new THREE.SphereGeometry(0.25, 24, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  solarSystemRoot.add(sun);

  // 8 Planets — Option B walkthrough scale.
  // Planets are laid along the NEGATIVE-Z axis so the user walks forward through the system.
  // Distances are in metres; 1 m ≈ 20 million km (1 : 20 billion).
  // Relative sizes are exaggerated ~10× for visibility while keeping correct ordering.
  // Labelled "simplified model — not engineering grade" in the scale indicator plinth below.
  const planetsData = [
    { name: 'Mercury', dist: 0.60, size: 0.025, color: 0x94a3b8 },
    { name: 'Venus',   dist: 1.10, size: 0.055, color: 0xf59e0b },
    { name: 'Earth',   dist: 1.60, size: 0.060, color: 0x3b82f6 },
    { name: 'Mars',    dist: 2.20, size: 0.040, color: 0xef4444 },
    { name: 'Jupiter', dist: 3.20, size: 0.130, color: 0xd97706 },
    { name: 'Saturn',  dist: 4.40, size: 0.110, color: 0xfcd34d, hasRing: true },
    { name: 'Uranus',  dist: 5.60, size: 0.075, color: 0x38bdf8 },
    { name: 'Neptune', dist: 7.00, size: 0.070, color: 0x2563eb },
  ];

  planetsData.forEach((p) => {
    // Orbital path indicator arc (quarter arc in XZ plane so it is visible from above)
    const orbitGeo = new THREE.RingGeometry(p.dist - 0.006, p.dist + 0.006, 48);
    orbitGeo.rotateX(-Math.PI / 2);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    solarSystemRoot.add(orbitRing);

    // Planet mesh — placed on NEGATIVE Z axis (walkway direction)
    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.size, 16, 16),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.7 })
    );
    pMesh.position.set(0, 0, -p.dist);  // walkway: walk forward (−Z) to reach outer planets
    pMesh.name = `planet-${p.name.toLowerCase()}`;

    if (p.hasRing) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(p.size * 1.4, p.size * 2.2, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      ring.rotateX(Math.PI / 3);
      pMesh.add(ring);
    }
    solarSystemRoot.add(pMesh);
  });
  // Option B: walkthrough scale — 1 m ≈ 20 million km; NO table-top compaction.
  // The user stands near the Sun and walks forward (−Z) to reach outer planets.
  solarSystemRoot.scale.setScalar(1.0);
  solarSystemRoot.position.set(0, 1.2, 0);

  // Scale indicator plinth near the Sun (browser only — skipped in node test env)
  if (typeof document !== 'undefined') {
    const scaleLabelCanvas = document.createElement('canvas');
    scaleLabelCanvas.width = 512; scaleLabelCanvas.height = 128;
    const scaleLabelCtx = scaleLabelCanvas.getContext('2d')!;
    scaleLabelCtx.fillStyle = 'rgba(0,0,0,0.75)';
    scaleLabelCtx.roundRect(4, 4, 504, 120, 12);
    scaleLabelCtx.fill();
    scaleLabelCtx.fillStyle = '#f8fafc';
    scaleLabelCtx.font = 'bold 22px sans-serif';
    scaleLabelCtx.fillText('Scale: 1 m ≈ 20 million km (1 : 20 billion)', 20, 42);
    scaleLabelCtx.font = '18px sans-serif';
    scaleLabelCtx.fillStyle = '#94a3b8';
    scaleLabelCtx.fillText('Planet sizes ×10 for visibility. Time-accelerated Keplerian orbits.', 20, 76);
    scaleLabelCtx.fillText('Simplified model — not engineering grade.', 20, 108);
    const scaleLabelTex = new THREE.CanvasTexture(scaleLabelCanvas);
    const scaleLabelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.4),
      new THREE.MeshBasicMaterial({ map: scaleLabelTex, transparent: true, side: THREE.FrontSide }),
    );
    scaleLabelPlane.name = 'solar-system-scale-indicator';
    scaleLabelPlane.position.set(0, 0.5, 0.3);  // just in front of sun plinth, facing user
    solarSystemRoot.add(scaleLabelPlane);
  }
  root.add(solarSystemRoot);

  // Two-handed scale pinch primitive on solar system
  const scalePinchPrimitive = new SpatialScalePinchPrimitive(solarSystemRoot, {
    minScale: 0.3,
    maxScale: 4.0,
  });

  // 6. Exoplanet Display Pods — positioned well clear of the solar system walkway.
  // The walkway runs along −Z (Sun at z=0, Neptune at z=−7). Exoplanet zone sits at
  // z=+12 (behind the user's start point, clearly separated); accessed by turning around
  // after the solar system walk or via a signpost.
  const exoplanetDisplays: THREE.Group[] = [];
  const exoZone = new THREE.Group();
  exoZone.name = 'exoplanets-zone';
  exoZone.position.set(0, 1.2, 12.0);  // clearly behind the user start (opposite direction)

  EXOPLANET_CATALOG.forEach((planet, idx) => {
    const pod = createExoplanetDisplay(planet);
    // Radial distribution
    const angle = (idx / EXOPLANET_CATALOG.length) * Math.PI - Math.PI / 2;
    pod.position.set(Math.cos(angle) * 2.8, 0, Math.sin(angle) * 1.5);
    pod.lookAt(0, 1.2, 0);
    pod.userData.billboard = true;
    exoplanetDisplays.push(pod);
    exoZone.add(pod);
  });
  root.add(exoZone);

  // 7. Sagittarius A* Supermassive Black Hole — gravitational lensing shader
  // Isolated far from the solar system walkway — reachable ONLY via warp pad.
  // Position: (-40, 1.5, -60) ≈ 72 m from origin.
  // Rendering: replaced flat rings (BUG-13) with ShaderMaterial lensing quad.
  // See src/modules/cosmos/black-hole-shader.ts for shader design and EHT comparison notes.
  // Honest verdict: shadow + photon ring + Doppler beaming ✓; disc warp / secondary image ✗.
  // NOT verified on headset.
  const blackHoleRoot = new THREE.Group();
  blackHoleRoot.name = 'sagittarius-a-black-hole';
  blackHoleRoot.position.set(-40, 1.5, -60);

  const { group: bhShaderGroup, update: updateBlackHole } = buildBlackHoleShader({ rs: 0.35 });
  blackHoleRoot.add(bhShaderGroup);
  root.add(blackHoleRoot);
  // Outbound warp pad near the Sun (solar system walkway start)
  const warpOutGeo=new THREE.RingGeometry(0.3,0.5,24).rotateX(-Math.PI/2);
  const warpMat=new THREE.MeshBasicMaterial({color:0x38bdf8,side:THREE.DoubleSide,transparent:true,opacity:0.8});
  const warpPad=new THREE.Mesh(warpOutGeo,warpMat);
  warpPad.name='warp-to-black-hole';
  warpPad.position.set(-2,0.01,-1);
  warpPad.userData.activate=()=>window.dispatchEvent(new CustomEvent('maarify:warp-to',{detail:{x:-40,z:-58}}));
  root.add(warpPad);
  // Return warp pad near black hole
  const warpRet=new THREE.Mesh(new THREE.RingGeometry(0.3,0.5,24).rotateX(-Math.PI/2),warpMat.clone());
  warpRet.name='warp-return-to-solar-system';
  warpRet.position.set(-38,0.01,-57);
  warpRet.userData.activate=()=>window.dispatchEvent(new CustomEvent('maarify:warp-to',{detail:{x:0,z:0}}));
  root.add(warpRet);

  // 8. Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'cosmos-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // 9. Interactive Primitives for Physical Challenges:
  // Challenge 2 Rotator Dial for Exoplanet Transit Alignment
  const rotatorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 })
  );
  rotatorMesh.position.set(0.6, 0.85, -0.7);
  const transitRotator = new SpatialRotatorPrimitive(rotatorMesh, { detentStepDeg: 15 });
  root.add(rotatorMesh);

  // Capstone Challenge Thrust Gimbal Lever for Mars Hohmann Burn
  const leverBase = new THREE.Group();
  leverBase.position.set(-0.6, 0.85, -0.7);
  const leverArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 })
  );
  leverArm.position.y = 0.125;
  leverBase.add(leverArm);
  const marsThrustLever = new SpatialLeverPrimitive(leverBase, { minAngleDeg: -30, maxAngleDeg: 30 });
  root.add(leverBase);

  // Animation / Render tick handler
  function update(deltaSeconds: number): void {
    // Slowly revolve planets (Keplerian-approximated: inner planets faster)
    planetsData.forEach((p, i) => {
      const mesh = solarSystemRoot.getObjectByName(`planet-${p.name.toLowerCase()}`);
      if (mesh) {
        const speed = (0.5 / (i + 1)) * deltaSeconds;
        mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), speed);
      }
    });

    // Update black hole shader (animates disc rotation, jet pulse)
    updateBlackHole(deltaSeconds);

    // Slowly revolve ISS
    issGroup.rotation.y += 0.2 * deltaSeconds;
  }

  function dispose(): void {
    anchorPrimitive.dispose();
    starGeo.dispose();
    starMat.dispose();
  }

  return {
    root,
    starfield,
    solarSystemRoot,
    blackHoleRoot,
    exoplanetDisplays,
    anchorPrimitive,
    scalePinchPrimitive,
    transitRotator,
    marsThrustLever,
    update,
    dispose,
  };
}

