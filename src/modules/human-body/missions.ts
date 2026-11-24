import type { CourseEvent, MissionDefinition } from '../../core/types.js';

/**
 * Human Body & Medicine — Course Storyboard Missions.
 *
 * Covers Heart H1 to H4, HIV V1 to V4, Brain, and Cancer.
 * Data only. Every factual claim backed by a source id in SOURCES.md.
 * Educational biology principles only; non-diagnostic; destigmatising tone.
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
  // --- Heart Wing (H1 to H4) ---
  {
    id: 'hb-h1-trace-the-blood',
    title: 'H1: Cardiac Circulation Circuit',
    objective: 'You trace and assemble the unidirectional flow path of blood through both heart chambers and great vessels.',
    outcomes: {
      foundation:
        'You trace deoxygenated blood through the right atrium and ventricle to the lungs, returning oxygenated to the aorta.',
      advanced:
        'You follow serial systemic and pulmonary circuit flow matching Guyton hemodynamics (stroke volume ~70 mL at rest).',
      expert:
        'You verify the closed-loop conservation of mass where left and right ventricular outputs match over time.',
    },
    steps: [
      {
        id: 'hb-h1-step-enter-heart',
        caption: 'You enter the Cardiology Wing and approach the anatomical heart model.',
        highlights: ['heart_cutaway'],
        completed: (events) => events.some((e) => e.type === 'enteredZone' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-h1-step-start-flow',
        caption: 'You adjust the pacing slider to activate pulsatile pulmonary and aortic blood flow.',
        highlights: ['heart-pressure-slider'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' || e.type === 'flowToggled'),
      },
      {
        id: 'hb-h1-step-confirm-circuit',
        caption: 'You observe synchronized red oxygenated and blue deoxygenated blood streams.',
        highlights: ['heart_cutaway'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Enter the Heart Wing through the red wayfinding portal.',
      'Adjust the cardiac slider on the pedestal to begin blood flow animation.',
      'Observe the dual particle streams tracing systemic and pulmonary circulation.',
    ],
    feedback: {
      success: 'Circulatory flow established. Oxygenated and deoxygenated streams circulate synchronously.',
      nearMiss: 'Adjust the cardiac pacing slider to activate both flow circuits.',
      wrong: 'Approach the central heart pedestal in the Heart Wing to initiate flow.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'sliderChanged' || e.type === 'flowToggled'),
    tolerance: 0.1,
    xp: 150,
    badge: 'hb-badge-circulation',
    panelRefs: ['human-body-anchor-heart-valve'],
    sources: ['GUYTON-HALL-PHYSIOLOGY-2020'],
    assetIds: ['heart_cutaway'],
    partIds: ['valve-mitral', 'valve-aortic', 'valve-tricuspid', 'valve-pulmonary'],
    seatedVariant: 'The cardiac pedestal stands at 0.9 m within easy reach while seated.',
    reducedMotionVariant: 'Blood particle speeds are limited to gentle rhythmic pulses.',
  },
  {
    id: 'hb-h2-cutaway-and-valves',
    title: 'H2: Cutaway & Passive Valve Dynamics',
    objective: 'You explode the heart cutaway to inspect passive mitral and aortic valve closure under systolic pressure.',
    outcomes: {
      foundation:
        'You explode the anterior myocardium using two-handed pinch-pull to inspect the mitral and aortic valve leaflets.',
      advanced:
        'You observe one-way valve closure sealing under 120 mmHg ventricular systolic backpressure.',
      expert:
        'You analyze the pressure gradient across the atrioventricular junction during isovolumetric ventricular contraction.',
    },
    steps: [
      {
        id: 'hb-h2-step-explode',
        caption: 'You pinch-pull the heart cutaway with both hands to expose the internal valve chambers.',
        highlights: ['heart_cutaway'],
        completed: (events) => events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'hb-h2-step-inspect-valves',
        caption: 'You inspect the mitral and aortic valve leaflets as pressure cycles.',
        highlights: ['heart_cutaway'],
        completed: (events) => events.some((e) => e.type === 'grabbed' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-h2-step-seal',
        caption: 'You confirm passive valve sealing preventing regurgitation into the atrium.',
        highlights: ['human-body-anchor-heart-valve'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Reach toward the heart model with both hands and pinch-pull outward (or click EXPLODE).',
      'Look inside the left ventricle to inspect the mitral valve leaflets.',
      'Check the valve placard explaining passive closure driven by hemodynamic pressure differentials.',
    ],
    feedback: {
      success: 'Heart cutaway inspected. Passive valve closure dynamics verified.',
      nearMiss: 'Pinch-pull the heart outward to separate the myocardial walls.',
      wrong: 'Activate the cutaway exploded view on the heart model.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'explodeChanged'),
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-valves',
    panelRefs: ['human-body-anchor-heart-valve'],
    sources: ['GUYTON-HALL-PHYSIOLOGY-2020', 'WIGGERS-1915'],
    assetIds: ['heart_cutaway'],
    partIds: ['valve-mitral', 'valve-aortic'],
    seatedVariant: 'The exploded heart halves remain centered over the 0.9 m pedestal within seated reach.',
    reducedMotionVariant: 'Heart cutaway separates smoothly along lateral rails without camera recoil.',
  },
  {
    id: 'hb-h3-ecg-conduction',
    title: 'H3: Cardiac Electrophysiology & ECG Synchronization',
    objective: 'You tune cardiac pacing to align the P-QRS-T electrocardiogram waveform with ventricular contraction.',
    outcomes: {
      foundation:
        'You correlate the ECG P wave (atrial depolarization), QRS complex (ventricular firing), and T wave (repolarization).',
      advanced:
        'You adjust the pacemaker timing dial to 120 ms AV nodal delay for optimal preload filling.',
      expert:
        'You evaluate the Frank-Starling mechanism relating end-diastolic sarcomere stretch to systolic force generation.',
    },
    steps: [
      {
        id: 'hb-h3-step-tune-pace',
        caption: 'You adjust the pacing rate toward normal resting sinus rhythm (72 bpm).',
        highlights: ['heart-pressure-slider'],
        completed: (events) => reachedValue(events, 'heart-pressure-slider', 0.5, 0.2),
      },
      {
        id: 'hb-h3-step-stabilize',
        caption: 'You stabilize ventricular pacing near the 72 bpm physiological target.',
        highlights: ['heart-pressure-slider'],
        completed: (events) => reachedValue(events, 'heart-pressure-slider', 0.5, 0.1),
      },
      {
        id: 'hb-h3-step-ecg-trace',
        caption: 'You inspect the live ECG trace synchronized with ventricular contraction.',
        highlights: ['human-body-anchor-heart-valve'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Grasp the heart rate slider to the right of the heart pedestal.',
      'Move the slider handle to the center position (normal resting 72 bpm).',
      'Watch the synchronized P-QRS-T trace form on the cardiac monitor.',
    ],
    feedback: {
      success: 'Sinus rhythm established. ECG trace synchronized with mechanical contraction.',
      nearMiss: 'Adjust the slider closer to the center baseline at 72 bpm.',
      wrong: 'Slide the pacing control toward the center resting rate.',
    },
    successPredicate: (events) => reachedValue(events, 'heart-pressure-slider', 0.5, 0.15),
    tolerance: 0.15,
    xp: 200,
    badge: 'hb-badge-ecg',
    panelRefs: ['human-body-anchor-heart-valve'],
    sources: ['WIGGERS-1915', 'GUYTON-HALL-PHYSIOLOGY-2020'],
    assetIds: ['heart_cutaway'],
    partIds: ['valve-mitral', 'valve-aortic'],
    seatedVariant: 'The pacing slider sits at 0.85 m height directly accessible while seated.',
    reducedMotionVariant: 'The ECG trace uses continuous line scrolling without strobe flashes.',
  },
  {
    id: 'hb-h4-coronary-perfusion',
    title: 'H4: Coronary Hemodynamics & Perfusion',
    objective: 'You examine coronary arterial blood flow and explore how luminal narrowing reduces myocardial perfusion.',
    outcomes: {
      foundation:
        'You inspect the coronary arterial tree supplying oxygen to the left and right ventricular myocardium.',
      advanced:
        'You observe downstream perfusion changes when coronary resistance increases under atherosclerotic narrowing.',
      expert:
        'You analyze coronary perfusion pressure (aortic diastolic pressure minus left ventricular end-diastolic pressure).',
    },
    steps: [
      {
        id: 'hb-h4-step-inspect-vessels',
        caption: 'You inspect the left anterior descending and circumflex coronary arteries.',
        highlights: ['heart_cutaway'],
        completed: (events) => events.some((e) => e.type === 'grabbed' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-h4-step-flow-rate',
        caption: 'You adjust flow rate to observe diastolic coronary perfusion.',
        highlights: ['heart-pressure-slider'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' || e.type === 'flowToggled'),
      },
      {
        id: 'hb-h4-step-verify-perfusion',
        caption: 'You verify that coronary filling occurs predominantly during ventricular diastole.',
        highlights: ['human-body-anchor-heart-valve'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Examine the red coronary vessels branching across the heart surface.',
      'Adjust the slider control to inspect myocardial perfusion dynamics.',
      'Check the spatial anchor placard detailing coronary flow mechanics.',
    ],
    feedback: {
      success: 'Coronary perfusion verified. Diastolic myocardial blood supply demonstrated.',
      nearMiss: 'Inspect the coronary vessels and adjust perfusion controls.',
      wrong: 'Examine the coronary vessels on the heart model to proceed.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'sliderChanged' || e.type === 'panelOpened'),
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-coronary',
    panelRefs: ['human-body-anchor-heart-valve'],
    sources: ['ROBBINS-PATHOLOGY-2020', 'GUYTON-HALL-PHYSIOLOGY-2020'],
    assetIds: ['heart_cutaway'],
    partIds: ['valve-aortic'],
    seatedVariant: 'The heart pedestal allows 360-degree seated viewing of all coronary branches.',
    reducedMotionVariant: 'Perfusion particles maintain steady velocities without rapid acceleration.',
  },

  // --- HIV Science Wing (V1 to V4) ---
  {
    id: 'hb-v1-virion-assembly',
    title: 'V1: HIV Virion Structure & Exploded Assembly',
    objective: 'You explode the HIV virion cutaway to identify the viral envelope, capsid, RNA genome, and enzymes.',
    outcomes: {
      foundation:
        'You use two-handed pinch-pull to separate the viral lipid bilayer, gp120 spikes, p24 capsid, and RNA genome.',
      advanced:
        'You identify key viral enzymes: Reverse Transcriptase, Integrase, and Protease packaged inside the conical capsid.',
      expert:
        'You examine the glycoprotein trimer gp120/gp41 mediating high-affinity CD4 binding and CCR5/CXCR4 coreceptor engagement.',
    },
    steps: [
      {
        id: 'hb-v1-step-enter-hiv',
        caption: 'You enter the HIV Science Wing and approach the virion cutaway pedestal.',
        highlights: ['hiv_virion_cutaway'],
        completed: (events) => events.some((e) => e.type === 'enteredZone' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-v1-step-explode-virion',
        caption: 'You pinch-pull the virion model outward with two hands to expose internal structures.',
        highlights: ['hiv_virion_cutaway'],
        completed: (events) => events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'hb-v1-step-inspect-capsid',
        caption: 'You inspect the p24 conical capsid containing the dimeric single-stranded RNA genome.',
        highlights: ['hiv_virion_cutaway'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Enter the HIV Science Wing along the violet wayfinding path.',
      'Reach out with both hands and pinch-pull the virion model outward (or click EXPLODE).',
      'Examine the conical capsid and reverse transcriptase enzyme clusters.',
    ],
    feedback: {
      success: 'Virion anatomy revealed. Structural proteins and viral genome identified.',
      nearMiss: 'Pinch-pull the virion outward to separate the outer envelope from the capsid.',
      wrong: 'Approach the virion cutaway model in the HIV Wing to begin.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'explodeChanged'),
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-virion',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['WHO-U-EQUALS-U-2023', 'FDA-DOLUTEGRAVIR-2013'],
    assetIds: ['hiv_virion_cutaway'],
    partIds: ['capsid-p24', 'rna-dimer', 'gp120-spikes'],
    seatedVariant: 'The virion model rests at 0.9 m pedestal height within direct arm reach.',
    reducedMotionVariant: 'Virion explosion separates along radial axes with smooth linear easing.',
  },
  {
    id: 'hb-v2-lifecycle-and-art',
    title: 'V2: HIV Life Cycle & Antiretroviral Blockade',
    objective: 'You examine the ART laboratory bench and slot integrase inhibitors into the viral catalytic active site.',
    outcomes: {
      foundation:
        'You slot antiretroviral inhibitor tokens into viral enzymes to observe how modern ART stops viral replication.',
      advanced:
        'You trace the mechanism of Integrase Strand Transfer Inhibitors (INSTI) blocking viral DNA insertion into host chromosomes.',
      expert:
        'You analyze the catalytic triad (DDE motif) coordination of Mg2+ ions targeted by dolutegravir with high resistance barriers.',
    },
    steps: [
      {
        id: 'hb-v2-step-approach-bench',
        caption: 'You walk to the ART development bench in the HIV laboratory.',
        highlights: ['hiv_art_bench'],
        completed: (events) => events.some((e) => e.type === 'enteredZone' || e.type === 'grabbed'),
      },
      {
        id: 'hb-v2-step-slot-insti',
        caption: 'You slot the integrase inhibitor (INSTI) into the active catalytic docking pocket.',
        highlights: ['hiv_integrase_insti'],
        completed: (events) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'hb-v2-step-confirm-blockade',
        caption: 'You confirm that strand transfer is blocked, preventing viral genome integration.',
        highlights: ['human-body-anchor-hiv-lifecycle'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Walk to the bench on the left side of the HIV Wing.',
      'Grab the glowing INSTI molecular inhibitor model.',
      'Place it into the highlighted catalytic pocket on the integrase enzyme.',
    ],
    feedback: {
      success: 'Enzyme blockade confirmed. Integrase catalytic site inhibited, preventing viral integration.',
      nearMiss: 'Slot the drug inhibitor directly into the enzyme catalytic pocket.',
      wrong: 'Pick up the INSTI inhibitor model from the lab bench.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
    tolerance: 0.1,
    xp: 250,
    badge: 'hb-badge-art',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['FDA-DOLUTEGRAVIR-2013', 'KEMRI-ANNUAL-REPORT-2022'],
    assetIds: ['hiv_art_bench', 'hiv_integrase_insti'],
    partIds: ['integrase-dimer', 'insti-molecule'],
    seatedVariant: 'The ART bench stands at 0.85 m table height within seated reaching radius.',
    reducedMotionVariant: 'Molecular docking occurs with subtle glow highlights and no screen shake.',
  },
  {
    id: 'hb-v3-u-equals-u-science',
    title: 'V3: Viral Suppression & Undetectable = Untransmittable (U=U)',
    objective: 'You evaluate clinical viral load suppression curves demonstrating the evidence base of U=U.',
    outcomes: {
      foundation:
        'You review clinical data proving that an undetectable viral load (<200 copies/mL) prevents sexual transmission.',
      advanced:
        'You track plasma viremia reduction across 24 weeks of continuous ART regimen leading to durable viral suppression.',
      expert:
        'You analyze the PARTNER and Opposites Attract trials establishing zero transmissions over >100,000 condomless acts.',
    },
    steps: [
      {
        id: 'hb-v3-step-inspect-chart',
        caption: 'You open the clinical epidemiology panel on the HIV Wing wall.',
        highlights: ['human-body-anchor-hiv-lifecycle'],
        completed: (events) => events.some((e) => e.type === 'panelOpened' || e.type === 'grabbed'),
      },
      {
        id: 'hb-v3-step-verify-threshold',
        caption: 'You inspect the suppression threshold line marking 200 copies/mL.',
        highlights: ['human-body-anchor-hiv-lifecycle'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-v3-step-u-equals-u-conclusion',
        caption: 'You confirm the scientific consensus: Undetectable = Untransmittable (U=U).',
        highlights: ['human-body-anchor-hiv-lifecycle'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Inspect the clinical display placard on the wall of the HIV Wing.',
      'Tap the panel to review clinical viral suppression trials.',
      'Check the WHO guidance on Undetectable = Untransmittable.',
    ],
    feedback: {
      success: 'Clinical evidence verified: Undetectable equals Untransmittable (U=U) based on global WHO guidelines.',
      nearMiss: 'Open and inspect the clinical viral suppression data chart.',
      wrong: 'Approach the clinical results display in the HIV Wing.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'panelOpened'),
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-u-equals-u',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['WHO-U-EQUALS-U-2023'],
    assetIds: ['hiv_art_bench'],
    partIds: [],
    seatedVariant: 'The wall display panel is oriented for clear readability from a seated viewpoint.',
    reducedMotionVariant: 'Data curve animations utilize progressive opacity fades.',
  },
  {
    id: 'hb-v4-pumwani-mucosal-immunity',
    title: 'V4: Cellular Immunity & The Nairobi Pumwani Cohort',
    objective: 'You examine cytotoxic T-lymphocyte (CTL) epitope recognition discovered in the pioneering Pumwani Cohort.',
    outcomes: {
      foundation:
        'You observe how specialized mucosal CD8+ cytotoxic T-lymphocytes recognize and clear HIV-infected cells.',
      advanced:
        'You trace HLA-restricted epitope presentation of viral Gag and Nef peptides to cytotoxic T-cell receptors.',
      expert:
        'You evaluate the immunogenetic findings of the Nairobi Pumwani cohort demonstrating natural mucosal cellular resistance.',
    },
    steps: [
      {
        id: 'hb-v4-step-approach-ctl',
        caption: 'You approach the cellular immunology station in the HIV Wing.',
        highlights: ['hiv_cd8_ctl'],
        completed: (events) => events.some((e) => e.type === 'enteredZone' || e.type === 'grabbed'),
      },
      {
        id: 'hb-v4-step-target-epitope',
        caption: 'You guide the cytotoxic T-lymphocyte to engage the MHC-I presentation complex on the target cell.',
        highlights: ['hiv_cd4_cell'],
        completed: (events) => events.some((e) => e.type === 'placed' || e.type === 'docked'),
      },
      {
        id: 'hb-v4-step-honor-cohort',
        caption: 'You review the scientific contribution of the Kenyan Pumwani cohort to global vaccine design.',
        highlights: ['human-body-anchor-hiv-lifecycle'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Walk to the right table in the HIV Wing displaying the cellular models.',
      'Grab the CD8+ cytotoxic T-cell and guide it to the infected target cell.',
      'Review the scientific placard honoring the pioneering Nairobi Pumwani sex worker cohort.',
    ],
    feedback: {
      success: 'Mucosal cellular immunity demonstrated. Landmark contribution of the Pumwani cohort honored.',
      nearMiss: 'Guide the cytotoxic T-lymphocyte to bind the target antigen receptor.',
      wrong: 'Approach the cellular immunology station in the HIV Wing to proceed.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'placed' || e.type === 'docked'),
    tolerance: 0.1,
    xp: 250,
    badge: 'hb-badge-pumwani',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['FOWKE-PLUMMER-PUMWANI-1996', 'KEMRI-ANNUAL-REPORT-2022'],
    assetIds: ['hiv_cd8_ctl', 'hiv_cd4_cell'],
    partIds: ['tcr-receptor', 'mhc-complex'],
    seatedVariant: 'Cellular immunology models sit at 0.78 m height within direct seated reach.',
    reducedMotionVariant: 'Cell engagement uses smooth spatial guidance without sudden snaps.',
  },

  // --- Brain & Neurology Wing ---
  {
    id: 'hb-b1-neural-synapse',
    title: 'B1: Neural Action Potentials & Synaptic Transmission',
    objective: 'You explore cerebral functional topography and trigger action potential propagation across the chemical synapse.',
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
        id: 'hb-b1-step-lobes',
        caption: 'You tap any cerebral lobe to review its specialized cognitive or motor function.',
        highlights: ['brain-lobe-frontal'],
        completed: (events) => events.some((e) => e.type === 'panelOpened' || e.type === 'grabbed'),
      },
      {
        id: 'hb-b1-step-synapse',
        caption: 'You guide a neurotransmitter vesicle into the presynaptic active zone to trigger exocytosis.',
        highlights: ['neural-synapse-zone'],
        completed: (events) => events.some((e) => e.type === 'placed' || e.type === 'docked'),
      },
      {
        id: 'hb-b1-step-confirm',
        caption: 'You confirm rapid millisecond-scale chemical signaling across the synaptic cleft.',
        highlights: ['human-body-anchor-synapse'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Enter the Brain & Neural Wing and examine the illuminated cerebral model.',
      'Tap on the frontal or occipital lobe to view functional specialization.',
      'Guide the vesicle into the presynaptic active zone to release neurotransmitters.',
    ],
    feedback: {
      success: 'Neural action potential propagated. Synaptic vesicle exocytosis completed in <0.5 ms.',
      nearMiss: 'Guide the vesicle to dock at the presynaptic active zone.',
      wrong: 'Review the functional anatomy of the cerebral cortex and neurotransmitter dynamics.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'placed' || e.type === 'docked'),
    tolerance: 0.1,
    xp: 200,
    badge: 'hb-badge-neuro',
    panelRefs: ['human-body-anchor-synapse'],
    sources: ['KANDEL-PRINCIPLES-NEURAL-2021', 'HODGKIN-HUXLEY-1952'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'The cerebral cortex model is anchored at 1.25 m height, directly reachable seated.',
    reducedMotionVariant: 'Action potential propagation along axon paths uses static illumination cues.',
  },

  // --- Oncology & Cancer Wing ---
  {
    id: 'hb-c1-car-t-immunotherapy',
    title: 'C1: Cellular Oncology & CAR-T Immunotherapy',
    objective: 'You examine tumor antigen presentation and assemble an anti-CD19 CAR-T receptor to target malignant cells.',
    outcomes: {
      foundation:
        'You assemble a chimeric antigen receptor (CAR) by attaching an antibody binding fragment onto a T-cell receptor.',
      advanced:
        'You observe how CAR-T cells recognize tumor surface antigens (CD19) without requiring MHC presentation.',
      expert:
        'You analyze costimulatory domain signaling (CD28 / 4-1BB) sustaining T-cell expansion and cytotoxic persistence.',
    },
    steps: [
      {
        id: 'hb-c1-step-enter-oncology',
        caption: 'You enter the Oncology Wing and approach the cellular immunology bench.',
        highlights: ['cancer-bench'],
        completed: (events) => events.some((e) => e.type === 'enteredZone' || e.type === 'panelOpened'),
      },
      {
        id: 'hb-c1-step-snap-car',
        caption: 'You snap the anti-CD19 single-chain variable fragment (scFv) onto the synthetic CAR backbone.',
        highlights: ['car-t-receptor'],
        completed: (events) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'hb-c1-step-destroy-tumor',
        caption: 'You verify that engineered CAR-T cells induce targeted apoptosis in CD19+ tumor cells.',
        highlights: ['cancer-bench'],
        narrative: true,
        completed: (_events) => true,
      },
    ],
    hints: [
      'Enter the Oncology Wing and locate the synthetic receptor on the central bench.',
      'Grab the scFv binding domain and snap it onto the CAR receptor hinge.',
      'Watch the engineered CAR-T cell bind and eliminate the tumor target.',
    ],
    feedback: {
      success: 'CAR-T receptor assembled. Targeted tumor cell apoptosis initiated without MHC restriction.',
      nearMiss: 'Align and snap the scFv fragment onto the CAR backbone.',
      wrong: 'Approach the central cellular bench in the Oncology Wing.',
    },
    successPredicate: (events) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
    tolerance: 0.1,
    xp: 250,
    badge: 'hb-badge-oncology',
    panelRefs: ['human-body-anchor-hiv-lifecycle'],
    sources: ['HANAHAN-WEINBERG-2011', 'JUNE-CAR-T-NEJM-2018'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'The oncology workbench is at 0.78 m height accessible to seated learners.',
    reducedMotionVariant: 'Cell lysis animations use gentle particle dispersion without flashing.',
  },
];

export function getMissions(): MissionDefinition[] {
  return HUMAN_BODY_MISSIONS;
}
