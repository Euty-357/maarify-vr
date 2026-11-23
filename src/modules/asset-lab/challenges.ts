import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    {
      id: 'asset-lab-explode',
      title: 'Explode an asset',
      description: 'Pull an asset apart using the explode lever or scrub bar.',
      type: 'assembly',
      xpReward: 100,
      seatedCompatible: true,
    },
    {
      id: 'asset-lab-dock',
      title: 'Dock a part',
      description: 'Drag a dock-capable part into its socket anchor.',
      type: 'assembly',
      xpReward: 100,
      seatedCompatible: true,
    },
    {
      id: 'asset-lab-inspect',
      title: 'Inspect an asset',
      description: 'Tap a part to read its diegetic label and description.',
      type: 'assembly',
      xpReward: 50,
      seatedCompatible: true,
    },
  ];
}