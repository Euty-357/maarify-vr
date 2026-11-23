import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createExplodableFromAsset } from '../../../src/core/assets/explodable-adapter.js';
import { parseAssetNodes } from '../../../src/core/assets/asset-parser.js';

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
    description: 'A test part.',
    explodeDirection: [1, 0, 0],
    explodeDistanceMeters: 0.5,
  };
  return mesh;
}

function makeAssetScene(): THREE.Scene {
  const scene = new THREE.Scene();

  // Moving part
  scene.add(makePartMesh('nozzle', new THREE.Vector3(0, 0, 0)));

  // Non-moving part (zero distance)
  const chamber = makePartMesh('chamber', new THREE.Vector3(0, 0, 0));
  chamber.userData.explodeDistanceMeters = 0;
  chamber.userData.explodeDirection = [0, 0, 0];
  scene.add(chamber);

  // Non-moving part (zero vector, positive distance)
  const shield = makePartMesh('shield', new THREE.Vector3(0, 0, 0));
  shield.userData.explodeDistanceMeters = 0.3;
  shield.userData.explodeDirection = [0, 0, 0];
  scene.add(shield);

  return scene;
}

describe('createExplodableFromAsset', () => {
  it('registers every part as tappable (moving and non-moving)', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    expect(assembly.getParts()).toHaveLength(3);
    expect(assembly.getPart('nozzle')).toBeDefined();
    expect(assembly.getPart('chamber')).toBeDefined();
    expect(assembly.getPart('shield')).toBeDefined();
  });

  it('moves parts between home and exploded slot with setExplodeAmount', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    const nozzle = assembly.getPart('nozzle')!;
    assembly.setExplodeAmount(1);
    expect(nozzle.object.position.x).toBeCloseTo(0.5, 5);

    assembly.setExplodeAmount(0.5);
    expect(nozzle.object.position.x).toBeCloseTo(0.25, 5);

    assembly.setExplodeAmount(0);
    expect(nozzle.object.position.x).toBeCloseTo(0, 5);
  });

  it('keeps non-moving (zero distance) parts at home', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    const chamber = assembly.getPart('chamber')!;
    assembly.setExplodeAmount(1);
    expect(chamber.object.position.x).toBeCloseTo(0, 5);
  });

  it('keeps non-moving (zero vector) parts at home even with positive distance', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    const shield = assembly.getPart('shield')!;
    assembly.setExplodeAmount(1);
    expect(shield.object.position.x).toBeCloseTo(0, 5);
  });

  it('normalises non-unit explode directions', () => {
    const scene = new THREE.Scene();
    const mesh = makePartMesh('fin', new THREE.Vector3(0, 0, 0));
    mesh.userData.explodeDirection = [3, 0, 0];
    mesh.userData.explodeDistanceMeters = 0.2;
    scene.add(mesh);

    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    const fin = assembly.getPart('fin')!;
    expect(fin.explodeDirection!.length()).toBeCloseTo(1, 5);
  });

  it('resets rest pose restores all parts to home', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    const nozzle = assembly.getPart('nozzle')!;
    assembly.setExplodeAmount(1);
    assembly.detach('nozzle');
    assembly.resetRestPose();

    expect(assembly.explodeAmount).toBe(0);
    expect(nozzle.object.position.x).toBeCloseTo(0, 5);
    expect(nozzle.object.position.y).toBeCloseTo(0, 5);
    expect(nozzle.object.position.z).toBeCloseTo(0, 5);
  });

  it('emits tap events on grab', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const events: string[] = [];
    const assembly = createExplodableFromAsset(parsed, root, {
      onEvent: (e) => events.push(e.type),
    });

    const nozzle = assembly.getPart('nozzle')!;
    nozzle.grab.options.onGrab?.('right');
    expect(events).toContain('tap');
  });

  it('highlights a part and clears highlight', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    assembly.highlightPart('nozzle', true);
    assembly.highlightPart('nozzle', false);
    // Should not throw
    expect(true).toBe(true);
  });

  it('supports partial explode amounts clamped to 0..1', () => {
    const scene = makeAssetScene();
    const parsed = parseAssetNodes(scene);
    const root = new THREE.Group();
    const assembly = createExplodableFromAsset(parsed, root);

    assembly.setExplodeAmount(-1);
    expect(assembly.explodeAmount).toBe(0);

    assembly.setExplodeAmount(2);
    expect(assembly.explodeAmount).toBe(1);
  });
});