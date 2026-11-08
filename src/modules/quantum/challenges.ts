import type { ChallengeDefinition } from '../../core/types.js';

export function getChallenges(): ChallengeDefinition[] {
  return [
    {
      id: 'quantum-challenge-superposition-tuning',
      title: 'Bloch Vector Superposition Tuning',
      description:
        'Rotate the 3D Bloch state vector arrow onto the equator (theta = 90 degrees) to synthesize an exact equal superposition state (|0> + |1>)/sqrt(2).',
      type: 'tune',
      xpReward: 150,
      seatedCompatible: true,
    },
    {
      id: 'quantum-challenge-double-slit-observer',
      title: 'Observer Gaze Wavefunction Collapse',
      description:
        'Walk or look directly at the left slit detector, holding gaze for 1.5 seconds to cause the wave probability ripples to collapse into localized particle hits.',
      type: 'gaze-hold',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'quantum-challenge-bell-correlation',
      title: 'Bell State Entanglement Correlation',
      description:
        'Separate the entangled photon pair with both hands and rotate polarizers to verify quantum non-local correlation violating Bell\'s classical bound (S > 2).',
      type: 'alignment',
      xpReward: 200,
      seatedCompatible: true,
    },
    {
      id: 'quantum-challenge-circuit-assembly',
      title: 'Capstone: Deutsch-Jozsa Quantum Gate Assembly',
      description:
        'Physically slot Hadamard (H) and CNOT logic tokens into the optical circuit rails to evaluate the oracle function in a single computational step.',
      type: 'assembly',
      xpReward: 350,
      seatedCompatible: true,
    },
  ];
}

