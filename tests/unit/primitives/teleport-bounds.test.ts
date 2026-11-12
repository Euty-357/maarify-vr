import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SpatialTeleportPrimitive } from '../../../src/core/input/primitives/teleport.js';
import { ActiveTuning, resetTuningToDefaults } from '../../../src/config/tuning.js';

function aimDownRange(): SpatialTeleportPrimitive {
  const scene = new THREE.Scene();
  const rig = new THREE.Object3D();
  const teleport = new SpatialTeleportPrimitive(scene, rig);
  teleport.startAim();
  teleport.updateAim(new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, -0.12, -1).normalize(), 0);
  return teleport;
}

describe('Teleport target bounds', () => {
  afterEach(() => resetTuningToDefaults());

  it('accepts a landing point inside the walkable radius', () => {
    const teleport = aimDownRange();
    expect(teleport.target.isValid).toBe(true);
    const radius = Math.hypot(teleport.target.position.x, teleport.target.position.z);
    expect(radius).toBeLessThanOrEqual(ActiveTuning.comfort.teleportMaxRadiusMeters);
  });

  it('rejects a landing point outside the walkable radius', () => {
    ActiveTuning.comfort.teleportMaxRadiusMeters = 0.5;
    const teleport = aimDownRange();
    expect(teleport.target.isValid).toBe(false);
  });

  it('rejects an aim that is beyond the maximum throw distance', () => {
    ActiveTuning.comfort.teleportMaxDistanceMeters = 0.25;
    const teleport = aimDownRange();
    expect(teleport.target.isValid).toBe(false);
  });
});
