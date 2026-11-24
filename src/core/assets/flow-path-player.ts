/**
 * FlowPathPlayer — animates instanced particles along a Catmull-Rom spline.
 *
 * Takes a flowPath ([[x,y,z],...] points in local space) and a colour, and
 * advances particles along the spline on the fixed timestep (dt = 1/120s).
 * Particle count is governed by the caller via the dynamic quality controller
 * (see src/config/tuning.ts quality block).
 *
 * Used by WP4 to refactor human-body/blood-flow.ts to use asset flow paths
 * with the current hand-typed points as fallback.
 */

import * as THREE from 'three';
import { createRoundPointMaterial } from '../design/point-sprite.js';
import { courseEventBus } from '../course/event-bus.js';

/** Options for FlowPathPlayer. */
export interface FlowPathPlayerOptions {
  /** Spline control points in local space. */
  flowPath: [number, number, number][];
  /** Particle colour (hex). */
  flowColor: number;
  /** Number of particles. Governed by the dynamic quality controller. */
  particleCount?: number;
  /** Particle size. */
  particleSize?: number;
  /** Base speed in turns per second (0..1). */
  speed?: number;
}

/**
 * Animated particle flow along a Catmull-Rom spline.
 *
 * Particles are distributed evenly along the path and advance by `speed * dt`
 * each update. Positions are sampled from the spline on every fixed-step tick.
 */
export class FlowPathPlayer {
  private readonly spline: THREE.CatmullRomCurve3;
  private readonly points: THREE.Points;
  private readonly positions: Float32Array;
  private readonly ts: Float32Array;
  readonly particleCount: number;
  private speed: number;

  constructor(options: FlowPathPlayerOptions) {
    const count = options.particleCount ?? 32;
    this.particleCount = count;
    this.speed = options.speed ?? 0.1;

    // Build the Catmull-Rom spline from the flow path points.
    const curvePoints = options.flowPath.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    this.spline = new THREE.CatmullRomCurve3(curvePoints, false);

    this.positions = new Float32Array(count * 3);
    this.ts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.ts[i] = i / count;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    // Round points via the shared material: a bare PointsMaterial renders squares.
    const material = createRoundPointMaterial({
      color: options.flowColor,
      size: options.particleSize ?? 0.015,
      opacity: 0.95,
      additive: false,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.name = 'flow-path-particles';
    this.points.frustumCulled = false;

    this._syncBuffers();
  }

  /** The Three.js Points object to add to the scene. */
  get mesh(): THREE.Points {
    return this.points;
  }

  /** Set the playback speed (turns per second, 0..1). */
  setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(1, speed));
    courseEventBus.emit('flowToggled', undefined, this.speed);
  }

  /** Toggle flow playback between stopped (0) and default speed. */
  togglePlay(): void {
    this.speed = this.speed === 0 ? 0.15 : 0;
    courseEventBus.emit('flowToggled', undefined, this.speed);
  }

  /** Advance the flow by one fixed timestep (dt seconds). Call from the fixed-timestep accumulator. */
  update(dt: number): void {
    const step = this.speed * dt;
    for (let i = 0; i < this.particleCount; i++) {
      this.ts[i] = (this.ts[i] + step) % 1;
    }
    this._syncBuffers();
  }

  private _syncBuffers(): void {
    const tmp = new THREE.Vector3();
    for (let i = 0; i < this.particleCount; i++) {
      this.spline.getPoint(this.ts[i], tmp);
      this.positions[i * 3] = tmp.x;
      this.positions[i * 3 + 1] = tmp.y;
      this.positions[i * 3 + 2] = tmp.z;
    }
    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  }

  /** Dispose geometries and materials. */
  dispose(): void {
    this.points.geometry.dispose();
    const mat = this.points.material;
    if (mat && !Array.isArray(mat)) mat.dispose();
  }
}