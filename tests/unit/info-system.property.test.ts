import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { placeFolioBesideExhibit } from '../../src/core/ui/folio-placement.js';
import { InformationSystemManager } from '../../src/core/info-system/manager.js';
import { SpatialAnchorPrimitive } from '../../src/core/input/primitives/anchor.js';
import { FolioPanel } from '../../src/core/ui/folio-panel.js';

describe('Information System V3 Property Tests', () => {
  // Property 1: Folio placement height is in readable range [1.0, 1.6]
  // Validates: Requirements 3.2
  it('Property 1: placeFolioBesideExhibit placement height is always in [1.0, 1.6]', () => {
    for (let i = 0; i < 100; i++) {
      const exhibitPos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 3.0 - 0.5, // y in [-0.5, 2.5]
        (Math.random() - 0.5) * 20
      );
      const viewerPos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 2.0, // viewer y in [0, 2]
        (Math.random() - 0.5) * 20
      );

      const placement = placeFolioBesideExhibit(exhibitPos, viewerPos);
      expect(placement.position.y).toBeGreaterThanOrEqual(1.0);
      expect(placement.position.y).toBeLessThanOrEqual(1.6);
    }
  });

  // Property 2: Folio placement distance is within reach [0.4, 0.8]
  // Validates: Requirements 3.1
  it('Property 2: placeFolioBesideExhibit horizontal distance from exhibit is in [0.4, 0.8]', () => {
    for (let i = 0; i < 100; i++) {
      const exhibitPos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        1.2,
        (Math.random() - 0.5) * 20
      );
      // Ensure viewer is separated by >= 0.5m horizontally
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.5 + Math.random() * 3.0;
      const viewerPos = new THREE.Vector3(
        exhibitPos.x + Math.cos(angle) * dist,
        1.6,
        exhibitPos.z + Math.sin(angle) * dist
      );

      const placement = placeFolioBesideExhibit(exhibitPos, viewerPos);
      const xzDist = Math.hypot(
        placement.position.x - exhibitPos.x,
        placement.position.z - exhibitPos.z
      );
      expect(xzDist).toBeGreaterThanOrEqual(0.4);
      expect(xzDist).toBeLessThanOrEqual(0.8);
    }
  });

  // Property 3: Room-bounds clamp produces contained position
  // Validates: Requirements 9.1
  it('Property 3: roomBounds clamp always produces a point contained inside the box', () => {
    for (let i = 0; i < 100; i++) {
      const minX = (Math.random() - 0.5) * 10;
      const minY = 0;
      const minZ = (Math.random() - 0.5) * 10;
      const box = new THREE.Box3(
        new THREE.Vector3(minX, minY, minZ),
        new THREE.Vector3(minX + 2 + Math.random() * 5, minY + 3, minZ + 2 + Math.random() * 5)
      );

      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        Math.random() * 5,
        (Math.random() - 0.5) * 30
      );

      box.clampPoint(pos, pos);
      expect(box.containsPoint(pos)).toBe(true);
    }
  });

  // Property 4: Auto-close fires when head exceeds threshold and panel is not pinned
  // Validates: Requirements 6.1
  it('Property 4: auto-close fires when head exceeds threshold and panel is not pinned', () => {
    const anchorGroup = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(anchorGroup);
    const panel = new FolioPanel();
    const manager = new InformationSystemManager(primitive, panel, { autoCloseDistanceMeters: 2.5 });

    primitive.registerAnchor(
      {
        id: 'test-anchor-4',
        label: 'Test 4',
        anchorPosition: new THREE.Vector3(0, 1.2, 0),
        level1Note: 'Note',
        level2Simulation: {
          foundation: { type: 'exploded-view', description: 'F', caption: 'F' },
          advanced: { type: 'exploded-view', description: 'A', caption: 'A' },
          expert: { type: 'exploded-view', description: 'E', caption: 'E' },
        },
        sourceRefs: ['ref'],
      },
      'foundation'
    );

    // Open folio
    manager.onActivate('test-anchor-4', new THREE.Vector3(0, 1.2, 1));
    expect(panel.visible).toBe(true);
    expect(panel.pinned).toBe(false);

    // Head within 2.5m -> remains open
    manager.update(new THREE.Vector3(0, 1.2, 2.0));
    expect(panel.visible).toBe(true);

    // Head beyond 2.5m -> closes
    manager.update(new THREE.Vector3(0, 1.2, 3.5));
    expect(panel.visible).toBe(false);

    // If pinned -> does NOT close even when far
    manager.onActivate('test-anchor-4', new THREE.Vector3(0, 1.2, 1));
    panel.pinned = true;
    manager.update(new THREE.Vector3(0, 1.2, 5.0));
    expect(panel.visible).toBe(true);
  });

  // Property 5: Orientation lock holds across any number of head-movement updates
  // Validates: Requirements 7.1, 7.2
  it('Property 5: orientation lock holds across any number of head updates', () => {
    const anchorGroup = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(anchorGroup);
    const panel = new FolioPanel();
    const manager = new InformationSystemManager(primitive, panel, { autoCloseDistanceMeters: 50.0 });

    primitive.registerAnchor(
      {
        id: 'test-anchor-5',
        label: 'Test 5',
        anchorPosition: new THREE.Vector3(0, 1.2, 0),
        level1Note: 'Note',
        level2Simulation: {
          foundation: { type: 'exploded-view', description: 'F', caption: 'F' },
          advanced: { type: 'exploded-view', description: 'A', caption: 'A' },
          expert: { type: 'exploded-view', description: 'E', caption: 'E' },
        },
        sourceRefs: ['ref'],
      },
      'foundation'
    );

    manager.onActivate('test-anchor-5', new THREE.Vector3(1, 1.2, 2));
    const lockedQuat = panel.quaternion.clone();

    // 100 random head position updates
    for (let i = 0; i < 100; i++) {
      const head = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        1.2 + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 5
      );
      manager.update(head);
      expect(panel.quaternion.x).toBeCloseTo(lockedQuat.x, 5);
      expect(panel.quaternion.y).toBeCloseTo(lockedQuat.y, 5);
      expect(panel.quaternion.z).toBeCloseTo(lockedQuat.z, 5);
      expect(panel.quaternion.w).toBeCloseTo(lockedQuat.w, 5);
    }
  });
});
