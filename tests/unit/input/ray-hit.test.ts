import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  selectRayHit,
  isHiddenInHierarchy,
  isInteractiveObject,
  rayEndPoint,
  type RayHitLike,
} from '../../../src/core/input/ray-hit.js';

function hit(object: THREE.Object3D, distance: number): RayHitLike {
  return { object, distance, point: new THREE.Vector3(0, 0, -distance) };
}

function makeMesh(name: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshBasicMaterial(),
  );
  mesh.name = name;
  return mesh;
}

describe('isHiddenInHierarchy', () => {
  it('is false for a visible object', () => {
    const mesh = makeMesh('visible');
    expect(isHiddenInHierarchy(mesh)).toBe(false);
  });

  it('is true when the object itself is hidden', () => {
    const mesh = makeMesh('hidden');
    mesh.visible = false;
    expect(isHiddenInHierarchy(mesh)).toBe(true);
  });

  it('is true when any ancestor is hidden', () => {
    const parent = new THREE.Group();
    const child = makeMesh('child');
    parent.add(child);
    parent.visible = false;
    expect(isHiddenInHierarchy(child)).toBe(true);
  });

  it('is false when only a sibling is hidden', () => {
    const parent = new THREE.Group();
    const visible = makeMesh('visible');
    const hidden = makeMesh('hidden');
    hidden.visible = false;
    parent.add(visible, hidden);
    expect(isHiddenInHierarchy(visible)).toBe(false);
  });
});

describe('isInteractiveObject', () => {
  it('is true for an object with an activate callback', () => {
    const mesh = makeMesh('button');
    mesh.userData.activate = () => {};
    expect(isInteractiveObject(mesh)).toBe(true);
  });

  it('is true when an ancestor carries the primitive', () => {
    const parent = new THREE.Group();
    const child = makeMesh('handle');
    parent.add(child);
    parent.userData.sliderPrimitive = {};
    expect(isInteractiveObject(child)).toBe(true);
  });

  it('is false for plain decorative geometry', () => {
    const mesh = makeMesh('floor');
    expect(isInteractiveObject(mesh)).toBe(false);
  });
});

describe('selectRayHit', () => {
  it('ignores a hidden mesh in front of an interactable', () => {
    const hidden = makeMesh('hidden-collider');
    hidden.visible = false;
    const button = makeMesh('button');
    button.userData.activate = () => {};

    const selected = selectRayHit([hit(hidden, 1), hit(button, 2)]);
    expect(selected?.object).toBe(button);
  });

  it('ignores a hidden ancestor of the hit object', () => {
    const group = new THREE.Group();
    group.visible = false;
    const child = makeMesh('child');
    group.add(child);
    const button = makeMesh('button');
    button.userData.activate = () => {};

    const selected = selectRayHit([hit(child, 1), hit(button, 2)]);
    expect(selected?.object).toBe(button);
  });

  it('skips decorative geometry in front of an interactable', () => {
    const decorative = makeMesh('decorative-wall');
    const button = makeMesh('button');
    button.userData.activate = () => {};

    const selected = selectRayHit([hit(decorative, 1), hit(button, 2)]);
    expect(selected?.object).toBe(button);
  });

  it('returns null when only decorative geometry is hit', () => {
    const decorative = makeMesh('decorative-wall');
    const selected = selectRayHit([hit(decorative, 1)]);
    expect(selected).toBeNull();
  });

  it('accepts a panel overlay with an activate callback', () => {
    const panel = makeMesh('folio-panel');
    panel.userData.activate = () => {};
    const selected = selectRayHit([hit(panel, 0.8)]);
    expect(selected?.object).toBe(panel);
  });

  it('accepts an object accepted by the extra interactivity rule', () => {
    const portal = makeMesh('hub-portal-cosmos');
    const selected = selectRayHit([hit(portal, 3)], {
      isInteractiveObject: (object) => object.name.startsWith('hub-portal-'),
    });
    expect(selected?.object).toBe(portal);
  });

  it('accepts decorative geometry when acceptDecorative is set', () => {
    const decorative = makeMesh('decorative-wall');
    const selected = selectRayHit([hit(decorative, 1)], { acceptDecorative: true });
    expect(selected?.object).toBe(decorative);
  });

  it('keeps GLB engine parts hittable', () => {
    // The explodable adapter gives every GLB part a grab primitive, so the
    // part resolves to an interactable and must not be skipped.
    const part = makeMesh('nozzle');
    part.userData.isExplodablePart = true;
    part.userData.grabPrimitive = { isGrabbed: false };

    const selected = selectRayHit([hit(part, 1.5)]);
    expect(selected?.object).toBe(part);
  });

  it('returns null for an empty hit list', () => {
    expect(selectRayHit([])).toBeNull();
  });

  it('returns the nearest acceptable hit when several qualify', () => {
    const near = makeMesh('near');
    near.userData.activate = () => {};
    const far = makeMesh('far');
    far.userData.activate = () => {};

    const selected = selectRayHit([hit(near, 1), hit(far, 2)]);
    expect(selected?.object).toBe(near);
  });
});

describe('rayEndPoint', () => {
  it('uses the hit point when something was hit', () => {
    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    const point = new THREE.Vector3(0, 1, -2);
    const end = rayEndPoint(origin, direction, { object: makeMesh('x'), distance: 2, point }, 4.5);
    expect(end.equals(point)).toBe(true);
  });

  it('runs to the full beam length when nothing was hit', () => {
    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    const end = rayEndPoint(origin, direction, null, 4.5);
    expect(end.z).toBeCloseTo(-4.5, 5);
    expect(end.y).toBeCloseTo(1, 5);
  });
});