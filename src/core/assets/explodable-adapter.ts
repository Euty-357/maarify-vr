/**
 * Explodable adapter: builds an ExplodableAssembly from a parsed GLB asset.
 *
 * Registers every part with the existing ExplodableAssembly (reusing its API),
 * normalises directions, skips non-moving parts (but keeps them tappable),
 * supports setExplodeAmount(0..1), rest-pose restore, per-part highlight,
 * tap and hover events, and the existing pinch-pull explode gesture.
 *
 * Extends ExplodableAssembly additively — no changes to the existing primitive.
 */

import * as THREE from 'three';
import { ExplodableAssembly, ExplodablePart } from '../input/primitives/explodable-assembly.js';
import { ActiveTuning } from '../../config/tuning.js';
import { triggerHapticPulse } from '../../core/haptics/haptics.js';
import { courseEventBus } from '../course/event-bus.js';
import { createTextPanel, setTextPanelText } from '../ui/text-panel.js';
import type { AssetPart, ParsedAsset } from './types.js';

interface ExplodablePartWithMoving extends ExplodablePart {
  isMoving: boolean;
}

/** Events emitted by the explodable adapter. */
export type ExplodableAdapterEvent =
  | { type: 'tap'; partId: string; part: AssetPart }
  | { type: 'hover'; partId: string; part: AssetPart; entered: boolean }
  | { type: 'explode-changed'; amount: number };

/** Options for createExplodableFromAsset. */
export interface ExplodableAdapterOptions {
  onEvent?: (event: ExplodableAdapterEvent) => void;
  defaultExplodeDistanceMeters?: number;
  defaultSnapDistanceMeters?: number;
}

export interface ExplodableAdapterAssembly extends ExplodableAssembly {
  resetRestPose(): void;
  highlightPart(partId: string, enabled: boolean): void;
  highlightMovingParts(enabled: boolean): void;
}

/**
 * Create an ExplodableAssembly from a parsed asset.
 *
 * Every moving part (isMoving === true) is registered with explode direction and
 * distance from the asset. Non-moving parts (zero distance or zero vector) are
 * still registered and tappable but with explodeDistanceMeters = 0 so
 * setExplodeAmount leaves them at home.
 *
 * Tap/hover are wired through each part's grab primitive. Highlight is applied
 * by tinting the part's material emissive on hover.
 *
 * @param asset - Parsed asset (from parseAssetNodes).
 * @param root - The Three.js Group to attach parts to (usually the asset scene).
 * @param options - Optional callbacks and defaults.
 * @returns The ExplodableAssembly with all parts registered.
 */
