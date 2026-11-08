import * as THREE from 'three';

export interface QuantumHardwareModel {
  id: string;
  name: string;
  qubitType: string;
  operatingTempKelvin: number;
  leadingOrganizations: string[];
  keyStrengths: string;
  primaryLimitation: string;
  visualColor: number;
}

export const QUANTUM_ARCHITECTURES: QuantumHardwareModel[] = [
  {
    id: 'superconducting-transmon',
    name: 'Superconducting Transmon',
    qubitType: 'Cooper-pair island / Josephson junction',
    operatingTempKelvin: 0.015, // 15 mK
    leadingOrganizations: ['Google Quantum AI', 'IBM Quantum', 'Rigetti'],
    keyStrengths: 'Fast gate speeds (~10-50 ns), lithographic fabrication scalability.',
    primaryLimitation: 'Millikelvin cryogenics required; cross-talk and transmon frequency collisions.',
    visualColor: 0xf59e0b, // Gold (dilution cryostat)
  },
  {
    id: 'trapped-ion',
    name: 'Trapped-Ion',
    qubitType: 'Hyperfine states of ionized atoms (171Yb+, 40Ca+)',
    operatingTempKelvin: 300, // Room temp ultra-high vacuum chamber (or 4K cryogenic)
    leadingOrganizations: ['IonQ', 'Quantinuum'],
    keyStrengths: 'Highest gate fidelities (>99.9%), identical natural qubits, long coherence times.',
    primaryLimitation: 'Slower gate operations (~10-100 μs); scaling laser addressing across hundreds of ions.',
    visualColor: 0x38bdf8, // Cyan (laser cooling)
  },
  {
    id: 'photonic',
    name: 'Linear Optical / Photonic',
    qubitType: 'Single photons (polarization, path, or squeezed states)',
    operatingTempKelvin: 300, // Room-temperature qubits (superconducting nanowire detectors at 4K)
    leadingOrganizations: ['PsiQuantum', 'Xanadu'],
    keyStrengths: 'Room-temperature optical waveguides, low decoherence in ambient air/fiber.',
    primaryLimitation: 'Non-deterministic two-qubit entangling gates; high optical insertion loss.',
    visualColor: 0xec4899, // Magenta (laser light)
  },
  {
    id: 'neutral-atom',
    name: 'Neutral Atom Optical Tweezers',
    qubitType: 'Alkali/alkaline-earth atoms in optical dipole traps (87Rb, 171Yb)',
    operatingTempKelvin: 0.00001, // Microkelvin laser-cooled in room-temp UHV
    leadingOrganizations: ['QuEra Computing', 'Harvard/MIT', 'Pasqal'],
    keyStrengths: 'Dynamically reconfigurable 2D/3D geometry via spatial light modulators; strong Rydberg interactions.',
    primaryLimitation: 'Finite optical trap lifetime; atom loss during shuttling.',
    visualColor: 0x10b981, // Emerald (laser trap)
  },
  {
    id: 'silicon-spin',
    name: 'Silicon Spin Qubits',
    qubitType: 'Electron / nuclear spin in silicon quantum dots (Si/SiGe or MOS)',
    operatingTempKelvin: 1.0, // "Hot" qubits (~1 K)
    leadingOrganizations: ['Intel', 'UNSW Sydney', 'Silicon Quantum Computing'],
    keyStrengths: 'Compatibility with mature semiconductor CMOS manufacturing foundries; high density.',
    primaryLimitation: 'Sensitivity to material interface defects and nuclear spin bath in natural silicon.',
    visualColor: 0x6366f1, // Indigo (silicon wafer)
  },
  {
    id: 'topological',
    name: 'Topological Nanowires',
    qubitType: 'Non-Abelian Majorana zero-mode fermion braiding',
    operatingTempKelvin: 0.02, // 20 mK
    leadingOrganizations: ['Microsoft Quantum'],
    keyStrengths: 'Built-in hardware topological protection against local phase and bit-flip errors.',
    primaryLimitation: 'Extremely challenging materials physics; unambiguous braiding demonstration in development.',
    visualColor: 0x8b5cf6, // Violet
  },
  {
    id: 'quantum-annealer',
    name: 'Superconducting Flux Annealer',
    qubitType: 'Superconducting flux qubits (Ising spin-glass model)',
    operatingTempKelvin: 0.015,
    leadingOrganizations: ['D-Wave Systems'],
    keyStrengths: 'Thousands of coupled qubits for combinatorial optimization and quantum simulation.',
    primaryLimitation: 'Not universal gate-based computation; limited to quantum adiabatic algorithms.',
    visualColor: 0x64748b, // Slate
  },
];

/**
 * Creates a physical 3D pedestal for a quantum hardware architecture.
 */
export function createHardwarePedestal(hw: QuantumHardwareModel): THREE.Group {
  const group = new THREE.Group();
  group.name = `pedestal-${hw.id}`;

  // Base plinth
  const baseGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.8, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.4;
  group.add(base);

  // Glowing status rim
  const rimGeo = new THREE.TorusGeometry(0.26, 0.015, 12, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshBasicMaterial({ color: hw.visualColor });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.81;
  group.add(rim);

  // Floating hardware iconic mesh on top
  const model = createIconicHardwareMesh(hw.id, hw.visualColor);
  model.position.set(0, 1.05, 0);
  group.add(model);

  return group;
}

function createIconicHardwareMesh(id: string, color: number): THREE.Object3D {
  switch (id) {
    case 'superconducting-transmon': {
      // Golden cryostat chandelier stages
      const cryo = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12 - i * 0.02, 0.12 - i * 0.02, 0.01, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
        );
        plate.position.y = (3 - i) * 0.06 - 0.1;
        cryo.add(plate);
      }
      return cryo;
    }
    case 'trapped-ion': {
      // Linear ion chain (4 glowing points inside blade electrodes)
      const trap = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const ion = new THREE.Mesh(
          new THREE.SphereGeometry(0.015, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        ion.position.set((i - 1.5) * 0.04, 0, 0);
        trap.add(ion);
      }
      return trap;
    }
    case 'photonic': {
      // Optical beam splitter cube
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xec4899, transparent: true, opacity: 0.7, roughness: 0.1 })
      );
      return cube;
    }
    default: {
      // Generic quantum core sphere
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 })
      );
      return sphere;
    }
  }
}

