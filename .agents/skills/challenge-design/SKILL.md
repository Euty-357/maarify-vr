---
name: challenge-design
description: >
  Physical (non-quiz) challenge design: types, scoring, seated alternatives,
  head-tilt and gaze mechanics. Load when designing or implementing module challenges.
---

# Challenge Design Skill

## Principles
- No multiple-choice quizzes.
- All challenges are physical tasks in the 3D environment.
- Every challenge must be completable from a seated position.
- Minimum 3 challenges per module + 1 capstone.
- Challenges test understanding through action, not recall.

## Challenge Types
| Type | Description | Example |
|------|-------------|---------|
| Sequence walk | Walk to and tap parts in correct order | Tap atmosphere layers bottom to top |
| Assembly | Grab and snap components together | Assemble turbofan engine stages |
| Alignment | Tilt head or lean to align a beam/target | Align orbital insertion vector |
| Gaze hold | Maintain gaze on a moving target for N seconds | Track a comet across the sky |
| Steer / path | Guide an object along a path | Steer a spacecraft through a debris field |
| Tune / balance | Adjust parameters to reach a target state | Balance ecosystem species counts |
| Scale shift | Navigate correctly after a scale change | Find the DNA base pair after shrinking |

## Seated Adaptations
- Sequence walk → Teleport to each waypoint while seated.
- Alignment → Head tilt only (no standing lean required).
- All grab interactions reachable within 0.5 m of body centre.

## Scoring
```ts
interface ChallengeResult {
  challengeId: string;
  completed: boolean;
  timeSeconds: number;
  attempts: number;
  xpAwarded: number;
  badgeEarned?: string;
}
```
- Base XP per challenge: configurable per module (default 100).
- Bonus XP for first-attempt completion.
- No penalty for retries — encourage experimentation.

## Head-Tilt Mechanic
- Detect XRFrame head pose roll angle.
- Tolerance band ± 5° for alignment tasks.
- Visual guide: target indicator with live angle readout.
- Seated-safe: head tilt ≤ 30° from neutral (no neck strain).

## Gaze Mechanic
- Use XRFrame viewer pose to get forward direction.
- Raycast from viewer origin in forward direction.
- Dwell timer: fill ring UI around target over N seconds.
- Cancel if gaze breaks before dwell completes.
