import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import dnaModule from '../../../src/modules/dna-genetics/index.js';
import { DR_AMANI_DNA_BEATS } from '../../../src/modules/dna-genetics/audio-guidance.js';

describe('DNA & Genetics module', () => {
  it('conforms to the module contract and remains a 15–20 minute experience', () => {
    expect(dnaModule.id).toBe('dna-genetics');
    expect(dnaModule.estimatedMinutes).toEqual([15, 20]);
    expect(typeof dnaModule.load).toBe('function');
    expect(typeof dnaModule.update).toBe('function');
  });

  it('provides five seated, physical challenges worth 1,025 XP including the non-clinical capstone', () => {
    const challenges = dnaModule.getChallenges();
    expect(challenges).toHaveLength(5);
    expect(challenges.every((challenge) => challenge.seatedCompatible)).toBe(true);
    expect(challenges.reduce((total, challenge) => total + challenge.xpReward, 0)).toBe(1025);
    expect(challenges.find((challenge) => challenge.id === 'dna-crispr-capstone')?.description).toContain('no treatment procedure');
  });

  it('provides five sourced anchors with complete three-tier simulations and concise notes', () => {
    const anchors = dnaModule.getSpatialAnchors();
    expect(anchors).toHaveLength(5);
    anchors.forEach((anchor) => {
      expect(anchor.level1Note.split(/\s+/).length).toBeLessThanOrEqual(40);
      expect(anchor.level2Simulation.foundation).toBeDefined();
      expect(anchor.level2Simulation.advanced).toBeDefined();
      expect(anchor.level2Simulation.expert).toBeDefined();
      expect(anchor.sourceRefs.length).toBeGreaterThan(0);
    });
  });

  it('uses a full seven-beat narrative with explicit non-clinical care', () => {
    expect(DR_AMANI_DNA_BEATS).toHaveLength(7);
    expect(DR_AMANI_DNA_BEATS[4].guidanceText).toContain('not a clinical');
    expect(DR_AMANI_DNA_BEATS[5].guidanceText).toContain('never a prediction');
  });

  it('loads the seven-beat scene, exposes its state and unloads cleanly', async () => {
    const container = new THREE.Scene();
    const root = await dnaModule.load(container);
    expect(root.getObjectByName('dna-double-helix-walkthrough')).toBeDefined();
    expect(root.getObjectByName('dna-cell-membrane')).toBeDefined();
    expect(root.getObjectByName('dna-ribosome-translation-station')).toBeDefined();
    expect(root.getObjectByName('dna-crispr-targeting-station')).toBeDefined();
    expect(root.getObjectByName('dna-diversity-exhibit')).toBeDefined();
    expect(root.getObjectByName('dna-genomics-architect-plinth')).toBeDefined();

    const state = dnaModule.getState?.();
    expect(state).toMatchObject({ diveStage: 0, unzip: 0, genotype: 'HbAA', badgeUnlocked: false });

    dnaModule.unload();
    expect(container.children).toHaveLength(0);
  });
});
