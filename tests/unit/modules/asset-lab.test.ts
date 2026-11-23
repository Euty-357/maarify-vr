import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildAssetLabScene } from '../../../src/modules/asset-lab/scene.js';
import { ASSET_REGISTRY } from '../../../src/core/assets/registry.generated.js';

describe('Asset Lab module', () => {
  it('builds a shelf holding every registry asset', async () => {
    const scene = await buildAssetLabScene();
    const shelf = scene.root.getObjectByName('asset-shelf') as THREE.Group;
    expect(shelf).toBeDefined();
    const slots = shelf.children.filter((c) => c.userData.isShelfSlot === true);
    expect(slots).toHaveLength(ASSET_REGISTRY.length);
    expect(ASSET_REGISTRY.length).toBeGreaterThan(0);
    scene.dispose();
  });

  it('exposes no placed asset before one is selected', async () => {
    const scene = await buildAssetLabScene();
    expect(scene.getPlacedAssetName()).toBeNull();
    scene.dispose();
  });

  it('rejects an unknown asset name', async () => {
    const scene = await buildAssetLabScene();
    await expect(scene.placeAssetByName('does-not-exist')).rejects.toThrow(/Unknown asset/);
    scene.dispose();
  });

  it('keeps the floor flat and the root upright', async () => {
    const scene = await buildAssetLabScene();
    expect(scene.root.rotation.x).toBeCloseTo(0, 5);
    expect(scene.root.rotation.y).toBeCloseTo(0, 5);
    expect(scene.root.rotation.z).toBeCloseTo(0, 5);
    scene.dispose();
  });

  it('disposes cleanly without leaving listeners behind', async () => {
    const scene = await buildAssetLabScene();
    expect(() => scene.dispose()).not.toThrow();
  });
});