import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TUNING,
  ActiveTuning,
  exportTuningJson,
  importTuningJson,
  resetTuningToDefaults,
} from '../../../src/config/tuning.js';

describe('Tuning Configuration & Serialization', () => {
  it('validates default tuning parameter bounds and invariants', () => {
    // Haptics
    expect(DEFAULT_TUNING.haptics.grab.intensity).toBeGreaterThan(0);
    expect(DEFAULT_TUNING.haptics.grab.intensity).toBeLessThanOrEqual(1.0);
    expect(DEFAULT_TUNING.haptics.grab.durationMs).toBeGreaterThan(0);

    // Input
    expect(DEFAULT_TUNING.input.grabThresholdMeters).toBeGreaterThan(0.05);
    expect(DEFAULT_TUNING.input.grabThresholdMeters).toBeLessThan(0.5);

    // Comfort + physics
    expect(DEFAULT_TUNING.comfort.snapTurnAngleDeg).toBeGreaterThanOrEqual(15);
    expect(DEFAULT_TUNING.comfort.teleportMaxDistanceMeters).toBeGreaterThan(2.0);
    expect(DEFAULT_TUNING.comfort.vignetteMaxDarkness).toBeLessThanOrEqual(1.0);
    expect(DEFAULT_TUNING.physics.fixedStepHz).toBe(120);

    // Anchors and audio are consumed by core, so their defaults must stay sane.
    expect(DEFAULT_TUNING.anchors.tagWidth).toBeGreaterThan(0.3);
    expect(DEFAULT_TUNING.audio.masterGain).toBeGreaterThan(0);
    expect(DEFAULT_TUNING.audio.refDistance).toBeGreaterThan(0);

    // Tiers
    expect(DEFAULT_TUNING.tiers.tierA.targetFps).toBe(72);
    expect(DEFAULT_TUNING.tiers.tierB.targetFps).toBeGreaterThanOrEqual(90);
    expect(DEFAULT_TUNING.tiers.tierA.maxTriangles).toBe(100_000);
    expect(DEFAULT_TUNING.tiers.tierB.maxTriangles).toBe(250_000);
  });

  it('exports and imports configuration accurately through JSON round-trip', () => {
    ActiveTuning.input.grabThresholdMeters = 0.22;
    ActiveTuning.comfort.snapTurnAngleDeg = 45;

    const exported = exportTuningJson();
    expect(exported).toContain('"grabThresholdMeters": 0.22');
    expect(exported).toContain('"snapTurnAngleDeg": 45');

    resetTuningToDefaults();
    expect(ActiveTuning.input.grabThresholdMeters).toBe(DEFAULT_TUNING.input.grabThresholdMeters);

    const success = importTuningJson(exported);
    expect(success).toBe(true);
    expect(ActiveTuning.input.grabThresholdMeters).toBe(0.22);
    expect(ActiveTuning.comfort.snapTurnAngleDeg).toBe(45);

    // Cleanup
    resetTuningToDefaults();
  });

  it('rejects malformed json safely without throwing', () => {
    const success = importTuningJson('{ bad_json: true');
    expect(success).toBe(false);
  });
});

