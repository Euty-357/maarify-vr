/**
 * Aerospace & Rocket Propulsion — Physical Challenges.
 * All challenges are 100% seated-compatible per IMMERSION_CHARTER.md.
 */

import type { ChallengeDefinition } from '../../core/types.js';

export const AEROSPACE_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'aero-ch-1-wing-trim',
    title: 'High-Altitude Wing Trim & L/D Balancing',
    description:
      'Mechanically pitch the wing spar slider to find the optimal angle of attack (~6° to 8°) yielding peak Lift-to-Drag ratio (L/D > 15) in thin Nairobi air (1,680m elevation) without inducing stall buffeting.',
    type: 'tune',
    xpReward: 150,
    seatedCompatible: true,
  },
  {
    id: 'aero-ch-2-turbopump-plumbing',
    title: 'Staged Combustion Turbopump Plumbing Assembly',
    description:
      'Grab and align high-pressure fuel and oxidizer feed lines into the dual preburners of a Full-Flow Staged Combustion engine. Route coolant through nozzle channels without crossing high-pressure oxidizer into fuel turbines.',
    type: 'assembly',
    xpReward: 200,
    seatedCompatible: true,
  },
  {
    id: 'aero-ch-3-nozzle-contour',
    title: 'Supersonic Nozzle Throat & Expansion Tuning',
    description:
      'Adjust the de Laval nozzle expansion area ratio slider (Ae/At) to match chamber exit pressure with ambient atmospheric pressure, eliminating internal oblique shock separation.',
    type: 'alignment',
    xpReward: 175,
    seatedCompatible: true,
  },
  {
    id: 'aero-ch-4-orbital-injection',
    title: 'Capstone: Historical Malindi Range & Orbital Insertion',
    description:
      'Use a simplified historical Malindi launch-range scenario: throttle through Max-Q, time MECO staging separation, and steer an upper-stage burn to circularize. This classroom scenario does not depict Taifa-1, which launched from Vandenberg.',
    type: 'steer',
    xpReward: 350,
    seatedCompatible: true,
  },
];

export function getChallenges(): ChallengeDefinition[] {
  return AEROSPACE_CHALLENGES;
}
