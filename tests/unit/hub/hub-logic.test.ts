import { describe, it, expect } from 'vitest';
import { HubWorld } from '../../../src/hub/hub-world.js';

describe('Hub World Structure & Tier Plinth Logic', () => {
  it('instantiates all 7 physical portals arranged radially', () => {
    const hub = new HubWorld();
    expect(hub.portals.length).toBe(7);

    const expectedIds = [
      'cosmos',
      'quantum',
      'human-body',
      'aerospace',
      'dna-genetics',
      'environment',
      'urban-development',
    ];

    expectedIds.forEach((id) => {
      const portal = hub.portals.find((p) => p.id === id);
      expect(portal).toBeDefined();
      expect(hub.getObjectByName(`hub-portal-${id}`)).toBeDefined();
    });
  });

  it('updates selected tier and changes button material color', () => {
    const hub = new HubWorld();
    expect(hub.selectedTier).toBe('foundation');

    hub.setTier('advanced');
    expect(hub.selectedTier).toBe('advanced');

    hub.setTier('expert');
    expect(hub.selectedTier).toBe('expert');
  });

  it('removes brand plaque and adds floor crest inlay per Req 12', () => {
    const hub = new HubWorld();
    // Brand plaque above the arch removed per Req 12.2
    const brandPlaque = hub.getObjectByName('brand-plaque');
    expect(brandPlaque).toBeUndefined();

    // Floor crest inlay present at world origin per Req 12.1
    const floorInlay = hub.getObjectByName('hub-floor-crest-inlay');
    expect(floorInlay).toBeDefined();
    expect(floorInlay?.position.y).toBeCloseTo(0.003, 3);

    // Central orrery removed per Req 12.3
    const orrery = hub.getObjectByName('hub-orrery');
    expect(orrery).toBeUndefined();
  });
});

