import * as THREE from 'three';
import { getSpatialAnchors } from './anchors.js';
import {
  SpatialAnchorPrimitive,
  SpatialGrabPrimitive,
  SpatialRotatorPrimitive,
  SpatialScalePinchPrimitive,
  SpatialSliderPrimitive,
  SpatialSlotPrimitive,
} from '../../core/input/primitives/index.js';
import { createTextPanel, setTextPanelText } from '../../core/ui/text-panel.js';
import { SpatialBadgePlinth } from '../../gamification/badge-plinth.js';
import {
  DIVERSITY_REGIONS,
  DIVERSITY_TAKEAWAY,
  GENOTYPES,
  MODEL_MRNA,
  codonViews,
  genotypeFraming,
  isComplement,
  type Base,
  type Genotype,
} from './genetics.js';

/**
 * M6 DNA / Genetics — seven spatial beats.
 *
 * Beat 1  cell interior → nuclear pore → chromatin reveal (scale journey, no camera motion)
 * Beat 2  4 m double helix, two-hand unzip (slider is the seated parity path)
 * Beat 3  complementary base snapping with rejection
 * Beat 4  room-scale ribosome, A-site tRNA translocation and a growing peptide chain
 * Beat 5  CRISPR guide alignment, PAM site, push-to-lock, NHEJ vs HDR outcomes
 * Beat 6  African diversity wall, genotype dial, sickle trait / malaria causal chain
 * Beat 7  Genomics Architect badge, Kenyan agri-biotech vignette, exit portal
 */

export interface DnaGeneticsState {
  diveStage: number;
  unzip: number;
  basePairs: number;
  translated: number;
  crisprAligned: boolean;
  crisprLocked: boolean;
  repairOutcome: string;
  genotype: Genotype;
  diversityLinks: number;
  badgeUnlocked: boolean;
}

export interface DnaGeneticsScene {
  root: THREE.Group;
  anchorPrimitive: SpatialAnchorPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
  getState: () => DnaGeneticsState;
}

const BASE_COLORS: Record<Base, number> = { A: 0xf59e0b, T: 0x38bdf8, C: 0xa855f7, G: 0x10b981 };
const CHALLENGE_IDS = [
  'dna-base-pair-snap',
  'dna-replication-unzip',
  'dna-ribosome-thread',
  'dna-crispr-capstone',
  'dna-diversity-chain',
] as const;

interface Tween {
  elapsed: number;
  duration: number;
  from: number;
  to: number;
  apply: (value: number) => void;
}