export function createExplodableFromAsset(
  asset: ParsedAsset,
  root: THREE.Group,
  options: ExplodableAdapterOptions = {},
): ExplodableAdapterAssembly {
  const assembly = new ExplodableAssembly(root) as ExplodableAdapterAssembly;
  const { onEvent, defaultSnapDistanceMeters = 0.12 } = options;

  const highlightState = new Map<string, { originalEmissive: number | null; material: THREE.Material }>();

  for (const part of asset.parts) {
    const optionsObj: Parameters<ExplodableAssembly['addPart']>[2] = {
      label: part.label,
      explodeDirection: part.isMoving ? part.explodeDirection! : new THREE.Vector3(1, 0, 0),
      explodeDistanceMeters: part.isMoving ? part.explodeDistanceMeters : 0,
      snapDistanceMeters: defaultSnapDistanceMeters,
    };

    const registered = assembly.addPart(part.partId, part.object, optionsObj);
    const movingPart = registered as unknown as ExplodablePartWithMoving;
    movingPart.isMoving = part.isMoving;

    const grab = registered.grab;
    const originalOnGrab = grab.options.onGrab;
    const originalOnRelease = grab.options.onRelease;

    grab.options.onGrab = (hand) => {
      originalOnGrab?.(hand);
      setHighlight(part, true, highlightState);
      onEvent?.({ type: 'tap', partId: part.partId, part });
      triggerHapticPulse(undefined as unknown as XRInputSource, ActiveTuning.haptics.hover.intensity, ActiveTuning.haptics.hover.durationMs);
    };

    grab.options.onRelease = (inputSource) => {
      originalOnRelease?.(inputSource);
      setHighlight(part, false, highlightState);
      onEvent?.({ type: 'explode-changed', amount: assembly.explodeAmount });
    };

    part.object.userData.explodableAdapterPartId = part.partId;
    part.object.userData.explodableAssembly = assembly;
    // Mark the part so tooling can tell an explodable GLB part apart from
    // static geometry (see src/core/input/ray-hit.ts for the pointer rules).
    part.object.userData.isExplodablePart = true;
  }

  const originalSetExplodeAmount = assembly.setExplodeAmount.bind(assembly);
  assembly.setExplodeAmount = (amount: number) => {
    originalSetExplodeAmount(amount);
    onEvent?.({ type: 'explode-changed', amount: assembly.explodeAmount });
    courseEventBus.emit('explodeChanged', undefined, assembly.explodeAmount);
  };

  /** Restore every part to its rest (home) pose. */
  assembly.resetRestPose = () => {
    assembly.explodeAmount = 0;
    for (const part of assembly.parts.values()) {
      part.detached = false;
      part.object.position.copy(part.homePosition);
      part.object.quaternion.copy(part.homeQuaternion);
    }
    onEvent?.({ type: 'explode-changed', amount: 0 });
  };

  /** Highlight a single part by partId (diegetic tint, no head-locked UI). */
  assembly.highlightPart = (partId: string, enabled: boolean) => {
    const part = assembly.parts.get(partId);
    if (!part) return;
    setHighlight(part as unknown as AssetPart, enabled, highlightState);
  };

  /** Highlight all moving parts (used for the exploded cue). */
  assembly.highlightMovingParts = (enabled: boolean) => {
    for (const part of assembly.parts.values()) {
      if ((part as ExplodablePartWithMoving).isMoving) {
        setHighlight(part as unknown as AssetPart, enabled, highlightState);
      }
    }
  };

  // Add diegetic brass plaque button on each assembly (EXPLODE ⤢ / ASSEMBLE ⤡)
  // Activated by ray or touch, animated 0 to 1 smoothly
  const plaque = createTextPanel('EXPLODE ⤢', {
    widthMeters: 0.28,
    heightMeters: 0.08,
    fontSizePx: 26,
    align: 'center',
    background: '#3a2416',
    color: '#e8dcc0',
    accent: '#b08d57',
    pixelWidth: 320,
    pixelHeight: 96,
    lines: 1,
  });
  plaque.name = `plaque-explode-${root.name || 'assembly'}`;
  plaque.position.set(0, 0.1, 0.45);
  plaque.userData.isExplodePlaque = true;

  let animating = false;
  let targetAmount = 0;
  const animateStep = () => {
    if (!animating) return;
    const current = assembly.explodeAmount;
    const diff = targetAmount - current;
    if (Math.abs(diff) < 0.04) {
      assembly.setExplodeAmount(targetAmount);
      animating = false;
      setTextPanelText(plaque, targetAmount > 0.5 ? 'ASSEMBLE ⤡' : 'EXPLODE ⤢');
      return;
    }
    assembly.setExplodeAmount(current + Math.sign(diff) * 0.08);
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(animateStep);
    } else {
      assembly.setExplodeAmount(targetAmount);
      animating = false;
      setTextPanelText(plaque, targetAmount > 0.5 ? 'ASSEMBLE ⤡' : 'EXPLODE ⤢');
    }
  };

  plaque.userData.activate = () => {
    targetAmount = assembly.explodeAmount > 0.5 ? 0 : 1;
    animating = true;
    animateStep();
  };
  root.add(plaque);

  return assembly;
}

function setHighlight(
  part: AssetPart,
  enabled: boolean,
  highlightState: Map<string, { originalEmissive: number | null; material: THREE.Material }>,
): void {
  const material = Array.isArray(part.object.material)
    ? part.object.material[0]
    : part.object.material;
  if (!material) return;
  const mat = material as THREE.Material & { emissive?: THREE.Color };
  if (!mat.emissive) return;

  const existing = highlightState.get(part.partId);
  if (enabled) {
    if (!existing) {
      highlightState.set(part.partId, {
        originalEmissive: mat.emissive instanceof THREE.Color ? mat.emissive.getHex() : null,
        material,
      });
      mat.emissive.setHex(0x38bdf8);
    }
  } else {
    if (existing) {
      (existing.material as THREE.Material & { emissive?: THREE.Color }).emissive?.setHex(existing.originalEmissive ?? 0x000000);
      highlightState.delete(part.partId);
    }
  }
}