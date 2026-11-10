import { describe, expect, it } from 'vitest';
import {
  DIVERSITY_REGIONS,
  GENOTYPES,
  MODEL_MRNA,
  MODEL_PEPTIDE,
  MODEL_TEMPLATE,
  aminoAcidForCodon,
  codonViews,
  complement,
  complementStrand,
  gcFraction,
  genotypeFraming,
  isComplement,
  punnett,
  transcribe,
  translate,
} from '../../../src/modules/dna-genetics/genetics.js';

describe('DNA base pairing and the central dogma', () => {
  it('pairs A with T and C with G only', () => {
    expect(complement('A')).toBe('T');
    expect(complement('T')).toBe('A');
    expect(complement('C')).toBe('G');
    expect(complement('G')).toBe('C');
    expect(isComplement('A', 'T')).toBe(true);
    expect(isComplement('A', 'G')).toBe(false);
    expect(complementStrand(['A', 'C'])).toEqual(['T', 'G']);
  });

  it('transcribes the model template to mRNA with uracil', () => {
    expect(transcribe(MODEL_TEMPLATE).join('')).toBe('AUGGCAUUU');
    expect(MODEL_MRNA.join('')).toBe('AUGGCAUUU');
  });

  it('reads the standard genetic code and stops at a stop codon', () => {
    expect(aminoAcidForCodon(['A', 'U', 'G'])).toBe('M');
    expect(aminoAcidForCodon(['U', 'A', 'A'])).toBe('*');
    expect(aminoAcidForCodon(['G', 'G', 'G'])).toBe('G');
    expect(translate(['A', 'U', 'G', 'G', 'C', 'A', 'U', 'U', 'U'])).toEqual(['M', 'A', 'F']);
    expect(translate(['A', 'U', 'G', 'U', 'A', 'A', 'G', 'C', 'A'])).toEqual(['M']);
    expect(MODEL_PEPTIDE).toEqual(['M', 'A', 'F']);
  });

  it('describes the model codons for the exhibit', () => {
    const views = codonViews(MODEL_MRNA);
    expect(views.map((view) => view.codon)).toEqual(['AUG', 'GCA', 'UUU']);
    expect(views.map((view) => view.aminoAcidName)).toEqual(['Methionine', 'Alanine', 'Phenylalanine']);
  });

  it('computes GC fraction and handles the empty case', () => {
    expect(gcFraction(['G', 'C', 'A', 'T'])).toBe(0.5);
    expect(gcFraction([])).toBe(0);
  });
});

describe('Beta-globin inheritance and population framing', () => {
  it('produces Mendelian expectations for two carrier parents', () => {
    expect(punnett('HbAS', 'HbAS')).toEqual({ HbAA: 1, HbAS: 2, HbSS: 1 });
    expect(punnett('HbAA', 'HbSS')).toEqual({ HbAA: 0, HbAS: 4, HbSS: 0 });
    expect(punnett('HbAA', 'HbAA')).toEqual({ HbAA: 4, HbAS: 0, HbSS: 0 });
  });

  it('keeps trait and disease distinct and non-diagnostic', () => {
    const trait = genotypeFraming('HbAS');
    const disease = genotypeFraming('HbSS');
    expect(trait.label).toContain('trait');
    expect(trait.clinicalNote).toContain('Trait and disease are different');
    expect(disease.clinicalNote).toContain('not a diagnosis');
    expect(GENOTYPES).toHaveLength(3);
  });

  it('frames diversity as mostly shared variation', () => {
    expect(DIVERSITY_REGIONS).toHaveLength(5);
    expect(DIVERSITY_REGIONS.every((region) => region.beadCount > 0)).toBe(true);
    expect(DIVERSITY_REGIONS.map((region) => region.id)).toContain('world');
  });
});
