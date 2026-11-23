import type { AssetPlan } from '../../core/types.js';

/**
 * Aerospace & Rocket Propulsion — Asset choreography plan (WP7).
 *
 * Data and docs only — not wired into module scenes. Maps each existing anchor
 * and challenge to an asset, part ids, interaction, tier, and narration key.
 *
 * Anything not yet cited in src/modules/aerospace/SOURCES.md is marked
 * unverified. Respects the Rocket Propulsion Safety Scope: system-level
 * education only, no propellant formulations, mixing, ignition, or fabrication.
 */

export const AEROSPACE_ASSET_PLAN: AssetPlan = {
  moduleId: 'aerospace',
  steps: [
    {
      step: 1,
      anchorId: 'aerospace-anchor-aerofoil-lift',
      asset: 'engine_ffsc_methalox',
      partIds: ['nozzle', 'chamber', 'injector'],
      interaction: 'scrub',
      tier: 'foundation',
      narrationKey: 'aero-lift-foundation',
      successCondition: 'Learner rotates angle-of-attack slider past stall and observes lift breakdown.',
      unverified: true,
    },
    {
      step: 2,
      anchorId: 'aerospace-anchor-aerofoil-lift',
      asset: 'engine_ffsc_methalox',
      partIds: ['nozzle', 'chamber', 'cooling-jacket-a', 'cooling-jacket-b'],
      interaction: 'explode',
      tier: 'advanced',
      narrationKey: 'aero-engine-advanced',
      successCondition: 'Learner pulls the engine apart along each part normal and re-snaps to rest.',
      unverified: true,
    },
    {
      step: 3,
      challengeId: 'aero-ch-2-turbopump-plumbing',
      asset: 'engine_ffsc_methalox',
      partIds: ['fuel-turbopump', 'lox-turbopump', 'feed-lines', 'injector'],
      interaction: 'dock',
      tier: 'expert',
      narrationKey: 'aero-turbopump-expert',
      successCondition: 'Learner docks fuel and LOX feed lines into preburner sockets without cross-routing.',
      unverified: true,
    },
    {
      step: 4,
      challengeId: 'aero-ch-3-nozzle-contour',
      asset: 'engine_ffsc_methalox',
      partIds: ['nozzle'],
      interaction: 'tune',
      tier: 'advanced',
      narrationKey: 'aero-nozzle-advanced',
      successCondition: 'Learner sets nozzle expansion so exit pressure matches ambient (ideally expanded).',
      unverified: true,
    },
    {
      step: 5,
      challengeId: 'aero-ch-4-orbital-injection',
      asset: 'engine_srm',
      partIds: ['nozzle', 'propellant-grain', 'forward-casing', 'aft-casing'],
      interaction: 'tune',
      tier: 'expert',
      narrationKey: 'aero-capstone-expert',
      successCondition: 'Learner circularizes the upper stage and achieves stable orbit.',
      unverified: true,
    },
  ],
};

export default AEROSPACE_ASSET_PLAN;