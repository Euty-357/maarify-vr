import { test, expect } from '@playwright/test';
import { auditModuleInteractions } from './helpers/module-interaction-audit.js';

test.describe('M4 Human Body & Medicine Full Spec Playthrough', () => {
  test('renders full Human Body scene within Quest 3 budgets, passes screenshot matrix, and has zero console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?module=human-body');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('human-body');

    // 1. Verify global metrics reported by Human Body spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.currentModule).toBe('human-body');

    // 1b. Six-wing sections and their declared settings
    const sections = await page.evaluate(() => (window as any).__MAARIFY_SECTIONS__);
    expect(sections).toHaveLength(6);
    expect(sections.map((section: { id: string }) => section.id)).toEqual([
      'heart',
      'brain',
      'spine',
      'cancer',
      'hiv',
      'infection-prevention',
    ]);
    const setting = await page.evaluate(() => (window as any).__MAARIFY_SETTING__);
    expect(setting.environment).toBe('interior');
    await auditModuleInteractions(page, 48, 4);

    // 2. Verify Quest 3 budgets (< 250k triangles, < 180 draw calls)
    expect(metrics.triangles).toBeGreaterThan(500);
    expect(metrics.triangles).toBeLessThan(250000);
    expect(metrics.drawCalls).toBeLessThan(180);

    // 3. Capture multi-pose screenshot matrix for visual layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm4-human-body');
    expect(screenshots.length).toBeGreaterThan(0);

    // 3b. Heart close-up for the hero-object review
    await page.evaluate(() => (window as any).__MAARIFY_SET_CAMERA__?.([0, 1.3, -0.25], [0, 0, 0]));
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'reports/history/screenshots/m4-heart-closeup.png', timeout: 120000 });

    // 4. Update reports/budget-data.json with per-scene metrics
    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m4-human-body'] = { states: { 'hiv-exploded-geometry-preloaded': { triangles: metrics.triangles, drawCalls: metrics.drawCalls } } };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 5. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

