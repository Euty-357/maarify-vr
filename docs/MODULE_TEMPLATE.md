# Module Authoring Template
_Owner: module-builder & immersion-reviewer_
_Binding Standard: docs/IMMERSION_CHARTER.md_

Every Maarify module is a self-contained, spatial WebXR learning world. Modules never import other modules and interact solely with the public APIs exposed by `src/core/`.

---

## 1. Directory Structure
Use `node scripts/scaffold-module.mjs <id> "<DisplayName>"` to initialize:
```
src/modules/<id>/
  index.ts           # ModuleDefinition export
  scene.ts           # 3D spatial scene construction
  anchors.ts         # Diegetic Spatial Anchors & interactive micro-sims
  challenges.ts      # Physical 3D challenges (no quizzes)
  SOURCES.md         # Factual claims and citations
docs/modules/<id>/
  SPEC.md            # Detailed module specification with Immersion Map
```

---

## 2. Immersion Map (MANDATORY IN EVERY MODULE)
Every module must include a completed **Immersion Map** in its `SPEC.md`:

| Interaction / Object | What Makes It Spatial (Impossible on Flat Screen) | Hands / Controller / Body Input Used | Seated Parity Alternative |
| :--- | :--- | :--- | :--- |
| *Example Part* | *True 3D depth, parallax inspection, multi-axis spatial alignment* | *Two-handed grab & pull apart (exploded view)* | *Teleport to eye-level; upper-body rotation* |

---

## 3. Diegetic Spatial Anchor Standard (`anchors.ts`)
No floating flat cards. Every interactive component is defined as a `SpatialAnchorDefinition`:

```ts
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'module-component-1',
      anchorPosition: new THREE.Vector3(0, 1.2, -1.0),
      label: 'Component Name',
      // Level 1: Small spatial tag (<= 40 words, zero jargon)
      level1Note: 'Plain physical intuition describing what this part does.',
      // Level 2: Interactive 3D micro-simulation at this exact spot
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description: 'Two-hand pull reveals internal mechanical balance.',
          caption: 'Short supporting caption (<= 40 words).'
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description: 'Lever controls physical parameter, showing live vector flows.',
          caption: 'Technical governing relations.'
        },
        expert: {
          type: 'cross-section-flux',
          description: 'Cutting plane reveals thermodynamic/quantum flux gradients.',
          caption: 'Formal boundary equations.'
        }
      },
      sourceRefs: ['SOURCE-ID-1']
    }
  ];
}
```

---

## 4. Physical Challenges (`challenges.ts`)
- **No multiple-choice questions.**
- Challenges test understanding through physical action:
  - Sequence Walk (spatial positioning and ordering)
  - Assembly (snapping 3D parts together with magnetic detents)
  - Beam Alignment (head-tilt or hand orientation)
  - Gaze Hold (fixation dwell triggering quantum or astronomical state change)
  - Dynamic Balancing (tuning physical parameters to reach equilibrium)
- Every challenge must be completable seated.

---

## 5. Definition of Done Checklist (per module)
- [ ] Meets all 10 principles of `docs/IMMERSION_CHARTER.md`
- [ ] Complete **Immersion Map** in `docs/modules/<id>/SPEC.md`
- [ ] Spatial Anchors implemented with spatial leader lines and 3D micro-simulations (no 2D flat cards)
- [ ] $\ge 3$ physical challenges + capstone challenge, all 100% completable seated
- [ ] Positional 3D audio on all sound-emitting objects
- [ ] Haptic pulses on touch, grab, snap, and detent stops
- [ ] All factual claims verified and cited in `SOURCES.md`
- [ ] Playwright autopilot test green with zero console errors
- [ ] Quest 2 budgets verified via `renderer.info` ($< 100\text{k}$ tris, $< 100$ draw calls, 72 fps target)
- [ ] Sign-off obtained: `science-medical-reviewer`
- [ ] Sign-off obtained: `comfort-accessibility-reviewer`
- [ ] Sign-off obtained: `immersion-reviewer`
- [ ] Device test cases logged in `docs/DEVICE_TEST_BACKLOG.md`
