# Bugfix Requirements Document

## Introduction

The Maarify WebXR educational platform (Three.js + TypeScript, targeting Meta Quest 3) has 23 confirmed bugs identified through video review and full source-code audit. These bugs collectively prevent users from interacting with any grabbed object, see all module animations dead, block challenge completion, and cause multiple UX and visual regressions across all five learning modules (Cosmos, Quantum, Human Body, Aerospace, DNA-Genetics) and the Hub world.

The bugs are grouped into four priority tiers: P0 (nothing works without these), P1 (high impact), P2 (interaction, physics, and per-module fixes), and P3 (anchor card UX redesign and scene visibility).

---

## Bug Analysis

### Current Behavior (Defect)

**P0 — Nothing Works Without These**

1.1 WHEN a user grabs any object in a module THEN the object freezes at the position it was picked up because `grab.update()` is never called in the render loop

1.2 WHEN any learning module is loaded THEN all module animations are dead (heart does not beat, planets do not orbit, accretion disc does not spin, DNA tweens do not step, blood cells do not flow, Bloch sphere does not rotate) because `activeModuleDef.update(deltaSeconds)` is never called in the render loop

1.3 WHEN a user interacts with any lever (aerospace explode lever, flow lever, density lever, cosmos thrust lever) THEN the lever does not respond because `leverPrimitive` is not dispatched in `handleModuleRayInteraction()` or `handleModuleProximityInteraction()`

1.4 WHEN a user aligns the CRISPR guide dial to 45° and moves Cas9 near the target THEN the CRISPR challenge cannot be completed because `crisprLocked` is never set to `true` and `setRepairOutcome()` always early-returns

1.5 WHEN a user grabs a part of the explodable rocket engine assembly THEN the part teleports to the wrong position because `SpatialGrabPrimitive.update()` passes `targetObject.position` (local coordinates) to `onMove`, which then double-converts via `parent.worldToLocal()` in `ExplodableAssembly`

**P1 — High Impact**

1.6 WHEN a user attempts to teleport to distant areas of Cosmos or Human Body modules THEN the teleport is rejected because `teleportMaxDistanceMeters: 3.5` is too short for modules spanning 8–10 m

1.7 WHEN a user points at an interactive object near an anchor info card THEN the click is consumed by the anchor tag because anchor tag meshes are opaque raycaster targets and `findUserDataPrimitive()` walks ancestors to return a truthy `activate`, blocking the intended target

1.8 WHEN a user enters the Human Body module THEN all interactive content (heart, capillary loop, synapse, HIV virion, CAR-T) appears at world-space positions overlapping the atrium center rather than inside their respective wing doorways

**P2 — Interaction and Physics**

1.9 WHEN the XR session starts and the first frame renders THEN the pointer ray aims behind the user because the last-resort fallback in `getPointerRay()` reads identity quaternion from the controller before any pose has arrived

1.10 WHEN a user with hand tracking attempts to grab an object THEN grabs regularly miss because the grab threshold `grabThresholdMeters: 0.14` is smaller than the ±3–5 cm hand pose jitter on Quest 3

1.11 WHEN an XR hand tracking session starts THEN phantom pinches fire because the guard `thumbPosition.lengthSq() > 0.0001` allows near-zero initialization positions through

1.12 WHEN the DNA module runs for an extended session THEN completed tweens accumulate in the `tweens` array indefinitely because finished tweens are never spliced out of the array

1.13 WHEN a user drops a nucleotide on the wrong base-pair socket THEN no haptic feedback fires on rejection because `slot.attempt()` is called without an `inputSource` argument

**P2 — Cosmos Module**

1.14 WHEN a user enters the Cosmos module THEN all planets in the solar system are within arm's reach (within 2.65 m) giving no sense of scale because `solarSystemRoot` starts at full scale with no compact default

1.15 WHEN a user views the Sagittarius A* black hole THEN it appears as a plain black sphere with a flat single-layer disc and static pink cones, with no physically realistic Schwarzschild structure, Doppler asymmetry, photon ring, or animated jet pulsing

1.16 WHEN exoplanet pods are built THEN `pod.lookAt()` is called only once at build time, so pods never face the user as they move around the scene

**P2 — Quantum Module**

1.17 WHEN a user enters the Quantum module THEN anchor leader lines appear incorrectly positioned because `anchorPrimitive.batchLeaderLines()` is never called in the quantum scene (unlike aerospace and human-body)

1.18 WHEN a user rotates the Bloch sphere state vector THEN the arrow tilts rather than spinning correctly because the `SpatialRotatorPrimitive` is configured with `axis: 'z'` instead of `axis: 'y'`

