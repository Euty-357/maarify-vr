/**
 * Dr. Amani — 7-Beat Spatial Audio Narrative for Quantum Mechanics.
 * Bridges counter-intuitive micro-physics with real hardware architectures and African STEM initiatives.
 */

export interface QuantumNarrativeBeat {
  beatNumber: number;
  timeRange: string;
  title: string;
  guidanceText: string;
  stemContext: string;
}

export const DR_AMANI_QUANTUM_BEATS: QuantumNarrativeBeat[] = [
  {
    beatNumber: 1,
    timeRange: '0:00–2:00',
    title: 'Opening Hook: The Superposition Void',
    guidanceText:
      'Welcome to the quantum realm. Before you floats a single qubit in pure superposition. In classical computing, a bit is rigidly 0 or 1. Here, a quantum state exists as a continuous blend of possibilities until measured.',
    stemContext:
      'Quantum superposition enables simultaneous linear combination amplitudes, governed by complex Hilbert space vectors.',
  },
  {
    beatNumber: 2,
    timeRange: '2:00–5:00',
    title: 'The Bloch Sphere & Direct Vector Manipulation',
    guidanceText:
      'Grasp the state vector arrow directly with your hand. Rotate the polar angle theta to change the probability of measuring 0 versus 1. Rotate the azimuthal phase phi around the equator to adjust quantum relative phase.',
    stemContext:
      'Bloch sphere representation: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. Continuous geometric rotations map directly to unitary single-qubit gates.',
  },
  {
    beatNumber: 3,
    timeRange: '5:00–8:00',
    title: 'Physical Challenge: Superposition Tuning',
    guidanceText:
      'Prepare an equal superposition state (|0⟩ + |1⟩)/sqrt(2). Rotate the vector directly onto the equator at 90 degrees polar angle and hold steady to lock in the Hadamard transformation.',
    stemContext:
      'Hadamard gate transforms computational basis states into maximal superposition with equal 50% measurement probabilities.',
  },
  {
    beatNumber: 4,
    timeRange: '8:00–12:00',
    title: 'The 7 Physical Hardware Architectures',
    guidanceText:
      'Step forward into the hardware gallery. Quantum computation is realized across seven competing physical modalities: from superconducting circuits in millikelvin cryostats to individual laser-trapped ions and room-temperature photons.',
    stemContext:
      'Diverse physical platforms trade off gate speeds (fast superconducting transmons) against gate fidelity (long-lived trapped ions).',
  },
  {
    beatNumber: 5,
    timeRange: '12:00–16:00',
    title: 'Entanglement & Bell State Splitting',
    guidanceText:
      'Generate an entangled Bell pair. Grab one photon in each hand and pull your arms apart. When you rotate the polarization filter on the left, observe how the state on the right responds with instant non-local correlation.',
    stemContext:
      'Aspect (1982) and 2022 Nobel Prize verified violation of Bell inequalities, disproving local hidden variable theories.',
  },
  {
    beatNumber: 6,
    timeRange: '16:00–18:00',
    title: 'NISQ Limits & Decoherence',
    guidanceText:
      'Observe the fragile nature of quantum information. As ambient thermal noise strikes the qubit, its pure state vector decays into classical noise. This is decoherence—the central challenge of today\'s NISQ era.',
    stemContext:
      'Quantum error correction (surface codes) requires physical-to-logical qubit overhead (~1,000 physical qubits per logical fault-tolerant qubit).',
  },
  {
    beatNumber: 7,
    timeRange: '18:00–20:00',
    title: 'Capstone Circuit & African Quantum Frontiers',
    guidanceText:
      'Assemble the Deutsch-Jozsa quantum circuit to evaluate a balanced oracle in a single computation. You have earned the Quantum Architect badge. African researchers at Quantum Leap Africa in Kigali are pioneering quantum algorithms for continental logistics and health.',
    stemContext:
      'Quantum Leap Africa (QLA) at AIMS Rwanda conducts research in quantum information, cryptography, and machine learning.',
  },
];

