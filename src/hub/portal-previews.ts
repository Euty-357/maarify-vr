/**
 * portal-previews.ts
 * Builds iconic, highly recognizable 3D representations for each module's portal opening.
 * Triangle budget: ≤ 300 per preview (Quest 3/3S working budget constraint).
 */

import * as THREE from 'three';

export interface PortalPreview {
  mesh: THREE.Group;
  update?: (dt: number) => void; // optional per-frame animation
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function basicMat(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

/** Build a greyed-out padlock silhouette for locked / coming-soon portals. */
function buildPadlock(color: number): THREE.Group {
  const g = new THREE.Group();

  // Lock body
  const bodyMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12),
    basicMat(color),
  );
  bodyMesh.position.y = -0.05;
  g.add(bodyMesh);

  // Shackle arc (half-torus on top of body)
  const shackleMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI),
    basicMat(color),
  );
  shackleMesh.rotation.z = Math.PI;
  shackleMesh.position.y = 0.1 + 0.12;
  g.add(shackleMesh);

  return g;
}

/**
 * Attempt to create a small canvas-texture "COMING SOON" label plane.
 */
function buildComingSoonLabel(): THREE.Mesh | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.11),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  plane.position.y = -0.42;
  return plane;
}

// ---------------------------------------------------------------------------
// Per-module builders
// ---------------------------------------------------------------------------

function buildCosmos(): PortalPreview {
  const g = new THREE.Group();

  // Central glowing celestial body (Sun/Exoplanet)
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12),
    basicMat(0xf59e0b),
  );
  sphere.name = 'cosmos-sphere';
  g.add(sphere);

  // Tilted planetary ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.40, 0.025, 8, 32),
    basicMat(0xfcd34d),
  );
  ring.rotation.x = Math.PI / 3;
  ring.name = 'cosmos-ring';
  g.add(ring);

  // Tiny orbiting moon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    basicMat(0x94a3b8),
  );
  moon.position.set(0.42, 0, 0);
  g.add(moon);

  let angle = 0;
  return {
    mesh: g,
    update(dt: number) {
      sphere.rotation.y += 0.008;
      angle += dt * 1.2;
      moon.position.x = Math.cos(angle) * 0.42;
      moon.position.z = Math.sin(angle) * 0.22;
      moon.position.y = Math.sin(angle) * 0.12;
    },
  };
}

function buildQuantum(): PortalPreview {
  const g = new THREE.Group();

  // Dilution Refrigerator Golden Chandelier:
  // 4 tiered brass/gold stages connected by support rods
  const goldMat = basicMat(0xf59e0b);
  const copperMat = basicMat(0xb45309);
  const cyanMat = basicMat(0x38bdf8);

  const stageRadii = [0.18, 0.14, 0.10, 0.07];
  const stageYs = [0.18, 0.06, -0.06, -0.16];

  stageRadii.forEach((r, i) => {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.015, 16),
      goldMat,
    );
    plate.position.y = stageYs[i];
    g.add(plate);

    // Support pillars between stages
    if (i < stageRadii.length - 1) {
      const nextY = stageYs[i + 1];
      const h = stageYs[i] - nextY;
      for (let j = 0; j < 3; j++) {
        const pillarAngle = (j * Math.PI * 2) / 3;
        const pr = r * 0.7;
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, h, 6),
          goldMat,
        );
        rod.position.set(
          Math.cos(pillarAngle) * pr,
          stageYs[i] - h / 2,
          Math.sin(pillarAngle) * pr
        );
        g.add(rod);
      }
    }
  });

  // Copper cooling coils in middle tier
  const coil = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 6, 16),
    copperMat,
  );
  coil.position.y = 0.0;
  coil.rotation.x = Math.PI / 2;
  g.add(coil);

  // Glowing superconducting quantum chip at the coldest bottom stage
  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.01, 0.05),
    cyanMat,
  );
  chip.position.y = -0.19;
  g.add(chip);

  let time = 0;
  return {
    mesh: g,
    update(dt: number) {
      time += dt;
      g.rotation.y += 0.006;
      chip.scale.setScalar(1.0 + Math.sin(time * 4) * 0.12);
    },
  };
}

function buildHumanBody(): PortalPreview {
  const g = new THREE.Group();

  // Recognizable anatomical heart model:
  // Main cardiac muscular body (left + right ventricles)
  const heartBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    basicMat(0xdc2626),
  );
  heartBody.scale.set(1.1, 1.25, 0.85);
  heartBody.position.set(0, -0.04, 0);
  g.add(heartBody);

  // Tapered cardiac apex pointing down-left
  const apex = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.16, 10),
    basicMat(0xb91c1c),
  );
  apex.rotation.z = Math.PI + 0.25;
  apex.position.set(-0.04, -0.18, 0);
  g.add(apex);

  // Left atrium upper lobe
  const leftAtrium = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    basicMat(0xef4444),
  );
  leftAtrium.position.set(-0.08, 0.10, 0);
  g.add(leftAtrium);

  // Right atrium upper lobe
  const rightAtrium = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    basicMat(0xb91c1c),
  );
  rightAtrium.position.set(0.08, 0.08, 0);
  g.add(rightAtrium);

  // Aorta arch: thick curved tube arching upward from top
  const aorta = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.035, 8, 16, Math.PI * 0.85),
    basicMat(0xf87171),
  );
  aorta.position.set(0.02, 0.15, 0.02);
  aorta.rotation.z = -Math.PI / 4;
  g.add(aorta);

  // Vena cava vertical tube
  const venaCava = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.14, 8),
    basicMat(0x2563eb),
  );
  venaCava.position.set(0.12, 0.15, -0.02);
  g.add(venaCava);

  let pulseTimer = 0;
  return {
    mesh: g,
    update(dt: number) {
      pulseTimer += dt * 4.5;
      // Realistic double-beat cardiac rhythm
      const beat = Math.pow(Math.sin(pulseTimer), 8) * 0.14 + Math.pow(Math.sin(pulseTimer + 0.3), 8) * 0.07;
      g.scale.set(1 + beat, 1 + beat, 1 + beat);
    },
  };
}

