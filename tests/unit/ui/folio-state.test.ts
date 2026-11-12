import { describe, expect, it } from 'vitest';
import {
  createFolioState,
  currentPage,
  nextPage,
  pageCountFor,
  prevPage,
  setPage,
  setTier,
  toggleCollapsed,
} from '../../../src/core/ui/folio-state.js';
import type { AnchorContent } from '../../../src/core/content/schema.js';

const anchor: AnchorContent = {
  id: 'demo',
  label: 'Demo',
  level1Note: 'A note.',
  tiers: {
    foundation: { pages: [{ blocks: [{ type: 'paragraph', text: 'F1' }] }] },
    advanced: {
      pages: [
        { blocks: [{ type: 'paragraph', text: 'A1' }] },
        { blocks: [{ type: 'paragraph', text: 'A2' }] },
      ],
    },
    expert: {
      pages: [
        { blocks: [{ type: 'paragraph', text: 'E1' }] },
        { blocks: [{ type: 'paragraph', text: 'E2' }] },
      ],
    },
  },
};

describe('folio state', () => {
  it('remembers a page per tier when switching', () => {
    let state = createFolioState();
    state = setTier(state, 'advanced');
    state = setPage(state, 1, anchor);
    state = setTier(state, 'foundation');
    expect(currentPage(state, anchor)?.blocks[0]).toEqual({ type: 'paragraph', text: 'F1' });
    state = setTier(state, 'advanced');
    expect(currentPage(state, anchor)?.blocks[0]).toEqual({ type: 'paragraph', text: 'A2' });
  });

  it('clamps pages instead of wrapping', () => {
    let state = setTier(createFolioState(), 'advanced');
    state = prevPage(state, anchor);
    expect(state.pages.advanced).toBe(0);
    state = setPage(state, 99, anchor);
    expect(state.pages.advanced).toBe(pageCountFor(anchor, 'advanced') - 1);
    state = nextPage(state, anchor);
    expect(state.pages.advanced).toBe(1);
  });

  it('toggles collapse', () => {
    let state = createFolioState();
    expect(state.collapsed).toBe(false);
    state = toggleCollapsed(state);
    expect(state.collapsed).toBe(true);
    expect(setTier(state, 'expert').collapsed).toBe(false);
  });
});
