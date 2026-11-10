import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ComfortSystem } from '../../../src/core/comfort/comfort.js';
import { ActiveTuning } from '../../../src/config/tuning.js';

describe('Comfort System Math & Bounds', () => {
  it('converts the tuned snap turn degrees to exact radians', () => {
    const cam = new THREE.PerspectiveCamera();
    const comfort = new ComfortSystem(cam);
    const original = ActiveTuning.comfort.snapTurnAngleDeg;

    try {
      ActiveTuning.comfort.snapTurnAngleDeg = 30;
      expect(comfort.getSnapAngleRad()).toBeCloseTo(Math.PI / 6, 5);

      ActiveTuning.comfort.snapTurnAngleDeg = 45;
      expect(comfort.getSnapAngleRad()).toBeCloseTo(Math.PI / 4, 5);

      ActiveTuning.comfort.snapTurnAngleDeg = 90;
      expect(comfort.getSnapAngleRad()).toBeCloseTo(Math.PI / 2, 5);
    } finally {
      ActiveTuning.comfort.snapTurnAngleDeg = original;
    }
  });

  it('drives the vignette edges from the active tuning values', () => {
    const cam = new THREE.PerspectiveCamera();
    const comfort = new ComfortSystem(cam);
    const material = (comfort as any).vignetteMesh.material as THREE.ShaderMaterial;

    ActiveTuning.comfort.vignetteMinEdge = 0.42;
    ActiveTuning.comfort.vignetteMaxEdge = 0.78;
    comfort.setMotionIntensity(0.5);

    expect(material.uniforms.uMinEdge.value).toBe(0.42);
    expect(material.uniforms.uMaxEdge.value).toBe(0.78);

    ActiveTuning.comfort.vignetteMinEdge = 0.35;
    ActiveTuning.comfort.vignetteMaxEdge = 0.7;
  });

  it('clamps motion intensity strictly between 0.0 and 1.0', () => {
    const cam = new THREE.PerspectiveCamera();
    const comfort = new ComfortSystem(cam);

    comfort.setMotionIntensity(1.5);
    // Directly inspect internal opacity via private accessor in test
    expect((comfort as any).vignetteOpacity).toBe(1.0);

    comfort.setMotionIntensity(-0.5);
    expect((comfort as any).vignetteOpacity).toBe(0.0);

    comfort.setMotionIntensity(0.65);
    expect((comfort as any).vignetteOpacity).toBe(0.65);
  });

  it('forces opacity to 0.0 when vignette is disabled', () => {
    const cam = new THREE.PerspectiveCamera();
    const comfort = new ComfortSystem(cam);

    comfort.settings.vignetteEnabled = false;
    comfort.setMotionIntensity(0.8);
    expect((comfort as any).vignetteOpacity).toBe(0.0);
  });
});
