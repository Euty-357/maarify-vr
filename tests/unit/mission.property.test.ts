import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { TutorialController } from '../../src/core/mission/tutorial-controller.js';
import type { ModuleMission, ModuleTutorialStep } from '../../src/core/types.js';

describe('Mission & Tutorial Property Tests', () => {
  // Property 6: Tutorial advances to completion for any tutorial array
  // Validates: Requirements 52.1, 52.2
  it('Property 6: TutorialController completes after exactly N advances for any tutorial array', () => {
    const dummyPanel = new THREE.Mesh();

    for (let N = 1; N <= 20; N++) {
      const steps: ModuleTutorialStep[] = [];
      for (let s = 0; s < N; s++) {
        steps.push({
          id: `step-${s}`,
          instruction: `Instruction for step ${s}`,
          target: s % 2 === 0 ? `target-${s}` : '',
        });
      }

      const mission: ModuleMission = {
        title: `Test Mission ${N}`,
        guideName: 'Dr. Amani',
        tutorial: steps,
      };

      const controller = new TutorialController(mission, dummyPanel);
      controller.start();
      expect(controller.isComplete()).toBe(false);

      // Advance N - 1 times: not complete yet
      for (let a = 0; a < N - 1; a++) {
        controller.advance();
        expect(controller.isComplete()).toBe(false);
      }

      // Nth advance: transitions to complete
      controller.advance();
      expect(controller.isComplete()).toBe(true);
    }
  });
});
