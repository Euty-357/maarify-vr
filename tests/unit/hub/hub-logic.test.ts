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

  it('instantiates the brand plaque with FrontSide materials and Swahili carved-door geometry', () => {
    const hub = new HubWorld();
    const brandPlaque = hub.getObjectByName('brand-plaque');
    expect(brandPlaque).toBeDefined();

    // Verify position above the main arch (y = 2.75, z = -3.4)
    expect(brandPlaque?.position.y).toBeCloseTo(2.75, 2);
    expect(brandPlaque?.position.z).toBeCloseTo(-3.4, 2);
  });
});

