import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import humanBodyModule from '../../../src/modules/human-body/index.js';
import { CARDIAC_CHAMBERS, HIV_STRUCTURAL_COMPONENTS } from '../../../src/modules/human-body/anatomy.js';
import { DR_AMANI_BODY_BEATS } from '../../../src/modules/human-body/audio-guidance.js';

describe('Human Body & Medicine Module Architecture & Ethics Compliance', () => {
  it('conforms strictly to the ModuleDefinition interface contract', () => {
    expect(humanBodyModule.id).toBe('human-body');
    expect(humanBodyModule.displayName).toBe('Human Body & Medicine');
    expect(humanBodyModule.estimatedMinutes[0]).toBeGreaterThanOrEqual(10);
    expect(humanBodyModule.estimatedMinutes[1]).toBeLessThanOrEqual(25);
    expect(typeof humanBodyModule.load).toBe('function');
    expect(typeof humanBodyModule.unload).toBe('function');
  });

  it('provides >=3 physical challenges + capstone, all 100% seated compatible (NO quizzes)', () => {
    const challenges = humanBodyModule.getChallenges();
    expect(challenges.length).toBeGreaterThanOrEqual(4);

    challenges.forEach((ch) => {
      expect(ch.seatedCompatible).toBe(true);
      expect(ch.type).not.toBe('quiz');
      expect(['sequence-walk', 'assembly', 'alignment', 'gaze-hold', 'steer', 'tune', 'scale-shift']).toContain(
        ch.type
      );
      expect(ch.xpReward).toBeGreaterThan(0);
    });

    const capstone = challenges.find((c) => c.id.includes('art-blockade'));
    expect(capstone).toBeDefined();
    expect(capstone?.title).toContain('Antiretroviral');
  });

  it('provides Diegetic Spatial Anchors with 3-tier micro-simulations and valid source citations', () => {
    const anchors = humanBodyModule.getSpatialAnchors();
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

  it('accurately defines cardiac hemodynamics and HIV drug target classes', () => {
    expect(CARDIAC_CHAMBERS.length).toBe(4);
    const lv = CARDIAC_CHAMBERS.find((c) => c.name === 'Left Ventricle');
    expect(lv?.systolicPressureMmHg).toBe(120);

    expect(HIV_STRUCTURAL_COMPONENTS.length).toBe(5);
    const integrase = HIV_STRUCTURAL_COMPONENTS.find((p) => p.name === 'Integrase');
    expect(integrase?.targetDrugClass).toContain('INSTIs');
  });

  it('embeds medical disclaimers, destigmatizing U=U framing, and Kenyan health research context', () => {
    expect(DR_AMANI_BODY_BEATS.length).toBe(7);

    const beat1 = DR_AMANI_BODY_BEATS[0];
    expect(beat1.guidanceText).toContain('medical disclaimer');

    const beat6 = DR_AMANI_BODY_BEATS[5];
    expect(beat6.guidanceText).toContain('U=U');
    expect(beat6.stemContext).toContain('Pumwani');
  });

  it('loads spatial scene into container and unloads cleanly without memory leaks', async () => {
    const container = new THREE.Scene();
    const root = await humanBodyModule.load(container);

    expect(container.children).toContain(root);
    expect(root.name).toBe('human-body-module-root');

    // Confirm disclaimer plinth is present in scene
    const disclaimer = root.getObjectByName('medical-disclaimer-plinth');
    expect(disclaimer).toBeDefined();

    // Unload
    humanBodyModule.unload();
    expect(container.children.length).toBe(0);
  });
});

