import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';
import { createStarPointMaterial } from '../../core/design/star-sprite.js';
import { EXOPLANET_CATALOG, createExoplanetDisplay } from './exoplanets.js';
import { getSpatialAnchors } from './anchors.js';
import { buildBlackHoleShader } from './black-hole-shader.js';
import { buildQuasarExhibit } from './quasar.js';
import { addPlanetaryMoons } from './moons.js';
import {
  SpatialScalePinchPrimitive,
  SpatialAnchorPrimitive,
  SpatialRotatorPrimitive,
  SpatialSliderPrimitive,
} from '../../core/input/primitives/index.js';
import { createTextPanel, setTextPanelText } from '../../core/ui/text-panel.js';

export interface CosmosSceneComponents {
  root: THREE.Group;
  starfield: THREE.Points;
  solarSystemRoot: THREE.Group;
  blackHoleRoot: THREE.Group;
  exoplanetDisplays: THREE.Group[];
  anchorPrimitive: SpatialAnchorPrimitive;
  scalePinchPrimitive: SpatialScalePinchPrimitive;
  transitRotator: SpatialRotatorPrimitive;
  marsThrustSlider: SpatialSliderPrimitive;
  navConsole: THREE.Group;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/** Dispatch a warp event (works in browser and is ignored in Node/Vitest). */
function warpTo(id: string, x: number, z: number, mode: 'real-light-speed' | 'cinematic-warp'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maarify:warp-to', { detail: { id, x, z, mode } }));
  }
}

/** Brass lectern-style navigation console with destination buttons. */
function buildNavigationConsole(root: THREE.Group): THREE.Group {
  const console_ = new THREE.Group();
  console_.name = 'navigation-console';
  // Positioned comfortably to the right-front of player spawn, facing inward
  console_.position.set(1.4, 0, -1.0);
  console_.rotation.y = -Math.PI / 4;

  // Console body — brass-topped lectern
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.44, 0.78, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.55, roughness: 0.42 }),
  );
  body.position.y = 0.39;
  console_.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.03, 20),
    new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.72, roughness: 0.28 }),
  );
  top.position.y = 0.795;
  console_.add(top);

  // Mini orrery on top — small sun + orbital ring
  const miniSun = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
  );
  miniSun.position.y = 0.86;
  console_.add(miniSun);
  const miniOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.004, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xb08d57, transparent: true, opacity: 0.7 }),
  );
  miniOrbit.rotation.x = Math.PI / 2;
  miniOrbit.position.y = 0.86;
  console_.add(miniOrbit);

  // Destination buttons — 4 labelled pads on the console surface
  const destinations: { label: string; color: number; id: string; x: number; z: number; mode: 'real-light-speed' | 'cinematic-warp' }[] = [
    { label: 'Black Hole\nSgr A*', color: 0x38bdf8, id: 'sagittarius-a-star', x: -40, z: -58, mode: 'cinematic-warp' },
    { label: 'TRAPPIST-1\nSystem', color: 0xa78bfa, id: 'trappist-1', x: 0, z: -20, mode: 'cinematic-warp' },
    { label: 'Exoplanet\nGallery', color: 0x34d399, id: 'exoplanet-gallery', x: 0, z: 12, mode: 'cinematic-warp' },
    { label: 'Proxima Centauri\nα Cen system', color: 0xfcd34d, id: 'alpha-centauri', x: 0, z: -30, mode: 'cinematic-warp' },
  ];

  destinations.forEach((dest, i) => {
    const angle = (-0.75 + i * 0.5) * Math.PI * 0.42;
    const bx = Math.sin(angle) * 0.26;
    const bz = -Math.abs(Math.cos(angle)) * 0.18;

    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: dest.color, emissive: dest.color, emissiveIntensity: 0.65, metalness: 0.5 }),
    );
    button.position.set(bx, 0.825, bz);
    button.userData.activate = () => warpTo(dest.id, dest.x, dest.z, dest.mode);
    console_.add(button);

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 200);
        ctx.strokeStyle = `#${dest.color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, 500, 188);
        ctx.fillStyle = `#${dest.color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 36px sans-serif';
        const lines = dest.label.split('\n');
        lines.forEach((line, li) => ctx.fillText(line, 24, 64 + li * 46));
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(dest.mode === 'cinematic-warp' ? 'CINEMATIC WARP' : 'REAL LIGHT SPEED', 24, 168);
      }
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.26, 0.10),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide }),
      );
      label.position.set(bx, 0.88, bz + 0.02);
      label.lookAt(0, 0.88, 2);
      console_.add(label);
    }
  });

  // Return-home button on console
  const homeBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6, metalness: 0.5 }),
  );
  homeBtn.position.set(0, 0.825, 0.26);
  homeBtn.userData.activate = () => warpTo('solar-system', 0, 0, 'cinematic-warp');
  console_.add(homeBtn);

  const homeLabel = createTextPanel('RETURN TO SOLAR SYSTEM', {
    widthMeters: 0.44, heightMeters: 0.08, fontSizePx: 22, align: 'center',
    background: '#1e293b', color: '#fca5a5', accent: '#ef4444',
  });
  homeLabel.position.set(0, 0.93, 0.26);
  homeLabel.lookAt(0, 0.93, 2);
  console_.add(homeLabel);

  // 11.7 — Static light-speed travel time readout below console
  const speedReadout = createTextPanel(
    'At the speed of light:\nBlack Hole: 26,000 years\nTRAPPIST-1: 40.7 years\nProxima Cen: 4.2 years\n\nCINEMATIC WARP = fiction label',
    {
      widthMeters: 0.58, heightMeters: 0.26, fontSizePx: 17, align: 'left',
      background: '#0f172a', color: '#94a3b8', accent: '#38bdf8', lines: 6,
      pixelWidth: 512, pixelHeight: 240,
    },
  );
  speedReadout.position.set(0, 0.1, 0.5);
  speedReadout.lookAt(0, 0.1, 2);
  console_.add(speedReadout);

  root.add(console_);
  return console_;
}

