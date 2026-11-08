---
name: vr-ui-and-comfort
description: >
  World-space UI design, text legibility, comfort rules, seated mode,
  vignette effects, and safe warp/travel effects for VR.
  Load when building UI panels, comfort systems, or travel effects.
---

# VR UI and Comfort Skill

## Docs
- VR Comfort: https://developer.oculus.com/resources/bp-vision/
- WebXR Comfort: https://www.w3.org/TR/webxr/#security-and-privacy
- Three.js SDF Text (troika-three-text): https://github.com/protectwise/troika/tree/main/packages/troika-three-text

## World-Space UI Rules
- Position panels 1.0–2.0 m in front of the user's initial forward direction.
- Do NOT parent UI to the camera (causes nausea).
- Recommended: billboard panels that face the camera but translate independently.
- Minimum text size: 24 pt equivalent at 1 m viewing distance (≈ 0.024 world units tall at z = -1).
- Use `troika-three-text` for SDF font rendering (sharp at any scale; no texture blur).
- Colour contrast: ≥ 4.5:1 (WCAG AA) for all text.

## Comfort Constraints
- **No forced camera motion** — ever. Camera moves only via user locomotion.
- **Teleport:** Default primary locomotion. Ray-cast arc, confirm on trigger release.
- **Snap turn:** Discrete 30° or 45° rotations (configurable). No smooth rotation by default.
- **Smooth locomotion (opt-in):** Only with vignette. Vignette: radial darkening from edge toward centre, FOV reduces from 90° to ~70° during motion. Use `THREE.ShaderMaterial` radial mask.
- **Seated mode:** All interactions reachable from a seated position. No floor-level interactions.

## Vignette Implementation (outline)
```glsl
// Fragment shader radial vignette
float dist = length(vUv - vec2(0.5));
float vignette = smoothstep(vignetteStart, vignetteEnd, dist);
gl_FragColor = vec4(color * (1.0 - vignette * vignetteStrength), 1.0);
```
Animate `vignetteStrength` 0→1 on motion start, 1→0 on stop.

## Warp / Fast-Travel Rules (MANDATORY)
1. User-initiated only (button press or gaze + dwell).
2. Maximum duration: 2 seconds (shorter is better).
3. Fixed visual frame of reference: cockpit frame, portal ring, or similar that doesn't move.
4. Vignette on during entire travel sequence.
5. Reduced-motion option: skip the warp animation entirely, cut to destination.
6. Expert tier may explain relativistic effects — label as "Educational representation — not physically accurate."

## Motion Sickness Risk Factors to Avoid
- Latency > 20 ms (render-to-photon)
- Oscillating camera (bobbing)
- Mismatch between visual and vestibular motion (vection without physical motion)
- Accelerating camera without user input
- UI elements that drift or lag behind head rotation
