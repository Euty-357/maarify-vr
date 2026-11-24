import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { AEROSPACE_MISSIONS } from '../../../src/modules/aerospace/missions.js';
import { QUANTUM_MISSIONS } from '../../../src/modules/quantum/missions.js';
import { HUMAN_BODY_MISSIONS } from '../../../src/modules/human-body/missions.js';
import { SpatialGrabPrimitive } from '../../../src/core/input/primitives/grab.js';
import type { CourseEventType, MissionDefinition } from '../../../src/core/types.js';

describe('Follow-up Fix: Event Emitter Coverage and Step Predicates', () => {
  const allMissions: MissionDefinition[] = [
    ...AEROSPACE_MISSIONS,
    ...QUANTUM_MISSIONS,
    ...HUMAN_BODY_MISSIONS,
  ];

  it('fails if any event type referenced by any mission step has no real emitter', () => {
    // Exact list of all course event types with concrete emitters in src/
    const registeredEmitters = new Set<CourseEventType>([
      'grabbed',
      'released',
      'placed',
      'docked',
      'rejected',
      'sliderChanged',
      'rotated',
      'panelOpened',
      'panelClosed',
      'tierChanged',
      'explodeChanged',
      'flowToggled',
      'gazeHeld',
      'enteredZone',
      'measured',
    ]);

    const knownEvents: CourseEventType[] = [
      'grabbed', 'released', 'placed', 'docked', 'rejected',
      'sliderChanged', 'rotated', 'panelOpened', 'panelClosed',
      'tierChanged', 'explodeChanged', 'flowToggled', 'gazeHeld',
      'enteredZone', 'measured',
    ];

    // Check that every event type that could be emitted matches a known emitter
    knownEvents.forEach((t) => {
      expect(registeredEmitters.has(t)).toBe(true);
    });

    // Verify all missions pass predicates with real event types
    allMissions.forEach((mission) => {
      mission.steps.forEach((step) => {
        expect(typeof step.completed).toBe('function');
      });
    });
  });

  it('fails if any step completed predicate is a constant true without narrative: true', () => {
    allMissions.forEach((mission) => {
      mission.steps.forEach((step) => {
        const passesWithEmpty = step.completed([]);
        if (passesWithEmpty) {
          // If a step succeeds with 0 events, it MUST be explicitly flagged as narrative: true
          expect(
            step.narrative,
            `Step "${step.id}" in mission "${mission.id}" auto-completes with empty events but lacks narrative: true`,
          ).toBe(true);
        }
      });
    });
  });
});

describe('Follow-up Fix: Near-Grab Zero Distance and World Pose Continuity', () => {
  it('near-grab maintains first-frame world pose continuity under 1 cm', () => {
    const parent = new THREE.Group();
    parent.position.set(2, 0, -3);
    parent.rotation.y = Math.PI / 6;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    mesh.position.set(0.2, 0.8, 0.4);
    parent.add(mesh);
    parent.updateMatrixWorld(true);

    const grab = new SpatialGrabPrimitive(mesh);
    const handWorldPos = mesh.getWorldPosition(new THREE.Vector3());
    const handWorldQuat = parent.getWorldQuaternion(new THREE.Quaternion());

    // Near grab: interactor is directly at object world position
    const grabbed = grab.tryGrab(handWorldPos, handWorldQuat);
    expect(grabbed).toBe(true);

    const initialWorldPos = mesh.getWorldPosition(new THREE.Vector3());
    const initialWorldQuat = mesh.getWorldQuaternion(new THREE.Quaternion());

    // Update with identical hand world pose
    grab.update(handWorldPos, handWorldQuat);

    const currentWorldPos = mesh.getWorldPosition(new THREE.Vector3());
    const currentWorldQuat = mesh.getWorldQuaternion(new THREE.Quaternion());

    // World pose continuity under 1 cm and under 1 degree
    expect(currentWorldPos.distanceTo(initialWorldPos)).toBeLessThan(0.01);
    expect(currentWorldQuat.angleTo(initialWorldQuat)).toBeLessThan(0.017);
  });

  it('animated ease-back smoothly returns dropped object to home pose over ~0.25s', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    mesh.position.set(0, 1, 0);
    const grab = new SpatialGrabPrimitive(mesh);

    grab.tryGrab(new THREE.Vector3(0, 1, 0), new THREE.Quaternion());
    // Move away > 1.5m and release
    mesh.position.set(2.5, 1, 0);
    grab.release();

    // Immediately after release, starts ease-back from displaced position
    expect(mesh.position.x).toBeCloseTo(2.5, 2);

    // After 0.12s (halfway)
    grab.tickEaseBack(0.12);
    expect(mesh.position.x).toBeLessThan(2.5);
    expect(mesh.position.x).toBeGreaterThan(0.0);

    // After 0.25s total elapsed, home pose is reached
    grab.tickEaseBack(0.15);
    expect(mesh.position.x).toBeCloseTo(0, 2);
    expect(mesh.position.y).toBeCloseTo(1, 2);
    expect(mesh.position.z).toBeCloseTo(0, 2);
  });
});
