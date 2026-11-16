import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    {
      id: 'environment-challenge-watershed-restore',
      title: 'Water Tower Slope Infiltration Restoration',
      description:
        'Place native cedar and bamboo reforestation plots onto degraded hillsides to restore soil infiltration capacity above 50 mm/h.',
      type: 'assembly',
      xpReward: 150,
      seatedCompatible: true,
    },
    {
      id: 'environment-challenge-time-scrub',
      title: 'Mau Watershed 40-Year Time Scrub',
      description:
        'Operate the watershed time lever from 1980 to 2024 to observe forest loss, river baseflow decline, and sediment runoff.',
      type: 'steer',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'environment-challenge-naivasha-balance',
      title: 'Lake Naivasha Hydrological Balance',
      description:
        'Adjust the agricultural abstraction valve to balance commercial flower cultivation against wetland recharge and lake water levels.',
      type: 'tune',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'environment-challenge-stakeholder-equilibrium',
      title: 'Capstone: 9-Stakeholder Basin Equilibrium',
      description:
        'Balance community water rights, pastoralist corridors, downstream fisheries, and wildlife conservation to maintain >=75% overall basin health.',
      type: 'alignment',
      xpReward: 350,
      seatedCompatible: true,
    },
  ];
}
