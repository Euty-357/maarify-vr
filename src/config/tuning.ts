/**
 * Centralized Feel & Interaction Tuning Configuration.
 * All feel-related constants, thresholds, haptic presets, comfort parameters,
 * and quality tier limits live here. No magic numbers in scene code!
 */

export interface HapticPreset {
  intensity: number;
  durationMs: number;
}

export interface QualityTierTuning {
  targetFps: number;
  maxTriangles: number;
  maxDrawCalls: number;
  starParticleCount: number;
  atmosphereParticleCount: number;
  fixedFoveation: number;
  framebufferScaleFactor: number;
}

export interface TuningConfig {
  haptics: {
    hover: HapticPreset;
    grab: HapticPreset;
    release: HapticPreset;
    snap: HapticPreset;
    detent: HapticPreset;
    success: HapticPreset;
    error: HapticPreset;
  };
  input: {
    grabThresholdMeters: number;
    pokeThresholdMeters: number;
    handSmoothingAlpha: number;
    scalePinchMin: number;
    scalePinchMax: number;
    sliderSnapSteps: number;
    rotatorDetentStepDeg: number;
  };
  comfort: {
    teleportMaxDistanceMeters: number;
    teleportArcGravity: number;
    teleportLaunchVelocity: number;
    snapTurnAngleDeg: number;
    vignetteMinEdge: number;
    vignetteMaxEdge: number;
    vignetteMaxDarkness: number;
  };
  physics: {
    /** Fixed simulation rate in Hz; the accumulator stays decoupled from display refresh. */
    fixedStepHz: number;
  };
  anchors: {
    leaderLineColor: number;
    leaderLineOpacity: number;
    tagWidth: number;
    tagHeight: number;
    tagDepth: number;
    minViewingDistanceMeters: number;
    maxViewingDistanceMeters: number;
    fontSizePtEquivalent: number;
  };
  tiers: {
    tierA: QualityTierTuning;
    tierB: QualityTierTuning;
  };
  audio: {
    masterGain: number;
    spatialPingFreqHz: number;
    spatialPingDurationMs: number;
    rolloffFactor: number;
    refDistance: number;
    maxDistance: number;
  };
}

export const DEFAULT_TUNING: TuningConfig = {
  haptics: {
    hover: { intensity: 0.15, durationMs: 12 },
    grab: { intensity: 0.6, durationMs: 30 },
    release: { intensity: 0.25, durationMs: 18 },
    snap: { intensity: 0.85, durationMs: 40 },
    detent: { intensity: 0.4, durationMs: 22 },
    success: { intensity: 0.9, durationMs: 80 },
    error: { intensity: 0.7, durationMs: 120 },
  },
  input: {
    grabThresholdMeters: 0.14,
    pokeThresholdMeters: 0.045,
    handSmoothingAlpha: 0.35,
    scalePinchMin: 0.2,
    scalePinchMax: 5.0,
    sliderSnapSteps: 10,
    rotatorDetentStepDeg: 15,
  },
  comfort: {
    teleportMaxDistanceMeters: 8.0,
    teleportArcGravity: 9.81,
    teleportLaunchVelocity: 8.5,
    snapTurnAngleDeg: 30,
    vignetteMinEdge: 0.35,
    vignetteMaxEdge: 0.70,
    vignetteMaxDarkness: 0.85,
  },
  physics: {
    fixedStepHz: 120,
  },
  anchors: {
    leaderLineColor: 0x60a5fa,
    leaderLineOpacity: 0.85,
    tagWidth: 0.46,
    tagHeight: 0.13,
    tagDepth: 0.02,
    minViewingDistanceMeters: 0.5,
    maxViewingDistanceMeters: 3.5,
    fontSizePtEquivalent: 24,
  },
  tiers: {
    /**
     * Tier budgets and quality knobs. Only the particle counts are consumed today;
     * targetFps, maxTriangles, maxDrawCalls, fixedFoveation and framebufferScaleFactor
     * are reserved for the dynamic quality controller, which is not built yet.
     */
    tierA: {
      // Quest 2 baseline (guaranteed floor)
      targetFps: 72,
      maxTriangles: 100_000,
      maxDrawCalls: 100,
      starParticleCount: 6_000,
      atmosphereParticleCount: 2_500,
      fixedFoveation: 1.0,
      framebufferScaleFactor: 1.0,
    },
    tierB: {
      // Quest 3 / 3S (provisional, NOT measured on device)
      targetFps: 90,
      maxTriangles: 250_000,
      maxDrawCalls: 180,
      starParticleCount: 24_000,
      atmosphereParticleCount: 8_000,
      fixedFoveation: 0.5,
      framebufferScaleFactor: 1.2,
    },
  },
  audio: {
    /** Output level applied to every synthesized spatial ping. */
    masterGain: 0.3,
    spatialPingFreqHz: 880,
    spatialPingDurationMs: 120,
    rolloffFactor: 1.5,
    refDistance: 1.0,
    maxDistance: 10.0,
  },
};

/** Active runtime tuning copy that can be modified by the in-VR/desktop Tuning Panel */
export const ActiveTuning: TuningConfig = JSON.parse(JSON.stringify(DEFAULT_TUNING));

export function resetTuningToDefaults(): void {
  Object.assign(ActiveTuning, JSON.parse(JSON.stringify(DEFAULT_TUNING)));
}

export function exportTuningJson(): string {
  return JSON.stringify(ActiveTuning, null, 2);
}

export function importTuningJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    Object.assign(ActiveTuning, parsed);
    return true;
  } catch {
    return false;
  }
}

