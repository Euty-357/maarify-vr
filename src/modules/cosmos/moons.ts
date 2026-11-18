import * as THREE from 'three';
import { createTextPanel } from '../../core/ui/text-panel.js';

interface MoonData {
  name: string;
  radiusM: number;
  orbitRadiusM: number;
  color: number;
  initialAngle: number;
  orbitSpeedMult: number;
}

const MOON_DATA: Record<string, MoonData[]> = {
  'planet-earth': [
    { name: 'Moon', radiusM: 0.016, orbitRadiusM: 0.18, color: 0x94a3b8, initialAngle: 0.5, orbitSpeedMult: 1.0 },
  ],
  'planet-mars': [
    { name: 'Phobos', radiusM: 0.003, orbitRadiusM: 0.08, color: 0x78350f, initialAngle: 0, orbitSpeedMult: 3.0 },
    { name: 'Deimos', radiusM: 0.002, orbitRadiusM: 0.13, color: 0x92400e, initialAngle: 1.5, orbitSpeedMult: 1.0 },
  ],
  'planet-jupiter': [
    { name: 'Io',       radiusM: 0.011, orbitRadiusM: 0.28, color: 0xfcd34d, initialAngle: 0,   orbitSpeedMult: 4.0 },
    { name: 'Europa',   radiusM: 0.009, orbitRadiusM: 0.36, color: 0xe2e8f0, initialAngle: 1.2, orbitSpeedMult: 2.5 },
    { name: 'Ganymede', radiusM: 0.013, orbitRadiusM: 0.46, color: 0xa16207, initialAngle: 2.5, orbitSpeedMult: 1.5 },
    { name: 'Callisto', radiusM: 0.011, orbitRadiusM: 0.56, color: 0x44403c, initialAngle: 3.8, orbitSpeedMult: 0.8 },
  ],
  'planet-saturn': [
    { name: 'Titan',     radiusM: 0.013, orbitRadiusM: 0.44, color: 0xf59e0b, initialAngle: 0.8, orbitSpeedMult: 0.6 },
    { name: 'Enceladus', radiusM: 0.004, orbitRadiusM: 0.32, color: 0xf1f5f9, initialAngle: 2.1, orbitSpeedMult: 1.4 },
  ],
};

/**
 * Adds moons to a planet mesh as child objects with orbit animation.
 * Moon data sourced from NASA NSSDCA Planetary Fact Sheets.
 * Returns an update function — call it each frame with deltaSeconds.
 */
export function addPlanetaryMoons(
  planet: THREE.Object3D,
  planetName: string,
): (deltaSeconds: number) => void {
  const moons = MOON_DATA[planetName];
  if (!moons) return () => {};

  const BASE_SPEED = 0.4; // radians per second base orbit speed
  const orbits: { mesh: THREE.Object3D; r: number; speed: number; angle: number }[] = [];

  for (const m of moons) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(m.radiusM, 6, 4),
      new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.75 }),
    );
    mesh.name = `moon-${m.name.toLowerCase()}`;
    mesh.position.set(
      Math.cos(m.initialAngle) * m.orbitRadiusM,
      0,
      Math.sin(m.initialAngle) * m.orbitRadiusM,
    );
    planet.add(mesh);

    if (typeof document !== 'undefined') {
      const lbl = createTextPanel(m.name, {
        widthMeters: 0.14, heightMeters: 0.04, fontSizePx: 14,
        align: 'center', background: '#0f172a', color: '#94a3b8', lines: 1,
      });
      lbl.position.set(0, m.radiusM + 0.025, 0);
      mesh.add(lbl);
    }

    orbits.push({ mesh, r: m.orbitRadiusM, speed: BASE_SPEED * m.orbitSpeedMult, angle: m.initialAngle });
  }

  return (dt: number): void => {
    for (const o of orbits) {
      o.angle += o.speed * dt;
      o.mesh.position.set(Math.cos(o.angle) * o.r, 0, Math.sin(o.angle) * o.r);
    }
  };
}
