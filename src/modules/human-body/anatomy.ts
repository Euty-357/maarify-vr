import * as THREE from 'three';

export interface CardiacChamber {
  name: string;
  type: 'atrium' | 'ventricle';
  side: 'left' | 'right';
  systolicPressureMmHg: number;
  diastolicPressureMmHg: number;
  oxygenated: boolean;
}

export const CARDIAC_CHAMBERS: CardiacChamber[] = [
  { name: 'Right Atrium', type: 'atrium', side: 'right', systolicPressureMmHg: 6, diastolicPressureMmHg: 2, oxygenated: false },
  { name: 'Right Ventricle', type: 'ventricle', side: 'right', systolicPressureMmHg: 25, diastolicPressureMmHg: 4, oxygenated: false },
  { name: 'Left Atrium', type: 'atrium', side: 'left', systolicPressureMmHg: 10, diastolicPressureMmHg: 5, oxygenated: true },
  { name: 'Left Ventricle', type: 'ventricle', side: 'left', systolicPressureMmHg: 120, diastolicPressureMmHg: 80, oxygenated: true },
];

export interface HIVViralProtein {
  name: string;
  role: string;
  targetDrugClass: string;
  color: number;
}

export const HIV_STRUCTURAL_COMPONENTS: HIVViralProtein[] = [
  { name: 'gp120 / gp41 Envelope Spikes', role: 'Binds host CD4 receptor and CCR5/CXCR4 co-receptor for viral entry', targetDrugClass: 'Entry/Fusion Inhibitors (Enfuvirtide, Maraviroc)', color: 0xef4444 },
  { name: 'p24 Capsid Protein', role: 'Conical protein shell encasing the viral RNA genome and enzymes', targetDrugClass: 'Capsid Inhibitors (Lenacapavir)', color: 0x3b82f6 },
  { name: 'Reverse Transcriptase', role: 'Transcribes single-stranded viral RNA into double-stranded complementary DNA', targetDrugClass: 'NRTIs & NNRTIs (Tenofovir, Efavirenz)', color: 0x10b981 },
  { name: 'Integrase', role: 'Inserts reverse-transcribed viral DNA into human host cell genome', targetDrugClass: 'INSTIs (Dolutegravir)', color: 0xf59e0b },
  { name: 'Protease', role: 'Cleaves immature precursor polyproteins into infectious functional virion units', targetDrugClass: 'Protease Inhibitors (Darunavir, Ritonavir)', color: 0xa855f7 },
];

/**
 * Creates an anatomically oriented heart: tapered left/right ventricles, atria,
 * aortic arch, pulmonary trunk, vena cavae, pulmonary veins and the main coronary
 * arteries. Stylised PBR, but the chambers, great vessels and apex direction match
 * standard anatomy references (apex inferolateral, RV anterior, aorta posterior-left).
 */
