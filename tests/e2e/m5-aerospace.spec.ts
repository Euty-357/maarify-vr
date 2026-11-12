import { test, expect } from '@playwright/test';
import { inflateSync } from 'node:zlib';
import { auditModuleInteractions } from './helpers/module-interaction-audit.js';

function countCyanPixelsInLeftMiddlePng(png: Buffer): number {
  const signatureLength = 8;
  let cursor = signatureLength;
  let width = 0;
  let height = 0;
  let channels = 0;
  const compressedChunks: Buffer[] = [];
  while (cursor < png.length) {
    const length = png.readUInt32BE(cursor);
    const type = png.toString('ascii', cursor + 4, cursor + 8);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    if (type === 'IHDR') {
      width = png.readUInt32BE(dataStart);
      height = png.readUInt32BE(dataStart + 4);
      const colourType = png[dataStart + 9];
      expect([2, 6]).toContain(colourType); // RGB or RGBA, both emitted by Chromium.
      channels = colourType === 6 ? 4 : 3;
    }
    if (type === 'IDAT') compressedChunks.push(png.subarray(dataStart, dataEnd));
    cursor = dataEnd + 4; // Skip CRC.
  }
  const packed = inflateSync(Buffer.concat(compressedChunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let packedOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[packedOffset++];
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x++) {
      const raw = packed[packedOffset++];
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const up = y > 0 ? pixels[rowOffset - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[rowOffset - stride + x - channels] : 0;
      if (filter === 0) pixels[rowOffset + x] = raw;
      else if (filter === 1) pixels[rowOffset + x] = (raw + left) & 0xff;
      else if (filter === 2) pixels[rowOffset + x] = (raw + up) & 0xff;
      else if (filter === 3) pixels[rowOffset + x] = (raw + Math.floor((left + up) / 2)) & 0xff;
      else {
        const pa = Math.abs(up - upLeft);
        const pb = Math.abs(left - upLeft);
        const pc = Math.abs(left + up - 2 * upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        pixels[rowOffset + x] = (raw + predictor) & 0xff;
      }
    }
  }
  let coloured = 0;
  for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.65); y++) {
    for (let x = 0; x < Math.floor(width * 0.5); x++) {
      const offset = (y * width + x) * channels;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const alpha = channels === 4 ? pixels[offset + 3] : 255;
      if (alpha > 0 && blue > 130 && green > 90 && blue > red * 1.3) coloured += 1;
    }
  }
  return coloured;
}

test.describe('M5 Aerospace & Rocket Propulsion Full Spec Playthrough', () => {
  test('renders full Aerospace scene within Quest 3 budgets, passes screenshot matrix, and has zero console errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?module=aerospace');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible();

    await expect.poll(() => page.evaluate(() => (window as any).__MAARIFY_METRICS__?.currentModule)).toBe('aerospace');

    // 1. Verify global metrics reported by Aerospace spatial scene
    const metrics = await page.evaluate(() => (window as any).__MAARIFY_METRICS__);
    expect(metrics).toBeDefined();
    expect(metrics.currentModule).toBe('aerospace');
    await auditModuleInteractions(page, 24, 4);

    // 1b. Section 4.3: Verify the default-on flow field and its actual rendered output.
    const fluidCheck = await page.evaluate(() => {
      const scene = (window as any).__MAARIFY_SCENE_ROOT__;
      const streamlines = scene?.getObjectByName('wind-tunnel-streamlines');
      const ribbons = scene?.getObjectByName('wind-tunnel-streamline-ribbons');
      const particles = scene?.getObjectByName('wind-tunnel-particles');
      return {
        streamlinesVisible: streamlines?.visible === true,
        streamlineCount: ribbons?.userData.streamlineCount ?? 0,
        particleCount: particles?.geometry?.getAttribute('position')?.count ?? 0,
        particlesVisible: particles?.visible === true,
      };
    });
    expect(fluidCheck.streamlinesVisible).toBe(true);
    expect(fluidCheck.streamlineCount).toBeGreaterThanOrEqual(12);
    expect(fluidCheck.particleCount).toBeGreaterThanOrEqual(100);
    expect(fluidCheck.particlesVisible).toBe(true);

    const flowScreenshot = await canvas.screenshot({ path: 'reports/history/screenshots/m5-flow-visible.png' });
    const flowPixels = countCyanPixelsInLeftMiddlePng(flowScreenshot);
    expect(flowPixels).toBeGreaterThan(100);

    // 2. Verify Quest 3 budgets (< 250k triangles, < 180 draw calls)
    expect(metrics.triangles).toBeGreaterThan(500);
    expect(metrics.triangles).toBeLessThan(250000);
    expect(metrics.drawCalls).toBeLessThan(180);

    // 3. Capture multi-pose screenshot matrix for visual layout verification
    const { captureMultiPoseMatrix } = await import('./helpers/screenshot-matrix.js');
    const screenshots = await captureMultiPoseMatrix(page, 'm5-aerospace');
    expect(screenshots.length).toBeGreaterThan(0);

    // 4. Update reports/budget-data.json with per-scene metrics
    const fs = await import('fs/promises');
    let budgetData: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile('reports/budget-data.json', 'utf-8');
      budgetData = JSON.parse(existing);
    } catch {}

    budgetData['m5-aerospace'] = { states: { 'engine-exploded-and-plume-preloaded': { triangles: metrics.triangles, drawCalls: metrics.drawCalls } } };

    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/budget-data.json', JSON.stringify(budgetData, null, 2), 'utf-8');

    // 5. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
