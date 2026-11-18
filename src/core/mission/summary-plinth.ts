import * as THREE from 'three';
import { createTextPanel } from '../ui/text-panel.js';

/**
 * Builds a diegetic end-of-module summary plinth.
 * Shows the module badge, XP earned, and a return-to-hub button.
 * Position at (0, 0, 0) in module-local space; caller adds to scene.
 */
export function buildSummaryPlinth(badge: string, xp: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'module-summary-plinth';

  // Pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.9, 16),
    new THREE.MeshStandardMaterial({ color: 0x241610, metalness: 0.3, roughness: 0.6 }),
  );
  pedestal.position.y = 0.45;
  group.add(pedestal);

  // Badge panel
  const badgePanel = createTextPanel(badge, {
    widthMeters: 0.6,
    heightMeters: 0.2,
    fontSizePx: 30,
    align: 'center',
    background: '#241610',
    color: '#f2d8a5',
    accent: '#b08d57',
    lines: 2,
  });
  badgePanel.position.set(0, 1.1, 0);
  badgePanel.lookAt(0, 1.1, 1);
  group.add(badgePanel);

  // XP earned panel
  const xpPanel = createTextPanel(`${xp} XP EARNED`, {
    widthMeters: 0.5,
    heightMeters: 0.12,
    fontSizePx: 26,
    align: 'center',
    background: '#1e293b',
    color: '#fbbf24',
    accent: '#f59e0b',
    lines: 1,
  });
  xpPanel.position.set(0, 0.88, 0);
  xpPanel.lookAt(0, 0.88, 1);
  group.add(xpPanel);

  // Return to hub button
  const returnButton = createTextPanel('RETURN TO HUB', {
    widthMeters: 0.4,
    heightMeters: 0.1,
    fontSizePx: 22,
    align: 'center',
    background: '#7f1d1d',
    color: '#fca5a5',
    accent: '#ef4444',
    lines: 1,
  });
  returnButton.position.set(0, 0.6, 0.16);
  returnButton.lookAt(0, 0.6, 1);
  returnButton.userData.activate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('maarify:return-to-hub'));
    }
  };
  group.add(returnButton);

  return group;
}
