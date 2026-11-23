import type { CourseEvent, MissionDefinition } from '../../core/types.js';

/**
 * Quantum Mechanics — course missions.
 *
 * Data only. Every factual claim is backed by a source id in SOURCES.md.
 */

export const QUANTUM_MISSIONS: MissionDefinition[] = [
  {
    id: 'q-m1-cryostat-cooling',
    title: 'Dilution Refrigeration & 15 mK Thermal Shielding',
    objective: 'You explode the dilution refrigerator chandelier to isolate the five cryogenic cooling stages down to 15 millikelvin.',
    outcomes: {
      foundation:
        'You use two-handed pinch-pull to explode the gold shields and observe the 15 mK base temperature required for superconducting transmons.',
      advanced:
        'You trace the Helium-3/Helium-4 phase boundary dilution cycle that continuously absorbs heat below 1 Kelvin.',
      expert:
        'You calculate thermal noise suppression where hbar * omega >> k_B * T at 15 mK for 5 GHz microwave qubits.',
    },
    steps: [
      {
        id: 'q-m1-step-approach',
        caption: 'You step into the center of the cryogenic lab beneath the suspended dilution refrigerator.',
        highlights: ['quantum-anchor-cryostat'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m1-step-explode',
        caption: 'You pinch-pull the cryostat with two hands to separate the thermal gold shields and expose the cold plate.',
        highlights: ['quantum-anchor-cryostat'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'q-m1-step-inspect',
        caption: 'You examine the 15 mK mixing chamber where the QPU chip is anchored.',
        highlights: ['quantum-anchor-cryostat'],
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'The dilution refrigerator hangs from the ceiling in the exact centre of the room.',
      'Reach out with both hands to pinch-pull the cryostat outward (or click it on desktop).',
      'Watch each gold plate separate to see temperatures from 50 K down to 15 mK.',
    ],
    feedback: {
      success: 'Cryostat cooling stages exposed. 15 mK base temperature preserves superconducting qubit coherence.',
      nearMiss: 'Pinch-pull the cryostat further outward to fully separate the cryogenic stages.',
      wrong: 'Approach the central dilution refrigerator at the center of the room to begin.',
    },
    successPredicate: (_events: CourseEvent[]) => true,
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-cryostat',
    panelRefs: ['quantum-anchor-cryostat'],
    sources: ['ARUTE-GOOGLE-2019', 'POBELL-LOW-TEMP-2007'],
    assetIds: ['quantum_dilution_refrigerator'],
    partIds: ['vacuum-flange-300k', 'shield-50k', 'plate-4k', 'plate-still', 'plate-cold', 'mixing-chamber-10mk'],
    seatedVariant: 'Seated learners can reach the central cryostat mixing plate at 1.0 m height for direct interaction.',
    reducedMotionVariant: 'Cryostat cooling stages separate smoothly along vertical guides without rotational recoil.',
  },
  {
    id: 'q-m2-bloch-sphere',
    title: 'Qubit Geometry on the Bloch Sphere',
    objective: 'You inspect the Bloch sphere representation of single-qubit states and identify equal superposition states along the equator.',
    outcomes: {
      foundation:
        'You inspect the Bloch sphere North pole |0> and South pole |1> and locate equal superpositions on the equator.',
      advanced:
        'You track unitary gate transformations as rigid 3D rotations of the state vector (Pauli-X, Pauli-Z, Hadamard).',
      expert:
        'You analyze state purity gamma = Tr(rho^2) shrinking toward the center of the Bloch ball under environmental decoherence.',
    },
    steps: [
      {
        id: 'q-m2-step-locate',
        caption: 'You approach the Bloch sphere pedestal on the left side of the room.',
        highlights: ['bloch-sphere-pedestal'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m2-step-inspect',
        caption: 'You tap the state vector arrow or poles to review state definitions.',
        highlights: ['quantum-anchor-bloch-sphere'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'panelOpened' || e.type === 'explodeChanged'),
      },
      {
        id: 'q-m2-step-superposition',
        caption: 'You verify that equatorial states give equal 50/50 measurement probabilities.',
        highlights: ['quantum-anchor-bloch-sphere'],
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'The Bloch sphere rests on a cylindrical pedestal to the left front of the lab.',
      'Tap on the sphere parts to display level-1 state placards.',
      'The equator represents states like |+> = (|0> + |1>)/sqrt(2).',
    ],
    feedback: {
      success: 'Bloch sphere geometry mastered. Equatorial states possess maximal superposition.',
      nearMiss: 'Inspect the equatorial plane where superposition theta = pi/2.',
      wrong: 'Review the coordinates of pure qubit states on the spherical surface.',
    },
    successPredicate: (_events: CourseEvent[]) => true,
    tolerance: 0.1,
    xp: 150,
    badge: 'q-badge-bloch',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['NIELSEN-CHUANG-2010', 'BLOCH-1946'],
    assetIds: ['bloch_sphere'],
    partIds: ['sphere-mesh', 'state-vector', 'axes-xyz'],
    seatedVariant: 'The Bloch sphere pedestal stands at 0.85 m, directly accessible from a seated position.',
    reducedMotionVariant: 'State vector transformations interpolate over a 1.5-second easing arc.',
  },
  {
    id: 'q-m3-bell-entanglement',
    title: 'Bell State Entanglement & Non-Locality',
    objective: 'You examine the Bell optical bench to observe polarization correlations that violate local realism (S > 2).',
    outcomes: {
      foundation:
        'You inspect the spontaneous parametric down-conversion source producing entangled photon pairs.',
      advanced:
        'You rotate analyzer angles and confirm non-local correlation matching the Bell state (|00> + |11>)/sqrt(2).',
      expert:
        'You verify the CHSH inequality violation where |S| = 2*sqrt(2) ~ 2.828 exceeds the classical bound of 2.',
    },
    steps: [
      {
        id: 'q-m3-step-bench',
        caption: 'You approach the Bell optical bench on the back-left floor area.',
        highlights: ['bell-bench'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m3-step-align',
        caption: 'You inspect the polarizing beam splitters and coincidence detectors.',
        highlights: ['quantum-anchor-entanglement'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m3-step-evaluate',
        caption: 'You confirm Bell inequality violation distinguishing entanglement from classical hidden variables.',
        highlights: ['quantum-anchor-entanglement'],
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'The Bell optical bench sits on the floor to the rear-left of the dilution refrigerator.',
      'Inspect the laser source, non-linear crystal, and dual detection arms.',
      'Review the Bell inequality placard explaining the CHSH parameter S > 2.',
    ],
    feedback: {
      success: 'Bell inequality violation confirmed. Quantum non-locality verified.',
      nearMiss: 'Observe both detectors simultaneously to verify entangled state correlations.',
      wrong: 'Review the distinction between local realism and quantum entanglement.',
    },
    successPredicate: (_events: CourseEvent[]) => true,
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-entanglement',
    panelRefs: ['quantum-anchor-entanglement'],
    sources: ['BELL-1964', 'ASPECT-1982'],
    assetIds: ['bell_bench'],
    partIds: ['optical-rail', 'spdc-source', 'polarizer-a', 'polarizer-b', 'detector-a', 'detector-b'],
    seatedVariant: 'The optical bench table sits at standard 0.85 m working height for seated learners.',
    reducedMotionVariant: 'Photon detection events accumulate as static intensity heatmaps rather than individual flashes.',
  },
  {
    id: 'q-m4-wave-particle-duality',
    title: 'Wave-Particle Duality & Observer Effect',
    objective: 'You examine the double-slit apparatus and observe how measurement collapses the probability wave into particle tracks.',
    outcomes: {
      foundation:
        'You observe the interference fringe pattern created by probability wave propagation through two slits.',
      advanced:
        'You engage the which-way detector and watch the interference pattern collapse into two classical bands.',
      expert:
        'You calculate the de Broglie wavelength lambda = h / p and the fringe spacing Delta y = lambda * D / d.',
    },
    steps: [
      {
        id: 'q-m4-step-bench',
        caption: 'You walk to the double slit bench on the right side of the cryogenic lab.',
        highlights: ['double-slit-bench'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m4-step-observe',
        caption: 'You observe single-particle accumulation forming continuous interference fringes.',
        highlights: ['quantum-anchor-double-slit'],
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m4-step-collapse',
        caption: 'You inspect the observer effect that destroys interference upon path detection.',
        highlights: ['quantum-anchor-double-slit'],
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'The double slit bench is located on the floor to the right of the central cryostat.',
      'Inspect the particle emitter, the double-slit aperture, and the detection screen.',
      'Check the spatial anchor placard explaining de Broglie matter waves.',
    ],
    feedback: {
      success: 'Wave-particle duality demonstrated. Observer measurement collapses the wave pattern.',
      nearMiss: 'Examine both the fringe screen and the aperture slit spacing.',
      wrong: 'Review the relationship between photon momentum and de Broglie wavelength.',
    },
    successPredicate: (_events: CourseEvent[]) => true,
    tolerance: 0.1,
    xp: 150,
    badge: 'q-badge-duality',
    panelRefs: ['quantum-anchor-double-slit'],
    sources: ['FEYNMAN-LECTURES-V3', 'DAVISSON-GERMER-1927'],
    assetIds: ['double_slit_bench'],
    partIds: ['emitter', 'slit-mask', 'detector-screen'],
    seatedVariant: 'The double slit bench is at 0.75 m height with clear sightlines for seated learners.',
    reducedMotionVariant: 'Interference bands form continuously without particle flicker.',
  },
];

export function getMissions(): MissionDefinition[] {
  return QUANTUM_MISSIONS;
}
