import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'quantum-anchor-bloch-sphere',
      anchorPosition: new THREE.Vector3(0, 1.3, -1.0),
      label: 'The Bloch Sphere (Qubit Geometry)',
      level1Note:
        'A geometric representation of pure qubit states. North pole is |0>, south pole is |1>, and points along the equator represent equal superpositions.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Grasp and rotate the state vector arrow; live probability gauges display measurement likelihoods P(0) = cos^2(theta/2) and P(1) = sin^2(theta/2).',
          caption: 'Measurement collapses the continuous vector onto either |0> or |1> with probability defined by angle theta.',
        },
        advanced: {
          type: 'exploded-view',
          description:
            'Interactive unitary gate demonstration: execute Pauli-X (180 deg around X), Pauli-Z (phase flip around Z), and Hadamard transformations in 3D.',
          caption: 'All single-qubit quantum gates correspond to rigid rotations of the Bloch sphere.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Mixed state density matrix visualizer: observe the state vector shrink into the interior of the Bloch ball (radius r < 1) during decoherence.',
          caption: 'Purity gamma = Tr(rho^2) decreases from 1 (pure surface state) to 0.5 (maximally mixed center).',
        },
      },
      sourceRefs: ['NIELSEN-CHUANG-2010', 'BLOCH-1946'],
    },
    {
      id: 'quantum-anchor-double-slit',
      anchorPosition: new THREE.Vector3(1.0, 1.2, -1.2),
      label: 'Wave-Particle Duality & Observer Effect',
      level1Note:
        'Particles pass through both slits as a probability wave creating an interference fringe pattern, until measurement forces a single definite path.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Scrub between wave and particle views: see individual particle impacts accumulate statistically over time to form continuous interference bands.',
          caption: 'Electrons and photons display wave interference even when fired one at a time.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'De Broglie wavelength slider: adjust particle momentum p to observe how lambda = h / p alters slit fringe separation Delta y = lambda * D / d.',
          caption: 'Higher momentum shortens wavelength, eventually reproducing classical ray trajectories.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Feynman path-integral flux plane: visualize phase arrows for all possible paths; non-classical paths cancel via destructive interference.',
          caption: 'Total quantum amplitude psi = sum over all paths of exp(i * S[x(t)] / hbar).',
        },
      },
      sourceRefs: ['FEYNMAN-LECTURES-V3', 'DAVISSON-GERMER-1927'],
    },
    {
      id: 'quantum-anchor-cryostat',
      anchorPosition: new THREE.Vector3(-1.0, 1.4, -1.2),
      label: 'Dilution Refrigerator (15 mK)',
      level1Note:
        'Cooling transmon circuits to 15 millikelvin (-273.13°C) prevents thermal energy (k_B * T) from exciting qubits out of their ground state.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Two-handed vertical pull explodes the gold chandelier into its 5 temperature stages: 50K vacuum shield, 4K pulse tube, 800mK, 100mK, and 15mK mixing plate.',
          caption: 'Concentric thermal gold shields block ambient blackbody infrared radiation.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Helium dilution cycle flow simulator: trace the continuous circulation of Helium-3 dissolving across the phase boundary into dilute Helium-4.',
          caption: 'Endothermic phase boundary crossing absorbs heat continuously even at sub-kelvin temperatures.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Thermal Johnson-Nyquist noise spectrum cutting plane showing high-frequency microwave attenuation lines and circulators.',
          caption: 'At 15 mK, thermal excitation hbar * omega >> k_B * T for 5 GHz qubits, suppressing spurious transitions.',
        },
      },
      sourceRefs: ['ARUTE-GOOGLE-2019', 'POBELL-LOW-TEMP-2007'],
    },
    {
      id: 'quantum-anchor-entanglement',
      anchorPosition: new THREE.Vector3(0, 1.1, 0.5),
      label: 'Bell State Entanglement',
      level1Note:
        'Two entangled photons share a single composite wavefunction (|00> + |11>)/sqrt(2). Measuring one instantly defines the other across space.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Rotate one polarization analyzer; observe the remote entangled twin flash instantaneously with correlated matching or anti-correlated polarization.',
          caption: 'Einstein called this "spooky action at a distance"; Bell proved no local classical model can explain it.',
        },
        advanced: {
          type: 'exploded-view',
          description:
            'Clauser-Horne-Shimony-Holt (CHSH) inequality tester: compare classical correlation limit (|S| <= 2) against quantum prediction (|S| = 2*sqrt(2)).',
          caption: 'Quantum mechanics violates classical local realism up to Tsirelson\'s bound S = 2*sqrt(2) ≈ 2.828.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'No-communication theorem proof plane: demonstrating that reduced density matrix rho_B is invariant under local operations on subsystem A.',
          caption: 'Entanglement cannot transmit classical signals faster than light because local measurements yield random outcomes.',
        },
      },
      sourceRefs: ['BELL-1964', 'ASPECT-1982', 'NOBEL-PHYSICS-2022'],
    },
  ];
}

