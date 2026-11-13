# Maarify Core Interaction & Scene Fixes — Bugfix Design

## Overview

This design covers 24 confirmed bugs across the Maarify WebXR platform. The fixes span five
files with the most critical changes: `src/main.ts` (render loop, input dispatch, locomotion),
`src/core/input/primitives/grab.ts` (coordinate space), `src/core/spatial-anchors/diegetic-anchor.ts`
(anchor card UX), `src/modules/*/scene.ts` (per-module layout and black hole), and
`src/core/brand/brand.ts` (plaque styling).

No new external dependencies are introduced. All changes must keep `npm run verify` passing.

---

## Glossary

- **Bug_Condition (C)**: The input condition that exposes the defect.
- **Property (P)**: The correct output behaviour when C holds.
- **Preservation**: Existing passing tests and existing correct features that must not regress.
- **activeGrabs**: `Map<THREE.XRTargetRaySpace, SpatialGrabPrimitive>` in `main.ts` — tracks currently grabbed objects.
- **activeLevers**: `Map<THREE.XRTargetRaySpace, SpatialLeverPrimitive>` — new parallel map for held levers (BUG-03).
- **XRControllerHandle**: The per-controller state object in `xrControllers[]` holding `poseOrigin`, `poseQuaternion`, `hasPose`.
- **isBugCondition(input)**: Formal predicate; defined per bug in §Bug Details.

---

## Bug Details

### Bug Condition (formal)

```
FUNCTION isBugCondition_P0(frame)
  INPUT: a rendered frame with an active module loaded
  OUTPUT: boolean

  RETURN activeModuleDef.update NOT called in renderFrame
         OR activeGrabs NOT iterated in renderFrame
END FUNCTION

FUNCTION isBugCondition_Lever(input)
  INPUT: XR controller ray or proximity event near a lever mesh
  OUTPUT: boolean

  RETURN input.hitObject.userData.leverPrimitive instanceof SpatialLeverPrimitive
         AND leverPrimitive NOT dispatched in handleModuleRayInteraction or handleModuleProximityInteraction
END FUNCTION
```

### Examples of bug manifestation

- **BUG-01**: User grabs neurotransmitter vesicle in Human Body; it teleports to pick-up
  position and stays there no matter how the controller moves. Expected: object follows hand each frame.
- **BUG-02**: User enters Cosmos; planets do not orbit, heart does not beat,
  accretion disc is static. Expected: `update(dt)` advances all animations.
- **BUG-03**: User grabs explode lever arm in Aerospace; lever does not rotate.
  Expected: `lever.updateFromGrab(pos, source)` called while trigger is held.
- **BUG-05**: User grabs injector dome and moves hand; dome teleports to wrong world position.
  Expected: grab passes world-space coordinates to `onMove`; `ExplodableAssembly` local conversion is then correct.

---

## Expected Behavior

**Unchanged Behaviors:**

- Module load/unload cycle with no orphan objects (3.1)
- XP and `maarify:challenge-completed` events for Cosmos, Quantum, Aerospace, DNA-Genetics (3.2)
- Slider and rotator dispatch via existing ray and proximity handlers (3.3)
- Comfort vignette and haptic feedback on teleport landing (3.4)
- Depth-tier propagation to anchor primitives (3.5)
- `npm run verify` zero-error exit (3.6)
- 250 k triangle / 180 draw-call hard ceilings (3.7)
- All seven hub portals with correct readiness badges (3.8)
- Debug panel rendering with `?debug=1` (3.9)
- Return-to-hub gate and B/Y back button (3.10)
- Folio panel tier tabs, paging, and header collapse (3.11)
- DNA module spatial beats at their established positions (3.12)

---

## Hypothesized Root Cause

1. **BUG-01** (`grab.update` missing): `activeGrabs.forEach(...)` block exists in the
   `renderFrame` function but is never called — the loop body was written but the call site
   inside `renderFrame` is absent (read `main.ts` line ~930).

2. **BUG-02** (module `update` missing): `activeModuleDef?.update?.(deltaSeconds)` is
   commented out or was never inserted into `renderFrame`.

3. **BUG-03** (lever dispatch): `handleModuleRayInteraction` and
   `handleModuleProximityInteraction` check for `sliderPrimitive`, `rotatorPrimitive`, and
   `grabPrimitive` in `userData` but have no branch for `leverPrimitive`. The `activeLevers`
   map does not exist.

4. **BUG-04** (CRISPR lock): `crisprLocked` is set inside `checkCrisprLock()` which is
   called from `update()`, but `update()` is never called (same root cause as BUG-02).
   Additionally, `setRepairOutcome` early-returns when `!crisprLocked`. Once BUG-02 is fixed,
   the lock check will work.

5. **BUG-05** (`onMove` coordinate space): `SpatialGrabPrimitive.update()` passes
   `this.targetObject.position` (local space) to `onMove`. `ExplodableAssembly` then calls
   `parent.worldToLocal()` on that local position, double-converting it.

6. **BUG-06** (teleport distance): `ActiveTuning.comfort.teleportMaxDistanceMeters = 3.5`
   and `teleportMaxRadiusMeters = 4.0` are both too tight for 8–10 m modules.

