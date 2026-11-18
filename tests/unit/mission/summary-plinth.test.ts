import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { buildSummaryPlinth } from '../../../src/core/mission/summary-plinth.js';

describe('buildSummaryPlinth', () => {
  it('returns a group named "module-summary-plinth"', () => {
    const plinth = buildSummaryPlinth('Medicine', 250);
    expect(plinth).toBeInstanceOf(THREE.Group);
    expect(plinth.name).toBe('module-summary-plinth');
  });

  it('contains a pedestal, badge panel, xp panel, and return button', () => {
    const plinth = buildSummaryPlinth('Medicine', 250);
    expect(plinth.children).toHaveLength(4);
  });

  it('positions the pedestal at y=0.45', () => {
    const plinth = buildSummaryPlinth('Medicine', 250);
    const pedestal = plinth.children[0] as THREE.Mesh;
    expect(pedestal.position.y).toBeCloseTo(0.45, 5);
  });

  it('renders the badge text on the badge panel', () => {
    const plinth = buildSummaryPlinth('Quantum', 100);
    const badgePanel = plinth.children[1] as THREE.Mesh;
    expect(badgePanel.userData.textPanel.text).toBe('Quantum');
  });

  it('renders the XP earned value on the xp panel', () => {
    const plinth = buildSummaryPlinth('Cosmos', 320);
    const xpPanel = plinth.children[2] as THREE.Mesh;
    expect(xpPanel.userData.textPanel.text).toBe('320 XP EARNED');
  });

  describe('return-to-hub button', () => {
    let originalWindow: unknown;

    beforeEach(() => {
      originalWindow = (globalThis as { window?: unknown }).window;
      // Provide a real EventTarget so the activate handler can dispatch.
      (globalThis as { window: EventTarget }).window = new EventTarget();
    });

    afterEach(() => {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window?: unknown }).window = originalWindow;
      }
    });

    it('wires userData.activate to dispatch the maarify:return-to-hub event', () => {
      const plinth = buildSummaryPlinth('Medicine', 250);
      const returnButton = plinth.children[3] as THREE.Mesh;
      expect(typeof returnButton.userData.activate).toBe('function');

      const win = (globalThis as { window: EventTarget }).window;
      let received = false;
      win.addEventListener('maarify:return-to-hub', () => {
        received = true;
      });
      returnButton.userData.activate();
      expect(received).toBe(true);
    });
  });
});
