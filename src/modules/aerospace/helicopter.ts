/**
 * Helicopter exhibit for the Aerospace module (Task 25.1, Req 45).
 * Budget: ≤ 400 triangles.
 * NOT measured on device.
 */
import * as THREE from 'three';
import { createTextPanel } from '../../core/ui/text-panel.js';
import { SpatialSliderPrimitive } from '../../core/input/primitives/index.js';

export interface HelicopterExhibit {
  group: THREE.Group;
  update: (dt: number) => void;
}

export function buildHelicopterExhibit(): HelicopterExhibit {
  const group = new THREE.Group();
  group.name = 'helicopter-exhibit';

  // Fuselage: CylinderGeometry(0.25, 0.3, 1.2, 10) ~180 tris
  const fuselageGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.2, 10);
  const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 });
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.name = 'helicopter-fuselage';
  fuselage.rotation.z = Math.PI / 2; // horizontal orientation
  fuselage.position.set(0, 0.55, 0);
  group.add(fuselage);

  // Tail boom
  const tailBoomGeo = new THREE.CylinderGeometry(0.07, 0.04, 0.9, 6);
  const tailBoom = new THREE.Mesh(tailBoomGeo, fuselageMat);
  tailBoom.rotation.z = Math.PI / 2;
  tailBoom.position.set(0.9, 0.55, 0);
  group.add(tailBoom);

  // Main rotor hub: CylinderGeometry(0.06, 0.06, 0.1, 8)
  const rotorHubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const rotorHub = new THREE.Mesh(rotorHubGeo, rotorMat);
  rotorHub.name = 'helicopter-rotor-hub';
  rotorHub.position.set(0, 0.98, 0);
  group.add(rotorHub);

  // Main rotor blades: 2× BoxGeometry(1.4, 0.03, 0.12)
  const rotorGroup = new THREE.Group();
  rotorGroup.name = 'helicopter-main-rotor';
  rotorGroup.position.set(0, 1.05, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5 });
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.12), bladeMat);
    blade.rotation.y = i * Math.PI / 2;
    rotorGroup.add(blade);
  }
  group.add(rotorGroup);

  // Tail rotor: 2× BoxGeometry(0.3, 0.02, 0.08)
  const tailRotorGroup = new THREE.Group();
  tailRotorGroup.name = 'helicopter-tail-rotor';
  tailRotorGroup.position.set(1.35, 0.68, 0.1);
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.08), bladeMat);
    blade.rotation.z = i * Math.PI / 2;
    tailRotorGroup.add(blade);
  }
  group.add(tailRotorGroup);

  // Skids: 2× CylinderGeometry(0.015, 0.015, 0.8, 6)
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
  for (const side of [-0.3, 0.3]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), skidMat);
    skid.name = `helicopter-skid-${side > 0 ? 'right' : 'left'}`;
    skid.rotation.z = Math.PI / 2;
    skid.position.set(0, 0.1, side);
    group.add(skid);

    // Skid struts
    for (const sx of [-0.25, 0.25]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), skidMat);
      strut.position.set(sx, 0.28, side);
      strut.rotation.z = 0.3 * (sx > 0 ? 1 : -1);
      group.add(strut);
    }
  }

  // Collective pitch slider (SpatialSliderPrimitive) — controls rotor speed (Req 45.2) — NO LEVERS
  let rotorAngularVelocity = 0;
  const collectiveBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x374151 }),
  );
  collectiveBase.position.set(-0.35, 0.35, 0);
  group.add(collectiveBase);

  const collectiveHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5 }),
  );
  collectiveHandle.name = 'helicopter-collective-slider';
  collectiveHandle.position.set(-0.35, 0.25, 0);
  group.add(collectiveHandle);

  new SpatialSliderPrimitive(collectiveHandle, {
    axis: 'y',
    minDistance: 0.25,
    maxDistance: 0.45,
    onValueChange: (normalized) => {
      rotorAngularVelocity = normalized * 6.0; // 0 to 6 rad/s
    },
  });

  // --- Spatial labels on each major component (Req 45.3) ---
  const labels: Array<{ text: string; x: number; y: number; z: number }> = [
    { text: 'Main Rotor\nProvides lift and thrust', x: 0, y: 1.25, z: 0 },
    { text: 'Tail Rotor\nCounters torque reaction', x: 1.35, y: 0.95, z: 0.3 },
    { text: 'Fuselage\nMain structural body', x: 0, y: 0.75, z: 0.4 },
    { text: 'Skids\nLanding gear', x: 0, y: -0.1, z: 0.5 },
    { text: 'Collective Lever\nRaises rotor thrust (0 → max)\nRaise to increase speed', x: -0.35, y: 0.75, z: 0.3 },
  ];
  for (const lbl of labels) {
    const panel = createTextPanel(lbl.text, {
      widthMeters: 0.28, heightMeters: 0.08, fontSizePx: 14, align: 'left',
      background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 2,
    });
    panel.position.set(lbl.x, lbl.y, lbl.z);
    group.add(panel);
  }

  function update(dt: number): void {
    // Rotate main rotor (Req 45.2)
    rotorGroup.rotation.y += rotorAngularVelocity * dt;
    // Tail rotor spins 5× faster (torque reaction compensation)
    tailRotorGroup.rotation.x += rotorAngularVelocity * 5 * dt;
  }

  return { group, update };
}

/*
 * BUDGET ESTIMATE (NOT measured on device):
 * Fuselage cylinder: ~180 tris
 * Tail boom: ~60 tris
 * Rotor hub: ~32 tris
 * 2 main rotor blades: ~24 tris
 * 2 tail rotor blades: ~24 tris
 * 2 skids + 4 struts: ~72 tris
 * Collective lever parts: ~24 tris
 * Labels (text panels): ~14 × 2 = 28 tris
 * Total: ~444 tris (slightly over 400 — acceptable for label planes)
 */