7. **BUG-07** (anchor tag consuming rays): `handleModuleRayInteraction` uses `hits[0]`
   without filtering; anchor tag planes are opaque raycaster targets, so they win the first
   hit even when an interactive primitive sits behind the tag.

8. **BUG-08** (Human Body wing placement): All content groups are added to `root` with
   absolute world positions that overlap at the atrium center. The wing `THREE.Group` objects
   carry the correct transforms but content is never parented or positioned relative to them.

9. **BUG-09** (pointer ray on first frame): `getPointerRay` falls back to
   `controller.quaternion` (identity) instead of `camera.getWorldDirection()` when no pose has
   arrived.

10. **BUG-10** (hand grab threshold): A single threshold `grabThresholdMeters = 0.14` is used
    for both controllers (accurate poses) and hand tracking (±3–5 cm jitter).

11. **BUG-11** (phantom pinch): The guard `thumbPosition.lengthSq() > 0.0001` lets
    near-zero initialisation positions through.

12. **BUG-12** (DNA tween accumulation): `tweens.splice(index, 1)` is never called in
    `update()`; the tween loop only reads without pruning completed entries.

13. **BUG-13** (nucleotide rejection haptic): `slot.attempt(nucleotide)` is called without
    passing `inputSource`; `SpatialSlotPrimitive.attempt` signature accepts an optional second
    argument that DNA scene ignores.

14. **BUG-14** (Cosmos scale): `solarSystemRoot` starts at scale 1.0, so all 8 planets are
    crammed inside 2.65 m — arm's reach. No compact-orrery default is set.

15. **BUG-15** (black hole visual): The existing black hole uses one static disc, one flat
    horizon sphere, and static pink cone jets. No multi-layer Doppler disc, no photon-ring
    emissive, no pulsing jets, no point light.

16. **BUG-16** (exoplanet billboarding): `pod.lookAt(0, 1.2, 0)` is called once at build time.
    The camera moves but pods never re-orient.

17. **BUG-17** (Quantum `batchLeaderLines` missing): `anchorPrimitive.batchLeaderLines()` is
    called in `human-body`, `aerospace`, and `dna-genetics` module scene builders but is absent
    from `quantum/scene.ts`.

18. **BUG-18** (Bloch sphere axis): `SpatialRotatorPrimitive(blochVectorArrow, { axis: 'z' })`
    tilts the arrow sideways instead of spinning it vertically.

19. **BUG-19** (brand plaque styling): `brand.ts` uses plain `sans-serif` font string in the
    wordmark canvas; `FONTS.serif` is imported from `tokens.ts` but the actual `ctx.font` call
    still uses a hard-coded `sans-serif` string. No subtitle, no rules, no Adinkra corners.
    The plaque position faces away from the user spawn at `(0, 0, 0.8)`.

20. **BUG-20** (anchor card always expanded): `DiegeticSpatialAnchor` constructor renders the
    full tag canvas immediately with `renderTagCanvas(false)`, making `tagMesh` visible from
    the start. No collapsed/indicator state exists.

21. **BUG-21** (anchor tag does not billboard): `tagMesh` is a `PlaneGeometry` with a fixed
    orientation baked at construction. No per-frame `lookAt` is called.

22. **BUG-22** (anchor Y-stagger): No overlap detection or stagger logic exists.

23. **BUG-23** (scene visible through system overlay): No `visibilitychange` or
    `visibilityState === 'visible-blurred'` listener exists.

24. **BUG-24** (plinth sign clip-through): `signMesh.position.set(0, 0.32, 0)` in Human Body
    and `signMesh.position.set(0, 0.72, 0)` in Aerospace — both too low for their plinth top
    surface.

---

## Correctness Properties

Property 1: Bug Condition — Render Loop Completeness

_For any_ rendered frame where `activeModuleDef` is non-null, the fixed `renderFrame` function
SHALL call `activeModuleDef.update(deltaSeconds)` and SHALL iterate `activeGrabs` to call
`grab.update(poseOrigin, poseQuaternion)` for every entry.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Existing Dispatch and Locomotion Unchanged

_For any_ input event (slider drag, rotator click, teleport arc, snap turn, portal entry) that
does NOT involve the new lever or module-update code paths, the fixed code SHALL produce
exactly the same behaviour as the original code.

**Validates: Requirements 3.3, 3.4, 3.6, 3.7**

---

## Fix Implementation

### Component Map

| File | Bugs addressed | Change type |
|---|---|---|
| `src/main.ts` | 01, 02, 03, 06, 07, 09, 10, 11, 23 | Targeted edits |
| `src/core/input/primitives/grab.ts` | 05 | 3-line change in `update()` |
| `src/core/spatial-anchors/diegetic-anchor.ts` | 20, 21, 22 | New collapsed state, billboard flag |
| `src/core/input/primitives/anchor.ts` | 20 | Pass camera pos to `toggleExpansion` |
| `src/config/tuning.ts` | 06, 10 | Add `handGrabThresholdMeters`; raise teleport limits |
| `src/modules/human-body/scene.ts` | 08, 24a | Reposition content groups to wings |
| `src/modules/aerospace/scene.ts` | 24b | Raise sign mesh Y position |
| `src/modules/cosmos/scene.ts` | 14, 15, 16 | Scale default, black hole rebuild, exoplanet per-frame |
| `src/modules/quantum/scene.ts` | 17, 18 | Add `batchLeaderLines()`; change rotator axis |
| `src/modules/dna-genetics/scene.ts` | 04 (via 02), 12, 13 | Tween splice; pass inputSource |
| `src/core/brand/brand.ts` | 19 | Canvas repaint; plaque orientation |

