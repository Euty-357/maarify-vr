import * as THREE from 'three';

/**
 * Dark-academia design tokens. One place for palette, materials, typography and
 * spacing so the hub, panels and modules share the same visual language.
 */
export const PALETTE = {
  oak: 0x3a2416,
  walnut: 0x241610,
  brass: 0xb08d57,
  brassBright: 0xd9b877,
  oxblood: 0x5a1f1f,
  forest: 0x1f3b2c,
  parchment: 0xe8dcc0,
  ink: 0x14100c,
  candle: 0xffb066,
  lamp: 0xffd9a8,
  seal: 0x7a1f1f,
  smoke: 0x0b0908,
} as const;

export interface MaterialSpec {
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
}

export const MATERIALS: Record<'oak' | 'walnut' | 'brass' | 'leather' | 'parchment' | 'seal', MaterialSpec> = {
  oak: { color: PALETTE.oak, roughness: 0.72, metalness: 0.05 },
  walnut: { color: PALETTE.walnut, roughness: 0.8, metalness: 0.04 },
  brass: { color: PALETTE.brass, roughness: 0.28, metalness: 0.92, emissive: PALETTE.brass, emissiveIntensity: 0.12 },
  leather: { color: PALETTE.oxblood, roughness: 0.62, metalness: 0.02 },
  parchment: { color: PALETTE.parchment, roughness: 0.9, metalness: 0.0 },
  seal: { color: PALETTE.seal, roughness: 0.45, metalness: 0.1, emissive: PALETTE.seal, emissiveIntensity: 0.2 },
} as const;

export function standardMaterial(token: keyof typeof MATERIALS): THREE.MeshStandardMaterial {
  const spec = MATERIALS[token];
  return new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness,
    emissive: spec.emissive ?? 0x000000,
    emissiveIntensity: spec.emissiveIntensity ?? 0,
  });
}

/** Serif stack used everywhere until an embedded open-licence font is added. */
export const FONTS = {
  serif: "'EB Garamond', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  sans: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const TYPE_SCALE = {
  title: 40,
  subtitle: 28,
  body: 24,
  caption: 18,
} as const;

/** Minimum legible text in the app; tuned for the lower-density Quest 3S panel. */
export const MIN_TEXT_PT = 24;
