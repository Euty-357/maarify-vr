/**
 * Star-specific convenience wrapper around the shared round-point material.
 *
 * The shared implementation lives in `src/core/design/point-sprite.ts` and is
 * used by every point cloud in the app (Cosmos stars, blood-flow particles,
 * wind-tunnel smoke). This file keeps the star API stable so existing callers
 * do not need to change.
 *
 * See point-sprite.ts for why the alpha map is a procedural DataTexture.
 */

import * as THREE from 'three';
import {
  createRoundPointMaterial,
  getRoundPointTexture,
  disposeRoundPointTexture,
} from './point-sprite.js';

export { getRoundPointTexture, disposeRoundPointTexture };

/**
 * Build a PointsMaterial that renders round, soft-edged star points.
 * @param color Star colour when no per-vertex colours are used.
 * @param size Point size in world units.
 * @param vertexColors Whether to use the geometry's colour attribute.
 */
export function createStarPointMaterial(
  color: number,
  size: number,
  vertexColors = false,
): THREE.PointsMaterial {
  return createRoundPointMaterial({
    color,
    size,
    vertexColors,
    opacity: 0.9,
    additive: true,
    depthWrite: false,
  });
}