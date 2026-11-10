import type { ChallengeDefinition } from '../../core/types.js';

export const DNA_GENETICS_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'dna-base-pair-snap',
    title: 'Complementary Base Snapping',
    description: 'Grab reachable nucleotide models and snap complementary bases onto the exposed template strand.',
    type: 'assembly',
    xpReward: 150,
    seatedCompatible: true,
  },
  {
    id: 'dna-replication-unzip',
    title: 'Replication Fork Unzipping',
    description: 'Pull the two backbones apart, or use the replication lever, to open the helix for copying.',
    type: 'tune',
    xpReward: 175,
    seatedCompatible: true,
  },
  {
    id: 'dna-ribosome-thread',
    title: 'Ribosome Translation Threading',
    description: 'Guide matching tRNA models into the A site in codon order to extend a model peptide chain.',
    type: 'assembly',
    xpReward: 200,
    seatedCompatible: true,
  },
  {
    id: 'dna-crispr-capstone',
    title: 'Capstone: Guide RNA Target Alignment',
    description: 'Align a non-clinical model guide beside a PAM marker and push Cas9 into the target; no treatment procedure is taught.',
    type: 'alignment',
    xpReward: 350,
    seatedCompatible: true,
  },
  {
    id: 'dna-diversity-chain',
    title: 'Trait, Malaria and Frequency',
    description: 'Assemble the population-level causal chain that links the sickle-cell trait, malaria history and trait frequency.',
    type: 'sequence-walk',
    xpReward: 150,
    seatedCompatible: true,
  },
];

export function getChallenges(): ChallengeDefinition[] {
  return DNA_GENETICS_CHALLENGES;
}
