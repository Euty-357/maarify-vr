import { describe, expect, it } from 'vitest';
import {
  countWords,
  pageWordCount,
  validateAnchor,
  validateModuleContent,
  type AnchorContent,
  type ContentPage,
} from '../../../src/core/content/schema.js';

const page = (text: string): ContentPage => ({ blocks: [{ type: 'paragraph', text }] });

function anchor(overrides: Partial<AnchorContent> = {}): AnchorContent {
  return {
    id: 'test-anchor',
    label: 'Test anchor',
    level1Note: 'A short note.',
    tiers: {
      foundation: { pages: [page('Foundation page.')] },
      advanced: { pages: [page('Advanced one.'), page('Advanced two.')] },
      expert: {
        pages: [
          page('Expert one.'),
          {
            blocks: [
              { type: 'paragraph', text: 'Expert two.' },
              { type: 'sources', refs: ['REF-1'] },
            ],
          },
        ],
      },
    },
    ...overrides,
  };
}

describe('content schema', () => {
  it('counts words and enforces the 90-word page limit', () => {
    expect(countWords('one two  three')).toBe(3);
    expect(pageWordCount(page('a '.repeat(91)))).toBe(91);
  });

  it('accepts a well-formed anchor', () => {
    expect(validateAnchor(anchor())).toEqual([]);
  });

  it('rejects missing pages, long pages and missing sources', () => {
    const bad = anchor({
      tiers: {
        foundation: { pages: [page('a '.repeat(91))] },
        advanced: { pages: [page('one.')] },
        expert: { pages: [page('one.'), page('two.')] },
      },
    });
    const problems = validateAnchor(bad);
    expect(problems.some((problem) => problem.includes('maximum 90'))).toBe(true);
    expect(problems.some((problem) => problem.includes('minimum 2'))).toBe(true);
    expect(problems.some((problem) => problem.includes('no sources'))).toBe(true);
  });

  it('rejects an expert tier that repeats foundation verbatim', () => {
    const repeated = anchor({
      tiers: {
        foundation: { pages: [page('Same text.')] },
        advanced: { pages: [page('Advanced one.'), page('Advanced two.')] },
        expert: {
          pages: [
            page('Same text.'),
            { blocks: [{ type: 'sources', refs: ['REF-1'] }] },
          ],
        },
      },
    });
    expect(validateAnchor(repeated).some((problem) => problem.includes('repeats foundation'))).toBe(true);
  });

  it('enforces module thresholds', () => {
    const module = {
      moduleId: 'demo',
      anchors: [anchor()],
      glossary: [],
      objectives: [],
      practitioner: { deskTitle: '', tools: [] },
    };
    const problems = validateModuleContent(module);
    expect(problems.some((problem) => problem.includes('minimum 24'))).toBe(true);
    expect(problems.some((problem) => problem.includes('minimum 25'))).toBe(true);
    expect(problems.some((problem) => problem.includes('minimum 10'))).toBe(true);
  });
});
