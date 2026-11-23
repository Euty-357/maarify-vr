import type { AssetPlan } from '../../core/types.js';

/**
 * Quantum — Asset choreography plan (WP7).
 *
 * Data and docs only — not wired into module scenes. Maps each existing anchor
 * and challenge to an asset, part ids, interaction, tier, and narration key.
 *
 * Anything not yet cited in src/modules/quantum/SOURCES.md is marked
 * unverified.
 */

export const QUANTUM_ASSET_PLAN: AssetPlan = {
  moduleId: 'quantum',
  steps: [
    {
      step: 1,
      challengeId: 'quantum-challenge-superposition-tuning',
      asset: 'quantum-cryostat',
      partIds: ['50k-stage', '4k-stage', '800mk-stage', '100mk-stage', '15mk-stage'],
      interaction: 'tune',
      tier: 'foundation',
      narrationKey: 'q-cryostat-foundation',
      successCondition: 'Learner rotates the cryostat stage dial to the labeled base temperature.',
      unverified: true,
    },
    {
      step: 2,
      challengeId: 'quantum-challenge-double-slit-observer',
      asset: 'quantum-cryostat',
      partIds: ['dilution-plate', 'mixing-chamber'],
      interaction: 'gaze-hold',
      tier: 'advanced',
      narrationKey: 'q-superposition-advanced',
      successCondition: 'Learner holds gaze on a slit detector and observes wavefunction collapse.',
      unverified: true,
    },
    {
      step: 3,
      challengeId: 'quantum-challenge-bell-correlation',
      asset: 'quantum-cryostat',
      partIds: ['still', 'cold-plate'],
      interaction: 'dock',
      tier: 'expert',
      narrationKey: 'q-bell-expert',
      successCondition: 'Learner rotates polarizers and verifies Bell inequality violation (S > 2).',
      unverified: true,
    },
    {
      step: 4,
      challengeId: 'quantum-challenge-circuit-assembly',
      asset: 'quantum-circuit-kit',
      partIds: ['h-gate', 'cnot-gate', 'photon-source', 'detector'],
      interaction: 'dock',
      tier: 'expert',
      narrationKey: 'q-circuit-expert',
      successCondition: 'Learner slots H and CNOT tokens into circuit rails to evaluate the oracle.',
      unverified: true,
    },
    {
      step: 5,
      challengeId: 'quantum-challenge-superposition-tuning',
      asset: 'quantum-circuit-kit',
      partIds: ['bloch-sphere', 'state-vector'],
      interaction: 'scrub',
      tier: 'foundation',
      narrationKey: 'q-bloch-foundation',
      successCondition: 'Learner rotates the Bloch state vector to the equator (equal superposition).',
      unverified: true,
    },
  ],
};

export default QUANTUM_ASSET_PLAN;