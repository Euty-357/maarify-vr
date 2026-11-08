---
name: webxr-three-setup
description: >
  XR session lifecycle, controller input, hand tracking, passthrough,
  and desktop fallback using Three.js and the WebXR Device API.
  Load this skill when setting up or debugging XR sessions, input, or the flat fallback.
---

# WebXR + Three.js Setup Skill

## Docs
- WebXR Device API: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
- Three.js WebXR: https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content
- IWER (emulator): https://github.com/meta-quest/IWER
- Hand Tracking API: https://immersive-web.github.io/webxr-hand-input/

## XR Session Lifecycle
1. Check `navigator.xr.isSessionSupported('immersive-vr')`.
2. On user gesture: `navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['hand-tracking', 'local-floor', 'bounded-floor'] })`.
3. Set `renderer.xr.enabled = true; renderer.xr.setSession(session)`.
4. Use `renderer.setAnimationLoop(callback)` — standard `requestAnimationFrame` stops in XR.
5. On session end: clean up listeners, restore flat camera.

## Controllers
- Access via `renderer.xr.getController(0)` and `getController(1)`.
- Use `XRInputSourcesChangeEvent` to track connect/disconnect.
- Grip poses via `renderer.xr.getControllerGrip(i)`.
- Use `selectstart`/`selectend` events for trigger press.

## Hand Tracking
- Request `hand-tracking` as optional feature.
- Access `inputSource.hand` (XRHand). Iterate joints via `XRHand.values()`.
- Pinch detection: measure distance between thumb-tip and index-finger-tip joints.
- Always provide controller fallback — hand tracking may be unavailable.

## Passthrough (Quest 3/3S)
- Request `'xr-spatial-tracking'` and check `session.environmentBlendMode`.
- If `'alpha-blend'` or `'additive'`: set renderer background to transparent.
- Quest 2: `'opaque'` only. Quest 3: `'alpha-blend'` available.
- **NOT verified on headset.**

## Desktop Fallback
- If `navigator.xr` unavailable or session request fails: activate flat mode.
- Flat mode: standard PerspectiveCamera, OrbitControls (or pointer-lock), no XR renderer loop.
- All modules must render and be interactable in flat mode.
- Test flat mode in every Playwright test (no emulator required).

## IWER Integration (Emulator)
```js
import { IWER, XRDevice, metaQuest2 } from 'iwer';
const device = new XRDevice(metaQuest2);
device.installRuntime(); // patches navigator.xr
// Now navigator.xr.isSessionSupported('immersive-vr') returns true in Node/Playwright
```
- Cite: https://github.com/meta-quest/IWER

## Common Pitfalls
- Never call `requestAnimationFrame` inside the XR loop — use `renderer.setAnimationLoop`.
- Always gate hand-tracking code on `inputSource.hand !== null`.
- Dispose of geometries and textures on scene exit to avoid VRAM leaks.
