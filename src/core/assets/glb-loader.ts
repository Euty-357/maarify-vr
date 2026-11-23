/**
 * GLB asset loading for Maarify.
 *
 * Uses Three.js GLTFLoader (ships with three/examples, no extra dependency).
 * No Draco, no KTX2 needed — assets are plain GLB with embedded geometry.
 * All assets are same-origin, served from public/models/<module>/ at build time.
 * Zero runtime network calls to other origins.
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { LoadGlbOptions } from './types.js';

const DEFAULT_BASE_PATH = '/models/';

const loader = new GLTFLoader();
loader.setCrossOrigin('anonymous');

/**
 * Load a GLB asset from a same-origin URL.
 *
 * Returns a THREE.Scene containing the asset's root nodes. The loader caches
 * internally; callers should use AssetCache for reference-counted lifecycle
 * management across module enter/leave.
 *
 * @param url - Full or relative URL to the .glb file.
 * @param options - Optional basePath for relative URLs.
 * @returns Promise resolving to the loaded GLTF scene (scene + userData extras preserved).
 */
export async function loadGlbAsset(
  url: string,
  options: LoadGlbOptions = {},
): Promise<THREE.Scene> {
  const resolvedUrl = url.startsWith('http') || url.startsWith('/')
    ? url
    : `${options.basePath ?? DEFAULT_BASE_PATH}${url}`;

  // If running in Node.js (unit tests), load from public/ filesystem directly
  if (typeof window === 'undefined') {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const relativePath = resolvedUrl.replace(/^\/+/, '');
      const filePath = path.resolve(process.cwd(), 'public', relativePath);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(
            arrayBuffer,
            '',
            (gltf) => resolve(gltf),
            (error) => reject(error),
          );
        });
        const scene = gltf.scene.clone();
        scene.name = `glb-asset-${resolvedUrl.split('/').pop() ?? 'unknown'}`;
        return scene;
      }
    } catch {
      // Fall through to loader.load
    }
  }

  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load(
      resolvedUrl,
      (gltf) => resolve(gltf),
      undefined,
      (event) => reject(new Error(`GLTFLoader failed for ${resolvedUrl}: ${(event as ErrorEvent).message}`)),
    );
  });

  const scene = gltf.scene.clone();
  scene.name = `glb-asset-${resolvedUrl.split('/').pop() ?? 'unknown'}`;
  return scene;
}

/** Dispose a loaded GLB scene: geometries, materials, textures. */
export function disposeGlbScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => disposeMaterial(m));
      } else if (object.material) {
        disposeMaterial(object.material);
      }
    }
    if (object instanceof THREE.Line || object instanceof THREE.Points) {
      object.geometry.dispose();
      if (object.material) disposeMaterial(object.material);
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  material.dispose();
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
    const map = material.map;
    if (map) map.dispose();
    const aoMap = material.aoMap;
    if (aoMap) aoMap.dispose();
  }
}