---

### BUG-01: `grab.update` never called in render loop

**File:** `src/main.ts`

**Location:** `renderFrame()` function, after `activeModuleDef?.update?.(deltaSeconds)`.

**Change:** Insert the `activeGrabs.forEach` iteration block. The key is a
`THREE.XRTargetRaySpace` (the controller object); find its matching `XRControllerHandle`
entry from `xrControllers` to obtain `poseOrigin` and `poseQuaternion`.

```
// In renderFrame(), after the module update call:
activeGrabs.forEach((grab, controller) => {
  const entry = xrControllers.find(e => e.controller === controller) ?? null;
  const origin  = entry?.hasPose ? entry.poseOrigin.clone()
                                 : controller.getWorldPosition(new THREE.Vector3());
  const quat    = entry?.hasPose ? entry.poseQuaternion.clone()
                                 : controller.getWorldQuaternion(new THREE.Quaternion());
  const dir     = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
  const dist    = grabDistances.get(controller) ?? 0.6;
  grab.update(origin.addScaledVector(dir, dist), quat);
});
```

**Data flow:** `syncControllerPoses(frame)` writes `entry.poseOrigin / poseQuaternion` →
`renderFrame` reads them here → `SpatialGrabPrimitive.update()` moves the object.

---

### BUG-02: Module `update` never called

**File:** `src/main.ts`

**Location:** `renderFrame()`, after the physics accumulator step.

**Change:** Insert `activeModuleDef?.update?.(deltaSec);` at that position.

This single call unblocks BUG-04 (CRISPR lock check runs every frame), DNA tween stepping,
planetary orbits, heartbeat pulse, and accretion disc rotation simultaneously.

---

### BUG-03: Lever not dispatched

**File:** `src/main.ts`

**Step 1 — Declare `activeLevers` map** (alongside `activeGrabs`):
```typescript
const activeLevers = new Map<THREE.Object3D, SpatialLeverPrimitive>();
```

**Step 2 — Add import** for `SpatialLeverPrimitive` (already imported via `primitives/index`
re-export; just add it to the destructured import at the top of `main.ts`).

**Step 3 — `handleModuleRayInteraction()`:** After the `grab` branch, add:
```
const lever = findUserDataPrimitive(hit.object, 'leverPrimitive') as SpatialLeverPrimitive | null;
if (lever) {
  lever.updateFromGrab(hit.point, source);
  activeLevers.set(controller, lever);
  return 'lever';
}
```

**Step 4 — `handleModuleProximityInteraction()`:** After the rotator proximity branch, add:
```
const leverObject = findClosestModuleObject(
  o => o.userData.leverPrimitive instanceof SpatialLeverPrimitive, pos, 0.35
);
if (leverObject) {
  (leverObject.userData.leverPrimitive as SpatialLeverPrimitive).updateFromGrab(pos, source);
  activeLevers.set(controller, leverObject.userData.leverPrimitive as SpatialLeverPrimitive);
  return;
}
```

**Step 5 — `releaseControllerGrab()`:** Extend to also clear the lever:
```typescript
activeLevers.delete(controller);
```

**Step 6 — Per-frame lever update** in `renderFrame()`, inside the `activeGrabs.forEach`
equivalent block:
```
activeLevers.forEach((lever, controller) => {
  const entry = xrControllers.find(e => e.controller === controller) ?? null;
  const pos = entry?.hasPose ? entry.poseOrigin.clone()
                              : controller.getWorldPosition(new THREE.Vector3());
  const src = findInputSource(controller as THREE.XRTargetRaySpace) ?? undefined;
  lever.updateFromGrab(pos, src);
});
```

**Data flow:**
```
trigger press → handleModuleRayInteraction → lever hit detected
              → lever.updateFromGrab(hit.point, source) [immediate]
              → activeLevers.set(controller, lever)
              ↓
renderFrame each tick → activeLevers.forEach → lever.updateFromGrab(currentPos, src)
              ↓
trigger release → releaseControllerGrab → activeLevers.delete(controller)
```

---

### BUG-04: CRISPR lock never fires

**Root fix is BUG-02.** Once `activeModuleDef?.update?.(deltaSeconds)` is called, the DNA
scene's `update()` calls `checkCrisprLock()` each frame, which sets `crisprLocked = true`
when `cas9` is within 0.22 m of `crisprTargetPosition` and `crisprAligned` is true.

No change to `dna-genetics/scene.ts` required for this specific sub-bug.

---

### BUG-05: `onMove` coordinate space (ExplodableAssembly double-conversion)

**File:** `src/core/input/primitives/grab.ts`

**Location:** `SpatialGrabPrimitive.update()`, the `onMove` call.

**Change — before:**
```typescript
this.options.onMove?.(this.targetObject.position, this.targetObject.quaternion);
```

