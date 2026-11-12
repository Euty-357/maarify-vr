import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  forwardFromQuaternion,
  nextEdge,
  nextPinch,
  poseFromMatrix,
  selectSource,
  sourceHandedness,
  toWorldPose,
} from '../../../src/core/input/input-state.js';
import { ActiveTuning } from '../../../src/config/tuning.js';

describe('input edge detection', () => {
  it('reports press and release edges exactly once', () => {
    expect(nextEdge(false, false)).toEqual({ pressed: false, justPressed: false, justReleased: false });
    expect(nextEdge(false, true)).toEqual({ pressed: true, justPressed: true, justReleased: false });
    expect(nextEdge(true, true)).toEqual({ pressed: true, justPressed: false, justReleased: false });
    expect(nextEdge(true, false)).toEqual({ pressed: false, justPressed: false, justReleased: true });
  });
});

describe('pinch hysteresis', () => {
  it('enters below the enter threshold and leaves only above the exit threshold', () => {
    let active = false;
    active = nextPinch(active, 0.02).active;
    expect(active).toBe(true);
    active = nextPinch(active, 0.03).active;
    expect(active).toBe(true);
    active = nextPinch(active, 0.041).active;
    expect(active).toBe(false);
  });

  it('does not chatter around the enter threshold', () => {
    expect(nextPinch(false, 0.026).active).toBe(false);
    expect(nextPinch(false, 0.024).active).toBe(true);
  });

  it('uses the tuned thresholds by default', () => {
    expect(ActiveTuning.input.pinchEnterMeters).toBeLessThan(ActiveTuning.input.pinchExitMeters);
  });
});

describe('input source selection', () => {
  const left = { handedness: 'left', hand: null } as unknown as XRInputSource;
  const right = { handedness: 'right', hand: null } as unknown as XRInputSource;
  const gaze = { handedness: 'none' } as unknown as XRInputSource;

  it('maps sources by handedness, not by index', () => {
    expect(sourceHandedness(right)).toBe('right');
    expect(sourceHandedness(gaze)).toBeNull();
  });

  it('selects the live source for a hand even when the list order changes', () => {
    expect(selectSource([right, left], 'left')).toBe(left);
    expect(selectSource([left, right], 'right')).toBe(right);
    expect(selectSource([left], 'right')).toBeNull();
  });
});

describe('pose helpers', () => {
  it('decomposes an XR pose matrix into origin and rotation', () => {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(1, 2, 3),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      new THREE.Vector3(1, 1, 1)
    );
    const origin = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    poseFromMatrix(matrix.elements, origin, quaternion);
    expect(origin.toArray()).toEqual([1, 2, 3]);
    expect(quaternion.length()).toBeCloseTo(1, 5);
  });

  it('points along -Z after identity rotation', () => {
    const direction = forwardFromQuaternion(new THREE.Quaternion(), new THREE.Vector3());
    expect(direction.toArray()).toEqual([0, 0, -1]);
  });

  it('composes a reference-space pose with the rig after teleport and snap turn', () => {
    // Rig teleported 2 m right and 3 m back, then snapped 90 degrees.
    const rig = new THREE.Matrix4().compose(
      new THREE.Vector3(2, 0, -3),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      new THREE.Vector3(1, 1, 1)
    );
    const origin = new THREE.Vector3(0, 1.5, -0.5);
    const quaternion = new THREE.Quaternion();

    toWorldPose(origin, quaternion, rig);

    expect(origin.x).toBeCloseTo(1.5, 5);
    expect(origin.y).toBeCloseTo(1.5, 5);
    expect(origin.z).toBeCloseTo(-3, 5);

    // The pointing direction must turn with the rig, not stay in the old frame.
    const direction = forwardFromQuaternion(quaternion, new THREE.Vector3());
    expect(direction.x).toBeCloseTo(-1, 5);
    expect(direction.y).toBeCloseTo(0, 5);
    expect(direction.z).toBeCloseTo(0, 5);
  });

  it('leaves a pose untouched when the rig sits at the origin', () => {
    const origin = new THREE.Vector3(0.2, 1.4, -1.1);
    const quaternion = new THREE.Quaternion();
    toWorldPose(origin, quaternion, new THREE.Matrix4());
    expect(origin.toArray()).toEqual([0.2, 1.4, -1.1]);
    expect(quaternion.toArray().map((value) => Number(value.toFixed(6)))).toEqual([0, 0, 0, 1]);
  });
});
