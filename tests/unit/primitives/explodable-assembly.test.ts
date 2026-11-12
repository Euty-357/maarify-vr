import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ExplodableAssembly } from '../../../src/core/input/primitives/explodable-assembly.js';

function makeAssembly() {
  const root = new THREE.Group();
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial());
  nozzle.position.set(0.2, 0, 0);
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial());
  chamber.position.set(-0.2, 0, 0);
  root.add(nozzle, chamber);
  const assembly = new ExplodableAssembly(root);
  const nozzlePart = assembly.addPart('nozzle', nozzle, {
    explodeDirection: new THREE.Vector3(1, 0, 0),
    explodeDistanceMeters: 0.4,
  });
  const chamberPart = assembly.addPart('chamber', chamber, {
    explodeDirection: new THREE.Vector3(-1, 0, 0),
    explodeDistanceMeters: 0.3,
  });
  return { assembly, nozzle, chamber, nozzlePart, chamberPart };
}

describe('ExplodableAssembly', () => {
  it('moves every part between home and its exploded slot', () => {
    const { assembly, nozzle, chamber } = makeAssembly();
    assembly.setExplodeAmount(1);
    expect(nozzle.position.x).toBeCloseTo(0.6, 5);
    expect(chamber.position.x).toBeCloseTo(-0.5, 5);
    assembly.setExplodeAmount(0.5);
    expect(nozzle.position.x).toBeCloseTo(0.4, 5);
    assembly.setExplodeAmount(0);
    expect(nozzle.position.x).toBeCloseTo(0.2, 5);
    expect(chamber.position.x).toBeCloseTo(-0.2, 5);
  });

  it('gives every part its own grab primitive', () => {
    const { assembly, nozzle, chamber } = makeAssembly();
    expect(assembly.getParts()).toHaveLength(2);
    expect(nozzle.userData.grabPrimitive).toBeTruthy();
    expect(chamber.userData.grabPrimitive).toBeTruthy();
    expect(nozzle.userData.explodablePartId).toBe('nozzle');
  });

  it('detaches and re-attaches individual parts', () => {
    const { assembly, nozzle, nozzlePart } = makeAssembly();
    assembly.setExplodeAmount(1);
    const slot = assembly.slotPosition(nozzlePart);
    assembly.detach('nozzle');
    expect(nozzlePart.detached).toBe(true);
    expect(nozzle.position.equals(slot)).toBe(false);
    assembly.attach('nozzle');
    expect(nozzlePart.detached).toBe(false);
    expect(nozzle.position.distanceTo(slot)).toBeLessThan(1e-6);
  });

  it('snaps a released part back when it is near its slot, and leaves it out when far', () => {
    const { assembly, nozzle, nozzlePart } = makeAssembly();
    assembly.setExplodeAmount(0);
    expect(nozzlePart.grab.tryGrab(nozzle.position.clone(), new THREE.Quaternion())).toBe(true);
    nozzlePart.grab.release();
    expect(nozzlePart.detached).toBe(false);

    nozzle.position.set(3, 0, 0);
    expect(nozzlePart.grab.tryGrab(nozzle.position.clone(), new THREE.Quaternion())).toBe(true);
    nozzlePart.grab.release();
    expect(nozzlePart.detached).toBe(true);
  });

  it('resets the assembly to the home pose', () => {
    const { assembly, nozzle, chamber } = makeAssembly();
    assembly.setExplodeAmount(1);
    assembly.detach('nozzle');
    assembly.reset();
    expect(assembly.explodeAmount).toBe(0);
    expect(nozzle.position.x).toBeCloseTo(0.2, 5);
    expect(chamber.position.x).toBeCloseTo(-0.2, 5);
  });
});
