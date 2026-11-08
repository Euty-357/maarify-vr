---
name: quest-performance-budget
description: >
  Performance budgets, profiling, instancing, texture compression, LOD,
  dynamic quality scaling, and fixed-timestep execution for Meta Quest 3 and Quest 2.
  Load when optimising scenes or reviewing performance.
---

# Quest Performance Budget & Quality Skill

## Target Headsets & Quality Tiers
- **Primary Development Target:** Meta Quest 3 (Snapdragon XR2 Gen 2)
- **Supported Headsets:** Meta Quest 3S, Meta Quest 2 (Baseline performance floor)

### Quality Tiers Matrix
| Metric | Tier A (Quest 2 Baseline) | Tier B (Quest 3 / 3S Provisional) | Notes |
| :--- | :--- | :--- | :--- |
| **Target Frame Rate** | 72 fps | 90 fps / 120 fps | Configured via `updateTargetFrameRate()` |
| **Triangles per Scene** | $< 100,000$ | $< 250,000$ *(Provisional)* | Hard limit checked in `check-budgets.mjs` |
| **Draw Calls per Scene** | $< 100$ | $< 180$ *(Provisional)* | Strict batching / instancing required |
| **Textures** | KTX2 Basis Universal | KTX2 Basis Universal | ETC1S for color, UASTC for normals |
| **Fixed Foveation (FFR)** | 0.8 to 1.0 | 0.0 to 0.5 (Dynamic) | Adjusted via `baseLayer.fixedFoveation` |
| **Realtime Shadows** | Forbidden | Prohibited (Use contact blobs) | Saves 1 full scene render pass |

*(All Tier B figures are provisional and marked "NOT measured on device" until calibrated on physical Quest 3).*

---

## Dynamic Quality Engine
```ts
export class DynamicQualityController {
  private frameTimes: number[] = [];
  private currentScale = 1.0;
  private currentFoveation = 0.0;

  update(frameDeltaMs: number, session: XRSession, baseLayer: XRWebGLLayer) {
    this.frameTimes.push(frameDeltaMs);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const avgMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const targetBudgetMs = 1000 / (session.frameRate || 72);

    // If frame time exceeds 85% of budget, scale foveation up and resolution down
    if (avgMs > targetBudgetMs * 0.85) {
      if (baseLayer.fixedFoveation !== undefined) {
        this.currentFoveation = Math.min(1.0, this.currentFoveation + 0.1);
        baseLayer.fixedFoveation = this.currentFoveation;
      }
    } else if (avgMs < targetBudgetMs * 0.6) {
      if (baseLayer.fixedFoveation !== undefined) {
        this.currentFoveation = Math.max(0.0, this.currentFoveation - 0.05);
        baseLayer.fixedFoveation = this.currentFoveation;
      }
    }
  }
}
```

---

## Fixed-Timestep Simulation Loop
Physics and numerical calculations must run on a fixed internal clock decoupled from display refresh:
```ts
export class FixedTimestepAccumulator {
  private accumulator = 0;
  private readonly dt: number; // e.g. 1 / 120 = 0.00833s

  constructor(fixedHz = 120) {
    this.dt = 1 / fixedHz;
  }

  step(realDeltaSec: number, updatePhysics: (dt: number) => void): number {
    this.accumulator += Math.min(realDeltaSec, 0.1); // Clamp to prevent spiral of death

    while (this.accumulator >= this.dt) {
      updatePhysics(this.dt);
      this.accumulator -= this.dt;
    }

    return this.accumulator / this.dt; // Alpha for rendering interpolation
  }
}
```