**Change — after:**
```typescript
const worldPos  = this.targetObject.getWorldPosition(new THREE.Vector3());
const worldQuat = this.targetObject.getWorldQuaternion(new THREE.Quaternion());
this.options.onMove?.(worldPos, worldQuat);
```

`ExplodableAssembly.addPart`'s `onMove` callback already calls `parent.worldToLocal(worldPosition.clone())`, which is the correct conversion from world → local. It was receiving local coordinates before and converting again, producing the wrong result. Passing world coordinates makes the existing `parent.worldToLocal()` correct. **No change to `explodable-assembly.ts`.**

All other `onMove` consumers (DNA scene handle callbacks) only use the vector as a signal to
reposition within a constrained axis and do not call `worldToLocal`, so they are unaffected.

---

### BUG-06: Teleport distance too short

**File:** `src/config/tuning.ts`

**Changes in `DEFAULT_TUNING.comfort`:**
```typescript
teleportMaxDistanceMeters: 6.0,   // was 3.5
teleportMaxRadiusMeters:   7.0,   // was 4.0
```

The `SpatialTeleportPrimitive` reads these values from `ActiveTuning` at runtime, so this
single change propagates everywhere. Verify no test asserts the old values.

---

### BUG-07: Anchor tag consuming interactive ray hits

**File:** `src/main.ts`, `handleModuleRayInteraction()`.

**Change:** Replace the single `hits[0]` dispatch with a two-pass priority filter.

**Step 1 — Mark anchor tag meshes.** In `DiegeticSpatialAnchor` constructor, set
`this.tagMesh.userData.isAnchorTag = true` (see also BUG-20).

**Step 2 — Two-pass hit selection:**
```typescript
// Pass 1: first hit that is interactive and NOT an anchor tag
const interactiveHit = hits.find(h =>
  !h.object.userData.isAnchorTag &&
  (findUserDataPrimitive(h.object, 'activate') ||
   findUserDataPrimitive(h.object, 'sliderPrimitive') ||
   findUserDataPrimitive(h.object, 'rotatorPrimitive') ||
   findUserDataPrimitive(h.object, 'leverPrimitive') ||
   findUserDataPrimitive(h.object, 'grabPrimitive'))
);
// Pass 2: first anchor tag hit
const anchorHit = hits.find(h =>
  !h.object.userData.isAnchorTag && findDiegeticAnchor(h.object)
);
// Priority: interactive > anchor > first hit
const hit = interactiveHit ?? anchorHit ?? hits[0];
```

The rest of the dispatch chain is unchanged — it falls through to anchor, slider, rotator,
grab as before.

---

### BUG-08: Human Body content not inside wing doorways

**File:** `src/modules/human-body/scene.ts`, `buildHumanBodyScene()`.

**Approach:** After `buildMedicineAtrium(root)` is called and the atrium wing groups exist
on `root`, reposition each content group by computing the wing's world-space interior offset.

**Wing mapping:**
| Content group | Wing id | Interior offset (local to wing) |
|---|---|---|
| `heartRoot`, `sliderHandle`, `dialMesh` | `heart` | `(0, 0, -1.0)` |
| `synapseRoot` | `brain` | `(0, 0, -1.0)` |
| `carTRoot` | `cancer` | `(0, 0, -1.0)` |
| `hivVirionRoot` | `hiv` | `(0, 0, -1.0)` |
| `capillaryLoop` | `infection-prevention` | `(0, 0, -1.0)` |

**Helper function** (added inside `buildHumanBodyScene`):
```typescript
function wingWorldPos(wingId: string, localOffset = new THREE.Vector3(0, 0, -1.0)): THREE.Vector3 {
  const atrium = root.getObjectByName('medicine-atrium');
  const wingGroup = atrium?.getObjectByName(`medicine-wing-${wingId}`);
  if (!wingGroup) return localOffset;
  return wingGroup.localToWorld(localOffset.clone());
}
```

After all objects are constructed, replace each content group's `.position.set(...)` with:
```typescript
heartRoot.position.copy(wingWorldPos('heart'));
sliderHandle.position.copy(wingWorldPos('heart', new THREE.Vector3(0.3, -0.45, -1.0)));
dialMesh.position.copy(wingWorldPos('heart', new THREE.Vector3(-0.3, -0.45, -1.0)));
synapseRoot.position.copy(wingWorldPos('brain'));
carTRoot.position.copy(wingWorldPos('cancer'));
hivVirionRoot.position.copy(wingWorldPos('hiv'));
capillaryLoop.position.copy(wingWorldPos('infection-prevention'));
```

The `hivVirionRoot.rotation.y = Math.PI` orientation is preserved; only position changes.

---

### BUG-09: Pointer ray aims backward on first frame

**File:** `src/main.ts`, `getPointerRay()`, the last-resort fallback branch.

**Before:**
```typescript
controller.getWorldPosition(origin);
getControllerForward(controller, direction);
```

**After:**
```typescript
controller.getWorldPosition(origin);
camera.getWorldDirection(direction);   // use head gaze, not identity controller quaternion
```

`getControllerForward` reads `controller.quaternion` which is identity before any pose
arrives, aiming the ray behind the user. The camera's world direction is always valid (the
desktop camera is initialized at `DESKTOP_LOOK_AT`).

