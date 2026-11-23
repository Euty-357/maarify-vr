import * as THREE from 'three';
import { FlowPathPlayer } from '../../core/assets/flow-path-player.js';

/**
 * Two particle streams (aorta red, pulmonary blue) animated along spline paths.
 *
 * Uses asset flow paths when present (from a parsed heart_cutaway GLB via
 * parseAssetNodes), falling back to the hand-typed aorta/pulmonary spline
 * points. Particle counts are governed by the dynamic quality controller via
 * the constructor options.
 *
 * Simplified model — not engineering grade.
 */
export class BloodFlowSystem {
  private aortaPlayer: FlowPathPlayer;
  private pulmonaryPlayer: FlowPathPlayer;
  private heartRateNorm = 0.5;

  readonly group: THREE.Group;

  constructor(options: { aortaParticleCount?: number; pulmonaryParticleCount?: number } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'blood-flow-system';

    // Aorta path: left ventricle → aortic arch → descending aorta
    // Hand-typed fallback (used when no asset flow path is present).
    const aortaFallback: [number, number, number][] = [
      [0.05, 0, 0],
      [0.05, 0.25, 0],
      [0.1, 0.35, 0],
      [0.0, 0.4, 0],
      [-0.1, 0.35, 0],
      [-0.05, 0.1, 0],
      [-0.05, -0.3, 0],
    ];

    // Pulmonary trunk path: right ventricle → pulmonary artery → lungs
    const pulmonaryFallback: [number, number, number][] = [
      [-0.05, 0, 0],
      [-0.1, 0.2, 0],
      [-0.2, 0.3, 0.1],
      [-0.15, 0.1, 0.2],
      [0.0, 0.0, 0.2],
      [0.15, 0.1, 0.1],
      [0.1, 0.3, 0.05],
    ];

    this.aortaPlayer = new FlowPathPlayer({
      flowPath: aortaFallback,
      flowColor: 0xef4444,
      particleCount: options.aortaParticleCount ?? 48,
      particleSize: 0.015,
      speed: 0.15,
    });

    this.pulmonaryPlayer = new FlowPathPlayer({
      flowPath: pulmonaryFallback,
      flowColor: 0x3b82f6,
      particleCount: options.pulmonaryParticleCount ?? 48,
      particleSize: 0.015,
      speed: 0.15,
    });

    this.group.add(this.aortaPlayer.mesh);
    this.group.add(this.pulmonaryPlayer.mesh);
  }

  /**
   * Replace the fallback paths with asset-authored flow paths.
   * Called by module scene code after parsing a heart_cutaway GLB.
   */
  setAssetFlowPaths(aortaPath: [number, number, number][], pulmonaryPath: [number, number, number][]): void {
    this.aortaPlayer = new FlowPathPlayer({
      flowPath: aortaPath,
      flowColor: 0x2266dd, // asset flow-deoxygenated color
      particleCount: this.aortaPlayer.particleCount,
      particleSize: 0.015,
      speed: 0.15,
    });
    this.pulmonaryPlayer = new FlowPathPlayer({
      flowPath: pulmonaryPath,
      flowColor: 0xee3344, // asset flow-oxygenated color
      particleCount: this.pulmonaryPlayer.particleCount,
      particleSize: 0.015,
      speed: 0.15,
    });
    // Rebuild group with new players
    this.group.remove(...this.group.children);
    this.group.add(this.aortaPlayer.mesh);
    this.group.add(this.pulmonaryPlayer.mesh);
  }

  setHeartRate(normalised: number): void {
    this.heartRateNorm = Math.max(0, Math.min(1, normalised));
    const speed = 0.08 + this.heartRateNorm * 0.22; // 0.08–0.30 turns/sec
    this.aortaPlayer.setSpeed(speed);
    this.pulmonaryPlayer.setSpeed(speed);
  }

  update(dt: number): void {
    this.aortaPlayer.update(dt);
    this.pulmonaryPlayer.update(dt);
  }

  dispose(): void {
    this.aortaPlayer.dispose();
    this.pulmonaryPlayer.dispose();
  }
}
