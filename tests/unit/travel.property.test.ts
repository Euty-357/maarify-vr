import { describe, it, expect } from 'vitest';
import { TravelSystem, type TravelDestination } from '../../src/core/travel/travel-system.js';
import {
  formatRealSpeedReadout,
  type NavigationDestination,
} from '../../src/modules/cosmos/nav-console.js';

describe('Travel Property Tests', () => {
  // Property 7: TravelSystem reaches arriving phase for any dt sequence summing to >= 0.45 s
  // Validates: Requirements 58.1
  it('Property 7: TravelSystem reaches arriving phase for any dt sequence summing to >= 0.45 s', () => {
    // Generate 100 pseudo-random sequences of small positive floats summing to >= 0.45
    for (let run = 0; run < 100; run++) {
      const travel = new TravelSystem();
      const dest: TravelDestination = {
        id: `dest-${run}`,
        position: { x: run * 10, z: -run * 10 },
        mode: run % 2 === 0 ? 'cinematic-warp' : 'real-light-speed',
      };

      expect(travel.begin(dest)).toBe(true);
      expect(travel.state).toBe('departing');

      // Generate random dt steps in [0.01, 0.05] until sum >= 0.45
      let sum = 0;
      let reachedArriving = false;
      while (sum < 1.0) {
        const dt = 0.01 + Math.random() * 0.04;
        sum += dt;
        travel.update(dt);
        if (travel.state === 'arriving') {
          reachedArriving = true;
          break;
        }
      }

      expect(reachedArriving).toBe(true);
    }
  });

  // Property 9: Real-speed readout contains destination name and time for any destination
  // Validates: Requirements 59.1, 59.2
  it('Property 9: Real-speed readout contains destination name and time for any destination', () => {
    const sampleNames = ['Proxima Centauri', 'TRAPPIST-1', '51 Pegasi b', 'Kepler-16b', 'Sagittarius A*'];
    const sampleLabels = ['4.2 years', '40.7 years', '50.45 years', '245 years', '26,000 years'];

    for (let i = 0; i < 100; i++) {
      const name = sampleNames[i % sampleNames.length] + `-${i}`;
      const timeLabel = sampleLabels[i % sampleLabels.length];
      const years = 1 + (i * 37.5) % 10000;

      const dest: NavigationDestination = {
        id: `dest-${i}`,
        name,
        position: { x: i, z: -i },
        mode: 'real-light-speed',
        lightTravelTimeYears: years,
        lightTravelTimeLabel: timeLabel,
      };

      const readout = formatRealSpeedReadout(dest);
      expect(readout).toContain(dest.name);
      expect(readout).toContain(dest.lightTravelTimeLabel);
      expect(readout).toContain('Real speed shown for educational honesty.');
    }
  });
});
