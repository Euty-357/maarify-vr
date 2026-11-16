import { describe, it, expect } from 'vitest';
import { StakeholderSimulation } from '../../../src/core/simulation/stakeholder-sim.js';

describe('StakeholderSimulation Engine', () => {
  it('initializes stakeholders, resources, and computes overall health', () => {
    const sim = new StakeholderSimulation();

    sim.addResource({
      id: 'water-flow',
      name: 'River Water Volume',
      quantity: 80,
      baseQuantity: 80,
      regenerationRate: 0.1,
      capacity: 100,
      description: 'Clean river discharge',
    });

    sim.addStakeholder({
      id: 'farmers',
      name: 'Upstream Smallholder Farmers',
      category: 'community',
      wellbeing: 75,
      baseWellbeing: 75,
      dependsOn: ['water-flow'],
      description: 'Rely on river diversion for irrigation',
    });

    sim.addStakeholder({
      id: 'fisherfolk',
      name: 'Downstream Lake Fisherfolk',
      category: 'community',
      wellbeing: 70,
      baseWellbeing: 70,
      dependsOn: ['water-flow'],
      description: 'Rely on lake levels and water quality',
    });

    expect(sim.getAllStakeholders()).toHaveLength(2);
    expect(sim.getAllResources()).toHaveLength(1);
    expect(sim.getOverallHealth()).toBeGreaterThan(70);
  });

  it('toggles actions and correctly calculates ripple effects', () => {
    const sim = new StakeholderSimulation();

    sim.addResource({
      id: 'river-flow',
      name: 'Mara River Flow',
      quantity: 100,
      baseQuantity: 100,
      regenerationRate: 0,
      capacity: 100,
      description: 'Upstream river flow',
    });

    sim.addStakeholder({
      id: 'downstream-wildlife',
      name: 'Maasai Mara Wildlife Corridors',
      category: 'ecosystem',
      wellbeing: 90,
      baseWellbeing: 90,
      dependsOn: ['river-flow'],
      description: 'Migratory herds requiring river crossings',
    });

    sim.addAction({
      id: 'unregulated-irrigation',
      name: 'Unregulated Large-scale Water Abstraction',
      description: 'Diverts 60% of river flow for commercial farms',
      applied: false,
      effects: [{ targetId: 'river-flow', delta: -60 }],
    });

    // Action applied
    const applied = sim.toggleAction('unregulated-irrigation');
    expect(applied).toBe(true);

    const resource = sim.getResource('river-flow');
    expect(resource?.quantity).toBe(40);

    const wildlife = sim.getStakeholder('downstream-wildlife');
    expect(wildlife?.wellbeing).toBeLessThan(90);

    // Action toggled off / reversed
    const reverted = sim.toggleAction('unregulated-irrigation');
    expect(reverted).toBe(false);
    expect(sim.getResource('river-flow')?.quantity).toBe(100);
  });

  it('resets state accurately back to baseline', () => {
    const sim = new StakeholderSimulation();

    sim.addResource({
      id: 'forest-cover',
      name: 'Mau Forest Canopy',
      quantity: 50,
      baseQuantity: 50,
      regenerationRate: 0,
      capacity: 100,
      description: 'Indigenous forest canopy',
    });

    sim.addAction({
      id: 'reforestation',
      name: 'Community Tree Planting',
      description: 'Restores degraded indigenous water towers',
      applied: false,
      effects: [{ targetId: 'forest-cover', delta: 30 }],
    });

    sim.toggleAction('reforestation');
    expect(sim.getResource('forest-cover')?.quantity).toBe(80);

    sim.reset();
    expect(sim.getResource('forest-cover')?.quantity).toBe(50);
  });
});