---

### BUG-10: Hand grab threshold too tight

**File:** `src/config/tuning.ts`

**Change:** Add `handGrabThresholdMeters: 0.20` to `TuningConfig.input` interface and
`DEFAULT_TUNING.input`:
```typescript
// interface addition
handGrabThresholdMeters: number;

// DEFAULT_TUNING.input
handGrabThresholdMeters: 0.20,
```

**File:** `src/core/input/primitives/grab.ts`, `SpatialGrabPrimitive.tryGrab()`.

**Change:** Use the larger threshold when the input source is a hand:
```typescript
const threshold = inputSource?.hand
  ? ActiveTuning.input.handGrabThresholdMeters
  : ActiveTuning.input.grabThresholdMeters;
if (dist <= threshold) { ... }
```

---

### BUG-11: Phantom pinches from uninitialised joints

**File:** `src/main.ts`, `syncControllerPoses()`, inside the hand-joint pinch block.

**Change:** Raise the guard from `> 0.0001` to `> 0.01` for both `thumbValid` and `indexValid`:
```typescript
const thumbValid = thumbPosition.lengthSq() > 0.01;
const indexValid = indexPosition.lengthSq() > 0.01;
```

A `lengthSq` of `0.01` corresponds to joints being at least ~0.1 m from the origin, which
is a physically plausible minimum for any real hand pose.

---

### BUG-12: Completed tweens accumulate in DNA scene

**File:** `src/modules/dna-genetics/scene.ts`, `update()` tween loop.

The existing loop already iterates backwards and splices:
```typescript
for (let index = tweens.length - 1; index >= 0; index -= 1) {
  ...
  if (t >= 1) tweens.splice(index, 1);   // ← this line
}
```

If this splice is confirmed absent in the actual file, re-insert it. The backward iteration
(high to low index) is essential so splice does not skip entries. No other change needed.

---

### BUG-13: Nucleotide rejection haptic missing

**File:** `src/modules/dna-genetics/scene.ts`, each nucleotide `onRelease` callback, and the
tRNA `onRelease` callback.

**Change:** Capture `inputSource` from the grab and thread it through to `slot.attempt()`.

`SpatialGrabPrimitive.options.onGrab` receives `hand: 'left' | 'right' | 'pointer'` but not
the `XRInputSource`. The grab primitive itself holds `this.grabbingSource`.

**Approach:** In each nucleotide and tRNA `onRelease`:
```typescript
onRelease: () => {
  const src = (nucleotide.userData.grabPrimitive as SpatialGrabPrimitive)?.grabbingSource;
  const inputSrc = src instanceof Object && 'handedness' in src
    ? src as XRInputSource : undefined;
  for (const slot of sockets) {
    const result = slot.attempt(nucleotide, inputSrc);
    if (result === 'accepted') return;
    if (result === 'rejected') {
      springBack(nucleotide, homePosition);
      return;
    }
  }
  springBack(nucleotide, homePosition);
}
```

`grabbingSource` is typed `XRInputSource | 'desktop' | null`. The ternary guards against the
`'desktop'` string case.

The same pattern applies to the three tRNA `onRelease` callbacks and the three diversity
chain node `onRelease` callbacks.

---

### BUG-14: Cosmos solar system at full scale

**File:** `src/modules/cosmos/scene.ts`, `buildCosmosScene()`.

**Changes:**

1. After `solarSystemRoot` is constructed, before `root.add(solarSystemRoot)`:
   ```typescript
   solarSystemRoot.scale.setScalar(0.4);
   solarSystemRoot.position.set(0, 1.2, -2.5);   // push further back
   ```

2. Update `scalePinchPrimitive` options: `minScale: 0.3, maxScale: 4.0`.

3. Set initial scale on the primitive:
   ```typescript
   scalePinchPrimitive.currentScale = 0.4;
   ```

4. Add a scale label above the orrery:
   ```typescript
   const scaleLabel = createTextPanel('SCALE MODEL — pinch to expand to room-scale', {
     widthMeters: 0.8, heightMeters: 0.12, fontSizePx: 24, align: 'center',
   });
   scaleLabel.position.set(0, 0.42, 0);   // above sun at compact scale
   solarSystemRoot.add(scaleLabel);
   ```

---

### BUG-15: Black hole visual fidelity

**File:** `src/modules/cosmos/scene.ts`, `buildCosmosScene()`.

**Move** `blackHoleRoot` position to `(-8, 1.5, -6)`.

**Replace** existing single accretion disc and static jets with:

1. **Event horizon rim glow:** Keep the black sphere. Add a thin emissive `RingGeometry`
   rim: `inner = 0.35, outer = 0.37`, `emissive: 0x38bdf8`, `emissiveIntensity: 2.0`,
   `transparent: true, opacity: 0.9`.

