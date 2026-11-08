---
name: spatial-interaction-design
description: >
  Spatial interaction patterns for WebXR: hand tracking, controller input,
  diegetic anchoring, 3D affordances, haptics, spatial audio, exploded views,
  cross-section slicing, and scale shifts. Load when designing or building
  spatial interactions, manipulators, or diegetic 3D interfaces.
---

# Spatial Interaction Design Skill

## Core Principles
1. **VR-First:** Design for 6DOF headset and physical hands first.
2. **Show, Don't Tell:** Replace paragraphs with scrubbable, physical 3D demonstrations.
3. **Diegetic Information:** Information is anchored on or adjacent to the object with spatial leader lines, never in a head-locked HUD or flat floating card.
4. **Direct Manipulation:** Prefer grabbing, poking, pulling, slicing, and twisting over laser-pointing.

## 1. Hand Tracking & Controller Input

### Unified Interaction Abstraction
```ts
interface SpatialGrabRay {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  isPinching: boolean;
  pinchStrength: number; // 0.0 to 1.0
  isTriggerPressed: boolean;
  handedness: 'left' | 'right';
  jointTipPosition?: THREE.Vector3; // Index finger tip for direct poking
}
```

### Direct Poking vs Distance Grabbing
- **Direct Touching (Distance < 0.15 m):** Detect sphere-box collision between index tip joint (`XRHand.get('index-finger-tip')`) and object bounds. Trigger haptic detent upon crossing activation threshold.
- **Distance Grabbing (Distance > 0.15 m):** Raycast forward. On trigger squeeze / pinch, snap a spatial tether line and allow translation/rotation relative to hand pose.

## 2. Haptics via WebXR Gamepad API
Meta Quest Browser exposes controller haptics through `XRInputSource.gamepad.hapticActuators`.

```ts
export function triggerHaptic(
  inputSource: XRInputSource,
  intensity: number = 0.5,
  durationMs: number = 20
) {
  if (inputSource.gamepad?.hapticActuators?.length) {
    const actuator = inputSource.gamepad.hapticActuators[0];
    actuator.pulse(intensity, durationMs).catch(() => {});
  }
}

// Preset Detents:
// - Light Tick (UI toggle, index poke): intensity 0.3, 10ms
// - Magnetic Snap (part assembly): intensity 0.8, 25ms
// - Physical Rumble (turbofan thrust, turbulence): continuous pulse loop at 0.4
```

## 3. Spatial Audio via Web Audio HRTF
Three.js integrates with Web Audio via `THREE.AudioListener` and `THREE.PositionalAudio`.

```ts
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
sound.setRefDistance(1.0);     // Normal volume at 1 meter
sound.setMaxDistance(10.0);    // Inaudible past 10 meters
sound.setRolloffFactor(1.5);   // Natural physical attenuation
sound.setDistanceModel('inverse');
targetObject.add(sound);
```

## 4. Exploded Views (Direct Two-Hand Pull)
Allows users to pull assemblies (turbofan, virion, cryostat) apart along their functional axis.

```ts
// Component translation proportional to explosion factor (0.0 = assembled, 1.0 = fully exploded)
export function updateExplodedView(components: ExplodedPart[], factor: number) {
  for (const part of components) {
    part.mesh.position.copy(part.basePosition).addScaledVector(part.explodeDirection, part.explodeDistance * factor);
  }
}
```

## 5. Cross-Section Slicing Plane
Uses Three.js local clipping planes (`renderer.localClippingEnabled = true`).

```ts
const slicePlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const material = new THREE.MeshStandardMaterial({
  clippingPlanes: [slicePlane],
  clipShadows: true,
  side: THREE.DoubleSide
});

// User grabs a physical 3D cutting ring or handle and moves it along the Y-axis:
function onDragSliceHandle(newY: number) {
  slicePlane.constant = newY;
}
```

## 6. The Diegetic Spatial Anchor Pattern
Replaces the flat "info card" with an anchored 3D label and an interactive micro-simulation:
- **Resting:** Specular pulse shader highlighting interactive parts.
- **State 1 (Spatial Anchor Tag):** Minimalist 3D pill hovering 0.15 m above object with a glowing line (`THREE.Line2`). Displays name + $\le 40$-word plain note.
- **State 2 (Interactive Micro-Simulation):** The component expands into an exploded, cross-sectioned, or scrubbable 3D demonstration. Users can grab, rotate, and pull it to inspection distance (0.5–0.8 m).
- **State 3 (Dismiss):** Tossing gesture, pinch dismiss node, or third tap smoothly contracts the micro-simulation back into the parent object.

## 7. Mixed Reality (MR) Passthrough Mode
```ts
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hit-test', 'hand-tracking']
});
// Ensure renderer background is transparent
renderer.setClearColor(0x000000, 0);
```
- Quest 3/3S: Full color passthrough with automatic surface hit-testing.
- Quest 2: Grayscale passthrough fallback (**NOT verified on headset**).

