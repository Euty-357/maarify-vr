import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    {
      id: 'human-body-challenge-pacemaker-timing',
      title: 'Cardiac Conduction AV Nodal Timing',
      description:
        'Use the rotary pacing dial to tune the atrioventricular delay to 120 ms, achieving optimal ventricular preload filling before systole fires.',
      type: 'tune',
      xpReward: 150,
      seatedCompatible: true,
    },
    {
      id: 'human-body-challenge-synaptic-vesicle',
      title: 'Synaptic Vesicle SNARE Docking',
      description:
        'Grab the calcium-primed neurotransmitter vesicle and physically guide it into the presynaptic active zone to trigger membrane fusion.',
      type: 'assembly',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'human-body-challenge-car-t-antigen',
      title: 'CAR-T Chimeric Receptor Synthesis',
      description:
        'Align and snap the anti-CD19 single-chain variable fragment (scFv) binding domain onto the synthetic T-cell receptor backbone.',
      type: 'alignment',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'human-body-challenge-art-blockade',
      title: 'Capstone: Multitarget Antiretroviral & CTL Blockade',
      description:
        'Slot integrase strand transfer inhibitors (INSTI) into the active catalytic triad of HIV integrase, then direct CD8+ cytotoxic T-lymphocytes to clear infected cells.',
      type: 'assembly',
      xpReward: 350,
      seatedCompatible: true,
    },
  ];
}

