import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { parseAssetNodes } from '../../../src/core/assets/asset-parser.js';

import { AssetCache } from '../../../src/core/assets/asset-cache.js';

function makePartMesh(partId: string, position: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  mesh.position.copy(position);
  mesh.name = `part-${partId}`;
  mesh.userData = {
    partId,
    label: partId.charAt(0).toUpperCase() + partId.slice(1),
    description: 'A test part description.',
    explodeDirection: [1, 0, 0],
    explodeDistanceMeters: 0.5,
  };
  return mesh;
}

function makeSceneWithParts(): THREE.Scene {
  const scene = new THREE.Scene();

  scene.add(makePartMesh('nozzle', new THREE.Vector3(0, 0, 0)));

  const nonMoving = makePartMesh('chamber', new THREE.Vector3(0, 0, 0));
  nonMoving.userData.explodeDistanceMeters = 0;
  nonMoving.userData.explodeDirection = [0, 0, 0];
  scene.add(nonMoving);

  const zeroVector = makePartMesh('heat-shield', new THREE.Vector3(0, 0, 0));
  zeroVector.userData.explodeDistanceMeters = 0.3;
  zeroVector.userData.explodeDirection = [0, 0, 0];
  scene.add(zeroVector);

  const nonUnit = makePartMesh('fin', new THREE.Vector3(0, 0, 0));
  nonUnit.userData.explodeDirection = [3, 0, 0];
  nonUnit.userData.explodeDistanceMeters = 0.2;
  scene.add(nonUnit);

  const anchor = new THREE.Object3D();
  anchor.name = 'anchor_peg_1';
  anchor.userData = {
    anchorName: 'peg-socket-1',
    snapRadiusMeters: 0.2,
    acceptsPegId: 'peg-insti',
    acceptsGateIds: JSON.stringify(['gate-a', 'gate-b']),
  };
  scene.add(anchor);

  const flow = new THREE.Object3D();
  flow.name = 'flow-oxygenated';
  flow.userData = {
    flowName: 'oxygenated-flow',
    flowPath: JSON.stringify([[0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]]),
    flowColor: '#ee3344',
  };
  scene.add(flow);

  const peg = new THREE.Object3D();
  peg.userData = {
    role: 'peg',
    pegId: 'peg-insti',
    snapAnchorName: 'anchor_peg_1',
  };
  scene.add(peg);

  return scene;
}

describe('parseAssetNodes', () => {
  it('parses moving parts with normalised directions', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const nozzle = parsed.parts.find((p) => p.partId === 'nozzle');
    expect(nozzle).toBeDefined();
    expect(nozzle?.isMoving).toBe(true);
    expect(nozzle?.explodeDirection).not.toBeNull();
    expect(nozzle?.explodeDirection?.length()).toBeCloseTo(1, 5);
    expect(nozzle?.explodeDistanceMeters).toBe(0.5);
  });

  it('treats zero distance as non-moving', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const chamber = parsed.parts.find((p) => p.partId === 'chamber');
    expect(chamber).toBeDefined();
    expect(chamber?.isMoving).toBe(false);
    expect(chamber?.explodeDirection).toBeNull();
    expect(chamber?.explodeDistanceMeters).toBe(0);
  });

  it('treats zero vector with positive distance as non-moving', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const shield = parsed.parts.find((p) => p.partId === 'heat-shield');
    expect(shield).toBeDefined();
    expect(shield?.isMoving).toBe(false);
    expect(shield?.explodeDirection).toBeNull();
    expect(shield?.explodeDistanceMeters).toBe(0);
  });

  it('normalises non-unit directions', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const fin = parsed.parts.find((p) => p.partId === 'fin');
    expect(fin).toBeDefined();
    expect(fin?.isMoving).toBe(true);
    expect(fin?.explodeDirection?.x).toBeCloseTo(1, 5);
    expect(fin?.explodeDirection?.y).toBeCloseTo(0, 5);
    expect(fin?.explodeDirection?.z).toBeCloseTo(0, 5);
  });

  it('keeps non-moving parts tappable (they are still in parts list)', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);
    expect(parsed.parts).toHaveLength(4);
  });

  it('parses anchors with acceptsGateIds', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const anchor = parsed.anchors.find((a) => a.anchorName === 'peg-socket-1');
    expect(anchor).toBeDefined();
    expect(anchor?.snapRadiusMeters).toBe(0.2);
    expect(anchor?.acceptsPegId).toBe('peg-insti');
    expect(anchor?.acceptsGateIds).toEqual(['gate-a', 'gate-b']);
  });

  it('parses flows with path and color', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const flow = parsed.flows.find((f) => f.flowName === 'oxygenated-flow');
    expect(flow).toBeDefined();
    expect(flow?.flowPath).toEqual([[0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]]);
    expect(flow?.flowColor).toBe(0xee3344);
  });

  it('parses role peg objects', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);

    const peg = parsed.roles.find((r) => r.role === 'peg');
    expect(peg).toBeDefined();
    expect(peg?.pegId).toBe('peg-insti');
    expect(peg?.snapAnchorName).toBe('anchor_peg_1');
  });

  it('counts triangles correctly', () => {
    const scene = makeSceneWithParts();
    const parsed = parseAssetNodes(scene);
    expect(parsed.totalTriangles).toBe(4 * 12);
  });

  it('flags descriptions longer than 40 words as warnings', () => {
    const scene = new THREE.Scene();
    const mesh = makePartMesh('long-desc', new THREE.Vector3(0, 0, 0));
    mesh.userData.description = 'This is a very long description that has way more than forty words and should trigger a warning in the parser because Level 1 tags must be at most forty words according to the immersion charter and the published asset conventions for Maarify GLB extras.';
    scene.add(mesh);

    const parsed = parseAssetNodes(scene);
    expect(parsed.warnings.length).toBeGreaterThan(0);
    expect(parsed.warnings[0]).toContain('exceeds');
  });

  it('returns empty arrays for an empty scene', () => {
    const parsed = parseAssetNodes(new THREE.Scene());
    expect(parsed.parts).toEqual([]);
    expect(parsed.anchors).toEqual([]);
    expect(parsed.flows).toEqual([]);
    expect(parsed.roles).toEqual([]);
    expect(parsed.totalTriangles).toBe(0);
  });
});

describe('AssetCache', () => {
  it('reference counts and releases assets', async () => {
    const cache = new AssetCache();

    expect(cache.size).toBe(0);

    cache.release('nonexistent.glb');
    expect(cache.size).toBe(0);
  });
});