**P2 — Branding**

1.19 WHEN a user enters the Hub THEN the brand plaque faces away from the natural spawn viewpoint and the "MAARIFY" wordmark uses plain `sans-serif` canvas font with no Afro-academic styling, no Adinkra-inspired border geometry, and no "A SPATIAL LEARNING EXPERIENCE" subtitle

**P3 — Anchor Card UX**

1.20 WHEN any module loads THEN all anchor info cards immediately display their full tag at a fixed local offset regardless of camera position, causing cards to overlap each other and obstruct interactive objects

1.21 WHEN a user opens an anchor info card THEN the card does not billboard toward the camera; it stays fixed at its baked orientation

1.22 WHEN two or more anchor indicators are placed close together THEN they overlap at the same Y position with no vertical stagger to separate them

**P3 — Scene Visibility**

1.23 WHEN a user opens the Quest system menu while inside a module THEN scene content is visible through the system overlay because no `visibilitychange` listener hides the scene when `visibilityState === 'visible-blurred'`

1.24 WHEN a user reads the medical disclaimer or aerospace safety plaque THEN the sign mesh clips through the top of its supporting plinth because the sign is positioned too low

---

### Expected Behavior (Correct)

**P0**

2.1 WHEN a user grabs any object in a module THEN the system SHALL update the grabbed object's position and orientation each frame by calling `grab.update(poseOrigin, poseQuaternion)` for every entry in `activeGrabs` after `syncControllerPoses()`

2.2 WHEN any learning module is loaded THEN the system SHALL advance all module animations each frame by calling `activeModuleDef?.update?.(deltaSeconds)` in the render loop

2.3 WHEN a user interacts with any lever via ray or proximity THEN the system SHALL dispatch to `lever.updateFromGrab(hit.point, source)` and SHALL continue updating the lever each frame while the trigger is held

2.4 WHEN a user releases Cas9 within 0.15 m of the CRISPR target marker after aligning the guide dial THEN the system SHALL set `crisprLocked = true`, snap Cas9 to position, and update the repair panel to prompt outcome selection

2.5 WHEN a user grabs and moves an explodable assembly part THEN the system SHALL pass world-space position and quaternion (`targetObject.getWorldPosition()` / `targetObject.getWorldQuaternion()`) to `onMove` so `ExplodableAssembly` does not double-convert coordinates

**P1**

2.6 WHEN a user aims a teleport arc in any module THEN the system SHALL accept landing points up to 6.0 m away and within 7.0 m radius of the scene origin

2.7 WHEN a user points at an interactive object that lies behind an anchor tag THEN the system SHALL prioritize the first interactive hit (slider, rotator, lever, grab, activate) and SHALL only fall back to anchor activation if no interactive hit is found within the ray

2.8 WHEN a user enters the Human Body module THEN the system SHALL place each content group inside its matching wing doorway at the wing's `entryPosition` plus an interior offset, with Heart wing containing the heart assembly and pressure slider and pacemaker dial, Brain wing containing the synapse zone, Cancer wing containing the CAR-T zone, HIV wing containing the HIV virion, and Infection Prevention wing containing the capillary loop

**P2 — Interaction and Physics**

2.9 WHEN the XR session starts and no pose has been received THEN the system SHALL fall back to `camera.getWorldDirection(direction)` for the pointer ray rather than the controller's identity quaternion

2.10 WHEN a user with hand tracking (`inputSource.hand` is truthy) attempts to grab an object THEN the system SHALL use `handGrabThresholdMeters: 0.20` as the proximity threshold instead of the standard `grabThresholdMeters: 0.14`

2.11 WHEN hand joint positions are read for pinch detection THEN the system SHALL only process positions where `thumbPosition.lengthSq() > 0.01` to reject uninitialized joint data

2.12 WHEN a tween in the DNA module completes THEN the system SHALL splice it from the `tweens` array immediately so completed tweens do not accumulate

2.13 WHEN a user drops a nucleotide on the wrong socket THEN the system SHALL fire the rejection haptic by threading the active `inputSource` through to `slot.attempt()` calls

**P2 — Cosmos**

2.14 WHEN a user enters the Cosmos module THEN the solar system SHALL start at scale 0.4 (compact hand-held orrery at `(0, 1.2, -2.5)`) with a "SCALE MODEL — pinch to expand to room-scale" label, and SHALL expand walkably to room scale when the user pinches outward

