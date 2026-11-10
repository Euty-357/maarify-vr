import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'dna-anchor-helix',
      anchorPosition: new THREE.Vector3(0.55, 1.55, -3.0),
      label: 'DNA Double Helix',
      level1Note: 'DNA is a twisted ladder. Its paired letters carry inherited instructions.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Pull the two backbones apart and watch the paired rungs separate.',
          caption: 'Each strand can guide a matching copy.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Scrub the fork open and follow helicase unwinding and polymerase copying.',
          caption: 'Leading and lagging strands are copied differently.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Slice antiparallel strands and compare base pairing with base stacking.',
          caption: 'Duplex stability depends on sequence and conditions.',
        },
      },
      sourceRefs: ['NHGRI-DNA-2026'],
    },
    {
      id: 'dna-anchor-bases',
      anchorPosition: new THREE.Vector3(-1.45, 1.45, -1.15),
      label: 'Complementary Bases',
      level1Note: 'A pairs with T. C pairs with G. Each strand helps copy the other.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Snap matching base pieces into the exposed template positions.',
          caption: 'Matching pairs make DNA copying possible.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Follow a template through replication and compare a substitution with a frameshift.',
          caption: 'A mutation can change a protein instruction.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Inspect hydrogen bonding and stacking as a simplified stability model.',
          caption: 'Simplified model — not engineering grade.',
        },
      },
      sourceRefs: ['NHGRI-BASE-PAIR-2026'],
    },
    {
      id: 'dna-anchor-ribosome',
      anchorPosition: new THREE.Vector3(1.85, 1.7, -1.55),
      label: 'RNA to Protein',
      level1Note: 'Cells copy gene instructions into RNA. Ribosomes read RNA to build proteins.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Thread an RNA message through the ribosome and add matching pieces.',
          caption: 'RNA carries a gene message to a ribosome.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Move tRNA through the A, P and E positions while the chain grows.',
          caption: 'The ribosome reads RNA in three-letter codons.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Inspect decoding and peptide-bond formation as a simplified molecular model.',
          caption: 'Simplified model — not engineering grade.',
        },
      },
      sourceRefs: ['NHGRI-TRANSCRIPTION-TRANSLATION'],
    },
    {
      id: 'dna-anchor-crispr',
      anchorPosition: new THREE.Vector3(1.28, 1.62, -2.2),
      label: 'CRISPR-Cas9 Targeting',
      level1Note: 'A guide RNA helps Cas9 find matching DNA. Real medical editing needs safety testing.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Align the guide with the target beside a PAM marker.',
          caption: 'A guide helps Cas9 find a DNA sequence.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Clamp Cas9 after matching and compare simplified repair outcomes.',
          caption: 'A PAM is required for this common Cas9 system.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Inspect R-loop formation and off-target risk in a non-clinical model.',
          caption: 'This educational model is not medical advice.',
        },
      },
      sourceRefs: ['CRISPR-CAS9-2014', 'WHO-SICKLE-2025'],
    },
    {
      id: 'dna-anchor-diversity',
      anchorPosition: new THREE.Vector3(2.0, 1.6, -0.35),
      label: 'Diversity and the Sickle Trait',
      level1Note: 'Human diversity is mostly shared. Sickle-cell trait protects against malaria; the disease is different.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Turn the genotype dial and watch the red blood cell change shape.',
          caption: 'Trait and disease are not the same thing.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Compare HbAA, HbAS and HbSS population contexts beside malaria history.',
          caption: 'Population patterns never predict one person.',
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Inspect heterozygote advantage as a simplified population-genetics model.',
          caption: 'Protection is partial and context dependent.',
        },
      },
      sourceRefs: ['AGVP-2015', 'H3AFRICA-2024', 'WILLIAMS-2005', 'WHO-SICKLE-2025'],
    },
  ];
}
