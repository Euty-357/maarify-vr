import { describe, it, expect } from 'vitest';
import { InMemoryProgressStore } from '../../../src/core/store/progress-store';

describe('InMemoryProgressStore', () => {
  it('initializes with default foundation tier and zero progress', () => {
    const store = new InMemoryProgressStore();
    const progress = store.getProgress();

    expect(progress.totalXp).toBe(0);
    expect(progress.earnedBadges).toEqual([]);
    expect(progress.completedModules).toEqual([]);
    expect(progress.selectedDepthTier).toBe('foundation');
  });

  it('awards XP and tracks cumulative total', () => {
    const store = new InMemoryProgressStore();
    expect(store.awardXp(100)).toBe(100);
    expect(store.awardXp(250)).toBe(350);
    expect(store.getProgress().totalXp).toBe(350);
  });

  it('unlocks badges idempotently', () => {
    const store = new InMemoryProgressStore();
    expect(store.unlockBadge('orbital-navigator')).toBe(true);
    expect(store.unlockBadge('orbital-navigator')).toBe(false); // Second time returns false
    expect(store.getProgress().earnedBadges).toEqual(['orbital-navigator']);
  });

  it('marks module completion idempotently', () => {
    const store = new InMemoryProgressStore();
    store.completeModule('cosmos');
    store.completeModule('cosmos');
    expect(store.getProgress().completedModules).toEqual(['cosmos']);
  });

  it('updates active depth tier', () => {
    const store = new InMemoryProgressStore();
    store.setDepthTier('expert');
    expect(store.getProgress().selectedDepthTier).toBe('expert');
  });
});