2.15 WHEN a user views the black hole THEN the system SHALL render a physically structured Schwarzschild black hole with an event horizon rim glow, three overlapping disc layers (inner white-cyan at high emissive intensity rotating fastest, mid orange-gold rotating at medium speed, outer deep-red rotating slowest) with Doppler color asymmetry, a bright photon ring at 1.5× event horizon radius, animated sinusoidally pulsing relativistic jets, a point light at the black hole position, and SHALL be positioned at `(-8, 1.5, -6)` with teleport warp pads for access

2.16 WHEN a user moves through the Cosmos module THEN exoplanet pods SHALL billboard toward the camera each frame

**P2 — Quantum**

2.17 WHEN the Quantum module loads THEN the system SHALL call `anchorPrimitive.batchLeaderLines()` before adding the anchor container to root so leader lines render at correct world-space positions

2.18 WHEN a user rotates the Bloch sphere rotator THEN the state vector arrow SHALL spin about the Y axis (vertical) by using `axis: 'y'` on the `SpatialRotatorPrimitive`

**P2 — Branding**

2.19 WHEN a user enters the Hub THEN the brand plaque SHALL face the user at the standard spawn viewpoint, the "MAARIFY" wordmark SHALL be rendered in `EB Garamond, Cormorant Garamond, Georgia, serif` font with a calligraphic drop-cap M, a subtitle "A SPATIAL LEARNING EXPERIENCE" in small caps, thin brass horizontal rules above and below the name, parchment text on dark-walnut background with brass accents, and SHALL include Adinkra-inspired geometric border geometry in the corners in brass color

**P3 — Anchor Card UX**

2.20 WHEN a module loads THEN all anchors SHALL start collapsed, showing only a small glowing cyan indicator sphere (3 cm diameter, gentle pulse animation) at the anchor position; the full info card SHALL appear only when the user activates the anchor

2.21 WHEN a user opens an anchor info card THEN the system SHALL billboard the card toward the camera each frame and SHALL position it at `anchor.position + normalize(camera.position - anchor.position) × 0.3` relative to the anchor

2.22 WHEN anchor indicators are placed and two indicators are within 0.4 m horizontally of each other THEN the system SHALL apply a +0.2 m Y offset stagger to the overlapping indicator

**P3 — Scene Visibility**

2.23 WHEN the Quest system menu is opened while inside a module THEN the system SHALL set `scene.visible = false` when `session.visibilityState === 'visible-blurred'` and SHALL restore `scene.visible = true` when it returns to `'visible'`

2.24 WHEN a user reads the medical disclaimer plaque or the aerospace safety plaque THEN the sign mesh SHALL be positioned above the plinth top surface without clipping (human-body sign at `y = 0.68`, aerospace sign at `y = 0.78`)

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user navigates between the Hub and any module THEN the system SHALL CONTINUE TO load and unload modules without errors and without leaving orphaned scene objects

3.2 WHEN a user completes any existing challenge in Cosmos, Quantum, Aerospace, or DNA-Genetics THEN the system SHALL CONTINUE TO award the correct XP and dispatch the `maarify:challenge-completed` event

3.3 WHEN a user interacts with sliders and rotators in any module THEN the system SHALL CONTINUE TO dispatch slider and rotator interactions via the existing ray and proximity handlers

3.4 WHEN a user teleports within the bounds of `teleportMaxRadiusMeters` THEN the system SHALL CONTINUE TO apply the comfort vignette flash and haptic feedback on landing

3.5 WHEN a user selects a depth tier from the hub plinth THEN the system SHALL CONTINUE TO propagate the tier to all anchor primitives in the active module

3.6 WHEN `npm run verify` is executed THEN the system SHALL CONTINUE TO pass all hygiene, typecheck, lint, unit tests, Playwright e2e tests, and Tier A budget checks with zero console errors

3.7 WHEN any module is viewed in the Playwright emulator THEN the system SHALL CONTINUE TO stay within the 250,000 triangle and 180 draw-call hard ceilings

3.8 WHEN the Hub loads THEN the system SHALL CONTINUE TO show all seven portals with correct readiness badges and destination preview meshes

3.9 WHEN the debug panel is enabled via `?debug=1` THEN the system SHALL CONTINUE TO display build ID, session state, input sources, pose count, and hit label

3.10 WHEN a module is active THEN the system SHALL CONTINUE TO display the return-to-hub gate and respond to the B/Y back button press

3.11 WHEN the folio panel opens for a Cosmos anchor THEN the system SHALL CONTINUE TO support tier tab switching, page navigation, and header collapse interactions

3.12 WHEN the DNA module loads THEN the system SHALL CONTINUE TO place the complementary base-pair station, ribosome translation station, CRISPR station, diversity wall, and badge plinth at their established scene positions
