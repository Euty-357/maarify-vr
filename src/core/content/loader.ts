import cosmosContent from '../../modules/cosmos/content/module-content.json';
import type { AnchorContent, ModuleContent } from './schema.js';

const MODULE_CONTENT: Record<string, ModuleContent> = {
  cosmos: cosmosContent as unknown as ModuleContent,
};

export function getModuleContent(moduleId: string): ModuleContent | null {
  return MODULE_CONTENT[moduleId] ?? null;
}

/** Find an anchor's rich content by id across the modules that have content data. */
export function findAnchorContent(anchorId: string): AnchorContent | null {
  for (const module of Object.values(MODULE_CONTENT)) {
    const anchor = module.anchors.find((candidate) => candidate.id === anchorId);
    if (anchor) return anchor;
  }
  return null;
}

export function hasContentFor(moduleId: string): boolean {
  return Boolean(MODULE_CONTENT[moduleId]);
}
