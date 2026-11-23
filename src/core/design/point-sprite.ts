/**
 * Shared round-point material for every THREE.Points cloud in Maarify.
 *
 * A bare `new THREE.PointsMaterial(...)` renders each point as a solid
 * SQUARE, which made the Cosmos starfield read as a grid of boxes and the
 * blood-flow and wind-tunnel particles read as small cubes.
 *
 * This module builds one tiny radial-gradient texture used as the alpha map so
 * every point cloud renders as a soft round point. The texture is generated
 * procedurally as a DataTexture, so it works in every environment (browser,
 * WebXR, headless unit tests) with no DOM, no canvas and no network request.
 *
 * IMPORTANT: new point clouds must use `createRoundPointMaterial()` rather than
 * constructing a THREE.PointsMaterial directly. A unit test enforces this.
 */

import * as THREE from 'three';

const TEXTURE_SIZE = 32;

let sharedTexture: THREE.Texture | null = null;

/**
 * Return a shared 32×32 radial-gradient texture used as a Points alpha map.
 * The alpha channel falls off smoothly from the centre to the rim so points
 * render as soft round dots rather than squares.
 */
export function getRoundPointTexture(): THREE.Texture {
  if (sharedTexture) return sharedTexture;

  const size = TEXTURE_SIZE;
  const data = new Uint8Array(size * size * 4);
  const centre = (size - 1) / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - centre) / centre;
      const dy = (y - centre) / centre;
      const radius = Math.sqrt(dx * dx + dy * dy);
      // Soft radial falloff: opaque core fading to fully transparent at the rim.
      const alpha = radius >= 1 ? 0 : Math.pow(1 - radius, 1.6);
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  sharedTexture = texture;
  return texture;
}

/** Options for {@link createRoundPointMaterial}. */
export interface RoundPointMaterialOptions {
  /** Point colour when no per-vertex colours are used. */
  color?: number;
  /** Point size in world units. */
  size?: number;
  /** Whether to use the geometry's per-vertex colour attribute. */
  vertexColors?: boolean;
  /** Material opacity (0..1). */
  opacity?: number;
  /** Use additive blending (good for stars and glow) instead of normal blending. */
  additive?: boolean;
  /** Write to the depth buffer. Off by default so points never clip each other. */
  depthWrite?: boolean;
}

/**
 * Build a PointsMaterial that renders round, soft-edged points.
 *
 * @param options - Material options.
 * @returns A material with the shared round alpha map applied.
 */
export function createRoundPointMaterial(
  options: RoundPointMaterialOptions = {},
): THREE.PointsMaterial {
  const {
    color = 0xffffff,
    size = 0.1,
    vertexColors = false,
    opacity = 0.9,
    additive = false,
    depthWrite = false,
  } = options;

  const material = new THREE.PointsMaterial({
    color,
    size,
    vertexColors,
    transparent: true,
    opacity,
    depthWrite,
    alphaTest: 0.02,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  material.alphaMap = getRoundPointTexture();
  return material;
}

/** Dispose the shared texture (used by leak tests). */
export function disposeRoundPointTexture(): void {
  sharedTexture?.dispose();
  sharedTexture = null;
}