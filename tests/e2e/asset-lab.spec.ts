import { test, expect } from '@playwright/test';

/**
 * Asset Lab e2e: load the dev-only lab, place a registry asset, explode it,
 * and verify the module unloads without leaking.
 *
 * The lab is hidden from the hub in production builds and is reachable through
 * the dev URL flag (?dev=true) — see src/config/feature-flags.ts.
 */
test.describe('Asset Lab (dev-only)', () => {
  test('loads the shelf, places an asset, explodes it, and unloads cleanly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?module=asset-lab&dev=true');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('asset-lab');

    // 1. The shelf holds every registry asset.
    const lab = await page.evaluate(() => (window as any).__MAARIFY_ASSET_LAB__());
    expect(lab.loaded).toBe(true);
    expect(lab.shelfSlots).toBeGreaterThan(0);

    // 2. Place a registry asset through the same activate path a ray press takes.
    const placed = await page.evaluate(async () => {
      const registry = (window as any).__MAARIFY_ASSET_REGISTRY__ ?? [];
      const target = registry[0]?.assetName ?? 'engine_ffsc_methalox';
      const ok = await (window as any).__MAARIFY_PLACE_ASSET__(target);
      return { ok, target, state: (window as any).__MAARIFY_MODULE_STATE__ };
    });
    expect(placed.ok).toBe(true);
    await expect.poll(async () => (await page.evaluate(() => (window as any).__MAARIFY_MODULE_STATE__))?.placedAsset).toBeTruthy();

    // 3. Explode the placed asset through the shared lever primitive.
    const exploded = await page.evaluate(() => (window as any).__MAARIFY_SET_EXPLODE__(1));
    expect(exploded).toBe(true);
    await expect
      .poll(async () => (await page.evaluate(() => (window as any).__MAARIFY_MODULE_STATE__))?.explodeAmount)
      .toBeGreaterThan(0.9);

    // 4. Unload — the module must release its assets without throwing.
    await page.evaluate(() => (window as any).__MAARIFY_RETURN_TO_HUB__());
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('hub');

    expect(consoleErrors).toEqual([]);
  });
});