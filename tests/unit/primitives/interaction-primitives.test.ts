import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  SpatialGrabPrimitive,
  SpatialPokePrimitive,
  SpatialSliderPrimitive,
  SpatialLeverPrimitive,
  SpatialRotatorPrimitive,
  SpatialScalePinchPrimitive,
} from '../../../src/core/input/primitives/index.js';

describe('Spatial Interaction Primitives', () => {
  describe('SpatialGrabPrimitive', () => {
    it('grabs object within threshold and fires onGrab callback', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
      mesh.position.set(0, 1.2, -0.5);

      const onGrab = vi.fn();
      const grab = new SpatialGrabPrimitive(mesh, { onGrab });

      // Attempt grab within threshold
      const interactorPos = new THREE.Vector3(0, 1.2, -0.52);
      const grabbed = grab.tryGrab(interactorPos, new THREE.Quaternion());

      expect(grabbed).toBe(true);
      expect(grab.isGrabbed).toBe(true);
      expect(onGrab).toHaveBeenCalled();
    });

    it('rejects grab if interactor is outside threshold distance', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
      mesh.position.set(0, 1.2, -0.5);

      const grab = new SpatialGrabPrimitive(mesh);
      const farPos = new THREE.Vector3(0, 1.2, 0.5); // 1 meter away

      const grabbed = grab.tryGrab(farPos, new THREE.Quaternion());
      expect(grabbed).toBe(false);
      expect(grab.isGrabbed).toBe(false);
    });
  });

  describe('SpatialPokePrimitive', () => {
    it('depresses button when tip penetrates poke threshold', () => {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02));
      button.position.set(0, 1.0, 0);

      const onPress = vi.fn();
      const onRelease = vi.fn();
      const poke = new SpatialPokePrimitive(button, { onPress, onRelease, depthLimitMeters: 0.02 });

      // Poke close
      const tipPos = new THREE.Vector3(0, 1.01, 0);
      const pressed = poke.checkPoke(tipPos);

      expect(pressed).toBe(true);
      expect(poke.isPressed).toBe(true);
      expect(onPress).toHaveBeenCalled();
      expect(button.position.y).toBeCloseTo(0.98, 3);

      // Move tip away -> spring release
      const farTip = new THREE.Vector3(0, 1.5, 0);
      poke.checkPoke(farTip);
      expect(poke.isPressed).toBe(false);
      expect(onRelease).toHaveBeenCalled();
      expect(button.position.y).toBeCloseTo(1.0, 3);
    });
  });

  describe('SpatialSliderPrimitive', () => {
    it('clamps normalized value and snaps along discrete steps', () => {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02));
      const onValueChange = vi.fn();
      const slider = new SpatialSliderPrimitive(handle, {
        axis: 'x',
        minDistance: -0.2,
        maxDistance: 0.2,
        snapSteps: 10,
        onValueChange,
      });

      // Drag to right edge (+0.25 m)
      slider.updateDrag(new THREE.Vector3(0.25, 0, 0));
      expect(slider.value).toBe(1.0);
      expect(handle.position.x).toBeCloseTo(0.2, 4);

      // Drag to center (0.0 m)
      slider.updateDrag(new THREE.Vector3(0.0, 0, 0));
      expect(slider.value).toBe(0.5);
      expect(handle.position.x).toBeCloseTo(0.0, 4);
    });
  });

  describe('SpatialLeverPrimitive', () => {
    it('constrains angle within min and max limits and triggers snaps', () => {
      const leverMesh = new THREE.Mesh();
      const onAngleChange = vi.fn();
      const onSnapExtreme = vi.fn();
      const lever = new SpatialLeverPrimitive(leverMesh, {
        minAngleDeg: -45,
        maxAngleDeg: 45,
        onAngleChange,
        onSnapExtreme,
      });

      lever.setAngle(-60);
      expect(lever.currentAngleDeg).toBe(-45);
      expect(lever.normalizedValue).toBe(0.0);

      lever.throwToExtreme('max');
      expect(lever.currentAngleDeg).toBe(45);
      expect(lever.normalizedValue).toBe(1.0);
      expect(onSnapExtreme).toHaveBeenCalledWith('max');
    });
  });

  describe('SpatialRotatorPrimitive', () => {
    it('tracks rotation angle and total rotation revolutions', () => {
      const dial = new THREE.Mesh();
      const onRotate = vi.fn();
      const rotator = new SpatialRotatorPrimitive(dial, { detentStepDeg: 15, onRotate });

      rotator.setAngleDeg(180);
      expect(rotator.angleDeg).toBe(180);
      expect(rotator.totalRotations).toBe(0.5);
      expect(onRotate).toHaveBeenCalledWith(180, 0.5);

      rotator.addDeltaDeg(180);
      expect(rotator.angleDeg).toBe(360);
      expect(rotator.totalRotations).toBe(1.0);
    });
  });

  describe('SpatialScalePinchPrimitive', () => {
    it('calculates scale expansion ratio and clamps to min/max', () => {
      const assembly = new THREE.Group();
      const onExplodeFraction = vi.fn();
      const scalePinch = new SpatialScalePinchPrimitive(assembly, {
        minScale: 0.5,
        maxScale: 3.0,
        onExplodeFraction,
      });

      const hand1 = new THREE.Vector3(-0.1, 1.2, -0.5);
      const hand2 = new THREE.Vector3(0.1, 1.2, -0.5);
      scalePinch.startTwoHanded(hand1, hand2);

      // Double hand distance
      const hand1Far = new THREE.Vector3(-0.2, 1.2, -0.5);
      const hand2Far = new THREE.Vector3(0.2, 1.2, -0.5);
      scalePinch.updateTwoHanded(hand1Far, hand2Far);

      expect(scalePinch.currentScale).toBeCloseTo(2.0, 2);
      expect(scalePinch.explodeFraction).toBeCloseTo(0.5, 2);
      expect(assembly.scale.x).toBeCloseTo(2.0, 2);
    });
  });
});

