/**
 * Centralized Feel & Interaction Tuning Configuration.
 * All feel-related constants, thresholds, haptic presets, comfort parameters,
 * and quality tier limits live here. No magic numbers in scene code!
 */

export interface HapticPreset {
  intensity: number;
  durationMs: number;
}

export interface QualityTuning {
  /** Target refresh rate on Quest 3/3S. */
  targetFps: number;
  /** Minimum acceptable refresh rate; 72 Hz is the floor. */
  minFps: number;
  /** Hard ceilings for a worst-case scene state. NOT measured on device. */
  maxTriangles: number;
  maxDrawCalls: number;
  /** Working target: about 60–70 % of the ceilings until measured on device. */
  workingTriangles: number;
  workingDrawCalls: number;
  starParticleCount: number;
  atmosphereParticleCount: number;
  fixedFoveation: number;
  framebufferScaleFactor: number;
  /** Minimum legible text size, tuned for the lower-density Quest 3S panel. */
  minTextSizePt: number;
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
    handGrabThresholdMeters: number;
    pokeThresholdMeters: number;
    pinchEnterMeters: number;
    pinchExitMeters: number;
    handSmoothingAlpha: number;
    scalePinchMin: number;
    scalePinchMax: number;
    sliderSnapSteps: number;
    rotatorDetentStepDeg: number;
  };
  comfort: {
    teleportMaxDistanceMeters: number;
    teleportMaxRadiusMeters: number;
    teleportArcGravity: number;
    teleportLaunchVelocity: number;
    smoothLocomotion: boolean;
    smoothSpeedMetersPerSecond: number;
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
  quality: QualityTuning;
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
    handGrabThresholdMeters: 0.20,
    pokeThresholdMeters: 0.045,
    pinchEnterMeters: 0.025,
    pinchExitMeters: 0.04,
    handSmoothingAlpha: 0.35,
    scalePinchMin: 0.2,
    scalePinchMax: 5.0,
    sliderSnapSteps: 10,
    rotatorDetentStepDeg: 15,
  },
  comfort: {
    teleportMaxDistanceMeters: 6.0,
    teleportMaxRadiusMeters: 7.0,
    teleportArcGravity: 9.81,
    teleportLaunchVelocity: 6.0,
    smoothLocomotion: false,
    smoothSpeedMetersPerSecond: 1.6,
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
  quality: {
    /**
     * One baseline for Meta Quest 3 and Quest 3S. Ceilings reuse the old provisional
     * numbers; the working target is 60–70 % of them. NOT measured on device.
     */
    targetFps: 90,
    minFps: 72,
    maxTriangles: 250_000,
    maxDrawCalls: 180,
    workingTriangles: 150_000,
    workingDrawCalls: 108,
    starParticleCount: 24_000,
    atmosphereParticleCount: 8_000,
    fixedFoveation: 0.5,
    framebufferScaleFactor: 1.0,
    minTextSizePt: 24,
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

