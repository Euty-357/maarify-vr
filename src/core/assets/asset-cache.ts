/**
 * Reference-counted GLB asset cache.
 *
 * load() on module enter increments the ref count and loads (or reuses) the asset.
 * release() on module leave decrements the ref count; when it reaches zero the
 * scene graph is fully disposed (geometries, materials, textures) to prevent
 * memory leaks across module transitions.
 */

import { loadGlbAsset, disposeGlbScene } from './glb-loader.js';
import { parseAssetNodes } from './asset-parser.js';
import type { LoadedAsset, ParsedAsset } from './types.js';

export class AssetCache {
  private readonly cache: Map<string, LoadedAsset> = new Map();

  /** Load (or reuse) an asset, incrementing its reference count. */
  public async load(url: string): Promise<LoadedAsset> {
    const existing = this.cache.get(url);
    if (existing) {
      existing.refCount += 1;
      return existing;
    }

    const scene = await loadGlbAsset(url);
    const parsed = parseAssetNodes(scene);

    const entry: LoadedAsset = {
      url,
      scene,
      parsed,
      refCount: 1,
    };
    this.cache.set(url, entry);
    return entry;
  }

  /** Get a loaded asset without changing the reference count. */
  public get(url: string): LoadedAsset | undefined {
    return this.cache.get(url);
  }

  /** Release one reference. When the count reaches zero, fully dispose the asset. */
  public release(url: string): void {
    const entry = this.cache.get(url);
    if (!entry) return;

    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      disposeGlbScene(entry.scene);
      this.cache.delete(url);
    }
  }

  /** Release all assets and dispose everything. */
  public releaseAll(): void {
    for (const entry of this.cache.values()) {
      disposeGlbScene(entry.scene);
    }
    this.cache.clear();
  }

  /** Number of assets currently cached (ref count > 0). */
  public get size(): number {
    return this.cache.size;
  }

  /** Get the parsed metadata for a URL without loading. Returns undefined if not loaded. */
  public getParsed(url: string): ParsedAsset | undefined {
    return this.cache.get(url)?.parsed;
  }
}