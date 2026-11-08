/**
 * Fixed-timestep physics simulation accumulator (dt = 1/120s by default).
 * Decouples physical determinism and numerical integration from variable
 * display refresh rates (72Hz, 80Hz, 90Hz, 120Hz).
 */
export class FixedTimestepAccumulator {
  private accumulator = 0;
  public readonly dt: number;

  constructor(fixedHz = 120) {
    this.dt = 1 / fixedHz;
  }

  /**
   * Consumes frame elapsed time in seconds and invokes updateCallback in fixed dt chunks.
   * Returns interpolation factor alpha (0.0 to 1.0) for visual render state blending.
   */
  step(realDeltaSec: number, updatePhysics: (dt: number) => void): number {
    // Clamp to 0.1s to prevent spiral-of-death on backgrounding or frame drops
    this.accumulator += Math.min(realDeltaSec, 0.1);

    while (this.accumulator >= this.dt) {
      updatePhysics(this.dt);
      this.accumulator -= this.dt;
    }

    return this.accumulator / this.dt;
  }

  reset(): void {
    this.accumulator = 0;
  }
}