/** Black hole physics lab — Schwarzschild radius calculator + time dilation demo. */
function buildBlackHolePhysicsLab(bhRoot: THREE.Group): {
  massSlider: SpatialSliderPrimitive;
  updateLab: (dt: number) => void;
} {
  const lab = new THREE.Group();
  lab.name = 'bh-physics-lab';
  lab.position.set(3.5, 0, 2.0);

  // Bench at ground level (y=0 inside lab group)
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.74, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.55, roughness: 0.4 }),
  );
  bench.position.y = 0.37;
  lab.add(bench);

  const benchTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.025, 0.67),
    new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.3, roughness: 0.5 }),
  );
  benchTop.position.y = 0.755;
  lab.add(benchTop);

  // Mass slider handle
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.4, metalness: 0.7 }),
  );
  sliderHandle.position.set(-0.52, 0.82, -0.14);
  const massSlider = new SpatialSliderPrimitive(sliderHandle, {
    axis: 'x', minDistance: -0.55, maxDistance: 0.55,
  });
  lab.add(sliderHandle);

  // Slider rail
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.012, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 }),
  );
  rail.position.set(0, 0.82, -0.14);
  lab.add(rail);

  // Readout panel — y=1.08 (≤1.4 m above bench top, comfortable standing reach)
  let readoutPanel: THREE.Mesh | null = null;
  if (typeof document !== 'undefined') {
    readoutPanel = createTextPanel(
      'SCHWARZSCHILD RADIUS\nrs = 2GM/c²\n\nMass: 1× Sun\nrs = 2.95 km\nISCO: 8.86 km\n\nSimplified model — not engineering grade.',
      { widthMeters: 0.72, heightMeters: 0.52, fontSizePx: 20, align: 'left', background: '#0f172a', color: '#38bdf8', accent: '#b08d57', lines: 8, pixelWidth: 640, pixelHeight: 480 },
    );
    readoutPanel.position.set(0.46, 1.08, -0.14);
    readoutPanel.lookAt(0.46, 1.08, 2);
    lab.add(readoutPanel);
  }

  // Label over slider
  const sliderLabel = createTextPanel('MASS (0.1× — 10× Solar Masses)', {
    widthMeters: 0.6, heightMeters: 0.065, fontSizePx: 18, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  sliderLabel.position.set(0, 0.92, -0.14);
  sliderLabel.lookAt(0, 0.92, 2);
  lab.add(sliderLabel);

  // Time dilation clock pair — far clock (near horizon) and near clock (distant observer)
  const clockGroup = new THREE.Group();
  clockGroup.name = 'time-dilation-clocks';
  clockGroup.position.set(-0.6, 0.78, 0.2);
  ['OBSERVER (far)', 'NEAR HORIZON'].forEach((lbl, i) => {
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x334155 : 0x7f1d1d, metalness: 0.5 }),
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(i * 0.28, 0, 0);
    clockGroup.add(clockFace);
    const lp = createTextPanel(lbl, {
      widthMeters: 0.22, heightMeters: 0.055, fontSizePx: 16, align: 'center',
      background: '#0f172a', color: i === 0 ? '#94a3b8' : '#fca5a5',
    });
    lp.position.set(i * 0.28, -0.1, 0);
    lp.lookAt(i * 0.28, -0.1, 1);
    clockGroup.add(lp);
  });
  lab.add(clockGroup);

  // Description plaque
  const desc = createTextPanel(
    'Black Hole Physics Lab\nMove the mass slider to change the star mass.\nWatch the Schwarzschild radius (rs) and\nInnermost Stable Circular Orbit (ISCO) update.\nNothing is shown "falling in" — an infalling\nobject appears to freeze and redden at the\nhorizon due to gravitational time dilation.',
    { widthMeters: 0.72, heightMeters: 0.38, fontSizePx: 18, align: 'left', background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 8, pixelWidth: 640, pixelHeight: 320 },
  );
  desc.position.set(0, 1.05, 0.28);
  desc.lookAt(0, 1.05, 2);
  lab.add(desc);

  bhRoot.add(lab);

  // Clock hand meshes (rotated by update) — world-space offset matches lab position
  const farHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.056, 0.004),
    new THREE.MeshBasicMaterial({ color: 0x94a3b8 }),
  );
  farHand.position.set(-0.6 + 3.5, 0.78, 2.0 + 0.2);
  bhRoot.add(farHand);
  const nearHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.056, 0.004),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5 }),
  );
  nearHand.position.set(-0.6 + 3.5 + 0.28, 0.78, 2.0 + 0.2);
  bhRoot.add(nearHand);

  let farAngle = 0;
  let nearAngle = 0;

  function updateLab(dt: number): void {
    const val = massSlider.value; // 0–1
    const massSolar = 0.1 + val * 9.9; // 0.1 to 10 solar masses
    // rs = 2GM/c² ; for 1 solar mass, rs ≈ 2.953 km
    const rskm = massSolar * 2.953;
    const iscokm = rskm * 3.0; // ISCO = 3*rs (Schwarzschild)

    // Update readout
    if (readoutPanel && typeof document !== 'undefined') {
      const text = `SCHWARZSCHILD RADIUS\nrs = 2GM/c²\n\nMass: ${massSolar.toFixed(1)}× Sun\nrs = ${rskm.toFixed(1)} km\nISCO: ${iscokm.toFixed(1)} km\n\nSimplified model — not engineering grade.`;
      setTextPanelText(readoutPanel, text);
    }

    // Time dilation factor at ISCO: sqrt(1 - rs/r_isco) = sqrt(1 - 1/3) ≈ 0.816
    // We exaggerate for visual effect: near clock runs at 30% speed vs far clock
    farAngle += dt * 0.8;
    nearAngle += dt * 0.24; // 30% of far rate — exaggerated for visibility
    farHand.rotation.z = farAngle;
    nearHand.rotation.z = nearAngle;
  }

  return { massSlider, updateLab };
}

