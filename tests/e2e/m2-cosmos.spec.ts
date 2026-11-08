import { test, expect } from '@playwright/test';

test.describe('M2 Cosmos & Astronomy Full Spec Playthrough', () => {
  test('renders full Cosmos scene within Tier A budgets, passes screenshot matrix, and has zero console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?module=cosmos');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await page.waitForTimeout(1500);

    // 1. Verify global metrics reported by Cosmos spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.currentModule).toBe('cosmos');

    // 2. Verify Tier A performance budgets (< 100k triangles, < 100 draw calls)
    expect(metrics.triangles).toBeGreaterThan(1000);
    expect(metrics.triangles).toBeLessThan(100000);
    expect(metrics.drawCalls).toBeLessThan(100);

    // 3. Capture multi-pose screenshot matrix for visual layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm2-cosmos');
    expect(screenshots.length).toBeGreaterThan(0);

    // 4. Update reports/budget-data.json with per-scene metrics
    const fs = await import('fs/promises');
    let budgetData: Record<string, { triangles: number; drawCalls: number }> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m2-cosmos'] = {
      triangles: metrics.triangles,
      drawCalls: metrics.drawCalls,
    };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 5. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

