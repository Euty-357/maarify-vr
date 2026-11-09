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
 * Creates the stylized 4-chamber heart mesh with aorta and pulmonary trunk.
 */
export function createHeartAnatomyMesh(): THREE.Group {
  const heart = new THREE.Group();
  heart.name = 'heart-anatomy-root';

  // Left Ventricle (thick muscular wall)
  const lvGeo = new THREE.SphereGeometry(0.24, 16, 16);
  lvGeo.scale(1.0, 1.3, 0.9);
  const lvMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.6,
    metalness: 0.2,
  });
  const lv = new THREE.Mesh(lvGeo, lvMat);
  lv.position.set(0.08, 0, 0);
  lv.name = 'chamber-left-ventricle';
  heart.add(lv);

  // Right Ventricle (anterior crescentic wall)
  const rvGeo = new THREE.SphereGeometry(0.20, 16, 16);
  rvGeo.scale(0.9, 1.2, 0.8);
  const rvMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.6,
    metalness: 0.2,
  });
  const rv = new THREE.Mesh(rvGeo, rvMat);
  rv.position.set(-0.12, -0.04, 0.06);
  rv.name = 'chamber-right-ventricle';
  heart.add(rv);

  // Left & Right Atria
  const la = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 })
  );
  la.position.set(0.1, 0.24, -0.06);
  heart.add(la);

  const ra = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
  );
  ra.position.set(-0.14, 0.22, 0);
  heart.add(ra);

  // Aorta arch (red, curving up and back)
  const aortaGeo = new THREE.TorusGeometry(0.14, 0.04, 12, 24, Math.PI);
  const aortaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const aorta = new THREE.Mesh(aortaGeo, aortaMat);
  aorta.position.set(0.02, 0.28, -0.04);
  aorta.rotation.y = Math.PI / 4;
  heart.add(aorta);

  return heart;
}

