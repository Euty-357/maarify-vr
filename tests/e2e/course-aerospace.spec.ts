import { test, expect } from '@playwright/test';

/**
 * Course e2e: completes every Aerospace course mission through real interaction
 * events (published on the shared course event bus, exactly as the shared
 * primitives do) at all three depth tiers.
 *
 * The mission runner is driven only by events — never by calling internals.
 */
const MISSION_EVENTS: Record<string, Array<[string, string | undefined, number | undefined]>> = {
  'aero-m1-wings-work': [
    ['sliderChanged', 'aero-wing-pitch-slider', 0.85],
    ['sliderChanged', 'aero-wing-pitch-slider', 0.1],
    ['sliderChanged', 'aero-wing-pitch-slider', 0.25],
  ],
  'aero-m2-fly-the-controls': [
    ['grabbed', 'aero-yoke', undefined],
    ['grabbed', 'aero-pedals', undefined],
    ['rotated', 'aero-control-roll', 0],
    ['rotated', 'aero-control-pitch', 0],
    ['rotated', 'aero-control-yaw', 0],
  ],
  'aero-m3-turbofan-order': [
    ['grabbed', 'fan', undefined],
    ['placed', 'aero-turbofan-slot-fan', undefined],
    ['placed', 'aero-turbofan-slot-lpc', undefined],
    ['placed', 'aero-turbofan-slot-hpc', undefined],
    ['placed', 'aero-turbofan-slot-combustor', undefined],
    ['placed', 'aero-turbofan-slot-hpt', undefined],
    ['placed', 'aero-turbofan-slot-lpt', undefined],
  ],
  'aero-m4-trace-the-propellant': [
    ['grabbed', 'feed-lines', undefined],
    ['explodeChanged', 'aero-explode-amount', 1],
    ['docked', 'turbopump', undefined],
  ],
  'aero-m5-to-orbit': [
    ['leverChanged', 'aero-stack-stage-count', 1],
    ['sliderChanged', 'aero-stack-stage-mass', 0.4],
    ['sliderChanged', 'aero-stack-delta-v', 0.96],
  ],
  'aero-m6-kenya-connection': [
    ['sliderChanged', 'aero-density-altitude-slider', 0.8],
    ['sliderChanged', 'aero-density-altitude-slider', 0.35],
  ],
  'aero-capstone-design-to-mission': [
    ['grabbed', 'aero-mission-cards', undefined],
    ['sliderChanged', 'aero-capstone-payload', 0.5],
    ['sliderChanged', 'aero-capstone-score', 1],
  ],
};

test.describe('Aerospace course missions', () => {
  for (const tier of ['foundation', 'advanced', 'expert'] as const) {
    test(`completes every mission at the ${tier} tier`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/?module=aerospace');
      await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('aerospace');

      // Set the depth tier and confirm the mission copy follows it.
      await page.evaluate((t) => (window as any).__MAARIFY_SET_TIER__(t), tier);
      await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_MISSION_STATE__?.tier)).toBe(tier);

      const missionIds = await page.evaluate(() =>
        (window as any).__MAARIFY_MISSIONS__.map((m: { id: string }) => m.id),
      );
      expect(missionIds.length).toBeGreaterThanOrEqual(5);
      expect(missionIds.length).toBeLessThanOrEqual(7);
      expect(missionIds.some((id: string) => id.includes('capstone'))).toBe(true);

      // Each tier must have its own outcome copy.
      const outcomes = await page.evaluate(() =>
        (window as any).__MAARIFY_MISSIONS__[0].outcomes,
      );
      expect(new Set(Object.values(outcomes)).size).toBe(3);

      // Complete every mission through real interaction events.
      for (const id of missionIds) {
        const events = MISSION_EVENTS[id];
        expect(events, `no scripted events for ${id}`).toBeDefined();

        const started = await page.evaluate((missionId) =>
          (window as any).__MAARIFY_START_MISSION__(missionId), id);
        expect(started).toBe(true);

        for (const [type, target, value] of events) {
          await page.evaluate(
            ({ t, g, v }) => (window as any).__MAARIFY_COURSE_EVENT__(t, g, v),
            { t: type, g: target, v: value },
          );
        }

        await expect
          .poll(async () =>
            (await page.evaluate(() => (window as any).__MAARIFY_MISSION_STATE__))?.states[id],
          )
          .toBe('done');
      }

      // XP and badges landed in the in-memory store.
      const challenges = await page.evaluate(() => (window as any).__MAARIFY_CHALLENGES__);
      expect(challenges.totalXp).toBeGreaterThan(0);
      expect(challenges.badges.length).toBeGreaterThan(0);

      expect(consoleErrors).toEqual([]);
    });
  }
});