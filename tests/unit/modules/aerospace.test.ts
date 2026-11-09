import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import aerospaceModule from '../../../src/modules/aerospace/index.js';
import {
  ROCKET_ENGINE_CYCLES,
  PROPELLANT_CHEMISTRIES,
  calculateAerodynamics,
  evaluateNozzleExpansion,
} from '../../../src/modules/aerospace/propulsion.js';
import { DR_AMANI_AEROSPACE_BEATS } from '../../../src/modules/aerospace/audio-guidance.js';

describe('Aerospace & Rocket Propulsion Module Architecture & Safety Scope Compliance', () => {
  it('conforms strictly to the ModuleDefinition interface contract', () => {
    expect(aerospaceModule.id).toBe('aerospace');
    expect(aerospaceModule.displayName).toBe('Aerospace & Rocket Propulsion');
    expect(aerospaceModule.estimatedMinutes[0]).toBeGreaterThanOrEqual(10);
    expect(aerospaceModule.estimatedMinutes[1]).toBeLessThanOrEqual(25);
    expect(typeof aerospaceModule.load).toBe('function');
    expect(typeof aerospaceModule.unload).toBe('function');
  });

  it('provides >=3 physical challenges + capstone, all 100% seated compatible (NO quizzes)', () => {
    const challenges = aerospaceModule.getChallenges();
    expect(challenges.length).toBeGreaterThanOrEqual(4);

    challenges.forEach((ch) => {
      expect(ch.seatedCompatible).toBe(true);
      expect(ch.type).not.toBe('quiz');
      expect(['sequence-walk', 'assembly', 'alignment', 'gaze-hold', 'steer', 'tune', 'scale-shift']).toContain(
        ch.type
      );
      expect(ch.xpReward).toBeGreaterThan(0);
    });

    const capstone = challenges.find((c) => c.id.includes('orbital-injection'));
    expect(capstone).toBeDefined();
    expect(capstone?.title).toContain('Malindi');
    expect(capstone?.description).toContain('does not depict Taifa-1');
  });

  it('provides Diegetic Spatial Anchors with 3-tier micro-simulations and valid source citations', () => {
    const anchors = aerospaceModule.getSpatialAnchors();
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

  it('models 8 thermodynamic rocket engine cycles and 5 propellant chemistries accurately', () => {
    const cycles = Object.keys(ROCKET_ENGINE_CYCLES);
    expect(cycles.length).toBeGreaterThanOrEqual(8);
    expect(cycles).toContain('gas-generator');
    expect(cycles).toContain('full-flow-staged');
    expect(cycles).toContain('electric-pump');

    const ffsc = ROCKET_ENGINE_CYCLES['full-flow-staged'];
    expect(ffsc.chamberPressureRange[1]).toBeGreaterThanOrEqual(300);

    const propellants = Object.keys(PROPELLANT_CHEMISTRIES);
    expect(propellants).toContain('methalox');
    expect(propellants).toContain('hydrolox');
    expect(PROPELLANT_CHEMISTRIES['hydrolox'].ispVacuumNominal).toBeGreaterThan(440);
  });

  it('calculates aerodynamic stall buffeting at >15° angle of attack', () => {
    const normalFlight = calculateAerodynamics(6, 1680);
    expect(normalFlight.isStalled).toBe(false);
    expect(normalFlight.liftToDragRatio).toBeGreaterThan(10);

    const stalledFlight = calculateAerodynamics(18, 1680);
    expect(stalledFlight.isStalled).toBe(true);
    expect(stalledFlight.dragNewtons).toBeGreaterThan(normalFlight.dragNewtons);
  });

  it('evaluates de Laval supersonic nozzle shock diamond regimes', () => {
    // Sea level overexpanded for high-expansion altitude nozzle (area ratio = 50)
    const overexpanded = evaluateNozzleExpansion(50, 1.013, 100);
    expect(overexpanded.expansionRegime).toBe('overexpanded');
    expect(overexpanded.shockDiamondCount).toBeGreaterThan(0);

    // Vacuum underexpanded
    const underexpanded = evaluateNozzleExpansion(50, 0.0, 100);
    expect(underexpanded.expansionRegime).toBe('underexpanded');
  });

  it('embeds educational scope notice and Kenya Space Agency Taifa-1 narrative beats', () => {
    expect(DR_AMANI_AEROSPACE_BEATS.length).toBe(7);

    const beat1 = DR_AMANI_AEROSPACE_BEATS[0];
    expect(beat1.transcript).toContain('Wilson Airport');
    expect(beat1.transcript).toContain('Malindi');

    const beat7 = DR_AMANI_AEROSPACE_BEATS[6];
    expect(beat7.transcript).toContain('Taifa-1');
    expect(beat7.transcript).toContain('Vandenberg');
  });

  it('loads spatial scene into container and unloads cleanly without memory leaks', async () => {
    const container = new THREE.Scene();
    const root = await aerospaceModule.load(container);

    expect(container.children).toContain(root);
    expect(root.name).toBe('aerospace-module-root');

    // Confirm safety disclaimer plinth is present in scene
    const safetyPlinth = root.getObjectByName('propulsion-safety-plinth');
    expect(safetyPlinth).toBeDefined();

    // Confirm Taifa-1 CubeSat is present
    const taifa = root.getObjectByName('taifa-1-cubesat');
    expect(taifa).toBeDefined();

    // Unload
    aerospaceModule.unload();
    expect(container.children.length).toBe(0);
  });
});
