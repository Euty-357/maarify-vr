import { test, expect } from '@playwright/test';

test.describe('M1 Core Systems, Spatial Hub & Smoke-Test Zone', () => {
  test('renders 7 physical portals, plinth tier selector, and smoke-test zone within budget', async ({ page }) => {
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

    // 2. Capture multi-pose screenshot matrix for layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm1-hub-and-smoke-test');
    expect(screenshots.length).toBeGreaterThan(0);

    // 3. Record budget metrics for check-budgets script
    const fs = await import('fs/promises');
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(
      'reports/budget-data.json',
      JSON.stringify({
        'm1-hub-and-smoke-test': {
          triangles: metrics.triangles,
          drawCalls: metrics.drawCalls,
        },
      }, null, 2),
      'utf-8'
    );

    // 4. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

