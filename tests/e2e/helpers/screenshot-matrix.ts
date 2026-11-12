import { Page } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export interface CameraPose {
  name: string;
  position: [number, number, number];
  rotationDeg: [number, number, number];
}

export const STANDARD_HEAD_POSES: CameraPose[] = [
  { name: 'standing-eye-level', position: [0, 1.4, 0.8], rotationDeg: [0, 0, 0] },
  { name: 'seated-chest-level', position: [0, 1.0, 0.6], rotationDeg: [-5, 0, 0] },
];

/**
 * Captures screenshot matrix from multiple simulated head poses.
 * Writes to reports/history/screenshots/<session>/<prefix>-<pose>.png.
 */
export async function captureMultiPoseMatrix(
  page: Page,
  outputPrefix: string,
  poses: CameraPose[] = STANDARD_HEAD_POSES
): Promise<string[]> {
  const capturedPaths: string[] = [];

  for (const pose of poses) {
    // Reposition camera in Three.js context
    await page.evaluate(({ pos, rot }) => {
      const win = window as any;
      if (win.__MAARIFY_SET_CAMERA__) {
        win.__MAARIFY_SET_CAMERA__(pos, rot);
      }
    }, { pos: pose.position, rot: pose.rotationDeg });

    await page.waitForTimeout(100);

    const screenshotPath = `reports/history/screenshots/${outputPrefix}-${pose.name}.png`;
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, timeout: 120_000 });
    capturedPaths.push(screenshotPath);
  }

  return capturedPaths;
}

