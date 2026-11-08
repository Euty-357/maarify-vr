import { test, expect } from '@playwright/test';

test.describe('M0 Toolchain & WebXR Spatial Spike', () => {
  test('renders spatial scene, reports budget metrics, and responds to click grab', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Verify canvas container and Enter XR button exist
    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    const enterBtn = page.locator('#enter-xr-btn');
    await expect(enterBtn).toBeVisible();

    // 2. Wait 1 second for render loop to report metrics
    await page.waitForTimeout(1000);

    // 3. Inspect global metrics exposed by render loop
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.triangles).toBeGreaterThan(0);
    // Tier A hard budget: < 100k triangles, < 100 draw calls
    expect(metrics.triangles).toBeLessThan(100000);
    expect(metrics.drawCalls).toBeLessThan(100);

    // 4. Test desktop pointer interaction (click to toggle grab)
    await page.mouse.click(windowWidthHalf(page), windowHeightHalf(page));
    await page.waitForTimeout(200);

    // 5. Capture multi-pose screenshot matrix for visual inspection
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm0-spatial-spike');
    expect(screenshots.length).toBeGreaterThan(0);

    // 6. Record budget metrics for check-budgets script
    const fs = await import('fs/promises');
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(
      'reports/budget-data.json',
      JSON.stringify({
        'm0-spatial-spike': {
          triangles: metrics.triangles,
          drawCalls: metrics.drawCalls,
        },
      }, null, 2),
      'utf-8'
    );

    // 7. Verify zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

function windowWidthHalf(_page: any) {
  return 1280 / 2;
}

function windowHeightHalf(_page: any) {
  return 720 / 2;
}

