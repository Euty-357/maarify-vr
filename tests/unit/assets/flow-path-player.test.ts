import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FlowPathPlayer } from '../../../src/core/assets/flow-path-player.js';

const path: [number, number, number][] = [
  [0, 0, 0],
  [0.1, 0, 0],
  [0.2, 0, 0],
  [0.3, 0, 0],
];

describe('FlowPathPlayer', () => {
  it('creates a Points mesh with the given particle count', () => {
    const player = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 16 });
    expect(player.mesh instanceof THREE.Points).toBe(true);
    expect(player.particleCount).toBe(16);
    player.dispose();
  });

  it('advances particles along the spline on update', () => {
    const player = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 8 });
    const geometry = player.mesh.geometry as THREE.BufferGeometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const before = posAttr.array as Float32Array;
    const beforeCopy = Float32Array.from(before);

    player.update(0.01);

    const after = posAttr.array as Float32Array;
    let changed = false;
    for (let i = 0; i < beforeCopy.length; i++) {
      if (Math.abs(beforeCopy[i] - after[i]) > 1e-6) { changed = true; break; }
    }
    expect(changed).toBe(true);
    player.dispose();
  });

  it('keeps particles within the path bounds', () => {
    const player = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 32 });
    const geometry = player.mesh.geometry as THREE.BufferGeometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // All x values should be between 0 and 0.3 (the path extent)
    for (let i = 0; i < arr.length; i += 3) {
      expect(arr[i]).toBeGreaterThanOrEqual(-0.01);
      expect(arr[i]).toBeLessThanOrEqual(0.31);
    }
    player.dispose();
  });

  it('setSpeed changes the advance rate', () => {
    const fast = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 8, speed: 1.0 });
    const slow = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 8, speed: 0.0 });

    const fastGeo = fast.mesh.geometry as THREE.BufferGeometry;
    const slowGeo = slow.mesh.geometry as THREE.BufferGeometry;
    const fastBefore = Float32Array.from((fastGeo.getAttribute('position') as THREE.BufferAttribute).array);
    const slowBefore = Float32Array.from((slowGeo.getAttribute('position') as THREE.BufferAttribute).array);

    fast.update(0.1);
    slow.update(0.1);

    const fastAfter = (fastGeo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const slowAfter = (slowGeo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;

    let fastChanged = false, slowChanged = false;
    for (let i = 0; i < fastBefore.length; i++) {
      if (Math.abs(fastBefore[i] - fastAfter[i]) > 1e-6) fastChanged = true;
      if (Math.abs(slowBefore[i] - slowAfter[i]) > 1e-6) slowChanged = true;
    }
    expect(fastChanged).toBe(true);
    expect(slowChanged).toBe(false);

    fast.dispose();
    slow.dispose();
  });

  it('disposes geometry and material without throwing', () => {
    const player = new FlowPathPlayer({ flowPath: path, flowColor: 0xef4444, particleCount: 8 });
    expect(() => player.dispose()).not.toThrow();
  });
});