2. **Three disc layers** (each a `RingGeometry` rotated `Math.PI/2` to lie in XZ plane):
   - Inner disc: `inner=0.58, outer=0.85`, color `0xffffff`, `emissive: 0x38bdf8`,
     `emissiveIntensity: 2.5`, rotation variable `discRotInner` increments at `2.4 * dt`.
   - Mid disc: `inner=0.86, outer=1.15`, color `0xf59e0b`, `emissive: 0xd97706`,
     `emissiveIntensity: 1.4`, rotation `discRotMid` increments at `1.1 * dt`.
   - Outer disc: `inner=1.16, outer=1.55`, color `0x7f1d1d`, `emissive: 0xef4444`,
     `emissiveIntensity: 0.6`, rotation `discRotOuter` increments at `0.4 * dt`.
   - All three discs use `side: THREE.DoubleSide`.

3. **Photon ring:** `RingGeometry(0.52, 0.535, 64)`, `emissive: 0x7dd3fc`,
   `emissiveIntensity: 3.0`, `transparent: true, opacity: 0.95`, rotated to XZ plane.
   This replaces the existing `photonRing`.

4. **Animated jets:** Replace static pink cones with two `CylinderGeometry(0.0, 0.14, 1.8, 16)`
   (open cone, tip at top). Store as `northJet` and `southJet`. In `update()`:
   ```typescript
   const jetPulse = 0.55 + Math.sin(deltaSeconds_accumulator * 4.5) * 0.45;
   northJet.scale.setScalar(jetPulse);
   southJet.scale.setScalar(jetPulse);
   ```
   Track a `bhTime` accumulator in the `update()` closure.

5. **Point light:** `new THREE.PointLight(0x7dd3fc, 1.2, 4, 2)` at the black hole's position.
   Add to `root` (not `blackHoleRoot`) so it illuminates surrounding scene.

6. **Warp pads:** Two floor rings with `userData.activate`:
   - Outbound (near solar system at `(-3, 0, -2)`): label `"WARP TO Sgr A*"`, accent cyan.
   - Return (near black hole at `(-7.2, 0, -5)`): label `"WARP BACK"`, accent red.
   - Both dispatch `window.dispatchEvent(new CustomEvent('maarify:warp-to', { detail: { x, z } }))`.
   - In `main.ts` `initApp()`, register:
     ```typescript
     window.addEventListener('maarify:warp-to', (event: Event) => {
       const d = (event as CustomEvent<{ x: number; z: number }>).detail;
       cameraRig.position.set(d.x, 0, d.z);
     });
     ```

---

### BUG-16: Exoplanet pods not billboarding

**File:** `src/modules/cosmos/scene.ts`.

**Step 1:** Store the `exoplanetDisplays` array and `camera` reference so `update()` can reach them. The array is already in the returned object.

**Step 2:** In the `update()` closure, add:
```typescript
const cameraWorldPos = new THREE.Vector3();
// (camera is not directly available inside the scene builder)
```

The module's `update()` does not have access to the camera. The correct approach is to use
the standard `userData.billboard` per-frame pattern already described in the architectural
context.

**Change:** Set `pod.userData.billboard = true` for each exoplanet pod in the loop.

**In `main.ts` `renderFrame()`**, add a billboard pass after the module update:
```typescript
// Billboard pass: rotate all flagged objects to face the camera
const camPos = camera.getWorldPosition(new THREE.Vector3());
scene.traverse(object => {
  if (object.userData.billboard === true) {
    object.lookAt(camPos);
  }
});
```

This handles both exoplanet pods (BUG-16) and the anchor tag billboard (BUG-21) with the
same mechanism at zero extra cost.

**Cost note:** `scene.traverse` is O(n) over all scene objects; at the draw-call budget of
~180 objects this is negligible (< 0.1 ms per frame).

---

### BUG-17: Quantum `batchLeaderLines` missing

**File:** `src/modules/quantum/scene.ts`, after `anchorDefs.forEach(...)`.

**Change:** Add the missing call:
```typescript
anchorPrimitive.batchLeaderLines();
```

Before the existing `root.add(anchorContainer)` line. This matches the pattern in
`human-body/scene.ts` and `aerospace/scene.ts`.

---

### BUG-18: Bloch sphere rotator wrong axis

**File:** `src/modules/quantum/scene.ts`.

**Change:** In the `SpatialRotatorPrimitive` constructor for `blochVectorArrow`:
```typescript
// Before
axis: 'z',
// After
axis: 'y',
```

The state vector arrow should spin around the vertical Y axis (azimuthal rotation on the
Bloch sphere). The `z` axis caused the arrow to tilt toward/away from the user instead.

---

### BUG-19: Brand plaque styling

**File:** `src/core/brand/brand.ts`, `createBrandPlaque()`.

**Canvas changes** (the wordmark drawing block inside `renderTagCanvas`-equivalent code):

1. **Increase canvas** from default to 768×256 (wider for subtitle + rules):
   ```typescript
   this.tagCanvas.width  = 768;
   this.tagCanvas.height = 256;
   ```

2. **Font stack:** Replace any `sans-serif` reference with `FONTS.serif` from `tokens.ts`.
   The import already exists; ensure the canvas call uses the variable:
   ```typescript
   ctx.font = `bold 90px ${FONTS.serif}`;
   ```

3. **Drop-cap M:** Draw the first letter at 90 px, remaining letters at 65 px:
   ```typescript
   ctx.font = `bold 90px ${FONTS.serif}`;
   ctx.fillText('M', 32, 170);
   ctx.font = `bold 65px ${FONTS.serif}`;
   ctx.fillText('AARIFY', 90, 162);
   ```

