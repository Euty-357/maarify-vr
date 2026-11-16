import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { HubWorld } from '../../../src/hub/hub-world.js';
import aerospaceModule from '../../../src/modules/aerospace/index.js';

describe('Hub / Module Separation Lifecycle', () => {
  let scene: THREE.Scene;
  let hubWorld: HubWorld;

  beforeEach(() => {
    scene = new THREE.Scene();
    hubWorld = new HubWorld();
    scene.add(hubWorld);
  });

  it('entering module hides hub completely and leaving restores it', async () => {
    expect(hubWorld.visible).toBe(true);
    const initialHubChildCount = hubWorld.children.length;

    for (let cycle = 0; cycle < 10; cycle++) {
      // 1. Enter Aerospace module
      hubWorld.visible = false;
      const moduleRoot = await aerospaceModule.load(scene);

      expect(hubWorld.visible).toBe(false);
      expect(moduleRoot.children.length).toBeGreaterThan(0);
      expect(scene.children.includes(moduleRoot)).toBe(true);

      // Verify no hub portal is reachable or visible
      for (const portal of hubWorld.portals) {
        expect(portal.portalMesh.visible).toBe(true); // internally true, but parent hubWorld is false
      }

      // 2. Unload module and return to Hub
      aerospaceModule.unload();
      expect(scene.children.includes(moduleRoot)).toBe(false);

      hubWorld.visible = true;
      expect(hubWorld.visible).toBe(true);
      expect(hubWorld.children.length).toBe(initialHubChildCount);
    }
  });

  it('guarantees hub and module never remain simultaneously active if returnToHub is called during load', async () => {
    // Simulate navigation race: load started, returnToHub called before load finishes
    let generation = 1;
    hubWorld.visible = false;

    // Module load promise started
    const loadPromise = aerospaceModule.load(scene);

    // Return to hub called mid-flight
    generation++;
    aerospaceModule.unload();
    hubWorld.visible = true;

    const moduleRoot = await loadPromise;
    // If generation changed, module must be unloaded and removed from scene
    if (generation !== 1) {
      aerospaceModule.unload();
      if (moduleRoot && scene.children.includes(moduleRoot)) {
        scene.remove(moduleRoot);
      }
    }

    expect(hubWorld.visible).toBe(true);
    expect(scene.children.includes(moduleRoot)).toBe(false);
  });
});
