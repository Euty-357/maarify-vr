import { test, expect } from '@playwright/test';
import { auditModuleInteractions } from './helpers/module-interaction-audit.js';

test.describe('M2 Cosmos & Astronomy Full Spec Playthrough', () => {
  test('renders full Cosmos scene within Quest 3 budgets, passes screenshot matrix, and has zero console errors', async ({
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

    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('cosmos');

    // 1. Verify global metrics reported by Cosmos spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.currentModule).toBe('cosmos');
    await auditModuleInteractions(page, 24, 4);

    // 2. Verify Quest 3 budgets (< 250k triangles, < 180 draw calls)
    expect(metrics.triangles).toBeGreaterThan(1000);
    expect(metrics.triangles).toBeLessThan(250000);
    expect(metrics.drawCalls).toBeLessThan(180);

    // 2b. Panels v2: opening a Cosmos anchor shows the folio with its rich content
    const karmanExpanded = await page.evaluate(
      () => (window as any).__MAARIFY_TOGGLE_ANCHOR__?.('cosmos-anchor-karman-line')
    );
    // The interaction audit may leave a previously expanded anchor in either state;
    // establish the required expanded state rather than assuming a toggle direction.
    if (!karmanExpanded) {
      expect(
        await page.evaluate(() => (window as any).__MAARIFY_TOGGLE_ANCHOR__?.('cosmos-anchor-karman-line'))
      ).toBe(true);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_FOLIO__?.label)).toBe('The Karman Line (100 km)');
    const folio = await page.evaluate(() => (window as any).__MAARIFY_FOLIO__);
    expect(folio.tier).toBe('foundation');
    expect(folio.collapsed).toBe(false);

    // Tier tabs keep the page, arrows page, header collapses.
    await page.evaluate(() => (window as any).__MAARIFY_FOLIO_ACTION__('advanced'));
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_FOLIO__?.tier)).toBe('advanced');
    await page.evaluate(() => (window as any).__MAARIFY_FOLIO_ACTION__('next'));
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_FOLIO__?.page)).toBe(1);
    await page.evaluate(() => (window as any).__MAARIFY_FOLIO_ACTION__('collapse'));
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_FOLIO__?.collapsed)).toBe(true);
    await page.evaluate(() => (window as any).__MAARIFY_FOLIO_ACTION__('expert'));
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_FOLIO__?.tier)).toBe('expert');

    // 2c. VR tap path: the folio is a world-space overlay, so a controller ray must
    // reach its controls. __MAARIFY_TAP__ aims from the camera and runs the same
    // dispatch order as a trigger press.
    const tapFolio = (name: string) => page.evaluate((target) => (window as any).__MAARIFY_TAP__(target), name);
    const folioState = () => page.evaluate(() => (window as any).__MAARIFY_FOLIO__);
    const collapsed = async () => (await folioState())?.collapsed;

    // Switching tier opens the panel by design, so establish a collapsed start explicitly.
    await page.evaluate(() => (window as any).__MAARIFY_FOLIO_ACTION__('collapse'));
    await expect.poll(collapsed).toBe(true);

    expect(await tapFolio('folio-header')).toBe('folio');
    await expect.poll(collapsed).toBe(false);

    expect(await tapFolio('folio-tab-advanced')).toBe('folio');
    await expect.poll(async () => (await folioState())?.tier).toBe('advanced');

    expect(await tapFolio('folio-prev')).toBe('folio');
    await expect.poll(async () => (await folioState())?.page).toBe(0);
    expect(await tapFolio('folio-next')).toBe('folio');
    await expect.poll(async () => (await folioState())?.page).toBe(1);

    // Collapsed controls are hidden geometry; three still raycasts them, so the tap
    // filter must skip them and the body must not fall through to an anchor behind.
    await tapFolio('folio-header');
    await expect.poll(collapsed).toBe(true);
    const controls = await page.evaluate(() => (window as any).__MAARIFY_FOLIO_CONTROLS__());
    expect(controls.find((control: { name: string }) => control.name === 'folio-next').visible).toBe(false);
    expect(await tapFolio('folio-body')).toBe('folio');
    expect(await collapsed()).toBe(true);

    // 3. Capture multi-pose screenshot matrix for visual layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm2-cosmos');
    expect(screenshots.length).toBeGreaterThan(0);

    // 4. Update reports/budget-data.json with per-scene metrics
    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m2-cosmos'] = { states: { 'all-destinations-preloaded': { triangles: metrics.triangles, drawCalls: metrics.drawCalls } } };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 5. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});

