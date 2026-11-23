/**
 * Pure ray-hit selection for the Maarify pointer beam.
 *
 * Root cause this fixes: the controller ray raycast the whole module root
 * recursively, and THREE.Raycaster ignores `visible = false`. A hidden mesh
 * therefore still stopped the beam, and decorative geometry (floor, walls,
 * labels, engine bases) swallowed the pointer before it reached the control
 * behind it.
 *
 * Two rules make the beam behave:
 *  1. A hit is skipped when the hit object or ANY ancestor is invisible.
 *  2. A hit is only accepted when it resolves to something the learner can
 *     actually act on: an interaction primitive, an `activate` callback, a
 *     portal, a folio/panel control, or the return gate.
 *     Decorative geometry never stops the beam and never takes hover.
 *
 * The function is pure: it takes an already-sorted hit list and returns the
 * chosen intersection (or null). No Three.js scene traversal, no side effects,
 * so it is directly unit-testable.
 */

import type * as THREE from 'three';

/** The userData keys that mark an object as something the learner can act on. */
export const INTERACTIVE_USERDATA_KEYS = [
  'activate',
  'grabPrimitive',
  'sliderPrimitive',
  'rotatorPrimitive',
  'leverPrimitive',
  'scalePinchPrimitive',
  'slotPrimitive',
  'anchorPrimitive',
] as const;

/** A minimal shape of the pieces of THREE.Intersection this module needs. */
export interface RayHitLike {
  object: THREE.Object3D;
  distance: number;
  point: THREE.Vector3;
}

/**
 * Options for {@link selectRayHit}.
 */
export interface SelectRayHitOptions {
  /**
   * Extra predicate that accepts an object as interactive. Used for portals
   * (resolved by name) and for the return gate, which are not userData
   * primitives.
   */
  isInteractiveObject?: (object: THREE.Object3D) => boolean;
  /**
   * When true, a hit on an object with no interactive primitive is still
   * accepted. Off by default: decorative geometry must not stop the beam.
   */
  acceptDecorative?: boolean;
}

/**
 * True when the object or any ancestor in its parent chain has visible = false.
 *
 * THREE.Raycaster reports intersections for invisible objects, so this must be
 * checked explicitly before a hit is allowed to stop the beam.
 */
export function isHiddenInHierarchy(object: THREE.Object3D): boolean {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (!candidate.visible) return true;
    candidate = candidate.parent;
  }
  return false;
}

/**
 * Walk up the parent chain looking for a userData value under `key`.
 * Mirrors the `findUserDataPrimitive` helper in main.ts.
 */
export function findUserDataValue(
  object: THREE.Object3D,
  key: string,
): unknown | null {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    const value = candidate.userData[key];
    if (value) return value;
    candidate = candidate.parent;
  }
  return null;
}

/**
 * True when the object (or an ancestor) carries a recognised interaction
 * primitive or an `activate` callback.
 */
export function isInteractiveObject(object: THREE.Object3D): boolean {
  for (const key of INTERACTIVE_USERDATA_KEYS) {
    if (findUserDataValue(object, key)) return true;
  }
  return false;
}

/**
 * Choose the hit that should stop the pointer beam.
 *
 * @param hits - Raycast intersections, sorted nearest-first by THREE.Raycaster.
 * @param options - Optional extra interactivity rule.
 * @returns The first acceptable hit, or null when nothing interactable was hit.
 */
export function selectRayHit(
  hits: readonly RayHitLike[],
  options: SelectRayHitOptions = {},
): RayHitLike | null {
  const { isInteractiveObject: extraCheck, acceptDecorative = false } = options;

  for (const hit of hits) {
    // Rule 1: an invisible object (or any invisible ancestor) never stops the beam.
    if (isHiddenInHierarchy(hit.object)) continue;

    // Rule 2: only something the learner can act on stops the beam.
    if (acceptDecorative) return hit;
    if (isInteractiveObject(hit.object)) return hit;
    if (extraCheck?.(hit.object)) return hit;
  }

  return null;
}

/**
 * Compute the world-space end point of the pointer beam.
 *
 * When nothing interactable is hit the beam runs to its full length, so the
 * learner can still see where they are pointing.
 */
export function rayEndPoint(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  hit: RayHitLike | null,
  maxDistance: number,
): THREE.Vector3 {
  if (hit) return hit.point.clone();
  return origin.clone().addScaledVector(direction, maxDistance);
}