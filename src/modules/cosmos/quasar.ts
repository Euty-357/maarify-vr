import * as THREE from 'three';
import { createTextPanel } from '../../core/ui/text-panel.js';

/**
 * Builds the 3C 273 quasar exhibit.
 * Position it at an offset from the black hole (e.g. +4 m on x-axis).
 * Budget: ≤ 550 tris, ≤ 3 draw calls.
 */
export function buildQuasarExhibit(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'quasar-3c273-exhibit';

  // AGN host galaxy disc — flattened torus
  const galaxy = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.14, 8, 32),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.7,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    }),
  );
  galaxy.rotation.x = Math.PI / 2;
  galaxy.name = 'agn-host-galaxy-torus';
  group.add(galaxy);

  // Compact quasar core — bright white point
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  core.name = 'quasar-compact-core';
  group.add(core);

  // North relativistic jet — elongated bright blue-white cone
  const northJet = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 1.1, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    }),
  );
  northJet.position.y = 0.6;
  northJet.name = 'quasar-north-jet';
  group.add(northJet);

  // South relativistic jet — counter-jet (dimmer, receding)
  const southJet = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.85, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  southJet.position.y = -0.5;
  southJet.rotation.z = Math.PI; // flip to point downward
  southJet.name = 'quasar-south-jet';
  group.add(southJet);

  // Label
  const label = createTextPanel(
    "3C 273 — Quasar\nArtist's conception\n1.5 billion light-years away\nAGN: central black hole, accretion disc, relativistic jets\nSimplified model — not engineering grade",
    {
      widthMeters: 0.68,
      heightMeters: 0.24,
      fontSizePx: 18,
      align: 'center',
      background: '#0f172a',
      color: '#e2e8f0',
      accent: '#f97316',
      lines: 5,
    },
  );
  label.position.set(0, 1.5, 0);
  label.lookAt(0, 1.5, 2);
  group.add(label);

  return group;
}
