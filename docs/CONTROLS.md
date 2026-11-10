# MAARIFY — Controls Reference
_Status: current implementation. Emulator-verified behaviours are labelled; hardware feel is **NOT verified on headset**._
_Last updated: 2026-11-10._

This is the single reference for every control in the build. If a binding is not listed here, it does not exist.

---

## 1. Getting in

| Action | How |
|---|---|
| Desktop | `npm run dev` → open `http://localhost:5173` |
| Headset (Quest 3 / 3S / 2) | Enable Developer Mode, `adb reverse tcp:5173 tcp:5173`, open `http://localhost:5173` in the Quest browser, press **Enter WebXR** |
| Jump straight to a module | `?module=cosmos` (add `&dev=true` for experimental modules) |
| Return to the hub | M6's exit portal, the console hook `__MAARIFY_RETURN_TO_HUB__()`, or reload. M2–M5 have no exit portal yet |

---

## 2. Desktop

| Control | Result |
|---|---|
| **Left click** | Raycast from the camera: portals load modules · tier buttons change depth · anchors expand/collapse · sliders jump to max (or 0 if already max) · rotators step +30° · smoke chime pings · calibration block animates · smoke anchor toggles · the TUNING console opens the panel · panel buttons work once open |
| **T** | Open/close the tuning panel in front of the camera |
| **Enter WebXR** (bottom-right) | Request an immersive session |
| **Not available** | No locomotion (no WASD, no mouse-look), and **grabbing does not work on desktop** — the click path requires the camera to be within 14 cm of the object, so nucleotides, tRNA, Cas9 and the rocket injector cannot be picked up. Anchors, sliders, rotators, portals and buttons all work at any distance. |

---

## 3. VR — Touch controllers

| Control | Result |
|---|---|
| **Trigger press** | Controller ray (up to 4.5 m): activate portals/tier buttons/anchors/sliders/rotators/console buttons, and grab any grabbable object within ~30 cm that is also within the 14 cm grab radius |
| **Trigger release** | Release a held object; slot checks (base pairing, tRNA docking, causal chain) run on release |
| **Left thumbstick** | Hold past ~55 % to aim a teleport arc; release to land (max 8 m, vignette flash) |
| **Right thumbstick** | Snap turn 30° per push (edge-triggered, vignette pulse) |
| **Haptics** | Fired on grab, release, snap, detent, error and success |
| **Not wired** | Grip/squeeze, A/B/X/Y, menu, thumbstick click. These do nothing today. |

Seated play is fully supported: every module control is reachable from a seated position with teleport and snap turn.

---

## 4. VR — Hand tracking

| Control | Result |
|---|---|
| **Pinch** | Same as trigger: ray activation and proximity grab |
| **Pointing** | The ray starts at the hand's target-ray origin (palm), so it reads as pointing |
| **Missing** | No locomotion (teleport and snap turn are thumbstick-only), no hand or fingertip visuals, no haptics, no fingertip poke. Standing hands-only play works if you physically walk; seated hands-only play cannot reach the stations. |

---

## 5. In-world controls

| Object | Where | Action |
|---|---|---|
| 7 portals | Hub ring, 3.5 m radius | Enter a module |
| Depth-tier plinth | Hub centre | Foundation / Advanced / Expert |
| TUNING console | Hub, left of the smoke-test plinth at ~(−0.95, 1.08, −1.55) | Opens the tuning panel in front of you |
| Smoke-test zone | Hub, in front | Chime sphere (poke), calibration block (grab), test anchor (expand) |
| Diegetic anchors | Every module | Tap to expand the micro-simulation |
| Sliders / rotators | Every module | Drag / step; each has a seated reach |
| Grabbables | Every module | Pick up, release into a socket |
| Badge plinth + exit portal | M6 only | Badge unlocks at 5/5 challenges; portal returns to the hub |
| Simplified-model label | Every module | Static governance label |

---

## 6. Tuning panel

- **Desktop:** `T`.
- **VR:** point at the **TUNING console** in the hub and press the trigger. The panel appears 0.85 m in front of you at slightly below eye height and stays world-anchored (never head-locked).
- **Operating it in VR:** point the controller or hand ray at a drawn button and press the trigger. Buttons are 336 × 56 px on a 768 px canvas, which is roughly 27 × 4.5 cm in world space — comfortably ray-readable.

| Button | Effect |
|---|---|
| **GRAB − / +** | Grab radius, 0.05 – 0.35 m |
| **HAPTICS − / +** | Grab haptic intensity (snap scales to 1.3×) |
| **SNAP − / +** | Snap turn angle, 15° – 90° |
| **RESET** | Restore every value to the shipped default |
| **EXPORT** | Print the tuning JSON to the console and copy it to the clipboard |
| **CLOSE** | Hide the panel |

Changes are **runtime only** — they reset on reload. The panel also displays the live grab threshold, haptic intensity, snap angle, vignette maximum and fixed simulation step.

Verified in Playwright/emulator: the panel opens, a button press at UV (0.729, 0.479) increases the grab threshold by 0.02, and CLOSE hides it. **NOT verified on headset.**

---

## 7. Depth tier

Selecting a tier on the hub plinth now propagates:

- the hub plinth highlights the active tier;
- the selection is stored in the in-memory progress store;
- the loaded module's anchors update their **tier chip**, **caption line** and **micro-simulation scale** (0.85× foundation, 1.0× advanced, 1.2× expert);
- the active tier is exposed to tests as `__MAARIFY_AUDIT__.tier` and `__MAARIFY_METRICS__.selectedTier`.

The three tier *descriptions* exist per anchor, but the micro-simulation geometry itself is still the same single object per anchor. Tier-specific geometry is future work.

---

## 8. URL parameters and console hooks

| Hook | Purpose |
|---|---|
| `?module=<id>` | Load a module directly |
| `&dev=true` | Unlock experimental modules |
| `__MAARIFY_LOAD_MODULE__('quantum')` | Load a module from the console |
| `__MAARIFY_RETURN_TO_HUB__()` | Return to the hub |
| `__MAARIFY_SET_TIER__('advanced')` | Set the depth tier |
| `__MAARIFY_TUNING__.open()` / `.close()` / `.press(u, v)` / `.state()` | Drive the tuning panel |
| `__MAARIFY_TOGGLE_ANCHOR__(id)` | Expand/collapse an anchor |
| `__MAARIFY_MODULE_STATE__`, `__MAARIFY_CHALLENGES__`, `__MAARIFY_METRICS__`, `__MAARIFY_LOCOMOTION__` | Live state readouts |

---

## 9. Known gaps

1. No in-app help card — this document is the reference.
2. M2–M5 have no exit portal; use reload or the console hook.
3. Desktop cannot perform grab-based challenges.
4. Hands have no locomotion, visuals or haptics.
5. Grip, face buttons and menu are unwired.
6. All headset feel claims remain **NOT verified on headset**; see `docs/DEVICE_TEST_BACKLOG.md` DT-003/DT-008/DT-009.
