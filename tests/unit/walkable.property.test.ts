import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import quantumModule from '../../src/modules/quantum/index.js';
import aerospaceModule from '../../src/modules/aerospace/index.js';
import medicineModule from '../../src/modules/human-body/index.js';

describe('Walkable Property Tests', () => {
  // Property 8: isWalkable returns consistent results with room AABB
  // Validates: Requirements 63.1, 63.2, 63.3
  it('Property 8: Quantum isWalkable returns true strictly inside [-5, 5]x[-5, 5] and false outside', () => {
    // 100 points inside
    for (let i = 0; i < 100; i++) {
      const x = -4.9 + Math.random() * 9.8;
      const z = -4.9 + Math.random() * 9.8;
      expect(quantumModule.isWalkable?.(new THREE.Vector3(x, 0, z))).toBe(true);
    }

    // Points outside by > 0.1 m
    for (let i = 0; i < 100; i++) {
      const sign = i % 2 === 0 ? 1 : -1;
      const outsideCoord = sign * (5.15 + Math.random() * 5);
      const otherCoord = -4.0 + Math.random() * 8.0;

      // Outside on X
      expect(quantumModule.isWalkable?.(new THREE.Vector3(outsideCoord, 0, otherCoord))).toBe(false);
      // Outside on Z
      expect(quantumModule.isWalkable?.(new THREE.Vector3(otherCoord, 0, outsideCoord))).toBe(false);
    }
  });

  it('Property 8: Aerospace isWalkable returns true strictly inside [-7.5, 7.5]x[-5, 5] and false outside', () => {
    // 100 points inside
    for (let i = 0; i < 100; i++) {
      const x = -7.4 + Math.random() * 14.8;
      const z = -4.9 + Math.random() * 9.8;
      expect(aerospaceModule.isWalkable?.(new THREE.Vector3(x, 0, z))).toBe(true);
    }

    // Points outside by > 0.1 m
    for (let i = 0; i < 100; i++) {
      const sign = i % 2 === 0 ? 1 : -1;
      // Outside on X (> 7.6)
      const outX = sign * (7.65 + Math.random() * 5);
      expect(aerospaceModule.isWalkable?.(new THREE.Vector3(outX, 0, 0))).toBe(false);

      // Outside on Z (> 5.1)
      const outZ = sign * (5.15 + Math.random() * 5);
      expect(aerospaceModule.isWalkable?.(new THREE.Vector3(0, 0, outZ))).toBe(false);
    }
  });

  it('Property 8: Medicine isWalkable returns true inside atrium/wings and false far outside', () => {
    // Points inside atrium (radius <= 4.5)
    for (let i = 0; i < 50; i++) {
      const r = Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      expect(medicineModule.isWalkable?.(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)))).toBe(true);
    }

    // Points far outside (radius > 12)
    for (let i = 0; i < 50; i++) {
      const r = 12.0 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      expect(medicineModule.isWalkable?.(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)))).toBe(false);
    }
  });
});
