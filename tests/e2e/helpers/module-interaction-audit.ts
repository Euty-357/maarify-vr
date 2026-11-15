import { expect, type Page } from '@playwright/test';

/** Exercises every registered spatial anchor and verifies all physical challenges are exposed. */
export async function auditModuleInteractions(
  page: Page,
  expectedAnchors = 4,
  expectedChallenges = expectedAnchors
): Promise<void> {
  const audit = await page.evaluate(() => (window as any).__MAARIFY_AUDIT__);
  expect(audit.anchors).toHaveLength(expectedAnchors);
  expect(audit.challenges).toHaveLength(expectedChallenges);

  const toggleResults = await page.evaluate((anchorIds: string[]) => {
    return anchorIds.map((id: string) => {
      const expanded = (window as any).__MAARIFY_TOGGLE_ANCHOR__(id);
      const collapsed = (window as any).__MAARIFY_TOGGLE_ANCHOR__(id);
      return { id, expanded, collapsed };
    });
  }, audit.anchors);

  for (const res of toggleResults) {
    expect(res.expanded).toBe(true);
    expect(res.collapsed).toBe(false);
  }

  for (const challenge of audit.challenges) {
    expect(challenge.seatedCompatible).toBe(true);
    expect(challenge.xpReward).toBeGreaterThan(0);
  }
}
