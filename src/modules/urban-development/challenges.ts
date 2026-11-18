import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    { id: 'urban-matatu-corridor', title: 'Prioritise a Matatu Corridor', description: 'Set a transit corridor through the model city.', type: 'steer', xpReward: 150, seatedCompatible: true },
    { id: 'urban-services-grid', title: 'Upgrade Essential Services', description: 'Place water, lighting, and safe walking links in the district.', type: 'assembly', xpReward: 200, seatedCompatible: true },
    { id: 'urban-heat-map', title: 'Cool a Heat Hotspot', description: 'Move the thermal scanner and add a green corridor.', type: 'tune', xpReward: 200, seatedCompatible: true },
    { id: 'urban-master-plan', title: 'Capstone: Balance the District', description: 'Balance access, livelihoods, and environmental quality.', type: 'alignment', xpReward: 350, seatedCompatible: true },
  ];
}
