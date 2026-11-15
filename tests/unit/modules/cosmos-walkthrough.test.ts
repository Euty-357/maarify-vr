import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import cosmosModule from '../../../src/modules/cosmos/index.js';

describe('Cosmos Module Walkthrough Scale & Physics Fidelity', () => {
  it('implements Option B walkthrough scale with real planetary ordering along walkway', async () => {
    const container = new THREE.Scene();
    const root = await cosmosModule.load(container);
    root.updateMatrixWorld(true);

    const solarSystem = root.getObjectByName('solar-system-scalable-root');
    expect(solarSystem, 'Solar system root must exist').toBeDefined();
    // Option B undoes 0.4x table compaction (scale should be 1.0 at base)
    expect(solarSystem?.scale.x).toBeCloseTo(1.0, 1);

    const planetOrder = [
      'planet-mercury',
      'planet-venus',
      'planet-earth',
      'planet-mars',
      'planet-jupiter',
      'planet-saturn',
      'planet-uranus',
      'planet-neptune',
    ];

    let prevDist = 0;
    for (const pName of planetOrder) {
      const planet = root.getObjectByName(pName);
      expect(planet, `${pName} must exist in solar system`).toBeDefined();
      if (planet) {
        const localPos = planet.position;
        const distFromSun = Math.hypot(localPos.x, localPos.z);
        expect(distFromSun, `${pName} distance must increase monotonically`).toBeGreaterThan(prevDist);
        prevDist = distFromSun;
      }
    }

    cosmosModule.unload();
  });

  it('isolates the Black Hole Sagittarius A* far away from the solar system (reachable only via travel/warp)', async () => {
    const container = new THREE.Scene();
    const root = await cosmosModule.load(container);
    root.updateMatrixWorld(true);

    const blackHole = root.getObjectByName('sagittarius-a-black-hole');
    expect(blackHole, 'Black hole root must exist').toBeDefined();
    if (blackHole) {
      const worldPos = new THREE.Vector3();
      blackHole.getWorldPosition(worldPos);
      const distFromOrigin = Math.hypot(worldPos.x, worldPos.z);
      // Must be far away (> 25m) so it does not crowd the walkthrough solar system
      expect(distFromOrigin, 'Black hole must be isolated far away').toBeGreaterThan(25.0);
    }

    cosmosModule.unload();
  });

  it('exoplanet zone is well separated from the solar system walkway', async () => {
    const container = new THREE.Scene();
    const root = await cosmosModule.load(container);
    root.updateMatrixWorld(true);

    const exoZone = root.getObjectByName('exoplanets-zone');
    expect(exoZone, 'Exoplanet zone must exist').toBeDefined();
    if (exoZone) {
      const worldPos = new THREE.Vector3();
      exoZone.getWorldPosition(worldPos);
      // Must be > 8 m from origin so it does not overlap solar system walkway (Neptune at ~7 m)
      const dist = Math.hypot(worldPos.x, worldPos.z);
      expect(dist, 'Exoplanet zone must not overlap solar system walkway').toBeGreaterThan(8.0);
    }

    cosmosModule.unload();
  });
});
