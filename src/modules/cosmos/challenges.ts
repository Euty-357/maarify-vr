import type { ChallengeDefinition } from '../../core/types.js';

export interface CosmosChallengeState {
  id: string;
  completed: boolean;
  score: number;
}

export function getChallenges(): ChallengeDefinition[] {
  return [
    {
      id: 'cosmos-challenge-atmosphere-sorting',
      title: 'Atmospheric Layer Probe Deployment',
      description:
        'Physically place meteorological sounding pods into their correct atmospheric layers (Troposphere, Stratosphere, Thermosphere) matching temperature inversion signatures.',
      type: 'assembly',
      xpReward: 150,
      seatedCompatible: true,
    },
    {
      id: 'cosmos-challenge-transit-alignment',
      title: 'Exoplanet Transit Light Curve Alignment',
      description:
        'Rotate the exoplanetary orbital plane using the 3D rotator dial until the planet crosses the star face, creating a measurable dip in stellar flux.',
      type: 'sequence-walk',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'cosmos-challenge-doppler-filter',
      title: 'Accretion Disc Relativistic Beaming',
      description:
        'Align physical optical filter rings to measure the blueshifted, Doppler-brightened approaching side versus the redshifted receding side of Sagittarius A*.',
      type: 'alignment',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'cosmos-challenge-mars-injection',
      title: 'Capstone: Mars Hohmann Orbital Injection',
      description:
        'Tilt your head to sight the perigee indicator and hold the thrust gimbal lever to execute the retrograde capture burn into Martian orbit.',
      type: 'gaze-hold',
      xpReward: 350,
      seatedCompatible: true,
    },
  ];
}

