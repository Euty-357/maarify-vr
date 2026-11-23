import type { CourseEvent, MissionDefinition } from '../../core/types.js';

/**
 * Human Body & Medicine — course missions.
 *
 * Data only. Every factual claim is backed by a source id in SOURCES.md.
 * Medical content: educational and physiological principles only; U=U framing;
 * destigmatising tone.
 */

function reachedValue(
  events: CourseEvent[],
  controlId: string,
  target: number,
  tolerance: number,
): boolean {
  return events.some(
    (e) =>
      (e.type === 'sliderChanged' || e.type === 'rotated' || e.type === 'explodeChanged') &&
      e.target === controlId &&
      typeof e.value === 'number' &&
      Math.abs(e.value - target) <= tolerance,
  );
}

export const HUMAN_BODY_MISSIONS: MissionDefinition[] = [
  {
    id: 'hb-m1-cardiac-valves',
    title: 'Cardiac Mechanics & Valve Closure',
    objective: 'You adjust ventricular contraction rate to observe passive atrioventricular valve closure under systolic pressure.',
    outcomes: {
      foundation:
        'You adjust the heart rate slider to 72 bpm and observe the mitral and tricuspid valves seal against systolic backpressure.',
      advanced:
        'You observe the relationship between ventricular pressure rise and S1 heart sound valve leaflet coaptation.',
      expert:
        'You analyze the Wiggers diagram pressure differential across the mitral valve during isovolumetric contraction.',
    },
    steps: [
      {
        id: 'hb-m1-step-explore',
        caption: 'You move the heart rate slider toward normal resting rate of 72 bpm.',
        highlights: ['heart-pressure-slider'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged'),
      },
      {
        id: 'hb-m1-step-valves',
        caption: 'You inspect the heart cutaway to confirm mitral and aortic valve leaflet motion.',
        highlights: ['heart-pressure-slider'],
        completed: (events) =>
          reachedValue(events, 'heart-pressure-slider', 0.5, 0.2) ||
          events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'hb-m1-step-stabilize',
        caption: 'You stabilize ventricular pacing near resting physiological baseline (72 bpm).',
        highlights: ['heart-pressure-slider'],
        completed: (events) => reachedValue(events, 'heart-pressure-slider', 0.5, 0.1),
      },
    ],
    hints: [
      'The cardiac slider sits to the right of the heart pedestal in the Heart Wing.',
      'Slide the handle toward the midpoint to reach normal 72 bpm resting rate.',
      'Pinch-pull the heart with two hands to separate the front myocardium and view the valves.',
    ],
    feedback: {
      success: 'Normal sinus rate established. Heart valves seal passively under hemodynamic pressure.',
      nearMiss: 'You are close to resting rate. Adjust the slider slightly closer to the center.',
      wrong: 'The pacing rate is outside normal resting range. Adjust toward 72 bpm.',
    },
    successPredicate: (events) => reachedValue(events, 'heart-pressure-slider', 0.5, 0.15),
    tolerance: 0.15,
    xp: 150,
    badge: 'hb-badge-cardiac',
    panelRefs: ['human-body-anchor-heart-valve'],
    sources: ['GUYTON-HALL-PHYSIOLOGY-2020', 'WIGGERS-1915'],
    assetIds: ['heart_cutaway'],
    partIds: ['valve-mitral', 'valve-aortic', 'valve-tricuspid', 'valve-pulmonary'],
    seatedVariant: 'Seated at the pedestal, the cardiac controls sit within 0.8 m arm reach.',
    reducedMotionVariant: 'Heart contraction and blood pulse flow rates can be slowed to a gentle rhythmic pulse.',
  },
  {
    id: 'hb-m2-hiv-suppression',
    title: 'HIV Viral Suppression & U=U',
    objective: 'You examine the HIV virion structure and observe how effective antiretroviral therapy suppresses viral load to undetectable levels.',
    outcomes: {
      foundation:
        'You explode the virion cutaway to identify the viral RNA core and understand Undetectable = Untransmittable (U=U).',
      advanced:
        'You trace the viral load curve showing how daily ART regimen drops plasma viremia below 200 copies/mL within 24 weeks.',
      expert:
        'You examine the INSTI molecular mechanism blocking HIV integrase catalytic triad and strand transfer into host genomic DNA.',
    },
    steps: [
      {
        id: 'hb-m2-step-inspect',
        caption: 'You explode the HIV virion cutaway to observe the conical capsid and viral RNA.',
        highlights: ['hiv_virion_cutaway'],
        completed: (events) => events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'hb-m2-step-art',
        caption: 'You inspect the ART bench and integrase inhibitor docking interface.',
        highlights: ['hiv-art-bench'],
        completed: (events) => events.some((e) => e.type === 'placed' || e.type === 'docked' || e.type === 'grabbed'),
      },
      {
        id: 'hb-m2-step-verify',
        caption: 'You verify that viral suppression prevents transmission (U=U).',
        highlights: ['hiv-graph-panel'],
        completed: (_events) => true,
      },
    ],
    hints: [
      'Walk into the HIV Science Wing and approach the central virion pedestal.',
      'Pinch-pull the virion with both hands to explode it and reveal the RNA dimer.',
      'Review the viral load graph showing suppression below the 200 copies/mL threshold.',
    ],
    feedback: {
      success: 'Viral suppression verified: Undetectable = Untransmittable (U=U) based on WHO guidelines.',
      nearMiss: 'Examine the virion structure and check the ART timeline on the wall display.',
      wrong: 'Review the antiretroviral mechanism of action and the U=U clinical criteria.',
    },
    successPredicate: (_events) => true,
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-hiv-science',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['WHO-U-EQUALS-U-2023', 'FDA-DOLUTEGRAVIR-2013'],
    assetIds: ['hiv_virion_cutaway', 'hiv_art_bench', 'hiv_integrase_insti'],
    partIds: ['capsid-p24', 'rna-dimer', 'gp120-spikes', 'integrase-dimer'],
    seatedVariant: 'Seated learners can interact with the virion cutaway at 0.9 m height within direct reach.',
    reducedMotionVariant: 'Virion cutaway explosion moves along smooth linear detents with no rapid shaking.',
  },
  {
    id: 'hb-m3-neural-synapse',
    title: 'Neural Action Potentials & Synaptic Transmission',
    objective: 'You explore brain lobe localization and trigger action potential propagation across the chemical synapse.',
    outcomes: {
      foundation:
        'You locate the frontal, parietal, temporal, and occipital lobes and observe neurotransmitter vesicle release.',
      advanced:
        'You trace voltage-gated calcium channel opening and SNARE-mediated exocytosis across the 20 nm synaptic cleft.',
      expert:
        'You evaluate miniature endplate potential summation and Hodgkin-Huxley ionic conductance transitions.',
    },
    steps: [
      {
        id: 'hb-m3-step-lobes',
        caption: 'You tap any cerebral lobe to review its specialized cognitive or motor function.',
        highlights: ['brain-lobe-frontal'],
        completed: (events) => events.some((e) => e.type === 'panelOpened' || e.type === 'grabbed'),
      },
      {
        id: 'hb-m3-step-synapse',
        caption: 'You observe vesicle fusion and neurotransmitter diffusion across the synaptic cleft.',
        highlights: ['neural-synapse-zone'],
        completed: (_events) => true,
      },
      {
        id: 'hb-m3-step-confirm',
        caption: 'You confirm rapid millisecond-scale neural signaling across the cleft.',
        highlights: ['neural-synapse-zone'],
        completed: (_events) => true,
      },
    ],
    hints: [
      'Enter the Brain & Neural Wing and examine the illuminated cerebral model.',
      'Tap on the frontal lobe (orange) or occipital lobe (purple) to view functional tooltips.',
      'Observe the synaptic cleft simulation suspended above the pedestal.',
    ],
    feedback: {
      success: 'Neural action potential propagated. Synaptic vesicle exocytosis completed in <0.5 ms.',
      nearMiss: 'Select a brain lobe to examine cortical topography before testing the synapse.',
      wrong: 'Review the functional anatomy of the cerebral cortex and neurotransmitter dynamics.',
    },
    successPredicate: (_events) => true,
    tolerance: 0.1,
    xp: 150,
    badge: 'hb-badge-neuro',
    panelRefs: ['human-body-anchor-synapse'],
    sources: ['KANDEL-PRINCIPLES-NEURAL-2021', 'HODGKIN-HUXLEY-1952'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'The cerebral cortex model is anchored at 1.25 m height, directly reachable seated.',
    reducedMotionVariant: 'Action potential propagation along axon paths uses static illumination cues instead of rapid flashes.',
  },
];

export function getMissions(): MissionDefinition[] {
  return HUMAN_BODY_MISSIONS;
}
