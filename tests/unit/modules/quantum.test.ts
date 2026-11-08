import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import quantumModule from '../../../src/modules/quantum/index.js';
import { QUANTUM_ARCHITECTURES } from '../../../src/modules/quantum/hardware.js';
import { DR_AMANI_QUANTUM_BEATS } from '../../../src/modules/quantum/audio-guidance.js';

describe('Quantum Module Architecture & Immersion Compliance', () => {
  it('conforms strictly to the ModuleDefinition interface contract', () => {
    expect(quantumModule.id).toBe('quantum');
    expect(quantumModule.displayName).toBe('Quantum Mechanics');
    expect(quantumModule.estimatedMinutes[0]).toBeGreaterThanOrEqual(10);
    expect(quantumModule.estimatedMinutes[1]).toBeLessThanOrEqual(25);
    expect(typeof quantumModule.load).toBe('function');
    expect(typeof quantumModule.unload).toBe('function');
  });

  it('provides >=3 physical challenges + capstone, all 100% seated compatible (NO quizzes)', () => {
    const challenges = quantumModule.getChallenges();
    expect(challenges.length).toBeGreaterThanOrEqual(4);

    challenges.forEach((ch) => {
      expect(ch.seatedCompatible).toBe(true);
      expect(ch.type).not.toBe('quiz');
      expect(['sequence-walk', 'assembly', 'alignment', 'gaze-hold', 'steer', 'tune', 'scale-shift']).toContain(
        ch.type
      );
      expect(ch.xpReward).toBeGreaterThan(0);
    });

    const capstone = challenges.find((c) => c.id.includes('circuit-assembly'));
    expect(capstone).toBeDefined();
    expect(capstone?.title).toContain('Deutsch-Jozsa');
  });

  it('provides Diegetic Spatial Anchors with 3-tier micro-simulations and valid source citations', () => {
    const anchors = quantumModule.getSpatialAnchors();
    expect(anchors.length).toBeGreaterThanOrEqual(4);

    anchors.forEach((a) => {
      const words = a.level1Note.split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(45);

      expect(a.level2Simulation.foundation).toBeDefined();
      expect(a.level2Simulation.advanced).toBeDefined();
      expect(a.level2Simulation.expert).toBeDefined();

      expect(a.sourceRefs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('models the 7 physical quantum hardware architectures accurately with physical operating regimes', () => {
    expect(QUANTUM_ARCHITECTURES.length).toBe(7);

    const transmon = QUANTUM_ARCHITECTURES.find((h) => h.id === 'superconducting-transmon');
    expect(transmon).toBeDefined();
    expect(transmon?.operatingTempKelvin).toBeLessThan(0.05); // Millikelvin

    const trappedIon = QUANTUM_ARCHITECTURES.find((h) => h.id === 'trapped-ion');
    expect(trappedIon).toBeDefined();

    const photonic = QUANTUM_ARCHITECTURES.find((h) => h.id === 'photonic');
    expect(photonic).toBeDefined();
  });

  it('provides complete Dr. Amani 7-beat narrative guidance with African STEM context (QLA Kigali)', () => {
    expect(DR_AMANI_QUANTUM_BEATS.length).toBe(7);

    const beat1 = DR_AMANI_QUANTUM_BEATS[0];
    expect(beat1.guidanceText).toContain('superposition');

    const beat7 = DR_AMANI_QUANTUM_BEATS[6];
    expect(beat7.stemContext).toContain('Quantum Leap Africa');
  });

  it('loads spatial scene into container and unloads cleanly without memory leaks', async () => {
    const container = new THREE.Scene();
    const root = await quantumModule.load(container);

    expect(container.children).toContain(root);
    expect(root.name).toBe('quantum-module-root');

    // Unload
    quantumModule.unload();
    expect(container.children.length).toBe(0);
  });
});

