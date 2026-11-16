import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import environmentModule from '../../../src/modules/environment/index.js';

describe('Climate & Environment module', () => {
  it('conforms to the module contract and exports required metadata and sections', () => {
    expect(environmentModule.id).toBe('environment');
    expect(environmentModule.displayName).toBe('Climate & Environment');
    expect(environmentModule.estimatedMinutes).toEqual([15, 20]);
    expect(environmentModule.setting?.environment).toBe('exterior');
    expect(environmentModule.sections).toHaveLength(5);
    expect(typeof environmentModule.load).toBe('function');
    expect(typeof environmentModule.unload).toBe('function');
    expect(typeof environmentModule.update).toBe('function');
  });

  it('provides four seated-compatible physical challenges with XP rewards including capstone', () => {
    const challenges = environmentModule.getChallenges();
    expect(challenges).toHaveLength(4);
    expect(challenges.every((c) => c.seatedCompatible)).toBe(true);
    expect(challenges.reduce((sum, c) => sum + c.xpReward, 0)).toBe(900);
    expect(challenges.find((c) => c.id === 'environment-challenge-stakeholder-equilibrium')).toBeDefined();
  });

  it('provides four sourced anchors with complete three-tier simulations and <=40 word Level 1 notes', () => {
    const anchors = environmentModule.getSpatialAnchors();
    expect(anchors).toHaveLength(4);
    anchors.forEach((anchor) => {
      const words = anchor.level1Note.trim().split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(40);
      expect(anchor.level2Simulation.foundation).toBeDefined();
      expect(anchor.level2Simulation.advanced).toBeDefined();
      expect(anchor.level2Simulation.expert).toBeDefined();
      expect(anchor.sourceRefs.length).toBeGreaterThan(0);
    });
  });

  it('loads spatial scene, exposes simulation state, and unloads cleanly without leaks', async () => {
    const container = new THREE.Scene();
    const root = await environmentModule.load(container);
    root.updateMatrixWorld(true);

    // Verify key spatial stations exist
    expect(root.getObjectByName('mau-watershed-terrain')).toBeDefined();
    expect(root.getObjectByName('mara-river-flow')).toBeDefined();
    expect(root.getObjectByName('indigenous-forest-canopy')).toBeDefined();
    expect(root.getObjectByName('watershed-time-station')).toBeDefined();
    expect(root.getObjectByName('reforestation-assembly-station')).toBeDefined();
    expect(root.getObjectByName('stakeholder-causal-graph')).toBeDefined();
    expect(root.getObjectByName('lake-naivasha-table')).toBeDefined();
    expect(root.getObjectByName('lamu-coastal-mangrove-zone')).toBeDefined();

    // Verify initial state
    const state = environmentModule.getState?.();
    expect(state).toBeDefined();
    expect(state?.simulatedYear).toBe(2000);
    expect(state?.overallHealth).toBeGreaterThanOrEqual(70);

    // Verify update animation tick
    environmentModule.update?.(0.1);

    // Verify clean unload
    environmentModule.unload();
    expect(container.children).toHaveLength(0);
  });

  it('validates walkable bounds within the 4.5m radius', () => {
    expect(environmentModule.isWalkable?.(new THREE.Vector3(1, 0, 1))).toBe(true);
    expect(environmentModule.isWalkable?.(new THREE.Vector3(5, 0, 5))).toBe(false);
  });
});
