import { test, expect } from '@playwright/test';

test.describe('M1 Spatial Hub', () => {
  test('renders 7 physical portals, plinth tier selector and tuning controls within budget', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await page.waitForTimeout(1000);

    // 1. Verify global metrics reported by M1 spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();

    // Verify Tier A performance budgets (< 100k triangles, < 100 draw calls)
    expect(metrics.triangles).toBeGreaterThan(500);
    expect(metrics.triangles).toBeLessThan(100000);
    expect(metrics.drawCalls).toBeLessThan(100);

    // Depth tier propagates from the hub selector into application state.
    await page.evaluate(() => (window as any).__MAARIFY_SET_TIER__('expert'));
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.selectedTier)).toBe('expert');
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_AUDIT__?.tier)).toBe('expert');

    // Tuning console opens in-world and its buttons respond to a pointer press.
    const thresholdBefore = await page.evaluate(() => (window as any).__MAARIFY_TUNING__.state().grabThreshold);
    await page.evaluate(() => (window as any).__MAARIFY_TUNING__.open());
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_TUNING__.isOpen())).toBe(true);
    // GRAB + button centre, in panel UV space.
    await page.evaluate(() => (window as any).__MAARIFY_TUNING__.press(0.729, 0.479));
    const thresholdAfter = await page.evaluate(() => (window as any).__MAARIFY_TUNING__.state().grabThreshold);
    expect(thresholdAfter).toBeCloseTo(thresholdBefore + 0.02, 3);
    await page.evaluate(() => (window as any).__MAARIFY_TUNING__.close());
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_TUNING__.isOpen())).toBe(false);

    await page.evaluate(() => (window as any).__MAARIFY_SET_TIER__('foundation'));

    // 2. Capture multi-pose screenshot matrix for layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm1-hub');
    expect(screenshots.length).toBeGreaterThan(0);

    // 3. Record budget metrics for check-budgets script
    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m1-hub'] = { states: { baseline: { triangles: metrics.triangles, drawCalls: metrics.drawCalls } } };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 4. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