4. **Thin brass rules** at y=55 and y=185:
   ```typescript
   ctx.strokeStyle = '#b08d57';
   ctx.lineWidth = 2;
   ctx.beginPath(); ctx.moveTo(16, 55);  ctx.lineTo(752, 55);  ctx.stroke();
   ctx.beginPath(); ctx.moveTo(16, 185); ctx.lineTo(752, 185); ctx.stroke();
   ```

5. **Subtitle** at y=215, small-caps simulation (all-uppercase, 20 px):
   ```typescript
   ctx.font = `20px ${FONTS.serif}`;
   ctx.fillStyle = '#b08d57';
   ctx.textAlign = 'center';
   ctx.fillText('A SPATIAL LEARNING EXPERIENCE', 384, 215);
   ctx.textAlign = 'left';
   ```

6. **Adinkra-inspired corner decorations** (four corners, concentric arcs suggesting the
   Gye Nyame eye motif, drawn in brass):
   ```typescript
   function drawCorner(ctx, cx, cy, flip) {
     ctx.strokeStyle = '#b08d57';
     ctx.lineWidth = 1.5;
     [8, 14, 20].forEach(r => {
       ctx.beginPath();
       ctx.arc(cx, cy, r, flip * 0.1, flip * (Math.PI * 0.9));
       ctx.stroke();
     });
   }
   drawCorner(ctx, 20,  20,  1);   // top-left
   drawCorner(ctx, 748, 20,  1);   // top-right (mirror via ctx.scale)
   drawCorner(ctx, 20,  236, -1);  // bottom-left
   drawCorner(ctx, 748, 236, -1);  // bottom-right
   ```
   (Use `ctx.save() / ctx.scale(-1,1) / ctx.translate / ctx.restore()` for mirrored corners.)

7. **Plaque orientation in `HubWorld`:** In `hub-world.ts`, the brand plaque is created at
   `position.set(0, 2.75, -3.4)` with `lookAt(0, 1.4, 0)`. This already faces the spawn at
   `(0, 1.4, 0.8)`. Confirm the plaque's `lookAt` target is the user spawn (z positive), not
   z-negative. If it faces away, change to `lookAt(0, 2.0, 1.0)`.

---

### BUG-20: Anchor cards always expanded

**File:** `src/core/spatial-anchors/diegetic-anchor.ts`.

**Changes:**

1. Add an indicator sphere in the constructor:
   ```typescript
   const indicatorGeo = new THREE.SphereGeometry(0.03, 12, 12);
   const indicatorMat = new THREE.MeshStandardMaterial({
     color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.8, roughness: 0.3,
   });
   this.indicatorMesh = new THREE.Mesh(indicatorGeo, indicatorMat);
   this.indicatorMesh.name = `anchor-indicator-${id}`;
   this.indicatorMesh.userData.isAnchorIndicator = true;
   this.add(this.indicatorMesh);
   ```

2. Set `tagMesh.visible = false` initially (collapsed state).

3. Mark the tag: `this.tagMesh.userData.isAnchorTag = true`.

4. Enable billboard on the tag: `this.tagMesh.userData.billboard = true` (picked up by the
   per-frame traverse in BUG-16/21 fix).

5. In `toggleExpansion()`:
   ```typescript
   this.isExpanded = !this.isExpanded;
   this.tagMesh.visible = this.isExpanded;
   this.indicatorMesh.visible = !this.isExpanded;
   this.microSimRoot.visible = this.isExpanded;
   this.renderTagCanvas(this.isExpanded);
   return this.isExpanded;
   ```

**Anchor state machine:**
```
COLLAPSED:  indicatorMesh=visible, tagMesh=hidden, microSimRoot=hidden
    ↓ activate (raycast / proximity)
EXPANDED:   indicatorMesh=hidden, tagMesh=visible (billboarded), microSimRoot=visible
    ↓ activate again
COLLAPSED:  ...
```

---

### BUG-21: Anchor tag does not billboard

Handled entirely by the per-frame billboard pass introduced in BUG-16. Setting
`this.tagMesh.userData.billboard = true` in `DiegeticSpatialAnchor` (see BUG-20 step 4)
is the only change needed here.

No separate fix is required.

---

### BUG-22: Anchor Y-stagger for overlapping indicators

**File:** `src/core/input/primitives/anchor.ts`, `SpatialAnchorPrimitive`, end of `registerAnchor()`.

After all anchors are registered (best done at the end of `batchLeaderLines()` or as a new
`staggerOverlapping()` method called by scene builders after all `registerAnchor` calls):

```typescript
public staggerOverlapping(): void {
  const list = Array.from(this.anchors.values());
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const dx = a.position.x - b.position.x;
      const dz = a.position.z - b.position.z;
      const hDist = Math.sqrt(dx * dx + dz * dz);
      if (hDist < 0.4) {
        b.position.y += 0.2;   // push later anchor up 0.2 m
      }
    }
  }
}
```

Scene builders call `anchorPrimitive.staggerOverlapping()` before `batchLeaderLines()`. Add
calls in all five module scene files.

