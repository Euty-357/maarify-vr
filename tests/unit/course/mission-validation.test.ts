import { describe, expect, it } from 'vitest';
import { validateMission, validateMissions } from '../../../src/core/course/mission-validation.js';
import type { MissionDefinition } from '../../../src/core/types.js';
import { AEROSPACE_MISSIONS } from '../../../src/modules/aerospace/missions.js';

function validMission(): MissionDefinition {
  return {
    id: 'm-1',
    title: 'Mission One',
    objective: 'You do the thing.',
    outcomes: {
      foundation: 'Plain outcome.',
      advanced: 'Quantified outcome.',
      expert: 'Formal outcome.',
    },
    steps: [
      {
        id: 'hook',
        caption: 'You commit to a guess.',
        completed: () => false,
      },
    ],
    hints: ['One.', 'Two.', 'Three.'],
    feedback: { success: 'Good.', nearMiss: 'Close.', wrong: 'Again.' },
    successPredicate: () => true,
    tolerance: 0.1,
    xp: 100,
    sources: ['SRC-1'],
    seatedVariant: 'Seated reach.',
    reducedMotionVariant: 'Reduced motion.',
  };
}

describe('validateMission', () => {
  it('accepts a complete mission', () => {
    expect(validateMission(validMission())).toEqual([]);
  });

  it('rejects a mission without a three-level hint ladder', () => {
    const mission = validMission();
    mission.hints = ['Only one.'] as unknown as MissionDefinition['hints'];
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('hint ladder'))).toBe(true);
  });

  it('rejects a mission without a success predicate', () => {
    const mission = validMission();
    (mission as { successPredicate: unknown }).successPredicate = undefined;
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('success predicate'))).toBe(true);
  });

  it('rejects a mission without a debrief', () => {
    const mission = validMission();
    (mission as { feedback: unknown }).feedback = undefined;
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('debrief'))).toBe(true);
  });

  it('rejects a mission whose tier outcomes are identical', () => {
    const mission = validMission();
    mission.outcomes = {
      foundation: 'Same.',
      advanced: 'Same.',
      expert: 'Same.',
    };
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('tier outcomes'))).toBe(true);
  });

  it('rejects a mission with no sources', () => {
    const mission = validMission();
    mission.sources = [];
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('source'))).toBe(true);
  });

  it('rejects a mission without the accessibility variants', () => {
    const mission = validMission();
    delete mission.seatedVariant;
    delete mission.reducedMotionVariant;
    const problems = validateMission(mission);
    expect(problems.some((p) => p.problem.includes('seated'))).toBe(true);
    expect(problems.some((p) => p.problem.includes('reduced-motion'))).toBe(true);
  });
});

describe('validateMissions', () => {
  it('reports an empty mission list', () => {
    const problems = validateMissions([]);
    expect(problems).toHaveLength(1);
  });

  it('flags duplicate mission ids', () => {
    const problems = validateMissions([validMission(), validMission()]);
    expect(problems.some((p) => p.problem.includes('duplicate'))).toBe(true);
  });
});

describe('Aerospace mission data', () => {
  it('passes the full validation', () => {
    expect(validateMissions(AEROSPACE_MISSIONS)).toEqual([]);
  });

  it('ships between five and seven missions with a capstone', () => {
    expect(AEROSPACE_MISSIONS.length).toBeGreaterThanOrEqual(5);
    expect(AEROSPACE_MISSIONS.length).toBeLessThanOrEqual(7);
    expect(AEROSPACE_MISSIONS.some((m) => m.id.includes('capstone'))).toBe(true);
  });

  it('gives every mission a three-level hint ladder', () => {
    for (const mission of AEROSPACE_MISSIONS) {
      expect(mission.hints).toHaveLength(3);
      for (const hint of mission.hints) {
        expect(hint.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every mission distinct tier outcomes', () => {
    for (const mission of AEROSPACE_MISSIONS) {
      const texts = [
        mission.outcomes.foundation,
        mission.outcomes.advanced,
        mission.outcomes.expert,
      ];
      expect(new Set(texts).size).toBe(3);
    }
  });

  it('gives every mission a source id and accessibility variants', () => {
    for (const mission of AEROSPACE_MISSIONS) {
      expect(mission.sources.length).toBeGreaterThan(0);
      expect(mission.seatedVariant?.trim().length).toBeGreaterThan(0);
      expect(mission.reducedMotionVariant?.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps captions short enough to read at a glance', () => {
    for (const mission of AEROSPACE_MISSIONS) {
      for (const step of mission.steps) {
        const sentences = step.caption.split(/(?<=[.?!])\s+/).filter(Boolean);
        expect(sentences.length).toBeLessThanOrEqual(2);
        for (const sentence of sentences) {
          expect(sentence.split(/\s+/).length).toBeLessThanOrEqual(18);
        }
      }
    }
  });
});