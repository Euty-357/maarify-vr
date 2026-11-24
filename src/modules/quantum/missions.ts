import type { CourseEvent, MissionDefinition } from '../../core/types.js';

/**
 * Quantum Mechanics — Course Storyboard Missions (M0 to M7 + Capstone).
 *
 * All factual claims cited in SOURCES.md.
 * Levers removed; uses two-handed pinch-pull explode, gate token docking,
 * Bloch state vector rotations, and real measurements.
 */

export const QUANTUM_MISSIONS: MissionDefinition[] = [
  {
    id: 'q-m0-orientation',
    title: 'M0: Cryogenic Lab Orientation & Controls',
    objective: 'You explore the cryogenic quantum lab, inspect the state manual, and locate the key apparatus.',
    outcomes: {
      foundation:
        'You step into the cryogenic lab, open the information placard on the Bloch sphere, and inspect the central dilution refrigerator.',
      advanced:
        'You identify the six hardware stations and verify the 10 mK cryogenic operating baseline for superconducting qubits.',
      expert:
        'You evaluate the thermal noise constraint hbar * omega >> k_B * T governing 5 GHz transmon microwave isolation.',
    },
    steps: [
      {
        id: 'q-m0-step-enter',
        caption: 'You step into the center of the cryogenic quantum computing laboratory.',
        highlights: ['quantum-table--2--1.8'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
      {
        id: 'q-m0-step-open-manual',
        caption: 'You tap the spatial anchor placard on the Bloch sphere table to open the state manual.',
        highlights: ['quantum-anchor-bloch-sphere'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'panelOpened'),
      },
      {
        id: 'q-m0-step-close-manual',
        caption: 'You close the info panel to prepare for hardware manipulation.',
        highlights: ['quantum-anchor-bloch-sphere'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'panelClosed' || e.type === 'grabbed'),
      },
    ],
    hints: [
      'Walk towards the front-left lab bench to find the Bloch sphere.',
      'Tap on the brass spatial placard beside the sphere to review depth tiers.',
      'Tap the close button on the panel to complete your orientation.',
    ],
    feedback: {
      success: 'Orientation complete. The quantum laboratory systems are accessible.',
      nearMiss: 'Open and inspect the information placard on the Bloch sphere table.',
      wrong: 'Approach the front-left lab table and tap the placard to view the guide.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'panelOpened'),
    tolerance: 0.1,
    xp: 100,
    badge: 'q-badge-orientation',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['NIELSEN-CHUANG-2010'],
    assetIds: ['bloch_sphere'],
    partIds: ['sphere-mesh'],
    seatedVariant: 'All tables and placards are positioned at 0.78 m height for direct seated interaction.',
    reducedMotionVariant: 'Panel animations use smooth opacity fades without camera shifts.',
  },
  {
    id: 'q-m1-bit-vs-qubit',
    title: 'M1: A Bit Versus a Qubit & Superposition',
    objective: 'You rotate the Bloch sphere state vector to synthesize a 70/30 superposition state and measure its outcome probabilities.',
    outcomes: {
      foundation:
        'You rotate the state vector arrow away from pole |0> to synthesize a 70% probability state along polar angle theta ~ 66.4 degrees.',
      advanced:
        'You track state vector coordinates |psi> = cos(theta/2)|0> + e^(i*phi)*sin(theta/2)|1> with live probability gauges.',
      expert:
        'You verify the measurement projection postulate where repeated measurements collapse the state onto computational eigenstates.',
    },
    steps: [
      {
        id: 'q-m1-step-rotate',
        caption: 'You grasp the Bloch state vector arrow and rotate it away from the North pole |0>.',
        highlights: ['bloch_sphere'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'rotated' || e.type === 'grabbed'),
      },
      {
        id: 'q-m1-step-tune-superposition',
        caption: 'You tune the state vector to theta = 66.4 deg (70% P0 probability).',
        highlights: ['bloch_sphere'],
        completed: (events: CourseEvent[]) =>
          events.some((e) => e.type === 'rotated' && Math.abs((e.value ?? 0) - 66.4) <= 12.0) ||
          events.some((e) => e.type === 'sliderChanged'),
      },
      {
        id: 'q-m1-step-measure',
        caption: 'You press the MEASURE button on the pedestal to observe projective collapse.',
        highlights: ['bloch-measure-button'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
      },
    ],
    hints: [
      'Reach out with your hand to grab the glowing state vector arrow on the Bloch sphere.',
      'Tilt the arrow downward approximately 66 degrees toward the equator.',
      'Tap the green MEASURE button on the pedestal to trigger projective measurement.',
    ],
    feedback: {
      success: 'Superposition synthesized and measured. Quantum state probabilities verified.',
      nearMiss: 'Adjust the state vector angle closer to 66.4 degrees before measuring.',
      wrong: 'Grasp the state vector arrow on the Bloch sphere to adjust superposition.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
    tolerance: 0.15,
    xp: 150,
    badge: 'q-badge-superposition',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['BLOCH-1946', 'NIELSEN-CHUANG-2010'],
    assetIds: ['bloch_sphere'],
    partIds: ['state-vector', 'axes-xyz'],
    seatedVariant: 'The Bloch sphere sits at standard 0.78 m lab bench height within seated arm reach.',
    reducedMotionVariant: 'State vector movement has rotational damping and snapping detents.',
  },
  {
    id: 'q-m2-gates-as-rotations',
    title: 'M2: Quantum Gates as Unitary Rotations',
    objective: 'You insert physical logic tokens into the circuit slot to transform qubit states through unitary rotations.',
    outcomes: {
      foundation:
        'You slot the Hadamard (H) gate token into the circuit rail to transform basis state |0> into equal superposition |+>.',
      advanced:
        'You apply Pauli-X (pi rotation around X-axis) and Pauli-Z phase flip gates to track trajectory paths across the Bloch ball.',
      expert:
        'You formulate single-qubit SU(2) group generators exp(-i * theta * sigma / 2) and verify sequence HH = I.',
    },
    steps: [
      {
        id: 'q-m2-step-pick-gate',
        caption: 'You pick up a Hadamard (H) gate token from the circuit kit bench.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'grabbed'),
      },
      {
        id: 'q-m2-step-dock-gate',
        caption: 'You slot the H gate token into the circuit waveguide slot.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'q-m2-step-verify-rotation',
        caption: 'You observe the state vector rotate 90 degrees onto the equatorial |+> axis.',
        highlights: ['bloch_sphere'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'The quantum circuit kit sits on the front-right lab table.',
      'Grab the golden H token and move it towards the illuminated slot.',
      'Watch the Bloch sphere state vector rotate in response to the unitary operator.',
    ],
    feedback: {
      success: 'Unitary gate rotation applied. Basis state transformed into equal superposition.',
      nearMiss: 'Slot the Hadamard token into the open rail slot.',
      wrong: 'Pick up a gate token from the circuit tray to begin.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-gates',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['NIELSEN-CHUANG-2010'],
    assetIds: ['qc_circuit_kit', 'bloch_sphere'],
    partIds: ['gate-hadamard', 'circuit-rail'],
    seatedVariant: 'The circuit rail and gate token rack are positioned at table level 0.78 m.',
    reducedMotionVariant: 'Gate rotations interpolate smoothly without abrupt angular jumps.',
  },
  {
    id: 'q-m3-measurement-statistics',
    title: 'M3: Measurement Statistics & Wavefunction Collapse',
    objective: 'You execute repeated shots to accumulate measurement statistics and observe the born rule histogram.',
    outcomes: {
      foundation:
        'You execute multiple measurement shots and watch individual collapses accumulate into statistical distributions.',
      advanced:
        'You observe the Born rule probability distribution P(m) = |<m|psi>|^2 with Poissonian statistical shot variance.',
      expert:
        'You analyze non-demolition quantum measurement (QND) and state projection into orthogonal eigenspaces.',
    },
    steps: [
      {
        id: 'q-m3-step-shots',
        caption: 'You trigger multiple measurement shots on the superposition state.',
        highlights: ['bloch-measure-button'],
        completed: (events: CourseEvent[]) => events.filter((e) => e.type === 'measured').length >= 1,
      },
      {
        id: 'q-m3-step-observe-collapse',
        caption: 'You look at the double-slit observer detector to witness continuous wave collapse.',
        highlights: ['double_slit_bench'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'gazeHeld' || e.type === 'measured'),
      },
      {
        id: 'q-m3-step-confirm-stats',
        caption: 'You verify that repeated projective measurements yield reproducible post-measurement states.',
        highlights: ['double_slit_bench'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'Press the MEASURE button on the Bloch sphere pedestal.',
      'Walk to the right optical table to inspect the double-slit apparatus.',
      'Hold your gaze at the slit detector for 1.5 seconds to witness path measurement collapse.',
    ],
    feedback: {
      success: 'Measurement statistics verified. Wavefunction collapse confirmed by detector observations.',
      nearMiss: 'Take additional measurement shots or observe the slit detector.',
      wrong: 'Execute measurement shots on the Bloch pedestal to build the histogram.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'measured' || e.type === 'gazeHeld'),
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-measurement',
    panelRefs: ['quantum-anchor-double-slit'],
    sources: ['FEYNMAN-LECTURES-V3', 'DAVISSON-GERMER-1927'],
    assetIds: ['double_slit_bench', 'bloch_sphere'],
    partIds: ['emitter', 'slit-mask', 'detector-screen'],
    seatedVariant: 'The double-slit bench sits at 0.78 m optical table height accessible seated.',
    reducedMotionVariant: 'Histogram bars update with smooth height easing.',
  },
  {
    id: 'q-m4-bell-entanglement',
    title: 'M4: Bell State Entanglement & Non-Locality',
    objective: 'You align polarizing filters on the Bell optical bench to observe polarization correlations violating classical bounds.',
    outcomes: {
      foundation:
        'You inspect the spontaneous parametric down-conversion crystal producing polarization-entangled photon pairs.',
      advanced:
        'You rotate analyzer angles and confirm correlated outcomes matching Bell state (|00> + |11>)/sqrt(2).',
      expert:
        'You verify the CHSH inequality violation where |S| = 2*sqrt(2) ~ 2.828 strictly exceeds the local-realist bound of 2.',
    },
    steps: [
      {
        id: 'q-m4-step-approach-bench',
        caption: 'You approach the Bell optical bench on the rear-left optical table.',
        highlights: ['bell_bench'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'enteredZone' || e.type === 'grabbed'),
      },
      {
        id: 'q-m4-step-align-polarizer',
        caption: 'You rotate the polarizer analyzer angle on detector arm A.',
        highlights: ['bell_bench'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'rotated' || e.type === 'placed'),
      },
      {
        id: 'q-m4-step-record-correlation',
        caption: 'You observe coincidence counts confirming quantum entanglement without FTL communication.',
        highlights: ['quantum-anchor-entanglement'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'Walk to the rear-left optical table where the Bell bench laser shines.',
      'Grab and twist the polarizer dial on the optical rail.',
      'Review the Bell inequality placard demonstrating violation of local realism.',
    ],
    feedback: {
      success: 'Bell inequality violation confirmed. Quantum entanglement verified.',
      nearMiss: 'Adjust the polarizer rotation angle on the optical rail.',
      wrong: 'Approach the rear-left Bell optical bench to inspect entangled photon pairs.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'rotated' || e.type === 'placed'),
    tolerance: 0.1,
    xp: 250,
    badge: 'q-badge-entanglement',
    panelRefs: ['quantum-anchor-entanglement'],
    sources: ['BELL-1964', 'ASPECT-1982', 'NOBEL-PHYSICS-2022'],
    assetIds: ['bell_bench'],
    partIds: ['optical-rail', 'spdc-source', 'polarizer-a', 'polarizer-b'],
    seatedVariant: 'The optical table sits at 0.78 m with clear sightlines for seated learners.',
    reducedMotionVariant: 'Photon coincidence heatmaps accumulate continuously without strobing.',
  },
  {
    id: 'q-m5-quantum-algorithms',
    title: 'M5: Algorithms — Grover Search & Shor Factoring',
    objective: 'You assemble oracle and diffusion operations on the quantum circuit board to demonstrate amplitude amplification.',
    outcomes: {
      foundation:
        'You execute a single-iteration Grover search on 4 elements to find the marked state with 100% probability.',
      advanced:
        'You trace phase inversion by the oracle followed by reflection about the mean by the diffusion operator.',
      expert:
        'You calculate Grover complexity O(sqrt(N)) and evaluate Shor period-finding requirements for RSA-2048.',
    },
    steps: [
      {
        id: 'q-m5-step-slot-oracle',
        caption: 'You slot the oracle phase-inversion gate into the Grover circuit line.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'q-m5-step-slot-diffusion',
        caption: 'You attach the diffusion reflection operator to amplify the marked state amplitude.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'q-m5-step-readout-algorithm',
        caption: 'You measure the register to obtain the marked item with probability 1.0.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
      },
    ],
    hints: [
      'Approach the circuit bench on the front-right table.',
      'Slot the oracle token into the first slot on the circuit rail.',
      'Press MEASURE to verify amplitude amplification of the marked state.',
    ],
    feedback: {
      success: 'Grover amplitude amplification executed. Marked item identified in single query.',
      nearMiss: 'Complete the gate sequence and take a measurement on the register.',
      wrong: 'Insert the oracle and diffusion gate tokens into the circuit board.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
    tolerance: 0.1,
    xp: 250,
    badge: 'q-badge-algorithms',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['NIELSEN-CHUANG-2010'],
    assetIds: ['qc_circuit_kit'],
    partIds: ['circuit-board', 'gate-hadamard', 'gate-cnot'],
    seatedVariant: 'The circuit board sits at 0.78 m table height within comfortable arm reach.',
    reducedMotionVariant: 'Amplitude bars animate with smooth linear transitions.',
  },
  {
    id: 'q-m6-cryostat-dilution-cooling',
    title: 'M6: Inside the Machine — Dilution Refrigeration & 10 mK',
    objective: 'You explode the dilution refrigerator chandelier and inspect thermal attenuation stages down to 10 millikelvin.',
    outcomes: {
      foundation:
        'You use two-handed pinch-pull to explode the gold thermal shields and expose the 10 mK mixing chamber plate.',
      advanced:
        'You trace the Helium-3/Helium-4 phase boundary dilution cycle and coaxial microwave attenuation chain.',
      expert:
        'You calculate thermal occupation number n_th = 1/(exp(hf/k_B*T)-1) < 10^-5 at 10 mK for 5 GHz microwave qubits.',
    },
    steps: [
      {
        id: 'q-m6-step-approach-cryostat',
        caption: 'You step beneath the suspended dilution refrigerator at the center of the room.',
        highlights: ['quantum_dilution_refrigerator'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'enteredZone' || e.type === 'grabbed'),
      },
      {
        id: 'q-m6-step-explode-stages',
        caption: 'You pinch-pull the cryostat outward with two hands to separate the concentric thermal shields.',
        highlights: ['quantum_dilution_refrigerator'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'explodeChanged'),
      },
      {
        id: 'q-m6-step-inspect-mixing-chamber',
        caption: 'You inspect the mixing chamber plate where the transmon QPU chip is anchored at 10 mK.',
        highlights: ['quantum-anchor-cryostat'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'Stand directly beneath the central gold dilution refrigerator.',
      'Reach out with both hands and pinch-pull outward (or click the brass plaque button).',
      'Examine the mixing chamber plate at the bottom of the exposed chandelier.',
    ],
    feedback: {
      success: 'Cryostat cooling stages exposed. Base temperature 10 mK preserves qubit coherence.',
      nearMiss: 'Pinch-pull the cryostat outward to fully separate the cryogenic shielding stages.',
      wrong: 'Approach the central dilution refrigerator and activate its exploded view.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'explodeChanged'),
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-cryostat',
    panelRefs: ['quantum-anchor-cryostat'],
    sources: ['ARUTE-GOOGLE-2019', 'POBELL-LOW-TEMP-2007'],
    assetIds: ['quantum_dilution_refrigerator', 'qpu_chip_transmon'],
    partIds: ['vacuum-flange-300k', 'shield-50k', 'plate-4k', 'mixing-chamber-10mk'],
    seatedVariant: 'The cryostat base hangs at 1.0 m height, directly accessible to seated learners.',
    reducedMotionVariant: 'Cryostat stages separate vertically along guide rods without lateral swing.',
  },
  {
    id: 'q-m7-hardware-gallery',
    title: 'M7: Hardware Gallery — 7 Qubit Modalities & NISQ Reality',
    objective: 'You explore the hardware gallery to compare superconducting, trapped ion, photonic, neutral atom, and spin platforms.',
    outcomes: {
      foundation:
        'You inspect the physical hardware models and understand that quantum processors require specialized physical shielding.',
      advanced:
        'You compare trapped-ion vacuum traps, photonic beam splitters, and superconducting transmons on coherence and scaling.',
      expert:
        'You evaluate fault-tolerant surface code threshold requirements (physical error rate p < 1%) across physical architectures.',
    },
    steps: [
      {
        id: 'q-m7-step-approach-gallery',
        caption: 'You walk to the hardware display table along the back wall.',
        highlights: ['qc_architectures_gallery'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'enteredZone' || e.type === 'panelOpened'),
      },
      {
        id: 'q-m7-step-inspect-modalities',
        caption: 'You inspect the trapped ion and transmon chip hardware models.',
        highlights: ['qc_architectures_gallery'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'grabbed' || e.type === 'panelOpened'),
      },
      {
        id: 'q-m7-step-evaluate-limits',
        caption: 'You review the NISQ limits placard outlining decoherence and error mitigation challenges.',
        highlights: ['quantum-anchor-gallery'],
        narrative: true,
        completed: (_events: CourseEvent[]) => true,
      },
    ],
    hints: [
      'Walk to the rear display table to view the physical quantum hardware platforms.',
      'Inspect the trapped-ion Paul trap and superconducting transmon models.',
      'Check the hardware comparison placard detailing operating temperatures and fidelity.',
    ],
    feedback: {
      success: 'Hardware modalities mastered. NISQ constraints and platform trade-offs evaluated.',
      nearMiss: 'Examine both the hardware models and the architecture comparison placards.',
      wrong: 'Approach the back display table to inspect the 7 quantum hardware modalities.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'grabbed' || e.type === 'panelOpened'),
    tolerance: 0.1,
    xp: 200,
    badge: 'q-badge-gallery',
    panelRefs: ['quantum-anchor-gallery'],
    sources: ['CIRAC-ZOLLER-1995', 'HONG-OU-MANDEL-1987', 'ARUTE-GOOGLE-2019'],
    assetIds: ['qc_architectures_gallery', 'qpu_chip_transmon', 'josephson_junction'],
    partIds: ['gallery-display', 'qpu-carrier'],
    seatedVariant: 'The hardware gallery table sits at 0.78 m height directly accessible seated.',
    reducedMotionVariant: 'Gallery exhibit placards remain stationary with clear contrast.',
  },
  {
    id: 'q-capstone-deutsch-jozsa',
    title: 'Capstone: Deutsch-Jozsa Quantum Circuit Synthesis',
    objective: 'You assemble an end-to-end quantum circuit on the transmon processor and evaluate the oracle in a single step.',
    outcomes: {
      foundation:
        'You assemble Hadamard and CNOT gates to determine whether an oracle function is constant or balanced in one evaluation.',
      advanced:
        'You demonstrate quantum parallelism and constructive/destructive interference solving Deutsch-Jozsa exponentially faster.',
      expert:
        'You contrast classical query complexity O(2^(n-1)+1) with exact quantum query complexity O(1).',
    },
    steps: [
      {
        id: 'q-capstone-step-place-h1',
        caption: 'You slot the input Hadamard gate into qubit line 0.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'q-capstone-step-place-oracle',
        caption: 'You slot the oracle evaluation gate across both qubit lines.',
        highlights: ['qc_circuit_kit'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'docked' || e.type === 'placed'),
      },
      {
        id: 'q-capstone-step-measure-result',
        caption: 'You execute the measurement readout to verify oracle classification.',
        highlights: ['bloch-measure-button'],
        completed: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
      },
    ],
    hints: [
      'Work on the quantum circuit kit table to wire the Deutsch-Jozsa circuit.',
      'Place the Hadamard gate on the input rail to prepare superposition.',
      'Press MEASURE to observe interference that determines the oracle function.',
    ],
    feedback: {
      success: 'Capstone completed. Deutsch-Jozsa oracle evaluated in a single quantum query.',
      nearMiss: 'Slot both the preparation and oracle gates, then trigger measurement readout.',
      wrong: 'Assemble the quantum gates on the circuit board to evaluate the oracle.',
    },
    successPredicate: (events: CourseEvent[]) => events.some((e) => e.type === 'measured'),
    tolerance: 0.1,
    xp: 350,
    badge: 'q-badge-architect',
    panelRefs: ['quantum-anchor-bloch-sphere'],
    sources: ['NIELSEN-CHUANG-2010', 'AIMS-QLA-RWANDA'],
    assetIds: ['qc_circuit_kit', 'bloch_sphere'],
    partIds: ['circuit-board', 'gate-hadamard', 'gate-cnot'],
    seatedVariant: 'All capstone circuit components and measurement buttons are within 0.8 m seated reach.',
    reducedMotionVariant: 'Circuit verification displays static summary plots upon evaluation.',
  },
];

export function getMissions(): MissionDefinition[] {
  return QUANTUM_MISSIONS;
}
