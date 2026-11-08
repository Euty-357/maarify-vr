---
name: info-card-system
description: >
  The two-tap reveal pattern for interactive objects: state machine,
  depth tier content schema, and UI layout for info cards.
  Load when building interactive objects or the info card UI.
---

# Info Card System Skill

## Interaction Pattern
Every explorable object uses a 3-state machine:
```
CLOSED → (tap/pinch) → LEVEL_1 → (tap/pinch) → LEVEL_2 → (tap/pinch) → CLOSED
```
- **LEVEL_1:** Short plain note, ≤ 40 words, zero jargon. Same for all tiers.
- **LEVEL_2:** Tier-appropriate technical explanation. Content varies by selected depth tier.
- **CLOSED:** No card visible.

## Depth Tiers
| Tier | Audience | Reading Level | Detail |
|------|----------|--------------|--------|
| Foundation | High school (CBC Form 1–4) | Plain language, concrete analogies | Key concept + 1 analogy |
| Advanced | First-year university | Some technical vocabulary, equations where helpful | Mechanism + context |
| Expert | Postgraduate / specialist | Full technical language, derivations, caveats | Deep dive, limitations, open questions |

## Content Schema (per interactive object)
```ts
interface InfoCardContent {
  objectId: string;
  level1: string;           // ≤ 40 words, no jargon
  level2: {
    foundation: string;
    advanced: string;
    expert: string;
  };
  sourceRefs: string[];     // IDs from module SOURCES.md
}
```

## UI Layout
- Card appears at 1.5 m from user, offset slightly up and to the side of the object.
- Card dimensions: ~0.4 m × 0.25 m (adjustable).
- Header: object name (16 pt equivalent).
- Body: level text (12–14 pt equivalent).
- Tier badge: "Foundation / Advanced / Expert" top-right corner.
- Close affordance: tap card again, or tap X button.
- Narration: `window.speechSynthesis.speak()` on card open (optional; user toggle in hub).
- Captions: always render text on card regardless of narration setting.

## State Machine Implementation (outline)
```ts
type CardState = 'CLOSED' | 'LEVEL_1' | 'LEVEL_2';
function nextState(current: CardState): CardState {
  if (current === 'CLOSED') return 'LEVEL_1';
  if (current === 'LEVEL_1') return 'LEVEL_2';
  return 'CLOSED';
}
```

## Unit Test Requirements
- Test all three state transitions.
- Test that level1 text is ≤ 40 words.
- Test that level2 content exists for all three tiers.