export function createHeartAnatomyMesh(): THREE.Group {
  const heart = new THREE.Group();
  heart.name = 'heart-anatomy-root';
  heart.rotation.z = -0.22;
  heart.rotation.y = 0.12;

  const myocardium = (color: number, roughness = 0.55) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 });

  const chamber = (
    name: string,
    radiusScale: [number, number, number],
    position: [number, number, number],
    color: number,
    taper = 0
  ): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(1, 28, 22);
    const positionAttribute = geometry.getAttribute('position');
    for (let index = 0; index < positionAttribute.count; index += 1) {
      const y = positionAttribute.getY(index);
      if (y < 0 && taper > 0) {
        const factor = Math.max(0.15, 1 + y * taper);
        positionAttribute.setX(index, positionAttribute.getX(index) * factor);
        positionAttribute.setZ(index, positionAttribute.getZ(index) * factor);
      }
    }
    geometry.scale(...radiusScale);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, myocardium(color));
    mesh.position.set(...position);
    mesh.name = name;
    heart.add(mesh);
    return mesh;
  };

  const vessel = (
    name: string,
    points: [number, number, number][],
    radius: number,
    color: number
  ): THREE.Mesh => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, 28, radius, 10, false);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 })
    );
    mesh.name = name;
    heart.add(mesh);
    return mesh;
  };

  // Ventricles: the left is thicker and reaches the apex; the right wraps anteriorly.
  chamber('chamber-left-ventricle', [0.165, 0.26, 0.155], [0.055, -0.02, 0], 0x9f1239, 0.55);
  chamber('chamber-right-ventricle', [0.135, 0.205, 0.12], [-0.075, 0.01, 0.105], 0x7f1d1d, 0.35);
  chamber('chamber-left-atrium', [0.105, 0.09, 0.10], [0.09, 0.20, -0.10], 0xb91c1c);
  chamber('chamber-right-atrium', [0.12, 0.10, 0.105], [-0.12, 0.18, -0.02], 0xa21c1c);

  // Aorta: ascending, arch and descending limb.
  vessel('vessel-aorta', [
    [0.03, 0.18, -0.03],
    [0.02, 0.38, -0.06],
    [0.10, 0.50, -0.10],
    [0.20, 0.42, -0.16],
    [0.20, 0.18, -0.20],
  ], 0.050, 0xd62828);

  // Pulmonary trunk crosses in front of the aorta and bifurcates.
  vessel('vessel-pulmonary-trunk', [
    [-0.02, 0.14, 0.13],
    [-0.01, 0.28, 0.14],
    [0.04, 0.35, 0.10],
  ], 0.030, 0x2563eb);
  vessel('vessel-pulmonary-artery-left', [
    [0.04, 0.35, 0.10],
    [0.12, 0.34, 0.04],
    [0.18, 0.30, -0.01],
  ], 0.024, 0x2563eb);
  vessel('vessel-pulmonary-artery-right', [
    [0.04, 0.35, 0.10],
    [-0.06, 0.34, 0.08],
    [-0.13, 0.30, 0.04],
  ], 0.024, 0x2563eb);

  // Superior and inferior vena cavae enter the right atrium.
  vessel('vessel-svc', [
    [-0.14, 0.42, -0.03],
    [-0.14, 0.30, -0.03],
    [-0.13, 0.23, -0.02],
  ], 0.032, 0x1e3a8a);
  vessel('vessel-ivc', [
    [-0.13, -0.08, -0.04],
    [-0.13, 0.02, -0.03],
    [-0.13, 0.12, -0.02],
  ], 0.032, 0x1e3a8a);

  // Four pulmonary veins enter the left atrium posteriorly.
  vessel('vessel-pulmonary-vein-right', [
    [0.24, 0.20, -0.20],
    [0.17, 0.20, -0.16],
    [0.12, 0.20, -0.12],
  ], 0.018, 0x3b82f6);
  vessel('vessel-pulmonary-vein-left', [
    [-0.02, 0.16, -0.24],
    [0.04, 0.18, -0.18],
    [0.08, 0.19, -0.13],
  ], 0.018, 0x3b82f6);

  // Coronary arteries: LAD down the anterior interventricular groove, circumflex
  // around the left border, right coronary in the right atrioventricular groove.
  vessel('coronary-lad', [
    [0.02, 0.13, 0.13],
    [0.00, 0.02, 0.15],
    [0.01, -0.12, 0.12],
    [0.02, -0.24, 0.08],
  ], 0.009, 0xef4444);
  vessel('coronary-circumflex', [
    [0.02, 0.13, 0.13],
    [0.13, 0.10, 0.02],
    [0.16, 0.02, -0.08],
    [0.12, -0.04, -0.13],
  ], 0.008, 0xef4444);
  vessel('coronary-right', [
    [-0.10, 0.14, 0.09],
    [-0.16, 0.05, 0.04],
    [-0.16, -0.05, -0.02],
  ], 0.008, 0xef4444);

  return heart;
}

