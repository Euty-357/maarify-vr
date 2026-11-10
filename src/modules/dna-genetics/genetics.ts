/**
 * DNA / Genetics — pure model.
 *
 * Kept free of THREE and DOM so the biological rules are unit-testable in Node and
 * the scene can only render what this module computes.
 *
 * Educational scope: base pairing, transcription, translation, Mendelian inheritance
 * of the beta-globin variants, and population-level framing of the sickle-cell trait.
 * Nothing here is diagnostic, predictive about an individual, or a treatment protocol.
 */

export type Base = 'A' | 'T' | 'C' | 'G';
export type RnaBase = 'A' | 'U' | 'C' | 'G';

const COMPLEMENT: Record<Base, Base> = { A: 'T', T: 'A', C: 'G', G: 'C' };

/** Standard genetic code, ordered U, C, A, G for each codon position. `*` marks a stop codon. */
const AMINO_ACID_TABLE = 'FFLLSSSSYY**CC*W' + 'LLLLPPPPHHQQRRRR' + 'IIIMTTTTNNKKSSRR' + 'VVVVAAAADDEEGGGG';
const BASE_ORDER: Record<RnaBase, number> = { U: 0, C: 1, A: 2, G: 3 };

export function complement(base: Base): Base {
  return COMPLEMENT[base];
}

export function isComplement(a: Base, b: Base): boolean {
  return COMPLEMENT[a] === b;
}

export function complementStrand(dna: readonly Base[]): Base[] {
  return dna.map(complement);
}

/** DNA → messenger RNA. Adenine becomes uracil; the other bases map to their complement. */
export function transcribe(dna: readonly Base[]): RnaBase[] {
  return dna.map((base) => {
    if (base === 'A') return 'U';
    if (base === 'T') return 'A';
    if (base === 'C') return 'G';
    return 'C';
  });
}

export function splitCodons(rna: readonly RnaBase[]): RnaBase[][] {
  const codons: RnaBase[][] = [];
  for (let index = 0; index + 2 < rna.length; index += 3) {
    codons.push([rna[index], rna[index + 1], rna[index + 2]]);
  }
  return codons;
}

export function aminoAcidForCodon(codon: readonly RnaBase[]): string {
  if (codon.length !== 3) return '';
  const index = BASE_ORDER[codon[0]] * 16 + BASE_ORDER[codon[1]] * 4 + BASE_ORDER[codon[2]];
  return AMINO_ACID_TABLE[index];
}

/** Translate an RNA strand into single-letter amino acids, stopping at the first stop codon. */
export function translate(rna: readonly RnaBase[]): string[] {
  const peptide: string[] = [];
  for (const codon of splitCodons(rna)) {
    const aminoAcid = aminoAcidForCodon(codon);
    if (!aminoAcid || aminoAcid === '*') break;
    peptide.push(aminoAcid);
  }
  return peptide;
}

export function gcFraction(sequence: readonly Base[]): number {
  if (sequence.length === 0) return 0;
  const gc = sequence.filter((base) => base === 'G' || base === 'C').length;
  return gc / sequence.length;
}

export const AMINO_ACID_NAMES: Record<string, string> = {
  A: 'Alanine', C: 'Cysteine', D: 'Aspartate', E: 'Glutamate', F: 'Phenylalanine',
  G: 'Glycine', H: 'Histidine', I: 'Isoleucine', K: 'Lysine', L: 'Leucine',
  M: 'Methionine', N: 'Asparagine', P: 'Proline', Q: 'Glutamine', R: 'Arginine',
  S: 'Serine', T: 'Threonine', V: 'Valine', W: 'Tryptophan', Y: 'Tyrosine',
};

/**
 * The model sequence used at the translation station.
 * Template strand TAC CGT AAA transcribes to mRNA AUG GCA UUU,
 * which translates to Methionine–Alanine–Phenylalanine.
 */
export const MODEL_TEMPLATE: Base[] = ['T', 'A', 'C', 'C', 'G', 'T', 'A', 'A', 'A'];
export const MODEL_MRNA = transcribe(MODEL_TEMPLATE);
export const MODEL_PEPTIDE = translate(MODEL_MRNA);

export interface RnaCodonView {
  codon: string;
  aminoAcid: string;
  aminoAcidName: string;
}

