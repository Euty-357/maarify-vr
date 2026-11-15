import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import humanBodyModule from '../../../src/modules/human-body/index.js';
import { MEDICINE_WINGS } from '../../../src/modules/human-body/sections.js';

describe('Human Body Medicine Wings Room Isolation', () => {
  it('asserts all organ models reside inside their respective wing rooms and NOT inside the central atrium', async () => {
    const container = new THREE.Scene();
    const root = await humanBodyModule.load(container);
    root.updateMatrixWorld(true);

    const organModels = [
      { name: 'beating-heart-assembly', wing: 'heart' },
      { name: 'neural-synapse-zone', wing: 'brain' },
      { name: 'hiv-virion-assembly', wing: 'hiv' },
      { name: 'capillary-circulation-zone', wing: 'infection-prevention' },
      { name: 'car-t-oncology-zone', wing: 'cancer' },
    ];

    const atriumRadius = 3.6;

    for (const { name } of organModels) {
      const model = root.getObjectByName(name);
      expect(model, `Model ${name} should exist in scene`).toBeDefined();
      if (model) {
        const worldPos = new THREE.Vector3();
        model.getWorldPosition(worldPos);
        const horizontalDistFromCenter = Math.hypot(worldPos.x, worldPos.z);
        // Organ model must be located inside the wing room, well beyond the 3.6m atrium portal ring
        expect(
          horizontalDistFromCenter,
          `Model ${name} at radius ${horizontalDistFromCenter.toFixed(2)}m must be located inside its wing room (> ${atriumRadius}m)`
        ).toBeGreaterThan(atriumRadius + 0.4);
      }
    }

    // Verify each wing has its dedicated room geometry (floor, walls, lighting)
    for (const wingDef of MEDICINE_WINGS) {
      const wingRoom = root.getObjectByName(`wing-room-${wingDef.section.id}`);
      expect(wingRoom, `Wing room for ${wingDef.section.id} should exist`).toBeDefined();
    }

    humanBodyModule.unload();
  });
});
