import { describe, expect, it } from 'vitest';
import {
  CourseEventBus,
  MissionRunner,
  HINT_TIMINGS,
  NO_HINT_BONUS,
  ACCURACY_BONUS,
  type MissionScore,
} from '../../../src/core/course/index.js';
import type { CourseEvent, MissionDefinition } from '../../../src/core/types.js';

/** Build a simple test mission whose steps complete on distinct slider values. */
function makeMission(overrides: Partial<MissionDefinition> = {}): MissionDefinition {
  return {
    id: 'test-mission',
    title: 'Test Mission',
    objective: 'You move the slider to the target.',
    outcomes: {
      foundation: 'Plain language outcome.',
      advanced: 'Quantitative outcome with units.',
      expert: 'Formal outcome with constraints.',
    },
    steps: [
      {
        id: 'hook',
        caption: 'You commit to a guess by moving the slider.',
        highlights: ['target-object'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged'),
      },
      {
        id: 'apply',
        caption: 'You settle the slider on the target.',
        highlights: ['target-object'],
        completed: (events) =>
          events.some(
            (e) => e.type === 'sliderChanged' && e.target === 'test-slider' && Math.abs((e.value ?? 0) - 0.5) <= 0.05,
          ),
      },
    ],
    hints: ['Highlight hint.', 'Clearer hint.', 'Show me.'],
    feedback: {
      success: 'Well done.',
      nearMiss: 'Nearly there.',
      wrong: 'Try a different value.',
    },
    successPredicate: (events) =>
      events.some(
        (e) => e.type === 'sliderChanged' && e.target === 'test-slider' && Math.abs((e.value ?? 0) - 0.5) <= 0.1,
      ),
    tolerance: 0.1,
    xp: 100,
    badge: 'test-badge',
    sources: ['TEST-SOURCE'],
    seatedVariant: 'Seated reach.',
    reducedMotionVariant: 'Reduced motion.',
    ...overrides,
  };
}

describe('CourseEventBus', () => {
  it('delivers events to every subscriber', () => {
    const bus = new CourseEventBus();
    const seen: CourseEvent[] = [];
    bus.subscribe((e) => seen.push(e));
    bus.emit('sliderChanged', 'test-slider', 0.5);
    expect(seen).toHaveLength(1);
    expect(seen[0].type).toBe('sliderChanged');
    expect(seen[0].target).toBe('test-slider');
    expect(seen[0].value).toBe(0.5);
  });

  it('unsubscribes cleanly', () => {
    const bus = new CourseEventBus();
    const seen: CourseEvent[] = [];
    const unsubscribe = bus.subscribe((e) => seen.push(e));
    unsubscribe();
    bus.emit('grabbed', 'thing');
    expect(seen).toHaveLength(0);
    expect(bus.listenerCount).toBe(0);
  });

  it('never lets a broken subscriber break the publisher', () => {
    const bus = new CourseEventBus();
    const seen: CourseEvent[] = [];
    bus.subscribe(() => {
      throw new Error('boom');
    });
    bus.subscribe((e) => seen.push(e));
    expect(() => bus.emit('grabbed', 'thing')).not.toThrow();
    expect(seen).toHaveLength(1);
  });

describe('MissionRunner state machine', () => {
  it('starts locked and unlocks on request', () => {
    const runner = new MissionRunner([makeMission()]);
    expect(runner.getState('test-mission')).toBe('locked');
    expect(runner.start('test-mission')).toBe(false);
    runner.unlock('test-mission');
    expect(runner.getState('test-mission')).toBe('available');
    expect(runner.start('test-mission')).toBe(true);
    expect(runner.getState('test-mission')).toBe('active');
  });

  it('advances through steps as events arrive', () => {
    const bus = new CourseEventBus();
    const runner = new MissionRunner([makeMission()]);
    runner.attach(bus);
    runner.unlock('test-mission');
    runner.start('test-mission');

    bus.emit('sliderChanged', 'test-slider', 0.2);
    expect(runner.getState('test-mission')).toBe('active');

    bus.emit('sliderChanged', 'test-slider', 0.5);
    expect(runner.getState('test-mission')).toBe('done');
  });

  it('emits a success caption and unlocks the next mission', () => {
    const bus = new CourseEventBus();
    const captions: string[] = [];
    const first = makeMission();
    const second = makeMission({ id: 'second-mission' });
    const runner = new MissionRunner([first, second], {
      onCaption: (c) => captions.push(c),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    bus.emit('sliderChanged', 'test-slider', 0.2);
    bus.emit('sliderChanged', 'test-slider', 0.5);

    expect(captions).toContain('Well done.');
    expect(runner.getState('second-mission')).toBe('available');
  });
  it('never fails: a rejected event explains and retries', () => {
    const bus = new CourseEventBus();
    const feedback: string[] = [];
    const runner = new MissionRunner([makeMission()], {
      onNearMiss: (_m, caption, kind) => feedback.push(`${kind}:${caption}`),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    bus.emit('rejected', 'wrong-peg', undefined, { anchorName: 'socket-a' });

    expect(runner.getState('test-mission')).toBe('active');
    expect(feedback.some((f) => f.startsWith('wrong:'))).toBe(true);
  });
});

describe('MissionRunner hint ladder', () => {
  it('shows a highlight hint after 20 s of inactivity', () => {
    const bus = new CourseEventBus();
    const captions: string[] = [];
    const runner = new MissionRunner([makeMission()], {
      onCaption: (c) => captions.push(c),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    runner.update(HINT_TIMINGS.highlight + 0.1);
    expect(captions).toContain('Highlight hint.');
  });

  it('shows the clearer hint after 45 s and show-me after 90 s', () => {
    const bus = new CourseEventBus();
    const captions: string[] = [];
    const runner = new MissionRunner([makeMission()], {
      onCaption: (c) => captions.push(c),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    runner.update(HINT_TIMINGS.clearer + 0.1);
    expect(captions).toContain('Clearer hint.');

    runner.update(HINT_TIMINGS.showMe - HINT_TIMINGS.clearer + 0.2);
    expect(captions).toContain('Show me.');
  });

  it('counts hints used', () => {
    const bus = new CourseEventBus();
    const runner = new MissionRunner([makeMission()]);
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    runner.update(HINT_TIMINGS.clearer + 0.1);
    expect(runner.getHintsUsed('test-mission')).toBeGreaterThan(0);
  });

describe('MissionRunner scoring', () => {
  it('awards base xp plus both bonuses for a perfect run', () => {
    const bus = new CourseEventBus();
    const scores: MissionScore[] = [];
    let awarded = 0;
    const runner = new MissionRunner([makeMission()], {
      scoreSink: { awardXp: (amount) => { awarded += amount; } },
      onComplete: (_m, score) => scores.push(score),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    bus.emit('sliderChanged', 'test-slider', 0.5);
    bus.emit('sliderChanged', 'test-slider', 0.5);

    expect(scores).toHaveLength(1);
    expect(scores[0].baseXp).toBe(100);
    expect(scores[0].noHintBonus).toBe(NO_HINT_BONUS);
    expect(scores[0].accuracyBonus).toBe(ACCURACY_BONUS);
    expect(awarded).toBe(100 + NO_HINT_BONUS + ACCURACY_BONUS);
  });

  it('removes the no-hint bonus once a hint was consumed', () => {
    const bus = new CourseEventBus();
    const scores: MissionScore[] = [];
    const runner = new MissionRunner([makeMission()], {
      onComplete: (_m, score) => scores.push(score),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    runner.update(HINT_TIMINGS.highlight + 0.1);
    bus.emit('sliderChanged', 'test-slider', 0.5);
    bus.emit('sliderChanged', 'test-slider', 0.5);

    expect(scores[0].noHintBonus).toBe(0);
    expect(scores[0].hintsUsed).toBeGreaterThan(0);
  });
});

describe('MissionRunner tier handling', () => {
  it('keeps the three tier outcomes distinct', () => {
    const mission = makeMission();
    const texts = [
      mission.outcomes.foundation,
      mission.outcomes.advanced,
      mission.outcomes.expert,
    ];
    expect(new Set(texts).size).toBe(3);
  });

  it('records the selected tier and re-renders the caption when it changes', () => {
    const bus = new CourseEventBus();
    const captions: string[] = [];
    const runner = new MissionRunner([makeMission()], {
      tier: 'foundation',
      onCaption: (c) => captions.push(c),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    expect(runner.getTier()).toBe('foundation');
    runner.setTier('expert');
    expect(runner.getTier()).toBe('expert');
    expect(captions.length).toBeGreaterThan(1);
  });
});

  it('resets the idle timer when the learner interacts', () => {
    const bus = new CourseEventBus();
    const captions: string[] = [];
    const runner = new MissionRunner([makeMission()], {
      onCaption: (c) => captions.push(c),
    });
    runner.attach(bus);
    runner.unlockAll();
    runner.start('test-mission');

    runner.update(HINT_TIMINGS.highlight - 1);
    bus.emit('sliderChanged', 'test-slider', 0.1);
    runner.update(1);

    expect(captions).not.toContain('Highlight hint.');
  });
});
});