/** TRAPPIST-1 destination zone — compact resonant 7-planet system. */
function buildTrappist1Zone(): THREE.Group {
  const zone = new THREE.Group();
  zone.name = 'trappist-1-zone';
  zone.position.set(0, 0, -20);

  // TRAPPIST-1 star — ultra-cool M8 dwarf, ruddy orange-red at eye height
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 14),
    new THREE.MeshBasicMaterial({ color: 0xff6b35 }),
  );
  star.position.y = 1.2;
  zone.add(star);

  // 7 planets — approximate orbital period ratios from Gillon et al. 2017 (Nature)
  // Periods (days): b=1.51, c=2.42, d=4.05, e=6.10, f=9.21, g=12.35, h=18.77
  // Orbital distances in scene metres (1 m = proportional spacing, not to scale)
  const planets: { name: string; period: number; dist: number; color: number; hz: boolean }[] = [
    { name: 'b', period: 1.51, dist: 0.22, color: 0xef4444, hz: false },
    { name: 'c', period: 2.42, dist: 0.30, color: 0xf97316, hz: false },
    { name: 'd', period: 4.05, dist: 0.40, color: 0xeab308, hz: true },
    { name: 'e', period: 6.10, dist: 0.50, color: 0x3b82f6, hz: true },
    { name: 'f', period: 9.21, dist: 0.62, color: 0x8b5cf6, hz: true },
    { name: 'g', period: 12.35, dist: 0.73, color: 0x94a3b8, hz: false },
    { name: 'h', period: 18.77, dist: 0.86, color: 0x64748b, hz: false },
  ];

  const orbitSpeeds: number[] = [];
  planets.forEach((p, idx) => {
    // Orbit circle at eye height
    const orbitGeo = new THREE.RingGeometry(p.dist - 0.004, p.dist + 0.004, 48);
    orbitGeo.rotateX(-Math.PI / 2);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: p.hz ? 0x10b981 : 0x334155,
      side: THREE.DoubleSide, transparent: true, opacity: p.hz ? 0.5 : 0.25,
    });
    const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
    orbitMesh.position.y = 1.2;
    zone.add(orbitMesh);

    // Planet sphere at distinct initial angle
    const angle = (idx * Math.PI * 2) / planets.length;
    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 8),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.75 }),
    );
    pMesh.name = `trappist-${p.name}`;
    pMesh.position.set(Math.cos(angle) * p.dist, 1.2, Math.sin(angle) * p.dist);
    zone.add(pMesh);

    // HZ label
    if (p.hz) {
      const lbl = createTextPanel(`TRAPPIST-1${p.name}\nHabitable Zone`, {
        widthMeters: 0.22, heightMeters: 0.07, fontSizePx: 16, align: 'center',
        background: '#0f172a', color: '#10b981',
      });
      lbl.position.set(Math.cos(angle) * p.dist, 1.28, Math.sin(angle) * p.dist);
      lbl.lookAt(0, 1.28, 2);
      zone.add(lbl);
    }

    // Angular speed ∝ 1/period (Kepler: T² ∝ a³, simplified to 1/T here)
    orbitSpeeds.push(1.0 / p.period);
  });

  // System label
  const title = createTextPanel(
    'TRAPPIST-1 System\n40.7 light-years from Earth\n7 Earth-sized planets | 3 in habitable zone\nArtist\'s conception — Gillon et al. 2017 (Nature)',
    { widthMeters: 0.85, heightMeters: 0.22, fontSizePx: 20, align: 'center', background: '#0f172a', color: '#e2e8f0', accent: '#10b981', lines: 4 },
  );
  title.position.set(0, 2.2, 0);
  title.lookAt(0, 2.2, 2);
  zone.add(title);

  // 11.8 — Return warp pad on floor
  const warpGeo = new THREE.RingGeometry(0.35, 0.55, 32);
  warpGeo.rotateX(-Math.PI / 2);
  const warpRet = new THREE.Mesh(
    warpGeo,
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  );
  warpRet.position.set(0, 0.02, 1.4);
  warpRet.name = 'trappist-return-warp';
  warpRet.userData.activate = () => warpTo('solar-system', 0, 0, 'cinematic-warp');
  zone.add(warpRet);
  const retLabel = createTextPanel('RETURN TO SOLAR SYSTEM', {
    widthMeters: 0.55, heightMeters: 0.10, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#a78bfa', accent: '#a78bfa',
  });
  retLabel.position.set(0, 0.35, 1.4);
  retLabel.lookAt(0, 0.35, 3);
  zone.add(retLabel);

  // Store orbit speed data on zone for update()
  zone.userData.orbitSpeeds = orbitSpeeds;
  zone.userData.planetNames = planets.map((p) => `trappist-${p.name}`);
  return zone;
}