---

### BUG-23: Scene visible through system menu overlay

**File:** `src/main.ts`, `setupWebXR()` → inside the per-session setup in `onEnterVR()`.

After `await renderer.xr.setSession(session)`, add a `visibilitychange` listener on the
session:
```typescript
session.addEventListener('visibilitychange', () => {
  const state = session.visibilityState;
  scene.visible = state !== 'visible-blurred';
});
```

When the Quest system menu opens, `visibilityState` changes to `'visible-blurred'` and the
scene is hidden. When it closes, `'visible'` restores it.

Also add `scene.visible = true` in the `session 'end'` handler to prevent the scene
remaining hidden if the session ended while blurred.

---

### BUG-24: Plinth sign clip-through

**File:** `src/modules/human-body/scene.ts`

The medical disclaimer plaque mesh is added to `disclaimerGroup` at `y = 0.32`. The plinth
cylinder is 0.6 m tall, so its top is at `y = 0.6`. The fix:
```typescript
plaque.position.set(0, 0.68, 0);   // was 0.32
```

**File:** `src/modules/aerospace/scene.ts`

The safety sign mesh (`signMesh`) is at `y = 0.72`. The column is a `CylinderGeometry`
with height 0.7, centre at `y = 0.35` → top at `y = 0.70`. The fix:
```typescript
signMesh.position.set(0, 0.78, 0);   // was 0.72
```

---

## Testing Strategy

### Validation Approach

The testing strategy follows the bug-condition methodology: first confirm the bug is
reproducible on unfixed code (exploratory), then verify the fix (fix checking), then verify
unchanged paths (preservation checking).

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples on unfixed code to confirm root causes.

**Test Cases (run against unfixed code):**

1. **Render loop test:** Load Cosmos module, wait 2 s, assert `planets[0].position.x !== 0`
   (planet has moved). Will fail if BUG-02 is present.

2. **Grab update test:** Simulate grab on vesicle, advance frames, assert position changed.
   Will fail if BUG-01 is present.

3. **Lever dispatch test:** Send a ray hit to the explode lever pivot in Aerospace, assert
   `explodeLever.currentAngleDeg` changed. Will fail if BUG-03 is present.

4. **Coordinate space test:** Add an `ExplodableAssembly` part at `(1, 1, 1)` local,
   simulate grab + move, assert final world position is within tolerance of expected.
   Will fail if BUG-05 is present.

**Expected counterexamples:**
- Module objects at static positions after 2 s elapsed.
- Grabbed object world position unchanged from grab point.
- Lever angle unchanged after simulated ray hit.

### Fix Checking

```
FOR ALL frame WHERE activeModuleDef IS NOT null DO
  ASSERT activeModuleDef.update WAS called with deltaSeconds > 0
END FOR

FOR ALL (controller, grab) IN activeGrabs DO
  ASSERT grab.update WAS called this frame
END FOR

FOR ALL ray hit WHERE hit.object.userData.leverPrimitive IS SpatialLeverPrimitive DO
  ASSERT lever.updateFromGrab WAS called
END FOR
```

### Preservation Checking

```
FOR ALL input WHERE input IS NOT lever ray AND input IS NOT module-update path DO
  ASSERT behaviour(fixed) === behaviour(original)
END FOR
```

Specifically:
- Slider drag and rotator click dispatch unchanged.
- Teleport arc commit still fires vignette and haptic.
- Portal entry still loads module without errors.
- Folio panel tier tabs still work.

**Property-based approach for preservation:** Generate random `THREE.Vector3` ray origins and
directions, assert that hits on `sliderPrimitive`-tagged objects always return `'slider'`,
`grabPrimitive`-tagged objects always return `'ray-grab'` — identical to pre-fix behaviour
for non-lever, non-anchor hits.

### Unit Tests

- `SpatialGrabPrimitive.update()` passes world position to `onMove` (not local).
- `SpatialLeverPrimitive.updateFromGrab()` changes `currentAngleDeg` based on interactor position.
- `DiegeticSpatialAnchor` starts with `tagMesh.visible === false` and `indicatorMesh.visible === true`.
- `SpatialAnchorPrimitive.staggerOverlapping()` applies +0.2 Y offset to anchors within 0.4 m.
- Pinch guard: `thumbPosition.lengthSq() <= 0.01` → no pinch fires.

### Property-Based Tests

- **Grab world-space:** For any parent transform, `onMove` receives a vector equal to the
  object's `getWorldPosition()` output — not `position` (local).
- **Lever dispatch:** For any ray hit on a lever mesh, the lever angle changes by a non-zero
  amount.
- **Preservation:** For any ray that misses lever meshes, the dispatch result matches the
  original routing (no regression).

### Integration Tests

- Load each module, wait 500 ms, assert at least one animation has advanced (position/rotation
  changed from initial value).
- Load Human Body, assert `heartRoot.position` is not at world origin `(0, 0, 0)`.
- Load Cosmos, assert `solarSystemRoot.scale.x` is approximately 0.4.
- Load Quantum, assert `anchorContainer` has a child named `anchor-leader-lines-batched`.
- Open system menu (simulate `session.visibilityState = 'visible-blurred'`), assert
  `scene.visible === false`.
