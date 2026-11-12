import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';

/**
 * Pure input-state helpers shared by the entry point and (later) the interaction
 * primitives. Keeping the maths here makes edge detection, pinch hysteresis and
 * source selection unit-testable without a headset or a DOM.
 */

export type Handedness = 'left' | 'right';

export interface EdgeState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

export const IDLE_EDGE: EdgeState = { pressed: false, justPressed: false, justReleased: false };

/** Edge detection from a held-button boolean. Stateless: feed it the previous press. */
export function nextEdge(previousPressed: boolean, pressed: boolean): EdgeState {
  return {
    pressed,
    justPressed: pressed && !previousPressed,
    justReleased: !pressed && previousPressed,
  };
}

/** Map an input source to a hand, ignoring gaze and unknown handedness. */
export function sourceHandedness(source: XRInputSource | null | undefined): Handedness | null {
  if (!source) return null;
  return source.handedness === 'left' || source.handedness === 'right' ? source.handedness : null;
}

/**
 * Select the live source for a hand from the current frame's list. Re-reading the
 * list every frame avoids stale references after the Quest swaps hands and controllers.
 */
export function selectSource(sources: XRInputSource[], handedness: Handedness): XRInputSource | null {
  for (const source of sources) {
    if (sourceHandedness(source) === handedness) return source;
  }
  return null;
}

export interface PinchState {
  active: boolean;
  distanceMeters: number;
}

/**
 * Pinch detection with hysteresis on the thumb-tip to index-tip distance. Enter
 * below `enterMeters`, leave above `exitMeters`, so the pinch does not chatter.
 */
export function nextPinch(
  previouslyActive: boolean,
  distanceMeters: number,
  enterMeters: number = ActiveTuning.input.pinchEnterMeters,
  exitMeters: number = ActiveTuning.input.pinchExitMeters
): PinchState {
  const active = previouslyActive
    ? distanceMeters < exitMeters
    : distanceMeters < enterMeters;
  return { active, distanceMeters };
}

const scratchMatrix = new THREE.Matrix4();
const scratchScale = new THREE.Vector3();

/** Decompose an XR pose matrix (column-major 16 floats) into origin and rotation. */
export function poseFromMatrix(
  matrix: ArrayLike<number>,
  origin: THREE.Vector3,
  quaternion: THREE.Quaternion
): void {
  scratchMatrix.fromArray(matrix as number[]);
  scratchMatrix.decompose(origin, quaternion, scratchScale);
}

/** Pointing direction of a target-ray space, which is -Z in WebXR. */
export function forwardFromQuaternion(quaternion: THREE.Quaternion, target: THREE.Vector3): THREE.Vector3 {
  return target.set(0, 0, -1).applyQuaternion(quaternion).normalize();
}
