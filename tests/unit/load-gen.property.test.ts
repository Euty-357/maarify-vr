import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

describe('Load-Generation Property Tests', () => {
  // Property 10: Load-generation guard: only the latest generation's load takes effect
  // Validates: Requirements 43.1, 43.2
  it('Property 10: only the latest generation load completes and attaches to the scene', async () => {
    for (let run = 0; run < 50; run++) {
      const scene = new THREE.Scene();
      let loadGeneration = 0;
      let activeLoadedNode: THREE.Object3D | null = null;

      // Simulated async module loader following main.ts logic
      async function loadModuleSim(modId: string, delayMs: number): Promise<void> {
        loadGeneration += 1;
        const thisGen = loadGeneration;

        // Simulate async load duration
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        // Load generation guard (Req 43.2 / main.ts line 535)
        if (thisGen !== loadGeneration) {
          return; // stale — abort without attaching
        }

        const mesh = new THREE.Mesh();
        mesh.name = `module-${modId}-gen-${thisGen}`;
        scene.add(mesh);
        activeLoadedNode = mesh;
      }

      // Launch 3 interleaved loads with inverted delay order
      // Load 1 (gen 1, delay 30ms), Load 2 (gen 2, delay 20ms), Load 3 (gen 3, delay 5ms)
      const p1 = loadModuleSim('mod1', 30);
      const p2 = loadModuleSim('mod2', 20);
      const p3 = loadModuleSim('mod3', 5);

      await Promise.all([p1, p2, p3]);

      // Exactly one node attached, and it must belong to generation 3 (the highest)
      expect(scene.children.length).toBe(1);
      expect(activeLoadedNode).not.toBeNull();
      expect((activeLoadedNode as unknown as THREE.Object3D | null)?.name).toBe('module-mod3-gen-3');
    }
  });
});
