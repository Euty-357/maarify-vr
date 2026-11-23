import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import cosmosModule from '../../../src/modules/cosmos/index.js';
import quantumModule from '../../../src/modules/quantum/index.js';
import humanBodyModule from '../../../src/modules/human-body/index.js';
import aerospaceModule from '../../../src/modules/aerospace/index.js';
import dnaGeneticsModule from '../../../src/modules/dna-genetics/index.js';
import environmentModule from '../../../src/modules/environment/index.js';

const modules = [
  { name: 'Cosmos', mod: cosmosModule },
  { name: 'Quantum', mod: quantumModule },
  { name: 'Human Body', mod: humanBodyModule },
  { name: 'Aerospace', mod: aerospaceModule },
  { name: 'DNA & Genetics', mod: dnaGeneticsModule },
  { name: 'Climate & Environment', mod: environmentModule },
];

describe('Module Orientation and Alignment Verification', () => {
  for (const { name, mod } of modules) {
    it(`verifies ${name} module root is upright with floor at y=0 and zero roll/pitch tilt`, async () => {
      const container = new THREE.Scene();
      const root = await mod.load(container);
      expect(root).toBeDefined();

      // Module root should be centered and level
      expect(root.position.x).toBeCloseTo(0, 2);
      expect(root.position.y).toBeCloseTo(0, 2);
      expect(root.position.z).toBeCloseTo(0, 2);

      expect(root.rotation.x).toBeCloseTo(0, 2);
      expect(root.rotation.z).toBeCloseTo(0, 2);

      // Verify world up vector of root is (0, 1, 0)
      root.updateMatrixWorld(true);
      const rootUp = new THREE.Vector3(0, 1, 0).applyQuaternion(root.quaternion);
      expect(rootUp.dot(new THREE.Vector3(0, 1, 0))).toBeCloseTo(1, 4);

      mod.unload();
    });
  }

  it('verifies Quantum hardware pedestals are level and vertical (no uncommanded pitch)', async () => {
    const container = new THREE.Scene();
    const root = await quantumModule.load(container);
    root.updateMatrixWorld(true);

    const worldUp = new THREE.Vector3(0, 1, 0);
    root.traverse((obj) => {
      if (obj.name && (obj.name.startsWith('pedestal-') || obj.name.startsWith('lab-table-'))) {
        const objWorldQuat = new THREE.Quaternion();
        obj.getWorldQuaternion(objWorldQuat);
        const objUp = new THREE.Vector3(0, 1, 0).applyQuaternion(objWorldQuat);
        // Up vector must point straight up (dot product with (0, 1, 0) close to 1)
        expect(objUp.dot(worldUp)).toBeGreaterThan(0.99);
      }
    });

    quantumModule.unload();
  }, 15000);
});
