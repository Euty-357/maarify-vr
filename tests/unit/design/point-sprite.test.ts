import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as THREE from 'three';
import {
  createRoundPointMaterial,
  getRoundPointTexture,
} from '../../../src/core/design/point-sprite.js';
import { createStarPointMaterial } from '../../../src/core/design/star-sprite.js';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const SRC_ROOT = join(REPO_ROOT, 'src');

/** Collect every .ts file under src/. */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('shared round-point material', () => {
  it('no source file constructs a THREE.PointsMaterial directly', () => {
    // A bare PointsMaterial renders square points. Every point cloud must go
    // through createRoundPointMaterial() so they all render round.
    // The helper itself is the single allowed place.
    const allowed = join('core', 'design', 'point-sprite.ts');
    const offenders: string[] = [];
    for (const file of collectSourceFiles(SRC_ROOT)) {
      const source = readFileSync(file, 'utf8');
      if (!source.includes('new THREE.PointsMaterial(')) continue;
      if (file.endsWith(allowed)) continue;
      offenders.push(file.replace(REPO_ROOT, ''));
    }
    expect(offenders).toEqual([]);
  });

  it('applies the shared alpha map', () => {
    const material = createRoundPointMaterial({ color: 0xff0000, size: 0.05 });
    expect(material.alphaMap).toBe(getRoundPointTexture());
    expect(material.alphaTest).toBeGreaterThan(0);
    expect(material.transparent).toBe(true);
    material.dispose();
  });

  it('shares one texture instance across materials', () => {
    const a = createRoundPointMaterial();
    const b = createRoundPointMaterial();
    expect(a.alphaMap).toBe(b.alphaMap);
    a.dispose();
    b.dispose();
  });
});

describe('Cosmos stars use the round material', () => {
  it('uses the alphaMap, additive blending and depthWrite false', () => {
    const material = createStarPointMaterial(0xffffff, 0.18, true);
    expect(material.alphaMap).not.toBeNull();
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    expect(material.vertexColors).toBe(true);
    material.dispose();
  });

  it('is the material the Cosmos scene actually builds', async () => {
    const { buildCosmosScene } = await import('../../../src/modules/cosmos/scene.js');
    const scene = await buildCosmosScene();
    const starfield = scene.starfield;
    const material = starfield.material as THREE.PointsMaterial;
    expect(material.alphaMap).not.toBeNull();
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    scene.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material as THREE.Material;
        mat.dispose();
      }
    });
  });
});

describe('flow and smoke particles use the round material', () => {
  it('FlowPathPlayer points are round', async () => {
    const { FlowPathPlayer } = await import('../../../src/core/assets/flow-path-player.js');
    const player = new FlowPathPlayer({
      flowPath: [[0, 0, 0], [1, 0, 0]],
      flowColor: 0xff0000,
      particleCount: 4,
    });
    const material = player.mesh.material as THREE.PointsMaterial;
    expect(material.alphaMap).not.toBeNull();
    player.dispose();
  });

  it('aerospace smoke particles are round', async () => {
    const { buildAerospaceScene } = await import('../../../src/modules/aerospace/scene.js');
    const scene = await buildAerospaceScene();
    const smoke = scene.root.getObjectByName('wind-tunnel-particles') as THREE.Points | undefined;
    expect(smoke).toBeDefined();
    const material = smoke?.material as THREE.PointsMaterial;
    expect(material.alphaMap).not.toBeNull();
    scene.dispose();
  });
});