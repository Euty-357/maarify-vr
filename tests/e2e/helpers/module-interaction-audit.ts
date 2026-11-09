import { expect, type Page } from '@playwright/test';

/** Exercises every registered spatial anchor and verifies all physical challenges are exposed. */
export async function auditModuleInteractions(page: Page, expectedCount = 4): Promise<void> {
  const audit = await page.evaluate(() => (window as any).__MAARIFY_AUDIT__);
  expect(audit.anchors).toHaveLength(expectedCount);
  expect(audit.challenges).toHaveLength(expectedCount);

  for (const anchorId of audit.anchors) {
    const expanded = await page.evaluate((id) => (window as any).__MAARIFY_TOGGLE_ANCHOR__(id), anchorId);
    expect(expanded).toBe(true);
    const collapsed = await page.evaluate((id) => (window as any).__MAARIFY_TOGGLE_ANCHOR__(id), anchorId);
    expect(collapsed).toBe(false);
  }

  for (const challenge of audit.challenges) {
    expect(challenge.seatedCompatible).toBe(true);
    expect(challenge.xpReward).toBeGreaterThan(0);
  }
}
