/**
 * Asset Lab — developer-only module for inspecting GLB assets from the registry.
 *
 * Features:
 * - Every asset in ASSET_REGISTRY sits on a shelf.
 * - Ray-select one to place it 1 m in front of the learner at authored scale.
 * - Works seated and standing (the placed asset is always at the same height).
 * - Explode (lever) through createExplodableFromAsset.
 * - Tap a part for its label and description (diegetic, no head-locked UI).
 * - Flow play toggle through FlowPathPlayer.
 * - Dock a dock-capable part into its socket through DockingSystem.
 * - A stats panel anchored beside the asset.
 *
 * Hidden from the hub in production builds; reachable via ?dev=true.
 * No changes to other modules.
 */

import * as THREE from 'three';
import {
  SpatialSliderPrimitive,
  SpatialGrabPrimitive,
} from '../../core/input/primitives/index.js';
import { createTextPanel, setTextPanelText } from '../../core/ui/text-panel.js';
import {
  ASSET_REGISTRY,
  type AssetRegistryEntry,
} from '../../core/assets/registry.generated.js';
import { parseAssetNodes } from '../../core/assets/asset-parser.js';
import type { ParsedAsset } from '../../core/assets/types.js';
import { AssetCache } from '../../core/assets/asset-cache.js';
import { createExplodableFromAsset } from '../../core/assets/explodable-adapter.js';
import { DockingSystem } from '../../core/assets/docking-system.js';
import { FlowPathPlayer } from '../../core/assets/flow-path-player.js';

export interface AssetLabSceneComponents {
  root: THREE.Group;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
  /** Place an asset from the registry by name. Used by tests and the e2e run. */
  placeAssetByName: (assetName: string) => Promise<void>;
  /** Currently placed asset name, or null. */
  getPlacedAssetName: () => string | null;
  /** Explode amount of the placed asset (0..1). */
  getExplodeAmount: () => number;
  /** Set the explode amount of the placed asset (0..1). */
  setExplodeAmount: (amount: number) => void;
  /** Toggle the flow playback of the placed asset. */
  toggleFlow: () => void;
}

const SHELF_SPACING = 0.55;
const PLACE_DISTANCE = 1.0;
const PLACE_HEIGHT = 1.2;

/** A placed asset with everything the lab needs to drive it. */
interface PlacedAsset {
  entry: AssetRegistryEntry;
  url: string;
  root: THREE.Group;
  parsed: ParsedAsset;
  assembly: ReturnType<typeof createExplodableFromAsset>;
  docking: DockingSystem;
  flowPlayers: FlowPathPlayer[];
}