export async function buildScene(): Promise<DnaGeneticsScene> {
  const root = new THREE.Group();
  root.name = 'dna-genetics-module-root';

  // --- shared state -------------------------------------------------------
  let diveStage = 0;
  let unzip = 0;
  let crisprAligned = false;
  let crisprLocked = false;
  let repairOutcome: 'none' | 'nhej' | 'hdr' = 'none';
  let genotypeIndex = 0;
  let diversityLinks = 0;
  let badgeUnlocked = false;
  const completed = new Set<string>();
  const tweens: Tween[] = [];
  let elapsed = 0;

  const completeChallenge = (challengeId: string) => {
    if (completed.has(challengeId)) return;
    completed.add(challengeId);
    window.dispatchEvent(new CustomEvent('maarify:challenge-completed', { detail: { moduleId: 'dna-genetics', challengeId } }));
    if (completed.size === CHALLENGE_IDS.length) unlockBadge();
  };
  const unlockBadge = () => {
    if (badgeUnlocked) return;
    badgeUnlocked = true;
    badgePlinth.unlock();
    window.dispatchEvent(new CustomEvent('maarify:comfort-pulse', { detail: { intensity: 0.25 } }));
  };
  const ping = (emitter: THREE.Object3D, frequency: number) => {
    window.dispatchEvent(new CustomEvent('maarify:spatial-ping', { detail: { emitter, frequency } }));
  };
  const comfortPulse = (intensity: number) => {
    window.dispatchEvent(new CustomEvent('maarify:comfort-pulse', { detail: { intensity } }));
  };
  const tween = (from: number, to: number, duration: number, apply: (value: number) => void) => {
    tweens.push({ elapsed: 0, duration, from, to, apply });
  };

  // --- materials ----------------------------------------------------------
  const material = {
    dark: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.25 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9fb3c8, roughness: 0.28, metalness: 0.9 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, emissiveIntensity: 0.7, roughness: 0.3 }),
    emerald: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x064e3b, emissiveIntensity: 0.5, roughness: 0.35 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, emissiveIntensity: 0.5, roughness: 0.35 }),
    violet: new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x4c1d95, emissiveIntensity: 0.45, roughness: 0.35 }),
    red: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.4, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x60a5fa, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, roughness: 0.15, metalness: 0.2,
    }),
    membrane: new THREE.MeshStandardMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false, roughness: 0.4,
    }),
  };

  // --- floor ---------------------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x071827, roughness: 0.85, metalness: 0.15 })
  );
  floor.name = 'dna-lab-floor';
  floor.position.y = -0.02;
  root.add(floor);

  // --- Beat 1: inside a cell, then through the nuclear pore ---------------
  const cellGroup = new THREE.Group();
  cellGroup.name = 'dna-cell-interior';
  root.add(cellGroup);

  const membrane = new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 20), material.membrane);
  membrane.name = 'dna-cell-membrane';
  membrane.position.set(0, 1.6, 0);
  cellGroup.add(membrane);

  const organelles = new THREE.Group();
  organelles.name = 'dna-organelles';
  const organelleGeometry = new THREE.CapsuleGeometry(0.09, 0.26, 4, 8);
  [
    { position: new THREE.Vector3(-2.2, 2.4, -1.0), color: material.emerald },
    { position: new THREE.Vector3(2.4, 1.9, 0.6), color: material.violet },
    { position: new THREE.Vector3(-1.4, 1.2, 2.0), color: material.amber },
  ].forEach(({ position, color }, index) => {
    const organelle = new THREE.Mesh(organelleGeometry, color);
    organelle.position.copy(position);
    organelle.rotation.set(index * 0.7, index * 1.1, index * 0.4);
    organelles.add(organelle);
  });
  cellGroup.add(organelles);

  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.88, 28, 18), material.glass);
  nucleus.name = 'dna-nucleus-envelope';
  nucleus.position.set(0, 1.6, -2.1);
  cellGroup.add(nucleus);

  const chromatin = new THREE.Mesh(new THREE.TorusKnotGeometry(0.34, 0.055, 64, 8, 2, 3), material.violet);
  chromatin.name = 'dna-chromatin-coil';
  chromatin.position.copy(nucleus.position);
  chromatin.visible = false;
  cellGroup.add(chromatin);

  const poreRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 28), material.cyan);
  poreRing.name = 'dna-nuclear-pore';
  poreRing.position.set(0, 1.6, -1.42);
  cellGroup.add(poreRing);

  const scalePanel = createTextPanel('CELL INTERIOR — outside the nucleus', {
    widthMeters: 0.86, heightMeters: 0.2, fontSizePx: 28, align: 'center',
  });
  scalePanel.name = 'dna-scale-readout';
  scalePanel.position.set(-0.62, 0.66, -1.5);
  scalePanel.lookAt(0, 1.2, 0);
  root.add(scalePanel);

  const divePlinth = new THREE.Group();
  divePlinth.name = 'dna-scale-dive-plinth';
  const diveBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.9, 14), material.dark);
  diveBase.position.set(-2.15, 0.45, -0.6);
  divePlinth.add(diveBase);
  const diveRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8), material.metal);
  diveRod.position.set(-2.15, 1.02, -0.6);
  divePlinth.add(diveRod);
  const diveHandle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), material.cyan);
  diveHandle.name = 'dna-scale-dive-handle';
  diveHandle.position.set(-2.15, 0.88, -0.6);
  divePlinth.add(diveHandle);
  root.add(divePlinth);
  new SpatialSliderPrimitive(diveHandle, {
    axis: 'y', minDistance: 0.86, maxDistance: 1.14, snapSteps: 3,
    onValueChange: (value) => setDiveStage(Math.round(value * 3)),
  });

  const setDiveStage = (stage: number) => {
    const clamped = Math.max(0, Math.min(3, stage));
    if (clamped === diveStage) return;
    const previous = diveStage;
    diveStage = clamped;
    comfortPulse(clamped > previous ? 0.45 : 0.3);
    ping(poreRing, 420 + clamped * 90);
    tween(membrane.material.opacity, clamped === 0 ? 0.14 : clamped >= 3 ? 0.03 : 0.08, 0.9, (value) => {
      membrane.material.opacity = value;
    });
    tween(nucleus.material.opacity, clamped < 2 ? 0.16 : clamped === 2 ? 0.06 : 0.015, 0.9, (value) => {
      nucleus.material.opacity = value;
    });
    chromatin.visible = clamped === 2;
    if (chromatin.visible) {
      chromatin.scale.setScalar(1);
      chromatin.rotation.set(0, 0, 0);
    }
    const labels = [
      'CELL INTERIOR — outside the nucleus',
      'NUCLEAR PORE — approach the envelope',
      'CHROMATIN — DNA is packaged here',
      'MOLECULAR SCALE — DNA drawn oversized to walk beside it',
    ];
    setTextPanelText(scalePanel, labels[clamped]);
  };

  // --- Beat 2: 4 m double helix with two-hand unzip -----------------------
  const helix = new THREE.Group();
  helix.name = 'dna-double-helix-walkthrough';
  helix.position.set(0, 2.1, -3.0);
  root.add(helix);

  const TURNS = 60;
  const HELIX_HEIGHT = 3.8;
  const HELIX_RADIUS = 0.55;
  const beadGeometry = new THREE.SphereGeometry(0.042, 8, 6);
  const backboneA = new THREE.InstancedMesh(beadGeometry, material.cyan, TURNS);
  const backboneB = new THREE.InstancedMesh(beadGeometry, material.amber, TURNS);
  const rungGeometry = new THREE.BoxGeometry(HELIX_RADIUS * 2, 0.022, 0.022);
  const rungCount = 36;
  const rungs = new THREE.InstancedMesh(rungGeometry, material.metal, rungCount);
  const rungData: Array<{ y: number; theta: number }> = [];
  const dummy = new THREE.Object3D();
  for (let index = 0; index < TURNS; index += 1) {
    const theta = (index / TURNS) * Math.PI * 6;
    const y = -HELIX_HEIGHT / 2 + (index / (TURNS - 1)) * HELIX_HEIGHT;
    dummy.position.set(Math.cos(theta) * HELIX_RADIUS, y, Math.sin(theta) * HELIX_RADIUS);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    backboneA.setMatrixAt(index, dummy.matrix);
    dummy.position.set(-Math.cos(theta) * HELIX_RADIUS, y, -Math.sin(theta) * HELIX_RADIUS);
    dummy.updateMatrix();
    backboneB.setMatrixAt(index, dummy.matrix);
  }
  for (let index = 0; index < rungCount; index += 1) {
    const theta = (index / rungCount) * Math.PI * 6;
    const y = -HELIX_HEIGHT / 2 + (index / (rungCount - 1)) * HELIX_HEIGHT;
    rungData.push({ y, theta });
    dummy.position.set(0, y, 0);
    dummy.rotation.set(0, theta, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rungs.setMatrixAt(index, dummy.matrix);
  }
  backboneA.instanceMatrix.needsUpdate = true;
  backboneB.instanceMatrix.needsUpdate = true;
  rungs.instanceMatrix.needsUpdate = true;
  helix.add(backboneA, backboneB, rungs);

  const setUnzip = (amount: number) => {
    const next = Math.max(unzip, Math.min(1, amount));
    if (next === unzip) return;
    unzip = next;
    rungData.forEach(({ y, theta }, index) => {
      const separation = 0.1 + unzip * 0.22;
      dummy.position.set(0, y, 0);
      dummy.rotation.set(0, theta, 0);
      dummy.scale.set(1 - unzip * 0.55, 1, 1);
      dummy.updateMatrix();
      rungs.setMatrixAt(index, dummy.matrix);
      dummy.position.set(Math.cos(theta) * separation, y, Math.sin(theta) * separation);
      dummy.updateMatrix();
      rungs.setMatrixAt(index, dummy.matrix);
    });
    rungs.instanceMatrix.needsUpdate = true;
    if (unzip >= 0.95) completeChallenge('dna-replication-unzip');
  };

  const handleRest = { y: 1.35, z: -2.92 };
  const leftHandle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), material.cyan);
  leftHandle.name = 'dna-unzip-handle-left';
  leftHandle.position.set(-HELIX_RADIUS, handleRest.y, handleRest.z);
  root.add(leftHandle);
  new SpatialGrabPrimitive(leftHandle, {
    constrainY: true,
    onGrab: () => ping(leftHandle, 540),
    onMove: () => {
      leftHandle.position.y = handleRest.y;
      leftHandle.position.z = handleRest.z;
      leftHandle.position.x = Math.min(-0.3, leftHandle.position.x);
      const pull = (-HELIX_RADIUS - leftHandle.position.x) / 0.28;
      setUnzip(pull);
    },
  });

  const rightHandle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), material.amber);
  rightHandle.name = 'dna-unzip-handle-right';
  rightHandle.position.set(HELIX_RADIUS, handleRest.y, handleRest.z);
  root.add(rightHandle);
  new SpatialGrabPrimitive(rightHandle, {
    constrainY: true,
    onGrab: () => ping(rightHandle, 620),
    onMove: () => {
      rightHandle.position.y = handleRest.y;
      rightHandle.position.z = handleRest.z;
      rightHandle.position.x = Math.max(0.3, rightHandle.position.x);
      const pull = (rightHandle.position.x - HELIX_RADIUS) / 0.28;
      setUnzip(pull);
    },
  });

  new SpatialScalePinchPrimitive(helix, {
    minScale: 0.7,
    maxScale: 1.6,
    onScaleChange: (scale) => { helix.scale.setScalar(scale); },
  });

  const forkHandle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.07), material.metal);
  forkHandle.name = 'dna-replication-slider';
  forkHandle.position.set(0.0, 0.92, -2.35);
  root.add(forkHandle);
  new SpatialSliderPrimitive(forkHandle, {
    axis: 'x', minDistance: -0.18, maxDistance: 0.18, snapSteps: 10,
    onValueChange: (value) => setUnzip(value),
  });

  // --- Beat 3: complementary base snapping --------------------------------
  const baseStation = new THREE.Group();
  baseStation.name = 'dna-base-pair-matching-station';
  baseStation.position.set(-1.45, 1.15, -1.15);
  root.add(baseStation);

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.05), material.dark);
  baseStation.add(board);
  const templateSequence: Base[] = ['T', 'G', 'C', 'A'];
  const sockets: SpatialSlotPrimitive[] = [];
  templateSequence.forEach((base, index) => {
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    socket.name = `dna-template-socket-${index}`;
    socket.userData.base = base;
    socket.position.set(-0.3 + index * 0.2, 0.04, 0.04);
    socket.rotation.x = Math.PI / 2;
    baseStation.add(socket);
    const slot = new SpatialSlotPrimitive(socket, {
      claimRadius: 0.3,
      accept: (payload) => isComplement(base, payload.userData.base as Base),
      onAccept: (payload) => {
        payload.userData.snapped = true;
        delete payload.userData.grabPrimitive;
        delete payload.userData.isGrabbable;
        snappedBases.add(payload as THREE.Mesh);
        ping(payload, 880);
        if (snappedBases.size === templateSequence.length) completeChallenge('dna-base-pair-snap');
      },
    });
    sockets.push(slot);
  });

  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.16), material.metal);
  tray.position.set(0, -0.26, 0.16);
  baseStation.add(tray);

  const snappedBases = new Set<THREE.Mesh>();
  const nucleotideOrder: Base[] = ['A', 'C', 'G', 'T'];
  nucleotideOrder.forEach((base, index) => {
    const nucleotide = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.11, 0.05),
      new THREE.MeshStandardMaterial({ color: BASE_COLORS[base], roughness: 0.35, metalness: 0.2 })
    );
    nucleotide.name = `dna-nucleotide-${base}`;
    nucleotide.position.set(-1.75 + index * 0.2, 0.79, -1.0);
    nucleotide.userData.base = base;
    root.add(nucleotide);
    new SpatialGrabPrimitive(nucleotide, {
      onGrab: () => ping(nucleotide, 700),
      onRelease: () => {
        for (const slot of sockets) {
          const result = slot.attempt(nucleotide);
          if (result === 'accepted') return;
          if (result === 'rejected') {
            springBack(nucleotide, new THREE.Vector3(-1.75 + index * 0.2, 0.79, -1.0));
            return;
          }
        }
        springBack(nucleotide, new THREE.Vector3(-1.75 + index * 0.2, 0.79, -1.0));
      },
    });
  });

  const baseLegend = createTextPanel(`TEMPLATE  ${templateSequence.join(' ')}  ·  A pairs with T, C pairs with G`, {
    widthMeters: 0.92, heightMeters: 0.16, fontSizePx: 26, align: 'center',
  });
  baseLegend.position.set(-1.45, 1.44, -1.11);
  baseLegend.lookAt(-1.45, 1.44, 0);
  root.add(baseLegend);

  const springBackTweens = new Map<THREE.Object3D, THREE.Vector3>();
  const springBack = (object: THREE.Object3D, home: THREE.Vector3) => {
    springBackTweens.set(object, home);
    const start = object.position.clone();
    tween(0, 1, 0.28, (value) => {
      object.position.lerpVectors(start, home, value);
    });
  };

  // --- Beat 4: ribosome translation --------------------------------------
  const ribosomeStation = new THREE.Group();
  ribosomeStation.name = 'dna-ribosome-translation-station';
  ribosomeStation.position.set(1.85, 1.45, -1.55);
  root.add(ribosomeStation);

  const ribosome = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 12, 40), material.violet);
  ribosome.rotation.x = 0;
  ribosomeStation.add(ribosome);
  const subunit = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), material.dark);
  subunit.position.set(0, -0.52, 0);
  ribosomeStation.add(subunit);

  const codonView = codonViews(MODEL_MRNA);
  const mrna = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.06), material.cyan);
  mrna.position.set(0, 0.15, 0.05);
  ribosomeStation.add(mrna);
  codonView.forEach((_view, index) => {
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: [0x38bdf8, 0xf59e0b, 0x10b981][index], roughness: 0.35 }));
    knob.position.set(-0.44 + index * 0.44, 0.15, 0.09);
    ribosomeStation.add(knob);
  });

  const aSite = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 18), material.emerald);
  aSite.name = 'dna-a-site';
  aSite.position.set(1.85, 1.26, -1.4);
  aSite.rotation.x = Math.PI / 2;
  root.add(aSite);
  const aSiteSlot = new SpatialSlotPrimitive(aSite, {
    claimRadius: 0.3,
    accept: (payload) => payload.userData.translationIndex === translatedCount,
    onAccept: (payload) => {
      delete payload.userData.grabPrimitive;
      delete payload.userData.isGrabbable;
      const acceptedIndex = translatedCount;
      translatedCount += 1;
      peptideBeads[translatedCount - 1].visible = true;
      // The tRNA leaves the A site for the P/E positions so the next one can dock.
      const exit = new THREE.Vector3(1.85 + (acceptedIndex - 1) * 0.28, 1.12, -1.45);
      const start = payload.position.clone();
      tween(0, 1, 0.35, (value) => {
        payload.position.lerpVectors(start, exit, value);
      });
      aSiteSlot.release();
      ping(payload, 760 + translatedCount * 80);
      if (translatedCount === codonView.length) completeChallenge('dna-ribosome-thread');
    },
  });
  let translatedCount = 0;

  const trnaGeometry = new THREE.TorusGeometry(0.1, 0.028, 8, 14);
  codonView.forEach((view, index) => {
    const trna = new THREE.Mesh(trnaGeometry, new THREE.MeshStandardMaterial({ color: [0x38bdf8, 0xf59e0b, 0x10b981][index], roughness: 0.35 }));
    trna.name = `dna-trna-${view.codon}`;
    trna.position.set(1.5 + index * 0.4, 1.05, -1.1);
    trna.rotation.x = Math.PI / 2;
    trna.userData.translationIndex = index;
    root.add(trna);
    new SpatialGrabPrimitive(trna, {
      onGrab: () => ping(trna, 820),
      onRelease: () => {
        const result = aSiteSlot.attempt(trna);
        if (result === 'ignored') springBack(trna, new THREE.Vector3(1.5 + index * 0.4, 1.05, -1.1));
      },
    });
  });

  const peptideBeads: THREE.Mesh[] = [];
  codonView.forEach((_, index) => {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), material.amber);
    bead.position.set(1.85, 0.9 - index * 0.11, -1.4);
    bead.visible = false;
    root.add(bead);
    peptideBeads.push(bead);
  });

  const codonPanel = createTextPanel(
    `mRNA  ${codonView.map((view) => view.codon).join(' · ')}  →  ${codonView.map((view) => view.aminoAcidName).join(' · ')}`,
    { widthMeters: 1.3, heightMeters: 0.2, fontSizePx: 22, align: 'center', lines: 2 }
  );
  codonPanel.position.set(1.85, 1.0, -1.0);
  codonPanel.lookAt(1.85, 1.45, 0);
  root.add(codonPanel);

  // --- Beat 5: CRISPR-Cas9 targeting --------------------------------------
  const crisprStation = new THREE.Group();
  crisprStation.name = 'dna-crispr-targeting-station';
  crisprStation.position.set(1.55, 1.15, -2.2);
  root.add(crisprStation);

  const dnaBackbone = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.05), material.cyan);
  dnaBackbone.position.set(0, 0, -0.28);
  crisprStation.add(dnaBackbone);
  const dnaTemplate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.05), material.amber);
  dnaTemplate.position.set(0, -0.12, -0.28);
  crisprStation.add(dnaTemplate);
  const pamMarker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.06), material.amber);
  pamMarker.position.set(0.32, -0.06, -0.26);
  crisprStation.add(pamMarker);
  const targetMarker = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 20), material.emerald);
  targetMarker.position.set(-0.12, -0.06, -0.24);
  crisprStation.add(targetMarker);

  const cas9 = new THREE.Group();
  cas9.name = 'dna-cas9-complex';
  cas9.position.set(1.55, 1.22, -1.55);
  const cas9Protein = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), material.emerald);
  cas9.add(cas9Protein);
  const guideRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.016, 8, 20), material.amber);
  guideRing.position.set(0, 0, 0.16);
  guideRing.rotation.x = Math.PI / 2;
  cas9.add(guideRing);
  root.add(cas9);
  new SpatialGrabPrimitive(cas9, { onGrab: () => ping(cas9, 640) });

  const guideDial = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 18), material.metal);
  guideDial.name = 'dna-crispr-guide-dial';
  guideDial.position.set(1.55, 0.9, -1.85);
  root.add(guideDial);
  new SpatialRotatorPrimitive(guideDial, {
    detentStepDeg: 15,
    onRotate: (angle) => {
      guideRing.rotation.z = (angle * Math.PI) / 180;
      const alignment = Math.abs(angle - 45);
      const nextAligned = alignment <= 7;
      if (nextAligned !== crisprAligned) {
        crisprAligned = nextAligned;
        ping(guideDial, nextAligned ? 980 : 520);
      }
    },
  });

  const repairPanel = createTextPanel('ALIGN THE GUIDE (45°) THEN PUSH CAS9 INTO THE TARGET', {
    widthMeters: 0.9, heightMeters: 0.16, fontSizePx: 24, align: 'center',
  });
  repairPanel.name = 'dna-crispr-readout';
  repairPanel.position.set(1.55, 1.52, -1.95);
  repairPanel.lookAt(1.55, 1.52, 0);
  root.add(repairPanel);

  const setRepairOutcome = (outcome: 'nhej' | 'hdr') => {
    if (!crisprLocked) return;
    repairOutcome = outcome;
    setTextPanelText(
      repairPanel,
      outcome === 'hdr'
        ? 'HDR MODEL — a matching template can guide a precise correction. Simplified, non-clinical.'
        : 'NHEJ MODEL — the cut is rejoined with small errors. Simplified, non-clinical.'
    );
    ping(repairPanel, outcome === 'hdr' ? 900 : 560);
  };

  const nhejGate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.05), material.red);
  nhejGate.name = 'dna-repair-nhej';
  nhejGate.position.set(1.35, 1.0, -1.95);
  root.add(nhejGate);
  new SpatialGrabPrimitive(nhejGate, { onGrab: () => setRepairOutcome('nhej') });

  const hdrGate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.05), material.emerald);
  hdrGate.name = 'dna-repair-hdr';
  hdrGate.position.set(1.75, 1.0, -1.95);
  root.add(hdrGate);
  new SpatialGrabPrimitive(hdrGate, { onGrab: () => setRepairOutcome('hdr') });

  // --- Beat 6: diversity and the sickle trait -----------------------------
  const diversityStation = new THREE.Group();
  diversityStation.name = 'dna-diversity-exhibit';
  diversityStation.position.set(2.0, 1.3, -0.35);
  diversityStation.rotation.y = -0.55;
  root.add(diversityStation);

  const diversityBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.62, 0.04), material.dark);
  diversityStation.add(diversityBoard);

  const beadCountTotal = DIVERSITY_REGIONS.reduce((total, region) => total + region.beadCount, 0);
  const diversityBeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.4 }), beadCountTotal);
  diversityBeads.name = 'dna-diversity-beads';
  let beadCursor = 0;
  DIVERSITY_REGIONS.forEach((region, regionIndex) => {
    for (let index = 0; index < region.beadCount; index += 1) {
      const angle = (index / region.beadCount) * Math.PI * 2;
      const radius = 0.06 + (index % 3) * 0.02;
      dummy.position.set(-0.42 + regionIndex * 0.21 + Math.cos(angle) * radius, 0.16 + Math.sin(angle) * radius, 0.04);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      diversityBeads.setMatrixAt(beadCursor, dummy.matrix);
      beadCursor += 1;
    }
  });
  diversityBeads.instanceMatrix.needsUpdate = true;
  diversityStation.add(diversityBeads);

  const diversityLegend = createTextPanel(`${DIVERSITY_TAKEAWAY}`, {
    widthMeters: 1.3, heightMeters: 0.3, fontSizePx: 24, align: 'left',
  });
  diversityLegend.position.set(2.0, 1.05, -0.1);
  diversityLegend.lookAt(0, 1.1, 0.2);
  root.add(diversityLegend);

  const genotypeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 18), material.metal);
  genotypeDial.name = 'dna-genotype-dial';
  genotypeDial.position.set(2.05, 1.3, 0.15);
  root.add(genotypeDial);
  const redCell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 }));
  redCell.name = 'dna-red-blood-cell';
  redCell.position.set(1.75, 1.34, 0.05);
  redCell.scale.set(1, 0.55, 1);
  root.add(redCell);

  const genotypePanel = createTextPanel(genotypeFraming('HbAA').populationNote, {
    widthMeters: 0.9, heightMeters: 0.3, fontSizePx: 22, align: 'left',
  });
  genotypePanel.name = 'dna-genotype-readout';
  genotypePanel.position.set(1.75, 1.05, 0.15);
  genotypePanel.lookAt(0, 1.1, 0.3);
  root.add(genotypePanel);

  const setGenotype = (index: number) => {
    const clamped = Math.max(0, Math.min(GENOTYPES.length - 1, index));
    if (clamped === genotypeIndex) return;
    genotypeIndex = clamped;
    const framing = genotypeFraming(GENOTYPES[clamped]);
    (redCell.material as THREE.MeshStandardMaterial).color.setHex(framing.cellColor);
    redCell.scale.set(framing.cellShape === 'crescent' ? 1.35 : 1, framing.cellShape === 'crescent' ? 0.32 : 0.55, 1);
    setTextPanelText(genotypePanel, framing.populationNote);
    ping(genotypeDial, 600 + clamped * 120);
  };

  new SpatialSliderPrimitive(genotypeDial, {
    axis: 'y', minDistance: 1.22, maxDistance: 1.38, snapSteps: 2,
    onValueChange: (value) => setGenotype(Math.round(value * 2)),
  });

  const chainSlots: SpatialSlotPrimitive[] = [];
  ['dna-chain-slot-0', 'dna-chain-slot-1', 'dna-chain-slot-2'].forEach((name, index) => {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.03), material.metal);
    slot.name = name;
    slot.position.set(1.62 + index * 0.32, 1.54, -0.12);
    root.add(slot);
    chainSlots.push(new SpatialSlotPrimitive(slot, {
      claimRadius: 0.28,
      accept: (payload) => payload.userData.chainIndex === index,
      onAccept: (payload) => {
        delete payload.userData.grabPrimitive;
        delete payload.userData.isGrabbable;
        diversityLinks += 1;
        ping(payload, 800 + index * 100);
        if (diversityLinks === 3) completeChallenge('dna-diversity-chain');
      },
    }));
  });

  const chainNodes = [
    { text: 'Sickle-cell trait', index: 0 },
    { text: 'Partial protection from severe malaria', index: 1 },
    { text: 'Higher trait frequency where malaria is common', index: 2 },
  ];
  const chainVisualOrder = [1, 0, 2];
  chainNodes.forEach((node, position) => {
    const x = 1.55 + chainVisualOrder[position] * 0.34;
    const panel = createTextPanel(node.text, { widthMeters: 0.3, heightMeters: 0.12, fontSizePx: 20, align: 'center' });
    panel.name = `dna-chain-node-${node.index}`;
    panel.position.set(x, 1.62, 0.35);
    panel.lookAt(x, 1.62, 0);
    panel.userData.chainIndex = node.index;
    root.add(panel);
    new SpatialGrabPrimitive(panel, {
      onGrab: () => ping(panel, 660),
      onRelease: () => {
        for (const slot of chainSlots) {
          const result = slot.attempt(panel);
          if (result === 'accepted') return;
          if (result === 'rejected') {
            springBack(panel, new THREE.Vector3(x, 1.62, 0.35));
            return;
          }
        }
        springBack(panel, new THREE.Vector3(x, 1.62, 0.35));
      },
    });
  });

  // --- Beat 7: badge, agri-biotech vignette and exit portal ----------------
  const badgePlinth = new SpatialBadgePlinth({
    badgeId: 'genomics-architect',
    badgeName: 'GENOMICS ARCHITECT',
    subtitle: 'DNA → RNA → protein, and a careful guide alignment',
    accentColor: 0x38bdf8,
  });
  badgePlinth.name = 'dna-genomics-architect-plinth';
  badgePlinth.position.set(-1.95, 0, 0.85);
  badgePlinth.rotation.y = 0.8;
  root.add(badgePlinth);

  const agriTable = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), material.dark);
  agriTable.position.set(-2.35, 0.86, 0.25);
  root.add(agriTable);
  const stalkGeometry = new THREE.CylinderGeometry(0.012, 0.02, 0.3, 6);
  for (let index = 0; index < 3; index += 1) {
    const stalk = new THREE.Mesh(stalkGeometry, material.emerald);
    stalk.position.set(-2.5 + index * 0.14, 1.02, 0.25);
    stalk.rotation.z = (index - 1) * 0.08;
    root.add(stalk);
  }
  const agriDial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 14), material.metal);
  agriDial.name = 'dna-agri-selection-dial';
  agriDial.position.set(-2.35, 1.0, 0.42);
  root.add(agriDial);
  const agriPanel = createTextPanel('CROP GENOMICS — select for drought tolerance across generations', {
    widthMeters: 0.7, heightMeters: 0.2, fontSizePx: 22, align: 'center',
  });
  agriPanel.name = 'dna-agri-readout';
  agriPanel.position.set(-2.35, 1.22, 0.28);
  agriPanel.lookAt(-1.9, 1.3, 0.6);
  root.add(agriPanel);
  new SpatialSliderPrimitive(agriDial, {
    axis: 'y', minDistance: 0.94, maxDistance: 1.08, snapSteps: 2,
    onValueChange: (value) => {
      const generation = Math.round(value * 2) + 1;
      setTextPanelText(agriPanel, `CROP GENOMICS — generation ${generation}: select hardy plants, keep seed, repeat`);
      ping(agriDial, 520 + generation * 100);
    },
  });

  // --- Diegetic anchors ---------------------------------------------------
  const anchors = new THREE.Group();
  anchors.name = 'dna-genetics-anchors';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchors);
  getSpatialAnchors().forEach((definition) => {
    const anchor = anchorPrimitive.registerAnchor(definition);
    const microSim = new THREE.Group();
    microSim.name = `dna-micro-sim-${definition.id}`;
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.07, 1),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, emissiveIntensity: 0.6 })
    );
    new SpatialGrabPrimitive(core);
    microSim.add(core);
    anchor.setMicroSimContent(microSim);
  });
  root.add(anchors);

  // --- Simplified-model label --------------------------------------------
  const modelLabel = createTextPanel('SIMPLIFIED MODEL — NOT ENGINEERING GRADE', {
    widthMeters: 0.9, heightMeters: 0.12, fontSizePx: 24, align: 'center', background: '#111827', accent: '#f59e0b',
  });
  modelLabel.name = 'simplified-model-not-engineering-grade';
  modelLabel.position.set(0, 0.62, -1.1);
  modelLabel.lookAt(0, 1.0, 0);
  root.add(modelLabel);

  // --- CRISPR lock check --------------------------------------------------
  const crisprTargetPosition = new THREE.Vector3(1.55, 1.22, -2.48);
  const checkCrisprLock = () => {
    if (crisprLocked) return;
    const nearTarget = cas9.position.distanceTo(crisprTargetPosition) < 0.22;
    if (!nearTarget || !crisprAligned) return;
    crisprLocked = true;
    setTextPanelText(repairPanel, 'GUIDE LOCKED — choose a repair outcome (NHEJ or HDR)');
    ping(cas9, 1040);
    comfortPulse(0.2);
    completeChallenge('dna-crispr-capstone');
  };

  // --- Update loop --------------------------------------------------------
  let helixRotation = 0;
  const update = (deltaSeconds: number) => {
    elapsed += deltaSeconds;

    for (let index = tweens.length - 1; index >= 0; index -= 1) {
      const active = tweens[index];
      active.elapsed += deltaSeconds;
      const t = Math.min(1, active.elapsed / Math.max(0.0001, active.duration));
      const eased = t * t * (3 - 2 * t);
      active.apply(active.from + (active.to - active.from) * eased);
      if (t >= 1) tweens.splice(index, 1);
    }

    helixRotation += deltaSeconds * 0.16;
    helix.rotation.y = helixRotation;
    chromatin.rotation.y += deltaSeconds * 0.4;
    cas9.rotation.y += deltaSeconds * 0.25;
    diversityBeads.rotation.y = Math.sin(elapsed * 0.2) * 0.05;
    badgePlinth.tick(deltaSeconds);
    checkCrisprLock();
  };

  const getState = (): DnaGeneticsState => ({
    diveStage,
    unzip: Number(unzip.toFixed(2)),
    basePairs: snappedBases.size,
    translated: translatedCount,
    crisprAligned,
    crisprLocked,
    repairOutcome,
    genotype: GENOTYPES[genotypeIndex],
    diversityLinks,
    badgeUnlocked,
  });

  const dispose = () => {
    anchorPrimitive.dispose();
    const disposedMaterials = new Set<THREE.Material>();
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh || (object as THREE.Line).isLine) {
        mesh.geometry?.dispose();
        const materialOrArray = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(materialOrArray)) {
          materialOrArray.forEach((entry) => {
            if (!disposedMaterials.has(entry)) { entry.dispose(); disposedMaterials.add(entry); }
          });
        } else if (materialOrArray && !disposedMaterials.has(materialOrArray)) {
          materialOrArray.dispose();
          disposedMaterials.add(materialOrArray);
        }
      }
    });
  };

  return { root, anchorPrimitive, update, dispose, getState };
}
