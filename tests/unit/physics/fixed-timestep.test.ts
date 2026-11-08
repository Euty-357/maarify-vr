import { describe, it, expect } from 'vitest';
import { FixedTimestepAccumulator } from '../../../src/core/physics/fixed-timestep';

describe('FixedTimestepAccumulator', () => {
  it('runs exactly the same number of simulation steps regardless of frame rate', () => {
    // Simulate 1.0 second of real time under 72 Hz vs 90 Hz vs 120 Hz render rates
    const runTest = (fps: number) => {
      const fixed = new FixedTimestepAccumulator(120);
      let physicsSteps = 0;
      let simulatedPosition = 0;
      const frameDelta = 1 / fps;
      const totalFrames = Math.round(fps * 1.0); // 1.0 second

      for (let i = 0; i < totalFrames; i++) {
        fixed.step(frameDelta, (dt) => {
          physicsSteps++;
          simulatedPosition += 10.0 * dt; // velocity = 10 units/sec
        });
      }
      return { physicsSteps, simulatedPosition };
    };

    const res72 = runTest(72);
    const res90 = runTest(90);
    const res120 = runTest(120);

    // At 120 Hz internal tick, in 1 second we expect 120 steps
    expect(res72.physicsSteps).toBe(120);
    expect(res90.physicsSteps).toBe(120);
    expect(res120.physicsSteps).toBe(120);

    // Position reached after 1 second at 10 u/s should be exactly 10.0 units
    expect(res72.simulatedPosition).toBeCloseTo(10.0, 4);
    expect(res90.simulatedPosition).toBeCloseTo(10.0, 4);
    expect(res120.simulatedPosition).toBeCloseTo(10.0, 4);
  });
});
