import { test, expect } from '@playwright/test';
import { auditModuleInteractions } from './helpers/module-interaction-audit.js';

test.describe('M7 Climate & Environment Full Spec Playthrough', () => {
  test('renders full Environment scene within Quest 3 budgets, passes screenshot matrix, and has zero console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('ERR_NETWORK_IO_SUSPENDED')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/?module=environment');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('environment');

    // 1. Verify global metrics reported by Environment spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.currentModule).toBe('environment');

    // 1b. Verify declared setting and sections
    const setting = await page.evaluate(() => (window as any).__MAARIFY_SETTING__);
    expect(setting?.environment).toBe('exterior');
    const sections = await page.evaluate(() => (window as any).__MAARIFY_SECTIONS__);
    expect(sections).toHaveLength(5);

    // 1c. Audit spatial anchors & physical challenges
    await auditModuleInteractions(page, 4, 4);

    // 2. Verify Quest 3 budgets (< 250k triangles, < 180 draw calls)
    expect(metrics.triangles).toBeGreaterThan(500);
    expect(metrics.triangles).toBeLessThan(250000);
    expect(metrics.drawCalls).toBeLessThan(180);

    // 3. Capture multi-pose screenshot matrix for visual layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm7-environment');
    expect(screenshots.length).toBeGreaterThan(0);

    // 4. Update reports/budget-data.json with per-scene metrics
    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m7-environment'] = {
      states: {
        'watershed-terrain-and-stakeholders-preloaded': {
          triangles: metrics.triangles,
          drawCalls: metrics.drawCalls,
        },
      },
    };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 5. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
