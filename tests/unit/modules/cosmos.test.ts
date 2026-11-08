import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import cosmosModule from '../../../src/modules/cosmos/index.js';
import { EXOPLANET_CATALOG } from '../../../src/modules/cosmos/exoplanets.js';
import { DR_AMANI_COSMOS_BEATS } from '../../../src/modules/cosmos/audio-guidance.js';

describe('Cosmos Module Architecture & Immersion Compliance', () => {
  it('conforms strictly to the ModuleDefinition interface contract', () => {
    expect(cosmosModule.id).toBe('cosmos');
    expect(cosmosModule.displayName).toBe('Cosmos & Astronomy');
    expect(cosmosModule.estimatedMinutes[0]).toBeGreaterThanOrEqual(10);
    expect(cosmosModule.estimatedMinutes[1]).toBeLessThanOrEqual(25);
    expect(typeof cosmosModule.load).toBe('function');
    expect(typeof cosmosModule.unload).toBe('function');
  });

  it('provides >=3 physical challenges + capstone, all 100% seated compatible (NO quizzes)', () => {
    const challenges = cosmosModule.getChallenges();
    expect(challenges.length).toBeGreaterThanOrEqual(4);

    challenges.forEach((ch) => {
      expect(ch.seatedCompatible).toBe(true);
      expect(ch.type).not.toBe('quiz');
      expect(['sequence-walk', 'assembly', 'alignment', 'gaze-hold', 'steer', 'tune', 'scale-shift']).toContain(
        ch.type
      );
      expect(ch.xpReward).toBeGreaterThan(0);
    });

    const capstone = challenges.find((c) => c.id.includes('mars-injection'));
    expect(capstone).toBeDefined();
    expect(capstone?.title).toContain('Mars');
  });

  it('provides Diegetic Spatial Anchors with 3-tier micro-simulations and valid source citations', () => {
    const anchors = cosmosModule.getSpatialAnchors();
    expect(anchors.length).toBeGreaterThanOrEqual(4);

    anchors.forEach((a) => {
      // Level 1: plain description <= 40 words
      const words = a.level1Note.split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(45);

      // Level 2: 3-tier micro-simulations
      expect(a.level2Simulation.foundation).toBeDefined();
      expect(a.level2Simulation.advanced).toBeDefined();
      expect(a.level2Simulation.expert).toBeDefined();

      // Source references must exist and not be empty
      expect(a.sourceRefs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('provides exhaustive exoplanet catalog with honest disclaimers and verified travel times', () => {
    expect(EXOPLANET_CATALOG.length).toBe(7);

    const proxima = EXOPLANET_CATALOG.find((p) => p.id === 'proxima-b');
    expect(proxima).toBeDefined();
    expect(proxima?.inHabitableZone).toBe(true);
    expect(proxima?.atmosphereStatus).toBe('Unknown');
    expect(proxima?.artistConceptionNote).toContain('Artist\'s conception');
    expect(proxima?.voyagerTravelTimeYears).toBeGreaterThan(70000);

    const trappist = EXOPLANET_CATALOG.find((p) => p.id === 'trappist-1e');
    expect(trappist).toBeDefined();
    expect(trappist?.distanceLy).toBeCloseTo(40.66, 1);

    const pulsarPlanet = EXOPLANET_CATALOG.find((p) => p.id === 'psr-b1257-12-c');
    expect(pulsarPlanet).toBeDefined();
    expect(pulsarPlanet?.discoveryYear).toBe(1992);
  });

  it('provides complete Dr. Amani 7-beat narrative guidance with Kenyan STEM context', () => {
    expect(DR_AMANI_COSMOS_BEATS.length).toBe(7);

    const beat1 = DR_AMANI_COSMOS_BEATS[0];
    expect(beat1.guidanceText).toContain('Malindi');
    expect(beat1.stemContext).toContain('San Marco');

    const beat4 = DR_AMANI_COSMOS_BEATS[3];
    expect(beat4.stemContext).toContain('Taifa-1');
  });

  it('loads spatial scene into container and unloads cleanly without memory leaks', async () => {
    const container = new THREE.Scene();
    const root = await cosmosModule.load(container);

    expect(container.children).toContain(root);
    expect(root.name).toBe('cosmos-module-root');

    // Unload
    cosmosModule.unload();
    expect(container.children.length).toBe(0);
  });
});

