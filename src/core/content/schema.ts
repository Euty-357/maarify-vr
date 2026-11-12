/**
 * Content-as-data schema for Information Panels v2.
 *
 * Every anchor keeps a short Level 1 note (≤ 40 words) plus three tier bodies made
 * of pages. A page is a list of blocks, never a scrolling pane. The same rules are
 * enforced by `scripts/audit-content-depth.mjs`, so the audit and the runtime agree.
 */

export type TierId = 'foundation' | 'advanced' | 'expert';

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'keyFacts'; facts: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'equation'; latex: string; explanation: string }
  | { type: 'workedExample'; context: string; steps: string[]; answer: string }
  | { type: 'practitionerNote'; framework: string; note: string }
  | { type: 'sources'; refs: string[] }
  | { type: 'diagram3d'; assetId: string; caption: string; controls?: string[] };

export interface ContentPage {
  blocks: ContentBlock[];
}

export interface TierContent {
  pages: ContentPage[];
}

export interface AnchorContent {
  id: string;
  label: string;
  level1Note: string;
  tiers: Record<TierId, TierContent>;
}

export interface GlossaryTerm {
  term: string;
  tiers: Record<TierId, string>;
}

export interface LearningObjective {
  id: string;
  text: string;
  mappedTo: string;
}

export interface ModuleContent {
  moduleId: string;
  anchors: AnchorContent[];
  glossary: GlossaryTerm[];
  objectives: LearningObjective[];
  practitioner: { deskTitle: string; tools: string[] };
}

export const TIERS: TierId[] = ['foundation', 'advanced', 'expert'];
export const WORDS_PER_PAGE_MAX = 90;
export const LEVEL1_WORDS_MAX = 40;
export const MIN_PAGES: Record<TierId, number> = { foundation: 1, advanced: 2, expert: 2 };
export const MIN_ANCHORS = 24;
export const MIN_GLOSSARY = 25;
export const MIN_OBJECTIVES = 10;

/** Count words across every block; LaTeX and 3D captions count as words too. */
export function blockText(block: ContentBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text;
    case 'keyFacts':
      return block.facts.join(' ');
    case 'table':
      return [...block.headers, ...block.rows.flat()].join(' ');
    case 'equation':
      return `${block.latex} ${block.explanation}`;
    case 'workedExample':
      return [block.context, ...block.steps, block.answer].join(' ');
    case 'practitionerNote':
      return `${block.framework} ${block.note}`;
    case 'sources':
      return block.refs.join(' ');
    case 'diagram3d':
      return `${block.caption} ${(block.controls ?? []).join(' ')}`;
    default:
      return '';
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function pageWordCount(page: ContentPage): number {
  return page.blocks.reduce((total, block) => total + countWords(blockText(block)), 0);
}

/** Validate one tier; returns human-readable problems. */
export function validateTier(tier: TierId, content: TierContent | undefined): string[] {
  const problems: string[] = [];
  if (!content) return [`${tier}: missing tier content`];
  if (content.pages.length < MIN_PAGES[tier]) {
    problems.push(`${tier}: ${content.pages.length} page(s), minimum ${MIN_PAGES[tier]}`);
  }
  content.pages.forEach((page, index) => {
    const words = pageWordCount(page);
    if (words > WORDS_PER_PAGE_MAX) {
      problems.push(`${tier} page ${index + 1}: ${words} words, maximum ${WORDS_PER_PAGE_MAX}`);
    }
    if (page.blocks.length === 0) {
      problems.push(`${tier} page ${index + 1}: empty page`);
    }
  });
  return problems;
}

/** Validate one anchor, including the short Level 1 note and source presence. */
export function validateAnchor(anchor: AnchorContent): string[] {
  const problems: string[] = [];
  const level1Words = countWords(anchor.level1Note);
  if (level1Words > LEVEL1_WORDS_MAX) {
    problems.push(`level1: ${level1Words} words, maximum ${LEVEL1_WORDS_MAX}`);
  }
  for (const tier of TIERS) {
    problems.push(...validateTier(tier, anchor.tiers[tier]).map((problem) => `${anchor.id} ${problem}`));
  }
  const prose = (tier: TierId): string =>
    (anchor.tiers[tier]?.pages ?? [])
      .map((page) =>
        page.blocks
          .filter((block) => block.type !== 'sources')
          .map(blockText)
          .join(' ')
      )
      .join(' ')
      .trim();
  const expertText = prose('expert');
  const foundationText = prose('foundation');
  if (expertText && foundationText && expertText === foundationText) {
    problems.push(`${anchor.id}: expert repeats foundation verbatim`);
  }
  const hasSources = anchor.tiers.expert?.pages.some((page) =>
    page.blocks.some((block) => block.type === 'sources')
  );
  if (!hasSources) problems.push(`${anchor.id}: expert tier has no sources block`);
  return problems;
}

export function validateModuleContent(module: ModuleContent): string[] {
  const problems: string[] = [];
  if (module.anchors.length < MIN_ANCHORS) {
    problems.push(`${module.moduleId}: ${module.anchors.length} anchors, minimum ${MIN_ANCHORS}`);
  }
  if (module.glossary.length < MIN_GLOSSARY) {
    problems.push(`${module.moduleId}: ${module.glossary.length} glossary terms, minimum ${MIN_GLOSSARY}`);
  }
  if (module.objectives.length < MIN_OBJECTIVES) {
    problems.push(`${module.moduleId}: ${module.objectives.length} objectives, minimum ${MIN_OBJECTIVES}`);
  }
  if (!module.practitioner?.tools?.length) {
    problems.push(`${module.moduleId}: missing practitioner desk`);
  }
  for (const anchor of module.anchors) problems.push(...validateAnchor(anchor));
  return problems;
}
