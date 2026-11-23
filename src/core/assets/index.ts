/**
 * GLB asset pipeline public API.
 *
 * - loadGlbAsset(url) — load a GLB via Three.js GLTFLoader
 * - parseAssetNodes(scene) — parse a scene graph into typed parts/anchors/flows/roles
 * - AssetCache — reference-counted cache with full disposal on release
 * - createExplodableFromAsset(asset, root) — build an ExplodableAssembly from parsed asset parts
 * - Types: AssetPart, AssetAnchor, AssetFlow, AssetRole, ParsedAsset, LoadedAsset,
 *   ExplodableAdapterEvent, ExplodableAdapterOptions, ExplodableAdapterAssembly
 */

export { loadGlbAsset, disposeGlbScene } from './glb-loader.js';
export { parseAssetNodes } from './asset-parser.js';
export { AssetCache } from './asset-cache.js';
export {
  createExplodableFromAsset,
  type ExplodableAdapterEvent,
  type ExplodableAdapterOptions,
  type ExplodableAdapterAssembly,
} from './explodable-adapter.js';
export { DockingSystem, type DockingEvent, type DockingSystemOptions } from './docking-system.js';
export type {
  AssetPart,
  AssetAnchor,
  AssetFlow,
  AssetRole,
  ParsedAsset,
  LoadedAsset,
  LoadGlbOptions,
} from './types.js';