export async function buildAssetLabScene(): Promise<AssetLabSceneComponents> {
  const root = new THREE.Group();
  root.name = 'asset-lab-root';

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);

  const shelfEntries: AssetRegistryEntry[] = Array.from(ASSET_REGISTRY);

  // ── Stats panel, anchored beside the placed asset ──
  const statsPanel = createTextPanel('No asset placed', {
    widthMeters: 0.6, heightMeters: 0.3, fontSizePx: 16, align: 'left',
    background: '#0f172a', color: '#e2e8f0', accent: '#38bdf8', lines: 6,
  });
  statsPanel.position.set(0.95, 1.5, -PLACE_DISTANCE);
  statsPanel.lookAt(0, 1.5, -PLACE_DISTANCE);
  root.add(statsPanel);

  // ── Part label panel, shown when a part is tapped ──
  const partLabelPanel = createTextPanel('', {
    widthMeters: 0.5, heightMeters: 0.14, fontSizePx: 18, align: 'left',
    background: '#241610', color: '#f2d8a5', accent: '#b08d57', lines: 3,
  });
  partLabelPanel.position.set(-0.95, 1.5, -PLACE_DISTANCE);
  partLabelPanel.lookAt(0, 1.5, -PLACE_DISTANCE);
  partLabelPanel.visible = false;
  root.add(partLabelPanel);

  // ── Shelf ──
  const shelf = new THREE.Group();
  shelf.name = 'asset-shelf';
  shelf.position.set(-2.6, 1.0, 0);
  root.add(shelf);

  const slotGeometry = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const slotMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, transparent: true, opacity: 0.55,
  });

  shelfEntries.forEach((entry, index) => {
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(0, (index - (shelfEntries.length - 1) / 2) * SHELF_SPACING, 0);
    slot.userData.entry = entry;
    slot.userData.isShelfSlot = true;
    slot.userData.activate = () => {
      void placeAsset(entry);
    };
    shelf.add(slot);
  });

  const cache = new AssetCache();
  let placed: PlacedAsset | null = null;
  let explodeAmount = 0;
  let flowEnabled = false;

  function updateStats(entry: AssetRegistryEntry, parsed: ParsedAsset | null): void {
    const tris = parsed ? parsed.totalTriangles : entry.totalTriangles;
    const parts = parsed ? parsed.parts.length : entry.partIds.length;
    const warnings = parsed ? parsed.warnings.length : 0;
    const movingParts = parsed ? parsed.parts.filter((p) => p.isMoving).length : 0;
    const draws = parsed ? parsed.parts.length * 5 : entry.partIds.length * 5;
    const lines = [
      `Asset: ${entry.assetName}`,
      `Module: ${entry.module}`,
      `Triangles: ${tris.toLocaleString()}`,
      `Est. draw calls: ~${draws}`,
      `Parts: ${parts} (moving: ${movingParts})`,
      `Warnings: ${warnings}`,
    ];
    setTextPanelText(statsPanel, lines.join('\n'));
  }

  function clearPlacedAsset(): void {
    if (!placed) return;
    placed.assembly.resetRestPose();
    placed.flowPlayers.forEach((p) => p.dispose());
    placed.root.parent?.remove(placed.root);
    // Release the cache reference so the GLB's geometries and materials are
    // disposed when the last holder lets go.
    cache.release(placed.url);
    placed = null;
    explodeAmount = 0;
    flowEnabled = false;
    setTextPanelText(statsPanel, 'No asset placed');
    partLabelPanel.visible = false;
  }

  async function placeAsset(entry: AssetRegistryEntry): Promise<void> {
    clearPlacedAsset();

    // AssetCache owns loading, parsing and disposal. Loading through it means
    // the lab shares one instance per URL and releases geometries and
    // materials when the last reference goes away.
    let loaded;
    try {
      loaded = await cache.load(entry.url);
    } catch {
      // Graceful degradation: a procedural stand-in keeps the lab usable
      // while the real asset is missing or fails to load.
      const fallbackScene = new THREE.Scene();
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x7f1d1d }),
      );
      fallback.name = 'asset-lab-fallback';
      fallbackScene.add(fallback);
      loaded = {
        url: entry.url,
        scene: fallbackScene,
        parsed: parseAssetNodes(fallbackScene),
        refCount: 1,
      };
    }

    const parsed = loaded.parsed;
    const placedRoot = new THREE.Group();
    placedRoot.position.set(0, PLACE_HEIGHT, -PLACE_DISTANCE);
    placedRoot.add(loaded.scene);

    // createExplodableFromAsset registers every part with the shared
    // ExplodableAssembly: grab, explode, rest-pose restore and per-part tap.
    const assembly = createExplodableFromAsset(parsed, placedRoot);

    // Docking: register every part with a grab primitive as a peg and every
    // asset anchor as a socket.
    const docking = new DockingSystem({
      onEvent: (event) => {
        if (event.type === 'docked') {
          setTextPanelText(partLabelPanel, `Docked: ${event.anchorName}`);
          partLabelPanel.visible = true;
        } else if (event.type === 'rejected') {
          setTextPanelText(partLabelPanel, `Rejected: ${event.anchorName} does not accept this part.`);
          partLabelPanel.visible = true;
        }
      },
    });
    for (const part of parsed.parts) {
      const grab = part.object.userData.grabPrimitive as SpatialGrabPrimitive | undefined;
      if (grab) {
        docking.registerPeg(part.partId, part.object, part.partId, grab);
      }
    }
    for (const anchor of parsed.anchors) {
      docking.registerAnchor(anchor);
    }

    // Flow players for every authored flow path.
    const flowPlayers: FlowPathPlayer[] = [];
    for (const flow of parsed.flows) {
      if (flow.flowPath.length < 2) continue;
      const player = new FlowPathPlayer({
        flowPath: flow.flowPath,
        flowColor: flow.flowColor,
        particleCount: 16,
        particleSize: 0.015,
        speed: 0.15,
      });
      placedRoot.add(player.mesh);
      flowPlayers.push(player);
    }

    // Tapping a part shows its diegetic label and description.
    for (const part of parsed.parts) {
      const grab = part.object.userData.grabPrimitive as SpatialGrabPrimitive | undefined;
      if (!grab) continue;
      const originalOnGrab = grab.options.onGrab;
      grab.options.onGrab = (hand) => {
        originalOnGrab?.(hand);
        setTextPanelText(partLabelPanel, `${part.label}\n${part.description}`);
        partLabelPanel.visible = true;
      };
    }

    placed = { entry, url: entry.url, root: placedRoot, parsed, assembly, docking, flowPlayers };
    root.add(placedRoot);

    updateStats(entry, parsed);
  }

  // ── Explode slider ──
  const explodeSliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  explodeSliderTrack.position.set(1.35, 0.35, -0.4);
  root.add(explodeSliderTrack);

  const explodeHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b }),
  );
  explodeHandle.name = 'asset-lab-explode';
  explodeHandle.position.set(1.35, 0.38, -0.5);
  root.add(explodeHandle);

  new SpatialSliderPrimitive(explodeHandle, {
    axis: 'z', minDistance: -0.5, maxDistance: -0.3,
    courseId: 'asset-lab-explode',
    onValueChange: (norm) => {
      explodeAmount = norm;
      placed?.assembly.setExplodeAmount(norm);
    },
  });

  const explodeLbl = createTextPanel('Explode', {
    widthMeters: 0.28, heightMeters: 0.07, fontSizePx: 16, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  explodeLbl.position.set(1.35, 0.62, -0.4);
  root.add(explodeLbl);

  // ── Flow toggle slider ──
  const flowSliderTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x334155 }),
  );
  flowSliderTrack.position.set(1.35, 0.35, -1.1);
  root.add(flowSliderTrack);

  const flowHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
  );
  flowHandle.name = 'asset-lab-flow';
  flowHandle.position.set(1.35, 0.38, -1.2);
  root.add(flowHandle);

  new SpatialSliderPrimitive(flowHandle, {
    axis: 'z', minDistance: -1.2, maxDistance: -1.0,
    courseId: 'asset-lab-flow',
    onValueChange: (norm) => {
      flowEnabled = norm > 0.5;
    },
  });

  const flowLbl = createTextPanel('Flow', {
    widthMeters: 0.28, heightMeters: 0.07, fontSizePx: 16, align: 'center',
    background: '#0f172a', color: '#94a3b8',
  });
  flowLbl.position.set(1.35, 0.62, -1.1);
  root.add(flowLbl);

  const update = (deltaSeconds: number): void => {
    if (!placed) return;
    placed.assembly.setExplodeAmount(explodeAmount);
    if (flowEnabled) {
      for (const player of placed.flowPlayers) {
        player.update(deltaSeconds);
      }
    }
  };

  function dispose(): void {
    clearPlacedAsset();
    cache.releaseAll();
    slotGeometry.dispose();
    slotMaterial.dispose();
    for (const panel of [statsPanel, partLabelPanel, explodeLbl, flowLbl]) {
      panel.geometry.dispose();
      const mat = panel.material as THREE.Material;
      mat.dispose();
    }
    floor.geometry.dispose();
    const floorMat = floor.material as THREE.Material;
    floorMat.dispose();
  }

  return {
    root,
    update,
    dispose,
    placeAssetByName: async (assetName: string) => {
      const entry = shelfEntries.find((e) => e.assetName === assetName);
      if (!entry) throw new Error(`Unknown asset: ${assetName}`);
      await placeAsset(entry);
    },
    getPlacedAssetName: () => placed?.entry.assetName ?? null,
    getExplodeAmount: () => explodeAmount,
    setExplodeAmount: (amount: number) => {
      explodeAmount = Math.max(0, Math.min(1, amount));
      placed?.assembly.setExplodeAmount(explodeAmount);
    },
    toggleFlow: () => {
      flowEnabled = !flowEnabled;
    },
  };
}
