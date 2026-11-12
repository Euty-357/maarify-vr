import type { AnchorContent, TierId } from '../content/schema.js';

/** Pure paging/tier state for the Panels v2 folio, unit-testable without a DOM. */
export interface FolioState {
  tier: TierId;
  pages: Record<TierId, number>;
  collapsed: boolean;
}

export function createFolioState(): FolioState {
  return { tier: 'foundation', pages: { foundation: 0, advanced: 0, expert: 0 }, collapsed: false };
}

export function pageCountFor(anchor: AnchorContent, tier: TierId): number {
  return Math.max(1, anchor.tiers[tier]?.pages.length ?? 1);
}

export function setTier(state: FolioState, tier: TierId): FolioState {
  return { ...state, tier, collapsed: false };
}

export function setPage(state: FolioState, page: number, anchor: AnchorContent): FolioState {
  const count = pageCountFor(anchor, state.tier);
  const clamped = Math.min(Math.max(page, 0), count - 1);
  return { ...state, pages: { ...state.pages, [state.tier]: clamped } };
}

export function nextPage(state: FolioState, anchor: AnchorContent): FolioState {
  return setPage(state, state.pages[state.tier] + 1, anchor);
}

export function prevPage(state: FolioState, anchor: AnchorContent): FolioState {
  return setPage(state, state.pages[state.tier] - 1, anchor);
}

export function toggleCollapsed(state: FolioState): FolioState {
  return { ...state, collapsed: !state.collapsed };
}

export function currentPage(state: FolioState, anchor: AnchorContent) {
  const pages = anchor.tiers[state.tier]?.pages ?? [];
  const index = Math.min(state.pages[state.tier], Math.max(0, pages.length - 1));
  return pages[index] ?? null;
}
