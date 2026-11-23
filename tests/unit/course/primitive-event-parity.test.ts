import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  SpatialGrabPrimitive,
  SpatialSliderPrimitive,
  SpatialLeverPrimitive,
  SpatialRotatorPrimitive,
} from '../../../src/core/input/primitives/index.js';
import { SpatialAnchorPrimitive } from '../../../src/core/input/primitives/anchor.js';
import { courseEventBus } from '../../../src/core/course/event-bus.js';
import type { CourseEvent } from '../../../src/core/types.js';

/**
 * Behaviour-parity tests for the shared primitives.
 *
 * The course system added event emission to the grab, slider, lever and
 * rotator primitives. These tests prove the BEHAVIOUR is unchanged: the same
 * values, the same callbacks, the same clamping — the only new thing is that
 * an event also appears on the course bus.
 */

let received: CourseEvent[] = [];

beforeEach(() => {
  received = [];
  courseEventBus.subscribe((event) => received.push(event));
});

afterEach(() => {
  courseEventBus.clear();
});

describe('grab primitive behaviour is unchanged apart from emitting events', () => {
  it('still grabs within threshold, rejects outside it, and restores its home pose', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    mesh.position.set(0, 1.2, -0.5);
    const onGrab = vi.fn();
    const onRelease = vi.fn();
    const grab = new SpatialGrabPrimitive(mesh, { onGrab, onRelease });

    // Outside threshold: rejected, no event.
    expect(grab.tryGrab(new THREE.Vector3(0, 1.2, 0.5), new THREE.Quaternion())).toBe(false);
    expect(onGrab).not.toHaveBeenCalled();
    expect(received.filter((e) => e.type === 'grabbed')).toHaveLength(0);

    // Inside threshold: grabbed, callback fires AND an event is emitted.
    expect(grab.tryGrab(new THREE.Vector3(0, 1.2, -0.52), new THREE.Quaternion())).toBe(true);
    expect(onGrab).toHaveBeenCalledTimes(1);
    expect(received.filter((e) => e.type === 'grabbed')).toHaveLength(1);

    // Release: callback fires AND an event is emitted.
    grab.release();
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(received.filter((e) => e.type === 'released')).toHaveLength(1);

    // Home pose restored exactly as before.
    mesh.position.set(9, 9, 9);
    grab.resetPose();
    expect(mesh.position.x).toBe(0);
    expect(mesh.position.y).toBe(1.2);
    expect(mesh.position.z).toBe(-0.5);
  });
});

describe('slider primitive behaviour is unchanged apart from emitting events', () => {
  it('still clamps, snaps and positions the handle exactly as before', () => {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02));
    const onValueChange = vi.fn();
    const slider = new SpatialSliderPrimitive(handle, {
      axis: 'x',
      minDistance: -0.2,
      maxDistance: 0.2,
      snapSteps: 10,
      onValueChange,
    });

    slider.updateDrag(new THREE.Vector3(0.25, 0, 0));
    expect(slider.value).toBe(1.0);
    expect(handle.position.x).toBeCloseTo(0.2, 4);
    expect(onValueChange).toHaveBeenCalledWith(1.0);

    slider.updateDrag(new THREE.Vector3(0.0, 0, 0));
    expect(slider.value).toBe(0.5);
    expect(handle.position.x).toBeCloseTo(0.0, 4);

    // setNormalizedValue still clamps to [0, 1] and fires the callback.
    slider.setNormalizedValue(5);
    expect(slider.value).toBe(1.0);
    slider.setNormalizedValue(-5);
    expect(slider.value).toBe(0.0);

    const sliderEvents = received.filter((e) => e.type === 'sliderChanged');
    expect(sliderEvents.length).toBeGreaterThan(0);
    expect(sliderEvents.every((e) => typeof e.value === 'number')).toBe(true);
  });
});

describe('lever primitive behaviour is unchanged apart from emitting events', () => {
  it('still constrains the angle, snaps to extremes and fires onSnapExtreme', () => {
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

    const leverEvents = received.filter((e) => e.type === 'leverChanged');
    expect(leverEvents.length).toBeGreaterThan(0);
    expect(leverEvents[leverEvents.length - 1].value).toBeCloseTo(1.0, 5);
  });
});

describe('rotator primitive behaviour is unchanged apart from emitting events', () => {
  it('still tracks angle, total rotations and the onRotate callback', () => {
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

    const rotateEvents = received.filter((e) => e.type === 'rotated');
    expect(rotateEvents.length).toBeGreaterThan(0);
    expect(rotateEvents[rotateEvents.length - 1].value).toBe(360);
  });
});

describe('anchor primitive behaviour is unchanged', () => {
  it('still expands and collapses, applies tiers and dismisses all', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    const definition = {
      id: 'parity-anchor',
      anchorPosition: new THREE.Vector3(0, 1, 0),
      label: 'Parity',
      level1Note: 'A test anchor.',
      level2Simulation: {
        foundation: { type: 'exploded-view' as const, description: 'd', caption: 'f' },
        advanced: { type: 'exploded-view' as const, description: 'd', caption: 'a' },
        expert: { type: 'exploded-view' as const, description: 'd', caption: 'e' },
      },
      sourceRefs: [],
    };
    const anchor = primitive.registerAnchor(definition, 'foundation');
    expect(anchor.isExpanded).toBe(false);

    anchor.toggleExpanded();
    expect(anchor.isExpanded).toBe(true);

    anchor.toggleExpanded();
    expect(anchor.isExpanded).toBe(false);

    primitive.updateTier('expert');
    expect(anchor.activeTier).toBe('expert');

    anchor.toggleExpanded();
    primitive.dismissAll();
    expect(anchor.isExpanded).toBe(false);

    expect(primitive.getAllAnchors()).toHaveLength(1);
  });
});