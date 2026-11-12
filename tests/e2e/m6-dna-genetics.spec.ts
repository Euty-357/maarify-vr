import { expect, test } from '@playwright/test';
import { auditModuleInteractions } from './helpers/module-interaction-audit.js';

/**
 * Full M6 playthrough: every beat is driven through the same shared primitives the
 * headset uses (grab release, slot attempt, slider value, rotator angle, activate).
 * Verified in Playwright/emulator only — NOT verified on headset.
 */
test.describe('M6 DNA & Genetics seven-beat playthrough', () => {
  // Software WebGL in CI renders this scene at roughly 2–4 fps, so the seven-beat
  // playthrough needs a longer budget than the project default.
  test.describe.configure({ timeout: 180_000 });

  test('plays all seven beats, awards 1,025 XP and the badge, then exits to the hub', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

    await page.goto('/?module=dna-genetics&dev=true');
    await expect(page.locator('#canvas-container canvas')).toBeVisible();
    await expect.poll(
      () => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule),
      { timeout: 30_000 }
    ).toBe('dna-genetics');
    await auditModuleInteractions(page, 5);

    const moduleState = () => page.evaluate(() => (window as any).__MAARIFY_MODULE_STATE__);
    const metrics = () => page.evaluate(() => (window as any).__MAARIFY_METRICS__);

    // Beat 1 — the dive reaches molecular scale and is reversible.
    await expect.poll(moduleState).toMatchObject({ diveStage: 0, genotype: 'HbAA', badgeUnlocked: false });
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.getObjectByName('dna-scale-dive-handle').userData.sliderPrimitive.setNormalizedValue(1);
    });
    await expect.poll(async () => (await moduleState()).diveStage).toBe(3);

    // Beat 3 — snap the four complementary bases onto the template.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.updateMatrixWorld(true);
      const complementary: Record<string, string> = { T: 'A', G: 'C', C: 'G', A: 'T' };
      for (let index = 0; index < 4; index += 1) {
        const socket = root.getObjectByName(`dna-template-socket-${index}`);
        const nucleotide = root.getObjectByName(`dna-nucleotide-${complementary[socket.userData.base as string]}`);
        socket.getWorldPosition(nucleotide.position);
        nucleotide.userData.grabPrimitive.options.onRelease();
      }
    });
    await expect.poll(async () => (await moduleState()).basePairs).toBe(4);

    // Beat 2 — open the replication fork with the seated lever.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.getObjectByName('dna-replication-slider').userData.sliderPrimitive.setNormalizedValue(1);
    });
    await expect.poll(async () => (await moduleState()).unzip).toBeGreaterThanOrEqual(0.95);

    // Beat 4 — thread three tRNAs through the A site in codon order.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.updateMatrixWorld(true);
      const aSite = root.getObjectByName('dna-a-site');
      ['AUG', 'GCA', 'UUU'].forEach((codon) => {
        const trna = root.getObjectByName(`dna-trna-${codon}`);
        aSite.getWorldPosition(trna.position);
        trna.userData.grabPrimitive.options.onRelease();
      });
    });
    await expect.poll(async () => (await moduleState()).translated).toBe(3);

    // Beat 5 — align the guide to 45 degrees, push Cas9 in, choose HDR.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.getObjectByName('dna-crispr-guide-dial').userData.rotatorPrimitive.setAngleDeg(45);
      const cas9 = root.getObjectByName('dna-cas9-complex');
      cas9.position.set(1.55, 1.22, -2.48);
    });
    await expect.poll(async () => (await moduleState()).crisprLocked).toBe(true);
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.getObjectByName('dna-repair-hdr').userData.grabPrimitive.options.onGrab('pointer');
    });
    await expect.poll(async () => (await moduleState()).repairOutcome).toBe('hdr');

    // Beat 6 — genotype dial then the causal chain.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      const dial = root.getObjectByName('dna-genotype-dial').userData.sliderPrimitive;
      dial.setNormalizedValue(1);
      dial.setNormalizedValue(0.5);
    });
    await expect.poll(async () => (await moduleState()).genotype).toBe('HbAS');
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.updateMatrixWorld(true);
      for (let index = 0; index < 3; index += 1) {
        const slot = root.getObjectByName(`dna-chain-slot-${index}`);
        const node = root.getObjectByName(`dna-chain-node-${index}`);
        slot.getWorldPosition(node.position);
        node.userData.grabPrimitive.options.onRelease();
      }
    });
    await expect.poll(async () => (await moduleState()).diversityLinks).toBe(3);

    // Beat 7 — badge unlocks only when all five challenges are complete.
    await expect.poll(async () => (await moduleState()).badgeUnlocked).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_CHALLENGES__?.completed.length)).toBe(5);
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_CHALLENGES__?.totalXp)).toBe(1025);
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_CHALLENGES__?.badges)).toContain('genomics-architect');

    // Locomotion is wired for seated and standing play.
    const locomotion = await page.evaluate(() => (window as any).__MAARIFY_LOCOMOTION__);
    expect(locomotion.hasTeleport).toBe(true);
    expect(locomotion.rig).toBeDefined();

    const sceneMetrics = await metrics();
    expect(sceneMetrics.triangles).toBeLessThan(250000);
    expect(sceneMetrics.drawCalls).toBeLessThan(180);

    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm6-dna-genetics');
    expect(screenshots.length).toBe(2);

    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try { budgetData = JSON.parse(await fs.readFile('reports/budget-data.json', 'utf8')); } catch { /* first run */ }
    budgetData['m6-dna-genetics'] = {
      states: {
        'all-beats-unlocked': { triangles: sceneMetrics.triangles, drawCalls: sceneMetrics.drawCalls },
      },
    };
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf8');

    // Exit horizon returns to the hub.
    await page.evaluate(() => {
      const root = (window as any).__MAARIFY_SCENE_ROOT__.getObjectByName('dna-genetics-module-root');
      root.getObjectByName('exit-portal-ring').userData.activate();
    });
    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('hub');

    expect(consoleErrors).toEqual([]);
  });
});
