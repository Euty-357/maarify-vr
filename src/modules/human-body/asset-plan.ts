import type { AssetPlan } from '../../core/types.js';

/**
 * Human Body & Medicine — Asset choreography plan (WP7).
 *
 * Data and docs only — not wired into module scenes. Maps each existing anchor
 * and challenge to an asset, part ids, interaction, tier, and narration key.
 *
 * Anything not yet cited in src/modules/human-body/SOURCES.md is marked
 * unverified. Medical content: accurate, destigmatising, non-diagnostic,
 * education-only disclaimer. U=U framing applied for HIV content.
 */

export const HUMAN_BODY_ASSET_PLAN: AssetPlan = {
  moduleId: 'human-body',
  steps: [
    {
      step: 1,
      anchorId: 'human-body-anchor-heart-valve',
      asset: 'heart_cutaway',
      partIds: ['valve-mitral', 'valve-aortic', 'valve-pulmonary', 'valve-tricuspid'],
      interaction: 'scrub',
      tier: 'foundation',
      narrationKey: 'heart-valve-foundation',
      successCondition: 'Learner scrubs ventricular pressure and observes valves sealing under systolic load.',
      unverified: true,
    },
    {
      step: 2,
      challengeId: 'human-body-challenge-pacemaker-timing',
      asset: 'heart_cutaway',
      partIds: ['aorta', 'pulmonary-trunk', 'vena-cavae'],
      interaction: 'flow',
      tier: 'advanced',
      narrationKey: 'heart-flow-advanced',
      successCondition: 'Learner toggles the deoxygenated and oxygenated flow paths and identifies chambers.',
      unverified: true,
    },
    {
      step: 3,
      challengeId: 'human-body-challenge-art-blockade',
      asset: 'hiv_integrase_insti',
      partIds: ['integrase-dimer', 'insti-drug', 'viral-dna-end', 'magnesium-ions'],
      interaction: 'dock',
      tier: 'expert',
      narrationKey: 'hiv-inst-dock-expert',
      successCondition: 'Learner docks INSTI drug into integrase catalytic triad with Mg2+ ions.',
      unverified: true,
    },
    {
      step: 4,
      challengeId: 'human-body-challenge-synaptic-vesicle',
      asset: 'hiv_cd4_cell',
      partIds: ['cd4-receptors', 'ccr5-coreceptors', 'membrane-front'],
      interaction: 'dock',
      tier: 'foundation',
      narrationKey: 'hiv-entry-foundation',
      successCondition: 'Learner aligns CD4/CCR5 receptors to demonstrate viral entry co-receptor usage.',
      unverified: true,
    },
    {
      step: 5,
      anchorId: 'human-body-anchor-heart-valve',
      asset: 'heart_cutaway',
      partIds: ['myocardium-front', 'myocardium-back', 'papillary-chordae'],
      interaction: 'explode',
      tier: 'expert',
      narrationKey: 'heart-anatomy-expert',
      successCondition: 'Learner explodes the heart into myocardium/valve/great-vessel layers and re-snaps.',
      unverified: true,
    },
  ],
};

export default HUMAN_BODY_ASSET_PLAN;