function buildAerospace(): PortalPreview {
  const g = new THREE.Group();

  const whiteMat = basicMat(0xf1f5f9);
  const darkMetalMat = basicMat(0x475569);
  const plumeMat = basicMat(0x38bdf8);

  // Sleek aircraft fuselage: tapered aerodynamic cylinder
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 0.44, 12),
    whiteMat,
  );
  g.add(fuselage);

  // Sharp aerodynamic nose cone
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.14, 12),
    whiteMat,
  );
  nose.position.y = 0.29;
  g.add(nose);

  // Swept delta wings
  const wingGeo = new THREE.BoxGeometry(0.52, 0.015, 0.12);
  const wings = new THREE.Mesh(wingGeo, whiteMat);
  wings.position.set(0, -0.02, 0);
  g.add(wings);

  // Vertical stabilizer (tail fin)
  const verticalTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.12, 0.09),
    whiteMat,
  );
  verticalTail.position.set(0, -0.16, 0.05);
  g.add(verticalTail);

  // Horizontal stabilizers
  const horizTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.012, 0.05),
    whiteMat,
  );
  horizTail.position.set(0, -0.19, 0);
  g.add(horizTail);

  // Rocket engine nozzle bell mounted at the base
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.055, 0.06, 12),
    darkMetalMat,
  );
  nozzle.position.y = -0.25;
  g.add(nozzle);

  // Glowing shock diamond rocket plume
  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.18, 8),
    plumeMat,
  );
  plume.rotation.x = Math.PI;
  plume.position.y = -0.37;
  g.add(plume);

  let time = 0;
  return {
    mesh: g,
    update(dt: number) {
      time += dt;
      // Gentle flight pitch & bank
      g.rotation.z = Math.sin(time * 1.5) * 0.08;
      g.rotation.x = Math.sin(time * 2.0) * 0.05;
      // Pulsing rocket plume
      plume.scale.y = 0.9 + Math.sin(time * 20) * 0.2;
    },
  };
}

function buildDnaGenetics(): PortalPreview {
  const g = new THREE.Group();

  const strandAColor = 0x3b82f6;
  const strandBColor = 0xef4444;
  const baseColor = 0xb08d57;

  const NUM_PAIRS = 8;
  const HEIGHT = 0.5;
  const RADIUS = 0.1;
  const TURNS = 1.5;

  const pointsA: THREE.Vector3[] = [];
  const pointsB: THREE.Vector3[] = [];

  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const y = (t - 0.5) * HEIGHT;
    const theta = t * Math.PI * 2 * TURNS;
    pointsA.push(new THREE.Vector3(Math.cos(theta) * RADIUS, y, Math.sin(theta) * RADIUS));
    pointsB.push(new THREE.Vector3(Math.cos(theta + Math.PI) * RADIUS, y, Math.sin(theta + Math.PI) * RADIUS));
  }

  const curveA = new THREE.CatmullRomCurve3(pointsA);
  const curveB = new THREE.CatmullRomCurve3(pointsB);

  const tubeA = new THREE.Mesh(new THREE.TubeGeometry(curveA, 20, 0.016, 6, false), basicMat(strandAColor));
  const tubeB = new THREE.Mesh(new THREE.TubeGeometry(curveB, 20, 0.016, 6, false), basicMat(strandBColor));
  g.add(tubeA);
  g.add(tubeB);

  for (let i = 0; i < NUM_PAIRS; i++) {
    const t = (i + 0.5) / NUM_PAIRS;
    const y = (t - 0.5) * HEIGHT;
    const theta = t * Math.PI * 2 * TURNS;

    const pA = new THREE.Vector3(Math.cos(theta) * RADIUS, y, Math.sin(theta) * RADIUS);
    const pB = new THREE.Vector3(Math.cos(theta + Math.PI) * RADIUS, y, Math.sin(theta + Math.PI) * RADIUS);

    const rungGeo = new THREE.CylinderGeometry(0.008, 0.008, pA.distanceTo(pB), 4);
    const rung = new THREE.Mesh(rungGeo, basicMat(baseColor));
    rung.position.copy(pA.clone().add(pB).multiplyScalar(0.5));
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pB.clone().sub(pA).normalize());
    g.add(rung);
  }

  return {
    mesh: g,
    update(_dt: number) {
      g.rotation.y += 0.01;
    },
  };
}

function buildEnvironment(): PortalPreview {
  const g = buildPadlock(0x15803d);
  const label = buildComingSoonLabel();
  if (label) g.add(label);
  return { mesh: g };
}

function buildUrbanDevelopment(): PortalPreview {
  const g = buildPadlock(0x0284c7);
  const label = buildComingSoonLabel();
  if (label) g.add(label);
  return { mesh: g };
}

export function buildPortalPreview(id: string): PortalPreview {
  switch (id) {
    case 'cosmos': return buildCosmos();
    case 'quantum': return buildQuantum();
    case 'human-body': return buildHumanBody();
    case 'aerospace': return buildAerospace();
    case 'dna-genetics': return buildDnaGenetics();
    case 'environment': return buildEnvironment();
    case 'urban-development': return buildUrbanDevelopment();
    default: return { mesh: new THREE.Group() };
  }
}