export function codonViews(rna: readonly RnaBase[]): RnaCodonView[] {
  return splitCodons(rna).map((codon) => {
    const aminoAcid = aminoAcidForCodon(codon);
    return {
      codon: codon.join(''),
      aminoAcid,
      aminoAcidName: AMINO_ACID_NAMES[aminoAcid] ?? 'Stop',
    };
  });
}

// --- Beta-globin inheritance ------------------------------------------------

export type Genotype = 'HbAA' | 'HbAS' | 'HbSS';

export interface GenotypeFraming {
  id: Genotype;
  label: string;
  /** Plain description of the beta-globin pair. */
  alleles: string;
  /** What this means in population context; never an individual prediction. */
  populationNote: string;
  /** Explicit separation of trait and disease. */
  clinicalNote: string;
  /** Red-cell appearance used by the spatial exhibit. */
  cellShape: 'biconcave' | 'mixed' | 'crescent';
  cellColor: number;
}

const GENOTYPE_FRAMING: Record<Genotype, GenotypeFraming> = {
  HbAA: {
    id: 'HbAA',
    label: 'HbAA — two typical beta-globin genes',
    alleles: 'One typical beta-globin allele from each parent.',
    populationNote: 'Red blood cells are usually flexible discs that move easily through small vessels.',
    clinicalNote: 'No sickle-cell variant is present in this model.',
    cellShape: 'biconcave',
    cellColor: 0xef4444,
  },
  HbAS: {
    id: 'HbAS',
    label: 'HbAS — sickle-cell trait',
    alleles: 'One typical allele and one sickle variant.',
    populationNote:
      'People with the trait usually have no sickle-cell disease, and population studies show strong protection against severe malaria. This is a population pattern, not a promise about one person.',
    clinicalNote: 'Trait and disease are different. The trait is common where malaria has been common.',
    cellShape: 'mixed',
    cellColor: 0xf59e0b,
  },
  HbSS: {
    id: 'HbSS',
    label: 'HbSS — sickle-cell disease',
    alleles: 'Two sickle variants, one from each parent.',
    populationNote:
      'Sickle-cell disease is a serious inherited condition. Care improves outcomes, and this model does not predict any individual’s health.',
    clinicalNote: 'Educational model only — not a diagnosis and not medical advice.',
    cellShape: 'crescent',
    cellColor: 0x991b1b,
  },
};

export function genotypeFraming(genotype: Genotype): GenotypeFraming {
  return GENOTYPE_FRAMING[genotype];
}

export const GENOTYPES: Genotype[] = ['HbAA', 'HbAS', 'HbSS'];

/** Mendelian expectation for one child, counted out of four equally likely outcomes. */
export function punnett(first: Genotype, second: Genotype): Record<Genotype, number> {
  const alleles = (genotype: Genotype): Array<'A' | 'S'> =>
    genotype === 'HbAA' ? ['A', 'A'] : genotype === 'HbSS' ? ['S', 'S'] : ['A', 'S'];

  const counts: Record<Genotype, number> = { HbAA: 0, HbAS: 0, HbSS: 0 };
  for (const a of alleles(first)) {
    for (const b of alleles(second)) {
      const pair = [a, b].sort().join('');
      if (pair === 'AA') counts.HbAA += 1;
      else if (pair === 'AS') counts.HbAS += 1;
      else counts.HbSS += 1;
    }
  }
  return counts;
}

// --- Beat 6 diversity framing ----------------------------------------------

export interface DiversityRegion {
  id: string;
  label: string;
  /** Relative within-Africa representation used purely for the visual cluster. */
  beadCount: number;
  note: string;
}

export const DIVERSITY_REGIONS: DiversityRegion[] = [
  { id: 'east', label: 'East Africa', beadCount: 16, note: 'Deep and varied lineages; the region where this lesson is set.' },
  { id: 'west', label: 'West Africa', beadCount: 14, note: 'High diversity, including variants tied to malaria history.' },
  { id: 'south', label: 'Southern Africa', beadCount: 9, note: 'Includes some of the deepest human population structure.' },
  { id: 'north', label: 'North Africa', beadCount: 7, note: 'Long-standing connections across the continent and beyond.' },
  { id: 'world', label: 'Outside Africa', beadCount: 6, note: 'Most variation is shared; a small subset is unique to each region.' },
];

export const DIVERSITY_TAKEAWAY =
  'Africa holds the greatest human genetic diversity. Most variation is shared by all people.';
