---
name: asset-pipeline
description: >
  Free-asset licence checking, ASSETS.md manifest, glTF optimisation pipeline.
  Load when sourcing, adding, or optimising 3D assets.
---

# Asset Pipeline Skill

## Licence Priority
1. **CC0 / Public Domain** — preferred; no attribution required.
2. **CC BY** — allowed; must credit in ASSETS.md and in-app acknowledgements.
3. **CC BY-SA** — allowed; check if share-alike affects the app as a whole.
4. **CC BY-NC** — only for non-commercial use; flag if commercial use planned.
5. **All Rights Reserved / proprietary** — do NOT use without explicit licence.

Record every asset in `ASSETS.md`:
```
| ID | File | Source URL | Licence | Attribution | Optimised | Notes |
```

## Recommended Sources
- Sketchfab (filter CC0): https://sketchfab.com
- Poly Pizza: https://poly.pizza (CC0)
- KhronosGroup sample models: https://github.com/KhronosGroup/glTF-Sample-Models

## glTF Optimisation Pipeline
1. Download original `.glb` or `.gltf`.
2. Run `gltf-transform optimize input.glb output.glb --compress meshopt`.
3. Convert textures: `toktx --encode etc1s output.ktx2 input.png` (colour) or `--encode uastc` (normals/metallic-roughness).
4. Update texture references in `.gltf` to `.ktx2`.
5. Verify: triangle count, texture sizes, draw calls.
6. Record in ASSETS.md.

## Tools (ask user before installing globally)
- `gltf-transform`: https://gltf-transform.donmccurdy.com/
- `toktx` (KTX-Software): https://github.com/KhronosGroup/KTX-Software
- `basisu` (Basis Universal): https://github.com/BinomialLLC/basis_universal

## Procedural Preference
Prefer procedural geometry over loaded assets when:
- The shape can be described mathematically (spheres, tori, tubes, grids).
- The asset would be used in many instances (stars, particles, DNA strands).
- Loading time or licence is a concern.
Procedural geometry counts as zero external assets and has no licence burden.
