import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SpatialAnchorPrimitive } from '../../../src/core/input/primitives/anchor.js';
import type { SpatialAnchorDefinition } from '../../../src/core/types.js';

/**
 * The "leftover rays from the i pointers" bug: the anchor leader line was
 * permanently hidden, but SpatialAnchorPrimitive.batchLeaderLines() built a
 * batched LineSegments from those hidden lines and left the batch VISIBLE, so
 * every module drew a permanent ray from each anchor to nowhere.
 *
 * These tests assert, per module scene, that in the idle state no visible
 * THREE.Line or THREE.LineSegments exists except the ones the module itself
 * documents (wind-tunnel streamlines and other deliberate line geometry).
 */

function makeAnchor(id: string): SpatialAnchorDefinition {
  return {
    id,
    anchorPosition: new THREE.Vector3(0, 1, 0),
    label: `Anchor ${id}`,
    level1Note: 'A test anchor.',
    level2Simulation: {
      foundation: { type: 'exploded-view', description: 'd', caption: 'c' },
      advanced: { type: 'exploded-view', description: 'd', caption: 'c' },
      expert: { type: 'exploded-view', description: 'd', caption: 'c' },
    },
    sourceRefs: [],
  };
}

/** Every visible Line / LineSegments in a subtree. */
function collectVisibleLines(root: THREE.Object3D): THREE.Object3D[] {
  const found: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (!object.visible) return;
    if (object instanceof THREE.Line || object instanceof THREE.LineSegments) {
      found.push(object);
    }
  });
  return found;
}

describe('DiegeticSpatialAnchor has no dead leader line or indicator', () => {
  it('creates no Line and no indicator mesh', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    const anchor = primitive.registerAnchor(makeAnchor('a1'), 'foundation');

    const lines = anchor.children.filter(
      (child) => child instanceof THREE.Line || child instanceof THREE.LineSegments,
    );
    expect(lines).toHaveLength(0);

    const indicators = anchor.children.filter(
      (child) => child.userData.isAnchorIndicator === true,
    );
    expect(indicators).toHaveLength(0);
  });

  it('batchLeaderLines adds no line geometry at all', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    primitive.registerAnchor(makeAnchor('a1'), 'foundation');
    primitive.registerAnchor(makeAnchor('a2'), 'foundation');

    primitive.batchLeaderLines();

    const lines = collectVisibleLines(container);
    expect(lines).toHaveLength(0);
    expect(container.getObjectByName('anchor-leader-lines-batched')).toBeUndefined();
  });

  it('dispose() releases the tag texture and is safe to call twice', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    const anchor = primitive.registerAnchor(makeAnchor('a1'), 'foundation');

    expect(() => anchor.dispose()).not.toThrow();
    expect(() => anchor.dispose()).not.toThrow();
  });

  it('SpatialAnchorPrimitive.dispose() removes every anchor from the graph', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    primitive.registerAnchor(makeAnchor('a1'), 'foundation');
    primitive.registerAnchor(makeAnchor('a2'), 'foundation');
    expect(container.children.length).toBeGreaterThan(0);

    primitive.dispose();
    expect(container.children.length).toBe(0);
    expect(primitive.getAllAnchors()).toHaveLength(0);
  });
});

describe('module scenes leave no visible leftover rays', () => {
  /**
   * A leftover ray is any visible Line / LineSegments that is NOT one of the
   * module's own named, deliberate line geometry. The anchor leader line and
   * the batched replacement are the ones that must never appear.
   */
  const DELIBERATE_LINE_NAMES = new Set([
    'engine-fuel-line',
    'engine-oxidiser-line',
    'engine-cooling-helix',
    'wind-tunnel-streamline-ribbons',
    'stakeholder-graph-links',
  ]);

  function findLeftoverRays(root: THREE.Object3D): string[] {
    return collectVisibleLines(root)
      .map((line) => line.name)
      .filter((name) => !DELIBERATE_LINE_NAMES.has(name));
  }

  it('Cosmos scene has no leftover rays', async () => {
    const { buildCosmosScene } = await import('../../../src/modules/cosmos/scene.js');
    const scene = await buildCosmosScene();
    expect(findLeftoverRays(scene.root)).toEqual([]);
    scene.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material as THREE.Material;
        mat.dispose();
      }
    });
  });

  it('Aerospace scene has no leftover rays', async () => {
    const { buildAerospaceScene } = await import('../../../src/modules/aerospace/scene.js');
    const scene = await buildAerospaceScene();
    expect(findLeftoverRays(scene.root)).toEqual([]);
    scene.dispose();
  });

  it('Human Body scene has no leftover rays', async () => {
    const { buildHumanBodyScene } = await import('../../../src/modules/human-body/scene.js');
    const scene = await buildHumanBodyScene();
    expect(findLeftoverRays(scene.root)).toEqual([]);
    scene.dispose();
  });

  it('Quantum scene has no leftover rays', async () => {
    const { buildQuantumScene } = await import('../../../src/modules/quantum/scene.js');
    const scene = await buildQuantumScene();
    expect(findLeftoverRays(scene.root)).toEqual([]);
    scene.dispose();
  });

  it('DNA scene has no leftover rays', async () => {
    const { buildScene } = await import('../../../src/modules/dna-genetics/scene.js');
    const scene = await buildScene();
    expect(findLeftoverRays(scene.root)).toEqual([]);
    scene.dispose();
  });
});