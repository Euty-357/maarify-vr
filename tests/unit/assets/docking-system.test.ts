import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DockingSystem } from '../../../src/core/assets/docking-system.js';
import { SpatialGrabPrimitive } from '../../../src/core/input/primitives/grab.js';

function makeGrabbedObject(position: THREE.Vector3): { object: THREE.Object3D; grab: SpatialGrabPrimitive } {
  const object = new THREE.Object3D();
  object.position.copy(position);
  const grab = new SpatialGrabPrimitive(object);
  return { object, grab };
}

function makeAnchorObject(position: THREE.Vector3): THREE.Object3D {
  const object = new THREE.Object3D();
  object.position.copy(position);
  return object;
}

describe('DockingSystem', () => {
  it('docks a peg into an accepting anchor when released within snap radius', () => {
    const events: string[] = [];
    const system = new DockingSystem({
      onEvent: (e) => events.push(`${e.type}:${e.pegId}:${e.anchorName}`),
    });

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-insti', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(true);
    expect(events).toContain('docked:peg-insti:socket-1');
  });

  it('rejects a peg that fails the acceptsPegId predicate', () => {
    const events: string[] = [];
    const system = new DockingSystem({
      onEvent: (e) => events.push(`${e.type}:${e.pegId}:${e.anchorName}`),
    });

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-other', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(false);
    expect(events).toContain('rejected:peg-other:socket-1');
  });

  it('ignores pegs released outside the snap radius', () => {
    const events: string[] = [];
    const system = new DockingSystem({
      onEvent: (e) => events.push(e.type),
    });

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(5, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-insti', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(false);
    expect(events.length).toBe(0);
  });

  it('accepts via gate id when peg has matching gateId in userData', () => {
    const events: string[] = [];
    const system = new DockingSystem({
      onEvent: (e) => events.push(`${e.type}:${e.pegId}:${e.anchorName}`),
    });

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    (pegObj.userData as { gateId?: string }).gateId = 'gate-a';
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, undefined, pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: undefined,
      acceptsGateIds: ['gate-a', 'gate-b'],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(true);
    // pegId is undefined for this peg, so the event falls back to the part id.
    expect(events).toContain('docked:peg-1:socket-1');
  });

  it('undocks a peg and emits undocked event', () => {
    const events: string[] = [];
    const system = new DockingSystem({
      onEvent: (e) => events.push(`${e.type}:${e.pegId}:${e.anchorName}`),
    });

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-insti', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(true);

    const peg = system.getPegs().find((p) => p.partId === 'peg-1')!;
    system.undock(peg);
    expect(system.isDocked('peg-1')).toBe(false);
    expect(events).toContain('undocked:peg-insti:socket-1');
  });

  it('reset undocks all pegs', () => {
    const system = new DockingSystem();

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-insti', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(true);

    system.reset();
    expect(system.isDocked('peg-1')).toBe(false);
  });

  it('regrabs a docked peg (undocks first)', () => {
    const system = new DockingSystem();

    const { object: pegObj, grab: pegGrab } = makeGrabbedObject(new THREE.Vector3(0, 0, 0));
    const anchorObj = makeAnchorObject(new THREE.Vector3(0.05, 0, 0));

    system.registerPeg('peg-1', pegObj, 'peg-insti', pegGrab);
    system.registerAnchor({
      anchorName: 'socket-1',
      snapRadiusMeters: 0.2,
      acceptsPegId: 'peg-insti',
      acceptsGateIds: [],
      object: anchorObj,
    });

    pegGrab.options.onRelease?.(undefined);
    expect(system.isDocked('peg-1')).toBe(true);

    const result = system.regrabPeg('peg-1');
    expect(result).toBe(true);
    expect(system.isDocked('peg-1')).toBe(false);
  });
});