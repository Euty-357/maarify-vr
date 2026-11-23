import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createStarPointMaterial } from '../../../src/core/design/star-sprite.js';
import { SpatialAnchorPrimitive } from '../../../src/core/input/primitives/anchor.js';
import type { SpatialAnchorDefinition } from '../../../src/core/types.js';

/**
 * Regression tests for the three reported issues:
 *  1. Cosmos stars rendered as boxes.
 *  2. The pointer ray stuck to engine bases in aerospace.
 *  3. Leftover rays from the "i" info pointers.
 *
 * Each test fails against the pre-fix code and passes after the fix.
 */

describe('ISSUE 1: Cosmos stars rendered as boxes', () => {
  it('uses an alpha map so points render round rather than square', () => {
    const material = createStarPointMaterial(0xffffff, 0.18, true);
    // A bare PointsMaterial has no alphaMap and renders solid squares.
    expect(material.alphaMap).not.toBeNull();
    expect(material.alphaTest).toBeGreaterThan(0);
    expect(material.transparent).toBe(true);
    material.dispose();
  });

  it('keeps vertex colours for the spectral star colours', () => {
    const material = createStarPointMaterial(0xffffff, 0.18, true);
    expect(material.vertexColors).toBe(true);
    material.dispose();
  });
});

describe('ISSUE 2: pointer ray stuck to engine bases', () => {
  it('marks GLB parts as explodable so tooling can tell them apart', async () => {
    const { createExplodableFromAsset } = await import(
      '../../../src/core/assets/explodable-adapter.js'
    );
    const { parseAssetNodes } = await import('../../../src/core/assets/asset-parser.js');

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial(),
    );
    mesh.userData = {
      partId: 'engine-part',
      label: 'Engine Part',
      description: 'A part of the engine.',
      explodeDirection: [1, 0, 0],
      explodeDistanceMeters: 0.3,
    };
    scene.add(mesh);

    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    createExplodableFromAsset(parsed, root);

    expect(mesh.userData.isExplodablePart).toBe(true);
  });

  it('keeps a GLB engine part hittable by the pointer', async () => {
    const { createExplodableFromAsset } = await import(
      '../../../src/core/assets/explodable-adapter.js'
    );
    const { parseAssetNodes } = await import('../../../src/core/assets/asset-parser.js');
    const { selectRayHit } = await import('../../../src/core/input/ray-hit.js');

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial(),
    );
    mesh.userData = {
      partId: 'engine-part',
      label: 'Engine Part',
      description: 'A part of the engine.',
      explodeDirection: [1, 0, 0],
      explodeDistanceMeters: 0.3,
    };
    scene.add(mesh);

    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    createExplodableFromAsset(parsed, root);

    // The adapter gives the part a grab primitive, so the ray must accept it.
    const hit = selectRayHit([
      { object: mesh, distance: 1.5, point: new THREE.Vector3(0, 0, -1.5) },
    ]);
    expect(hit).not.toBeNull();
  });
});

describe('ISSUE 3: leftover rays from the "i" info pointers', () => {
  function makeAnchor(): SpatialAnchorDefinition {
    return {
      id: 'test-anchor',
      anchorPosition: new THREE.Vector3(0, 1, 0),
      label: 'Test',
      level1Note: 'A test anchor.',
      level2Simulation: {
        foundation: { type: 'exploded-view', description: 'd', caption: 'c' },
        advanced: { type: 'exploded-view', description: 'd', caption: 'c' },
        expert: { type: 'exploded-view', description: 'd', caption: 'c' },
      },
      sourceRefs: [],
    };
  }

  it('creates no batched leader lines at all', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    primitive.registerAnchor(makeAnchor(), 'foundation');
    primitive.batchLeaderLines();

    // The leader line and its batched replacement were deleted, so there is
    // nothing left that could draw a permanent ray from every anchor to
    // nowhere.
    const batched = container.getObjectByName('anchor-leader-lines-batched');
    expect(batched).toBeUndefined();

    const visibleLines: THREE.Object3D[] = [];
    container.traverse((object) => {
      if (!object.visible) return;
      if (object instanceof THREE.Line || object instanceof THREE.LineSegments) {
        visibleLines.push(object);
      }
    });
    expect(visibleLines).toHaveLength(0);
  });

  it('creates no per-anchor leader line', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    const anchor = primitive.registerAnchor(makeAnchor(), 'foundation');
    const line = anchor.children.find(
      (child) => child instanceof THREE.Line || child instanceof THREE.LineSegments,
    ) as THREE.Line | undefined;
    expect(line).toBeUndefined();
  });
});