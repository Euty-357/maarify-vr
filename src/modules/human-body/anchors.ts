import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'human-body-anchor-heart-valve',
      anchorPosition: new THREE.Vector3(0, 1.3, -1.0),
      label: 'Cardiac Mitral Valve & Pressure Loop',
      level1Note:
        'Heart valves function as passive mechanical check valves, sealing tightly when downstream ventricular pressure exceeds upstream atrial pressure.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Grasp the hydraulic pressure lever; increase ventricular pressure from 10 to 120 mmHg to watch mitral valve leaflets seal tight against backflow.',
          caption: 'One-way valve leaflets prevent backflow into lungs during systolic contraction.',
        },
        advanced: {
          type: 'exploded-view',
          description:
            'Wiggers diagram dynamic viewer: trace left ventricular pressure curves, aortic pressure, and ECG depolarization across one complete cardiac cycle.',
          caption: 'Isovolumetric contraction spikes pressure before aortic valve opens at 80 mmHg.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Frank-Starling pressure-volume (PV) loop visualizer: observe how increasing venous return (preload) stretches myocytes to augment stroke volume.',
          caption: 'Stroke work equals area enclosed by the PV loop: SW = integral(P dV).',
        },
      },
      sourceRefs: ['GUYTON-HALL-PHYSIOLOGY-2020', 'WIGGERS-1915'],
    },
    {
      id: 'human-body-anchor-neural-synapse',
      anchorPosition: new THREE.Vector3(1.1, 1.2, -0.8),
      label: 'Synaptic Transmission & Ion Channels',
      level1Note:
        'Action potentials open voltage-gated calcium channels, triggering neurotransmitter vesicle exocytosis into the synaptic cleft.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Touch the calcium channel handle: watch calcium ions flood the axon terminal and prompt vesicle fusion with the presynaptic membrane.',
          caption: 'Neurotransmitters diffuse across the 20 nm synaptic gap in under 0.5 milliseconds.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Action potential phase scrubber: examine rapid sodium inward flux (-70 to +30 mV) followed by delayed potassium outward repolarization.',
          caption: 'Refractory periods ensure unidirectional action potential propagation down axons.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Hodgkin-Huxley conductance flux cutting plane showing voltage-dependent activation and inactivation gating variables (m, h, n).',
          caption: 'Membrane current I_m = C_m * (dV/dt) + g_Na*m^3*h*(V - E_Na) + g_K*n^4*(V - E_K) + g_L*(V - E_L).',
        },
      },
      sourceRefs: ['KANDEL-PRINCIPLES-NEURAL-2021', 'HODGKIN-HUXLEY-1952'],
    },
    {
      id: 'human-body-anchor-car-t-oncology',
      anchorPosition: new THREE.Vector3(-1.1, 1.3, -0.8),
      label: 'CAR-T Cell Cancer Immunotherapy',
      level1Note:
        'CAR-T cells are engineered living drugs: patient T-lymphocytes armed with synthetic antibody receptors that directly seek and destroy tumor cells.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Guide the synthetic CAR-T receptor to engage CD19 surface markers on a B-cell lymphoma; observe cytotoxic perforin and granzyme pore delivery.',
          caption: 'Engineered T-cells bypass normal MHC restriction to eliminate cancer cells.',
        },
        advanced: {
          type: 'exploded-view',
          description:
            'Exploded CAR receptor architecture: inspect the scFv binding domain, CD8 hinge, CD28 costimulatory domain, and CD3-zeta signaling tail.',
          caption: 'Costimulatory domains (CD28 or 4-1BB) prevent T-cell anergy and drive persistent in vivo expansion.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Tumor microenvironment checkpoint cutting plane: model how anti-PD-1 antibodies prevent PD-L1 from inducing T-cell exhaustion.',
          caption: 'Immune checkpoint blockade reverses immunosuppressive signaling in solid tumors.',
        },
      },
      sourceRefs: ['JUNE-CAR-T-NEJM-2018', 'HANAHAN-WEINBERG-2011'],
    },
    {
      id: 'human-body-anchor-hiv-replication',
      anchorPosition: new THREE.Vector3(0, 1.1, 0.4),
      label: 'HIV Virology, ART & U=U Reality',
      level1Note:
        'Antiretroviral therapy (ART) halts viral replication. When viral load becomes undetectable on treatment, the virus is untransmittable (U=U).',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Two-handed pull explodes the HIV virion into gp120 outer spikes, viral lipid membrane, p24 conical capsid, and interior reverse transcriptase.',
          caption: 'HIV selectively targets CD4+ helper T-lymphocytes, compromising adaptive immunity if untreated.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'ART enzymatic inhibition simulator: deploy Dolutegravir to block the catalytic triad of viral integrase, preventing host genome incorporation.',
          caption: 'Combination therapy with 3 active drugs prevents emergence of drug-resistant viral mutations.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Pumwani Cohort mucosal immunity cutting plane: visualize how mucosal CD8+ cytotoxic T-lymphocytes recognize conserved Gag epitopes presented on MHC-I.',
          caption: 'Studies of highly-exposed seronegative individuals in Nairobi demonstrated protective cell-mediated mucosal immunity.',
        },
      },
      sourceRefs: ['WHO-U-EQUALS-U-2023', 'FOWKE-PLUMMER-PUMWANI-1996'],
    },
  ];
}

