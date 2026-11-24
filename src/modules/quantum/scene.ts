import * as THREE from 'three';
import { createTextPanel } from '../../core/ui/text-panel.js';
import { getSpatialAnchors } from './anchors.js';
import {
  SpatialAnchorPrimitive,
  SpatialScalePinchPrimitive,
} from '../../core/input/primitives/index.js';
import { AssetCache } from '../../core/assets/asset-cache.js';
import { parseAssetNodes } from '../../core/assets/asset-parser.js';
import { createExplodableFromAsset } from '../../core/assets/explodable-adapter.js';
import { FlowPathPlayer } from '../../core/assets/flow-path-player.js';
import { courseEventBus } from '../../core/course/event-bus.js';

export interface QuantumSceneComponents {
  root: THREE.Group;
  hardwarePedestals: THREE.Group[];
  anchorPrimitive: SpatialAnchorPrimitive;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/**
 * Derives a human-readable qubit state description from gate slot contents.
 * Pure function — no side effects, no Three.js dependencies.
 */
export function computeCircuitState(gateSlots: (string | null)[]): string {
  const [slot0, slot1] = gateSlots;
  if (!slot0 && !slot1) return 'State: |0⟩';
  if (slot0 === 'H' && !slot1) return 'State: |+⟩ = (|0⟩+|1⟩)/√2';
  if (slot0 === 'X' && !slot1) return 'State: |1⟩ (bit-flip applied)';
  if (slot0 === 'Z' && !slot1) return 'State: |0⟩ with phase flip (Z|0⟩=|0⟩)';
  if (slot0 === 'H' && slot1 === 'CNOT') return 'Bell state: (|00⟩+|11⟩)/√2 — entangled.';
  if (slot0 === 'X' && slot1 === 'CNOT') return 'State: |11⟩ — both qubits flipped.';
  if (slot0 && slot1) return `State: ${slot0}+${slot1} combination`;
  return 'State: unknown';
}

export async function buildQuantumScene(): Promise<QuantumSceneComponents> {
  const root = new THREE.Group();
  root.name = 'quantum-module-root';

  // 1. Quantum Dark Lab Environment Floor & Wave Interference Pattern (Beat 1)
  const floorGroup = new THREE.Group();
  floorGroup.name = 'quantum-floor-zone';

  const floorGeo = new THREE.PlaneGeometry(12, 12, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    roughness: 0.35,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.05;
  floorGroup.add(floor);

  const quantumBoundaryRing = new THREE.Mesh(
    new THREE.RingGeometry(4.95, 5.0, 64),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  quantumBoundaryRing.rotation.x = -Math.PI / 2;
  quantumBoundaryRing.position.y = 0.002;
  root.add(quantumBoundaryRing);

  root.add(floorGroup);

  // Cryogenic lab room shell: steel walls, low ceiling
  const labRoom = new THREE.Group();
  labRoom.name = 'cryolab-room-shell';
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.42 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.75 });
  // Walls (open front for entry) — room spans x:[-5,+5] z:[-5,0]
  for (const [ox, oy, oz, ow, oh, od] of [
    [0,    1.65, -5.0, 10, 3.3, 0.1],   // back wall at z=-5
    [-5.0, 1.65, -2.5, 0.1, 3.3, 10],  // left wall
    [5.0,  1.65, -2.5, 0.1, 3.3, 10],  // right wall
  ] as [number, number, number, number, number, number][]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ow, oh, od), steelMat);
    wall.position.set(ox, oy, oz);
    labRoom.add(wall);
  }
  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), panelMat);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 3.3, -2.5);
  labRoom.add(ceiling);

  // Steel equipment benches along left wall — z values inside room (z: -5 to 0)
  for (const z of [-4.0, -2.5, -1.0]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.74, 0.65), steelMat);
    bench.position.set(-3.8, 0.37, z);
    labRoom.add(bench);
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.025, 0.67), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.3 }));
    benchTop.position.set(-3.8, 0.755, z);
    labRoom.add(benchTop);
  }

  // Gas handling panels on right wall
  for (let gpi = 0; gpi < 3; gpi++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.08), panelMat);
    panel.position.set(4.9, 1.6, -2.0 + gpi * 2.0);
    labRoom.add(panel);
    // Valve handles
    for (let v = 0; v < 3; v++) {
      const valve = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
      valve.position.set(4.86, 1.4 + v * 0.22, -2.0 + gpi * 2.0);
      valve.rotation.y = Math.PI / 2;
      labRoom.add(valve);
    }
  }

  // Cable management racks on ceiling
  for (let cr = 0; cr < 4; cr++) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 }));
    rack.position.set(0, 3.1, -1.5 + cr * 1.0);
    labRoom.add(rack);
  }

  root.add(labRoom);

  // ─── GLB asset loading ─────────────────────────────────────────────────
  const assetCache = new AssetCache();
  const glbDisposals: Array<() => void> = [];

  async function placeQuantumAsset(url: string, position: THREE.Vector3, options?: {
    rotationY?: number;
    fitToHeight?: number;
    label?: string;
    hasFlows?: boolean;
    explodable?: boolean;
    onLoaded?: (scene: THREE.Object3D, assembly?: any) => void;
  }): Promise<void> {
    try {
      const loaded = await assetCache.load(url);
      const assetScene = loaded.scene.clone();

      // Parse the freshly cloned scene so part.object references actual visible meshes
      const parsed = parseAssetNodes(assetScene);

      // Scale to fit
      const box = new THREE.Box3().setFromObject(assetScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = options?.fitToHeight ?? 0.8;
      const scaleFactor = maxDim > 0 ? targetHeight / maxDim : 1;
      assetScene.scale.setScalar(scaleFactor);

      // Recompute bounding box after scale
      const scaledBox = new THREE.Box3().setFromObject(assetScene);
      assetScene.position.set(
        position.x - (scaledBox.min.x + scaledBox.max.x) / 2,
        position.y - scaledBox.min.y,
        position.z - (scaledBox.min.z + scaledBox.max.z) / 2,
      );
      if (options?.rotationY) assetScene.rotation.y = options.rotationY;
      root.add(assetScene);

      let assembly: any = null;
      // Wire explodable adapter if requested
      if (options?.explodable) {
        assembly = createExplodableFromAsset(parsed, assetScene as unknown as THREE.Group, {
          onEvent: (ev) => {
            if (ev.type === 'tap') {
              const tag = createTextPanel(ev.part.label, {
                widthMeters: 0.22, heightMeters: 0.06, fontSizePx: 14, align: 'center',
                background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8',
              });
              const wp = new THREE.Vector3();
              ev.part.object.getWorldPosition(wp);
              tag.position.copy(wp).add(new THREE.Vector3(0, 0.12, 0));
              root.add(tag);
              setTimeout(() => { root.remove(tag); }, 4000);
            }
          },
        });
        const pinch = new SpatialScalePinchPrimitive(assetScene as unknown as THREE.Group, {
          minScale: 0.8, maxScale: 2.0, preventObjectScale: true,
          onExplodeFraction: (frac) => assembly.setExplodeAmount(frac),
        });
        assetScene.userData.explodableAssembly = assembly;
        assetScene.userData.scalePinchPrimitive = pinch;
      }

      // Flow paths
      const flowPlayers: FlowPathPlayer[] = [];
      if (options?.hasFlows) {
        for (const flow of parsed.flows) {
          const colorHex = flow.flowColor ?? 0x38bdf8;
          const fp = new FlowPathPlayer({ flowPath: flow.flowPath, flowColor: colorHex, particleCount: 20, speed: 0.08 });
          fp.mesh.position.copy(assetScene.position);
          fp.mesh.scale.copy(assetScene.scale);
          root.add(fp.mesh);
          flowPlayers.push(fp);
        }
      }

      options?.onLoaded?.(assetScene, assembly);

      glbDisposals.push(() => {
        assetCache.release(url);
        for (const fp of flowPlayers) {
          fp.mesh.parent?.remove(fp.mesh);
          (fp.mesh.geometry as THREE.BufferGeometry).dispose();
        }
        if (assetScene.parent) assetScene.parent.remove(assetScene);
      });
    } catch (err) {
      const errPlaque = createTextPanel(`⚠ Failed to load\n${options?.label ?? url.split('/').pop()}`, {
        widthMeters: 0.4, heightMeters: 0.1, fontSizePx: 14, align: 'center',
        background: '#7f1d1d', color: '#fecaca', accent: '#ef4444', lines: 2,
      });
      errPlaque.position.copy(position).add(new THREE.Vector3(0, 1.0, 0));
      root.add(errPlaque);
      console.warn('[Quantum] GLB load failed:', err);
    }
  }

  // --- Dedicated Lab Benches & Tables (Grounds all apparatus at ergonomic height 0.78 m) ---
  function createLabTable(x: number, z: number, width: number, depth: number, height = 0.78, isOptical = false): THREE.Group {
    const tableGroup = new THREE.Group();
    tableGroup.name = `quantum-table-${x}-${z}`;
    const legRadius = isOptical ? 0.045 : 0.035;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, height, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: isOptical ? 0x1e293b : 0x334155,
      metalness: 0.65,
      roughness: 0.35,
    });

    // 4 sturdy legs reaching the floor (y=0 to y=height)
    const dx = width / 2 - 0.08;
    const dz = depth / 2 - 0.08;
    for (const [lx, lz] of [
      [-dx, -dz],
      [dx, -dz],
      [-dx, dz],
      [dx, dz],
    ] as [number, number][]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, height / 2, lz);
      tableGroup.add(leg);
    }

    // Heavy-duty tabletop
    const topThick = isOptical ? 0.055 : 0.035;
    const topGeo = new THREE.BoxGeometry(width, topThick, depth);
    const topMat = new THREE.MeshStandardMaterial({
      color: isOptical ? 0x0f172a : 0x1e293b,
      metalness: isOptical ? 0.75 : 0.45,
      roughness: isOptical ? 0.25 : 0.55,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, height - topThick / 2, 0);
    tableGroup.add(top);

    tableGroup.position.set(x, 0, z);
    root.add(tableGroup);
    return tableGroup;
  }

  // 1. Dilution Refrigerator: Ceiling suspension mount at (0, 3.3, -2.2)
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
  const suspensionCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 24), gantryMat);
  suspensionCollar.position.set(0, 3.2, -2.2);
  root.add(suspensionCollar);
  for (let r = 0; r < 4; r++) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 12), gantryMat);
    const angle = (r * Math.PI) / 2;
    rod.position.set(Math.cos(angle) * 0.45, 2.75, -2.2 + Math.sin(angle) * 0.45);
    root.add(rod);
  }

  // 2. Optical Breadboard Tables for Bell State and Double Slit
  createLabTable(-2.0, -3.4, 1.5, 0.9, 0.78, true); // Bell optical table
  createLabTable(2.0, -3.4, 1.5, 0.9, 0.78, true);  // Double-slit optical table

  // 3. Front Lab Benches for Bloch Sphere and QC Circuit Kit
  createLabTable(-2.0, -1.8, 1.2, 0.9, 0.78, false); // Bloch sphere bench
  createLabTable(2.0, -1.8, 1.3, 0.9, 0.78, false);  // Circuit kit bench

  // 4. Back Wall Hardware Architectures Gallery Bench
  createLabTable(0, -4.5, 3.6, 0.8, 0.78, false); // Gallery display table

  // Place all quantum GLB assets in parallel directly on table surfaces (y=0.78)
  await Promise.all([
    // Dilution refrigerator — in the CENTRE OF THE ROOM (x=0, z=-2.2), hanging from ceiling at accessible height (base at 1.0 m)
    // Exploded view operated by two hands (pinch gesture) or direct click — NO LEVERS
    placeQuantumAsset('/models/quantum/quantum_dilution_refrigerator.glb', new THREE.Vector3(0, 1.0, -2.2), {
      fitToHeight: 1.4,
      explodable: true,
      hasFlows: true,
      label: 'Dilution Refrigerator',
    }),
    // Bloch sphere on lab bench at y=0.78 (no double-pedestal, flush on table)
    placeQuantumAsset('/models/quantum/bloch_sphere.glb', new THREE.Vector3(-2.0, 0.78, -1.8), {
      fitToHeight: 0.55, explodable: true, label: 'Bloch Sphere',
      onLoaded: (scene) => {
        // Measure button on Bloch pedestal
        const measureBtn = createTextPanel('MEASURE', {
          widthMeters: 0.2, heightMeters: 0.06, fontSizePx: 20, align: 'center',
          background: '#047857', color: '#ecfdf5', accent: '#10b981',
        });
        measureBtn.name = 'bloch-measure-button';
        measureBtn.position.set(0, 0.05, 0.25);
        measureBtn.userData.activate = () => {
          const outcome = Math.random() < 0.5 ? 0 : 1;
          courseEventBus.emit('measured', 'bloch-qubit', outcome, { shots: 1 });
        };
        scene.add(measureBtn);
      },
    }),
    // Quantum circuit kit on lab table at y=0.78
    placeQuantumAsset('/models/quantum/qc_circuit_kit.glb', new THREE.Vector3(2.0, 0.78, -1.8), {
      fitToHeight: 0.35, label: 'QC Circuit Kit',
    }),
    // Bell optical bench resting on dedicated optical table at y=0.78
    placeQuantumAsset('/models/quantum/bell_bench.glb', new THREE.Vector3(-2.0, 0.78, -3.4), {
      fitToHeight: 0.38, hasFlows: true, label: 'Bell Optical Bench',
    }),
    // Double slit bench resting on dedicated optical table at y=0.78
    placeQuantumAsset('/models/quantum/double_slit_bench.glb', new THREE.Vector3(2.0, 0.78, -3.4), {
      fitToHeight: 0.35, label: 'Double Slit Bench',
    }),
    // Hardware gallery resting on wide back-wall display table at y=0.78
    placeQuantumAsset('/models/quantum/qc_architectures_gallery.glb', new THREE.Vector3(0, 0.78, -4.5), {
      fitToHeight: 0.35, label: 'QC Architectures Gallery',
    }),
    // QPU chip on the left equipment bench top at y=0.78
    placeQuantumAsset('/models/quantum/qpu_chip_transmon.glb', new THREE.Vector3(-3.8, 0.78, -2.5), {
      fitToHeight: 0.22, label: 'QPU Chip (Transmon)',
    }),
    // Josephson junction on the left equipment bench top at y=0.78
    placeQuantumAsset('/models/quantum/josephson_junction.glb', new THREE.Vector3(-3.8, 0.78, -1.2), {
      fitToHeight: 0.18, label: 'Josephson Junction',
    }),
  ]);

  const hardwarePedestals: THREE.Group[] = [];

  // Diegetic Spatial Anchors Kit
  const anchorContainer = new THREE.Group();
  anchorContainer.name = 'quantum-anchors-container';
  const anchorPrimitive = new SpatialAnchorPrimitive(anchorContainer);
  const anchorDefs = getSpatialAnchors();
  anchorDefs.forEach((def) => {
    anchorPrimitive.registerAnchor(def, 'foundation');
  });
  anchorPrimitive.staggerOverlapping();
  anchorPrimitive.batchLeaderLines();
  root.add(anchorContainer);

  // Lab Aesthetic: Fluorescent strip lights
  for (const sx of [-2, 0, 2]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.04, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.4 }),
    );
    strip.position.set(sx, 2.9, 0);
    root.add(strip);
    const stripLight = new THREE.PointLight(0xffffff, 0.6, 4);
    stripLight.position.set(sx, 2.85, 0);
    root.add(stripLight);
  }

  // Equipment rack on right wall
  const rackBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 2.0, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.5 }),
  );
  rackBody.position.set(4.6, 1.0, 0);
  root.add(rackBody);
  const ledColors = [0x22c55e, 0xef4444, 0x3b82f6, 0xf59e0b, 0x22c55e, 0xef4444];
  for (let li = 0; li < 6; li++) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 0.06),
      new THREE.MeshStandardMaterial({ color: ledColors[li], emissive: ledColors[li], emissiveIntensity: 0.8 }),
    );
    led.position.set(4.6, 1.8 - li * 0.3, 0.21);
    root.add(led);
  }

  // Helium recovery pipes on ceiling
  for (const px of [-1.5, 1.5]) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 4.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 }),
    );
    pipe.position.set(px, 3.1, 0);
    root.add(pipe);
  }

  // Warning signs
  const cryoSign = createTextPanel('⚠ CRYOGENIC HAZARD', {
    widthMeters: 0.5, heightMeters: 0.08, fontSizePx: 20, align: 'center',
    background: '#1e3a5f', color: '#fbbf24', accent: '#fbbf24',
  });
  cryoSign.position.set(-4.6, 1.8, 0);
  cryoSign.rotation.y = Math.PI / 2;
  root.add(cryoSign);

  const magSign = createTextPanel('⚠ MAGNETIC FIELD — REMOVE METALLIC OBJECTS', {
    widthMeters: 0.7, heightMeters: 0.08, fontSizePx: 18, align: 'center',
    background: '#1e3a5f', color: '#fbbf24', accent: '#fbbf24',
  });
  magSign.position.set(4.6, 2.1, 0);
  magSign.rotation.y = -Math.PI / 2;
  root.add(magSign);

  // Welcome board at room entrance
  const boardBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.75, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  );
  boardBacking.name = 'quantum-welcome-board';
  boardBacking.position.set(0, 1.1, 3.5);
  root.add(boardBacking);

  const welcomeText = [
    'QUANTUM COMPUTING LAB',
    '─────────────────────────────',
    '1. Pinch-pull the cryostat to explore cooling stages',
    '2. Grab gate tokens on the circuit kit table',
    '3. Inspect Bloch sphere — tap parts to learn states',
    '4. Walk to the hardware gallery for qubit architectures',
    '',
    'Move: LEFT thumbstick / teleport arc.',
    'The room extends beyond the VR guardian.',
  ].join('\n');

  const boardPanel = createTextPanel(welcomeText, {
    widthMeters: 1.0, heightMeters: 0.68, fontSizePx: 17, align: 'left',
    background: '#1a0a00', color: '#fef3c7', accent: '#fbbf24',
    lines: 9, pixelWidth: 820, pixelHeight: 560,
  });
  boardPanel.position.set(0, 1.1, 3.48);
  root.add(boardPanel);

  function update(_deltaSeconds: number): void {
    // Animation handled by GLB assets (no procedural animation needed here)
  }

  function dispose(): void {
    anchorPrimitive.dispose();
    for (const cleanup of glbDisposals) cleanup();
  }

  return {
    root,
    hardwarePedestals,
    anchorPrimitive,
    update,
    dispose,
  };
}

/*
 * BUDGET ESTIMATE (NOT measured on device):
 * Floor + ceiling + walls: ~600 tris
 * GLB assets (cryostat 18k + bloch 5k + circuit kit 10k + bell 1.3k + double slit 0.2k + QPU 7k + JJ 1.5k): ~44,000 tris
 * Hardware gallery (7 procedural pedestals): ~1,800 tris
 * Lab aesthetic (strips, rack, pipes, signs): ~350 tris
 * Welcome board: ~12 tris
 * Misc labels / text panels: ~40 panels × 2 tris = ~80 tris
 * Triangles total: ~47,000 / working target 150,000 / ceiling 250,000
 * Draw calls: ~100 / working target 108 / ceiling 180
 * NOT measured on device.
 */