/** Proxima Centauri / Alpha Centauri destination zone. */
function buildAlphaCentauriZone(): THREE.Group {
  const zone = new THREE.Group();
  zone.name = 'alpha-centauri-zone';
  zone.position.set(0, 0, -30);

  // Proxima Centauri — red dwarf at eye height
  const proxima = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  );
  proxima.name = 'proxima-centauri-star';
  proxima.position.y = 1.2;
  zone.add(proxima);

  // Orbit ring for Proxima Centauri b
  const orbitGeo = new THREE.RingGeometry(0.28, 0.285, 36);
  orbitGeo.rotateX(-Math.PI / 2);
  const orbitMesh = new THREE.Mesh(
    orbitGeo,
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
  );
  orbitMesh.position.y = 1.2;
  zone.add(orbitMesh);

  // Proxima Centauri b
  const proxB = new THREE.Mesh(
    new THREE.SphereGeometry(0.024, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.75 }),
  );
  proxB.name = 'proxima-centauri-b';
  proxB.position.set(0.28, 1.2, 0);
  zone.add(proxB);

  // Label
  const infoLabel = createTextPanel(
    'Proxima Centauri b — artist\'s conception\n4.24 light-years from Earth\nNearest known exoplanet\nIn habitable zone of its red dwarf host.',
    {
      widthMeters: 0.8, heightMeters: 0.22, fontSizePx: 20, align: 'center',
      background: '#0f172a', color: '#e2e8f0', accent: '#fcd34d', lines: 4,
    },
  );
  infoLabel.position.set(0, 2.1, 0);
  infoLabel.lookAt(0, 2.1, 2);
  zone.add(infoLabel);

  // 11.8 — Return warp pad on floor
  const warpGeo2 = new THREE.RingGeometry(0.35, 0.55, 32);
  warpGeo2.rotateX(-Math.PI / 2);
  const retWarp = new THREE.Mesh(
    warpGeo2,
    new THREE.MeshBasicMaterial({ color: 0xfcd34d, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  );
  retWarp.position.set(0, 0.02, 1.4);
  retWarp.name = 'alpha-centauri-return-warp';
  retWarp.userData.activate = () => warpTo('solar-system', 0, 0, 'cinematic-warp');
  zone.add(retWarp);

  const retLabel = createTextPanel('RETURN TO SOLAR SYSTEM', {
    widthMeters: 0.55, heightMeters: 0.10, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#fcd34d', accent: '#fcd34d',
  });
  retLabel.position.set(0, 0.35, 1.4);
  retLabel.lookAt(0, 0.35, 3);
  zone.add(retLabel);

  // Store orbit angle for animation
  zone.userData.proxBAngle = 0;

  return zone;
}

export async function buildCosmosScene(): Promise<CosmosSceneComponents> {
  const root = new THREE.Group();
  root.name = 'cosmos-module-root';

  // 1. Starfield
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
    const spectralType = Math.random();
    if (spectralType > 0.8) {
      starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0;
    } else if (spectralType > 0.4) {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.8;
    } else {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.6; starColors[i * 3 + 2] = 0.4;
    }
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  // Round, soft-edged points: a bare PointsMaterial renders squares, which made
  // the starfield read as a grid of boxes.
  const starMat = createStarPointMaterial(0xffffff, 0.18, true);
  const starfield = new THREE.Points(starGeo, starMat);
  root.add(starfield);

  // 2. Kenyan Coast & Malindi Launch Horizon
  const coastGroup = new THREE.Group();
  coastGroup.name = 'malindi-coast-zone';
  const ocean = new THREE.Mesh(
    new THREE.CircleGeometry(12, 32),
    new THREE.MeshStandardMaterial({ color: 0x071e3d, roughness: 0.2, metalness: 0.6 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.05;
  coastGroup.add(ocean);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }),
  );
  platform.position.set(-6, 0.1, -8);
  coastGroup.add(platform);

  root.add(coastGroup);

  // 3. Atmospheric Layers
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
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: layer.color, side: THREE.DoubleSide, transparent: true, opacity: layer.opacity * 2.5,
    }));
    ring.position.y = layer.height;
    ring.name = `layer-${layer.name}`;
    atmoGroup.add(ring);
  });
  root.add(atmoGroup);

  // 4. LEO Satellites
  const leoGroup = new THREE.Group();
  leoGroup.name = 'leo-satellites-zone';
  leoGroup.position.set(0, 2.0, -2.5);
  const issGroup = new THREE.Group();
  issGroup.name = 'iss-satellite';
  issGroup.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }),
  ));
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
  for (const x of [-0.35, 0.35]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.2), solarMat);
    panel.position.set(x, 0, 0);
    issGroup.add(panel);
  }
  const issModule = new THREE.Mesh(
    (() => { const g = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12); g.rotateZ(Math.PI / 2); return g; })(),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 }),
  );
  issGroup.add(issModule);
  leoGroup.add(issGroup);

  const taifaGroup = new THREE.Group();
  taifaGroup.name = 'taifa-1-cubesat';
  taifaGroup.position.set(-0.6, 0.3, 0.2);
  taifaGroup.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 }),
  ));
  leoGroup.add(taifaGroup);
  root.add(leoGroup);

  // 5. Scalable Solar System — positioned in front of player at z = -3.5 (never inside player spawn)
  const solarSystemRoot = new THREE.Group();
  solarSystemRoot.name = 'solar-system-scalable-root';
  solarSystemRoot.position.set(0, 1.3, -3.5);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
  sun.name = 'sun';
  solarSystemRoot.add(sun);

  // 11.4 — Sun diegetic label
  if (typeof document !== 'undefined') {
    const sunLabel = createTextPanel(
      'The Sun\n1 million Earths would fit inside the Sun.\nCore temperature: 15.7 million K\nFuses 620 million tonnes of hydrogen per second.\nSimplified model — NASA NSSDCA Fact Sheet.',
      {
        widthMeters: 0.6, heightMeters: 0.24, fontSizePx: 18, align: 'center',
        background: '#1c0a00', color: '#fef3c7', accent: '#f59e0b', lines: 5,
      },
    );
    sunLabel.position.set(0, 0.42, 0);
    sunLabel.lookAt(0, 0.42, 1);
    sun.add(sunLabel);
  }

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

  // 11.3 — Collect moon updaters
  const moonUpdaters: ((dt: number) => void)[] = [];

  planetsData.forEach((p, idx) => {
    const orbitGeo = new THREE.RingGeometry(p.dist - 0.006, p.dist + 0.006, 48);
    orbitGeo.rotateX(-Math.PI / 2);
    solarSystemRoot.add(new THREE.Mesh(orbitGeo, new THREE.MeshBasicMaterial({
      color: 0x475569, side: THREE.DoubleSide, transparent: true, opacity: 0.35,
    })));

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.size, 16, 16),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.7 }),
    );
    // Distinct initial angle for each planet so they don't appear collided in a line
    const initialAngle = (idx * (Math.PI * 2 / planetsData.length)) + 0.4;
    pMesh.position.set(Math.cos(initialAngle) * p.dist, 0, Math.sin(initialAngle) * p.dist);
    pMesh.name = `planet-${p.name.toLowerCase()}`;
    if ((p as { hasRing?: boolean }).hasRing) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(p.size * 1.4, p.size * 2.2, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
      );
      ring.rotateX(Math.PI / 3);
      pMesh.add(ring);
    }
    solarSystemRoot.add(pMesh);

    // 11.3 — Wire moons
    const moonUpdater = addPlanetaryMoons(pMesh, `planet-${p.name.toLowerCase()}`);
    moonUpdaters.push(moonUpdater);
  });

  if (typeof document !== 'undefined') {
    const scaleLabelCanvas = document.createElement('canvas');
    scaleLabelCanvas.width = 512; scaleLabelCanvas.height = 128;
    const ctx = scaleLabelCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.roundRect?.(4, 4, 504, 120, 12);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Scale: 1 m ≈ 20 million km (1 : 20 billion)', 20, 42);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Planet sizes ×10 for visibility. Time-accelerated Keplerian orbits.', 20, 76);
    ctx.fillText('Simplified model — not engineering grade.', 20, 108);
    const scaleLabelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(scaleLabelCanvas), transparent: true }),
    );
    scaleLabelPlane.position.set(0, 0.5, 0.3);
    solarSystemRoot.add(scaleLabelPlane);
  }
  root.add(solarSystemRoot);

  const scalePinchPrimitive = new SpatialScalePinchPrimitive(solarSystemRoot, { minScale: 0.3, maxScale: 4.0 });

  // 6. Exoplanet gallery zone (behind user, z=+12)
  const exoplanetDisplays: THREE.Group[] = [];
  const exoZone = new THREE.Group();
  exoZone.name = 'exoplanets-zone';
  exoZone.position.set(0, 1.2, 12.0);
  EXOPLANET_CATALOG.forEach((planet, idx) => {
    const pod = createExoplanetDisplay(planet);
    const angle = (idx / EXOPLANET_CATALOG.length) * Math.PI - Math.PI / 2;
    pod.position.set(Math.cos(angle) * 2.8, 0, Math.sin(angle) * 1.5);
    pod.lookAt(0, 1.2, 0);
    pod.userData.billboard = true;
    exoplanetDisplays.push(pod);
    exoZone.add(pod);
  });
  // 11.8 — Return warp from exo gallery
  const exoRetWarp = new THREE.Mesh(
    (() => { const g = new THREE.RingGeometry(0.35, 0.55, 32); g.rotateX(-Math.PI / 2); return g; })(),
    new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  );
  exoRetWarp.position.set(0, 0.02, 1.4);
  exoRetWarp.name = 'exo-return-warp';
  exoRetWarp.userData.activate = () => warpTo('solar-system', 0, 0, 'cinematic-warp');
  exoZone.add(exoRetWarp);
  const exoRetLabel = createTextPanel('RETURN TO SOLAR SYSTEM', {
    widthMeters: 0.55, heightMeters: 0.10, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#34d399', accent: '#34d399',
  });
  exoRetLabel.position.set(0, 0.35, 1.4);
  exoRetLabel.lookAt(0, 0.35, 3);
  exoZone.add(exoRetLabel);
  root.add(exoZone);

  // 7. TRAPPIST-1 zone (always visible in distance)
  const trappistZone = buildTrappist1Zone();
  trappistZone.visible = true;
  root.add(trappistZone);

  // 11.5 — Alpha Centauri zone (always visible in distance)
  const alphaCentauriZone = buildAlphaCentauriZone();
  alphaCentauriZone.visible = true;
  root.add(alphaCentauriZone);

  // 8. Black hole zone (ground-level root at -40, 0, -60)
  const blackHoleRoot = new THREE.Group();
  blackHoleRoot.name = 'sagittarius-a-black-hole';
  blackHoleRoot.position.set(-40, 0, -60);

  const { group: bhShaderGroup, update: updateBlackHole } = buildBlackHoleShader({ rs: 0.35 });
  bhShaderGroup.position.set(0, 1.5, 0);
  blackHoleRoot.add(bhShaderGroup);

  // Black hole physics lab
  const { updateLab: updatePhysicsLab } = buildBlackHolePhysicsLab(blackHoleRoot);

  // Safety + honesty label at black hole
  const bhLabel = createTextPanel(
    'Sagittarius A* — 4 million solar masses, 26,000 ly from Earth\nShadow + photon ring + Doppler beaming: simplified 2D screen approximation.\nTrue Kerr metric ray-tracing NOT reproduced. Simplified model.',
    { widthMeters: 1.2, heightMeters: 0.22, fontSizePx: 20, align: 'center', background: '#0f172a', color: '#94a3b8', accent: '#38bdf8', lines: 3 },
  );
  bhLabel.position.set(0, 2.7, 0);
  bhLabel.lookAt(0, 2.7, 2);
  blackHoleRoot.add(bhLabel);

  // 11.8 — Return warp pad on floor in black hole zone
  const bhRetWarpGeo = new THREE.RingGeometry(0.35, 0.55, 32);
  bhRetWarpGeo.rotateX(-Math.PI / 2);
  const bhRetWarp = new THREE.Mesh(
    bhRetWarpGeo,
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  );
  bhRetWarp.position.set(0, 0.02, 2.5);
  bhRetWarp.name = 'bh-return-warp';
  bhRetWarp.userData.activate = () => warpTo('solar-system', 0, 0, 'cinematic-warp');
  blackHoleRoot.add(bhRetWarp);
  const bhRetLabel = createTextPanel('RETURN TO SOLAR SYSTEM', {
    widthMeters: 0.55, heightMeters: 0.10, fontSizePx: 22, align: 'center',
    background: '#0f172a', color: '#38bdf8', accent: '#38bdf8',
  });
  bhRetLabel.position.set(0, 0.35, 2.5);
  bhRetLabel.lookAt(0, 0.35, 4);
  blackHoleRoot.add(bhRetLabel);

  // Quasar exhibit — offset so it doesn't overlap the black hole shader
  const quasarGroup = buildQuasarExhibit();
  quasarGroup.position.set(5, 1.5, 2);
  blackHoleRoot.add(quasarGroup);

  root.add(blackHoleRoot);
  blackHoleRoot.visible = true;

  // 9. Navigation console (diegetic star-map lectern)
  const navConsole = buildNavigationConsole(root);

  // Console travels with player when warping to distant star systems
  const onWarp = (e: Event) => {
    const detail = (e as CustomEvent<{ x: number; z: number }>).detail;
    if (detail) {
      navConsole.position.set(detail.x + 1.4, 0, detail.z - 1.0);
      navConsole.rotation.y = -Math.PI / 4;
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('maarify:warp-to', onWarp);
  }

  // 10. Anchors
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'cosmos-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  getSpatialAnchors().forEach((def) => anchorPrimitive.registerAnchor(def, 'foundation'));
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // 11. Interaction primitives for challenges
  const rotatorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 }),
  );
  rotatorMesh.position.set(0.6, 0.85, -0.7);
  const transitRotator = new SpatialRotatorPrimitive(rotatorMesh, { detentStepDeg: 15 });
  root.add(rotatorMesh);

  const sliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  sliderTrack.position.set(-0.6, 0.85, -0.7);
  root.add(sliderTrack);
  const sliderHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 }),
  );
  sliderHandle.name = 'cosmos-thrust-slider';
  sliderHandle.position.set(-0.6, 0.88, -0.7);
  root.add(sliderHandle);
  const marsThrustSlider = new SpatialSliderPrimitive(sliderHandle, { axis: 'z', minDistance: -0.85, maxDistance: -0.55 });

  // Animation tick
  function update(deltaSeconds: number): void {
    // Revolve planets
    planetsData.forEach((p, i) => {
      const mesh = solarSystemRoot.getObjectByName(`planet-${p.name.toLowerCase()}`);
      if (mesh) {
        const speed = (0.5 / (i + 1)) * deltaSeconds;
        mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), speed);
      }
    });

    // 11.3 — Tick moon updaters
    for (const upd of moonUpdaters) {
      upd(deltaSeconds);
    }

    // Revolve TRAPPIST-1 planets
    const orbitSpeeds = trappistZone.userData.orbitSpeeds as number[] | undefined;
    const planetNames = trappistZone.userData.planetNames as string[] | undefined;
    if (orbitSpeeds && planetNames) {
      planetNames.forEach((name, i) => {
        const mesh = trappistZone.getObjectByName(name);
        if (mesh) mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitSpeeds[i] * deltaSeconds * 0.4);
      });
    }

    // Revolve Proxima Centauri b
    const proxB = alphaCentauriZone.getObjectByName('proxima-centauri-b');
    if (proxB) {
      proxB.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.18 * deltaSeconds);
    }

    updateBlackHole(deltaSeconds);
    updatePhysicsLab(deltaSeconds);
    issGroup.rotation.y += 0.2 * deltaSeconds;
  }

  function dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('maarify:warp-to', onWarp);
    }
    anchorPrimitive.dispose();
    starGeo.dispose();
    starMat.dispose();
  }

  return {
    root, starfield, solarSystemRoot, blackHoleRoot, exoplanetDisplays,
    anchorPrimitive, scalePinchPrimitive, transitRotator, marsThrustSlider,
    navConsole,
    update, dispose,
  };
}

/*
 * COSMOS BUDGET ESTIMATE (NOT measured on device):
 * Solar system: ~3,000 tris, ~25 draw calls
 * Moons: ~500 tris, ~10 draw calls
 * Starfield: 1 draw call (Points)
 * Black hole shader: 2 tris, 1 draw call
 * Quasar: ~750 tris, ~4 draw calls
 * Nav console: ~400 tris, ~6 draw calls
 * TRAPPIST-1 zone: ~300 tris, ~8 draw calls
 * Total estimate: ~5,000 tris / ~56 draw calls — well under 150k/108 working target.
 * NOT measured on device.
 */
