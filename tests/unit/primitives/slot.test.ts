import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SpatialSlotPrimitive } from '../../../src/core/input/primitives/slot.js';
import { createTextPanel, setTextPanelText } from '../../../src/core/ui/text-panel.js';

describe('SpatialSlotPrimitive', () => {
  it('accepts a payload that is close and passes the predicate', () => {
    const slotObject = new THREE.Object3D();
    slotObject.position.set(0, 1, 0);
    const accepted: string[] = [];
    const slot = new SpatialSlotPrimitive(slotObject, {
      accept: () => true,
      onAccept: () => accepted.push('yes'),
    });
    const payload = new THREE.Object3D();
    payload.position.set(0.05, 1, 0);

    expect(slot.attempt(payload)).toBe('accepted');
    expect(slot.isOccupied).toBe(true);
    expect(accepted).toHaveLength(1);
    expect(payload.position.toArray()).toEqual([0, 1, 0]);
  });

  it('rejects a near payload that fails the predicate without occupying the slot', () => {
    const slotObject = new THREE.Object3D();
    const rejected: string[] = [];
    const slot = new SpatialSlotPrimitive(slotObject, {
      accept: () => false,
      onReject: () => rejected.push('no'),
    });
    const payload = new THREE.Object3D();
    payload.position.set(0.02, 0, 0);

    expect(slot.attempt(payload)).toBe('rejected');
    expect(slot.isOccupied).toBe(false);
    expect(rejected).toHaveLength(1);
  });

  it('ignores payloads that are far away or when already occupied', () => {
    const slotObject = new THREE.Object3D();
    const slot = new SpatialSlotPrimitive(slotObject);
    const payload = new THREE.Object3D();
    payload.position.set(2, 0, 0);
    expect(slot.attempt(payload)).toBe('ignored');

    const near = new THREE.Object3D();
    near.position.set(0.05, 0, 0);
    expect(slot.attempt(near)).toBe('accepted');
    expect(slot.attempt(near)).toBe('ignored');
  });
});

describe('createTextPanel', () => {
  it('returns a diegetic mesh and updates its text in a DOM-free environment', () => {
    const panel = createTextPanel('HELLO');
    expect(panel.isMesh).toBe(true);
    expect(panel.userData.textPanel.text).toBe('HELLO');
    setTextPanelText(panel, 'CHANGED');
    expect(panel.userData.textPanel.text).toBe('CHANGED');
  });
});
