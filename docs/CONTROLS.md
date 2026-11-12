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
| Jump straight to a module | `?module=cosmos` (add `&dev=true` for experimental modules). The parameter is consumed on load and stripped from the URL, so a reload starts in the hub |
| Entering VR | The hub spawn is recentred under you, so a play area that starts off-centre does not drop you inside a portal. Proximity walk-in is ignored for the first 2 s |
| Return to the hub | The red return ring (every module), B/Y, the console hook `__MAARIFY_RETURN_TO_HUB__()`, or reload |

---

## 2. Desktop

| Control | Result |
|---|---|
| **Left click** | Raycast from the camera: portals load modules · tier buttons change depth · anchors expand/collapse · sliders jump to max (or 0 if already max) · rotators step +30° · the TUNING console opens the panel · panel buttons work once open |
| **T** | Open/close the tuning panel in front of the camera |
| **Enter WebXR** (bottom-right) | Request an immersive session |
| **Not available** | No locomotion (no WASD, no mouse-look), and **grabbing does not work on desktop** — the click path requires the camera to be within 14 cm of the object, so nucleotides, tRNA, Cas9 and the rocket injector cannot be picked up. Anchors, sliders, rotators, portals and buttons all work at any distance. |

---

## 3. VR — Touch controllers

| Control | Result |
|---|---|
| **Trigger press** | Controller ray (up to 4.5 m): activate portals/tier buttons/anchors/sliders/rotators/console buttons, tap the folio (tier tabs, page arrows, collapse header), and grab any grabbable object within ~30 cm that is also within the 14 cm grab radius |
| **Trigger release** | Release a held object; slot checks (base pairing, tRNA docking, causal chain) run on release |
| **Left thumbstick** | Hold past ~55 % to aim a teleport arc; release to land (up to 3.5 m, and no further than 4 m from the rig origin; vignette flash) |
| **Right thumbstick** | Snap turn 30° per push (edge-triggered, vignette pulse) |
| **B / Y** | Return to the hub from any module |
| **A / X** | In the hub only: enter the portal inside the aim cone |
| **Haptics** | Fired on grab, release, snap, detent, error and success |
| **Not wired** | Grip/squeeze, menu, thumbstick click. These do nothing today. |

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
| TUNING console | Hub, left of the plinth at ~(−0.95, 1.08, −1.55) | Opens the tuning panel in front of you |
| Diegetic anchors | Every module | Tap to expand the micro-simulation; the folio opens beside it |
| Folio panel | Every module, 1.1 m from you | Tap the header to collapse/expand, the three brass tabs to switch depth tier, the ‹ › arrows to page. It is drawn as an overlay, so it wins the ray and a tap on the board never falls through to the world behind |
| Sliders / rotators | Every module | Drag / step; each has a seated reach |
| Grabbables | Every module | Pick up, release into a socket |
| Badge plinth + exit portal | M6 only | Badge unlocks at 5/5 challenges; portal returns to the hub |
| **Red return ring** | Every module, 1.35 m behind the spawn point | Step onto it for 0.6 s, or point at it and press trigger, to return to the hub |
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
| `__MAARIFY_TAP__('folio-next')` | Aim from the camera at a folio control (`folio-header`, `folio-prev`, `folio-next`, `folio-tab-foundation|advanced|expert`) and run the same dispatch as a trigger press. Returns the reason code |
| `__MAARIFY_FOLIO_CONTROLS__()` | World positions and visibility of each folio control |
| `__MAARIFY_MODULE_STATE__`, `__MAARIFY_CHALLENGES__`, `__MAARIFY_METRICS__`, `__MAARIFY_LOCOMOTION__` | Live state readouts |

---

## 9. Debug panel (development aid, opt-in)

Open the app with **`?debug=1`** to show the panel. It is hidden by default and must not be enabled in a learner build. It sits at the bottom of the head-relative view, follows the head, refreshes at 4 Hz and is 60 % opaque.

| Line | Meaning |
|---|---|
| `BUILD` | Build id injected by Vite (git hash + server start). If this differs from `http://localhost:5173/__build`, the page is stale — reload. |
| `VIS` / `XR` | `XRSession.visibilityState` and whether an immersive session is presenting. |
| `SCENE` / `FRAME` | Current hub or module, and the last frame time in ms. |
| `SRC` | Live `session.inputSources`, e.g. `L:ctl:gp R:hand:h` (`ctl` controller, `hand`, `gp` gamepad). `none` means no sources are bound. |
| `RET` | Last reason code an activation stopped: `no-session`, `blurred`, `loading`, `debounce`, `panel`, `folio`, `activate`, `anchor`, `slider`, `rotator`, `ray-grab`, `module-near`, `hub-hit`, `hub-miss`. Hook taps log `tap:<code>`. |
| `HIT` | Last ray hit (`portal:<id>`, object name, or `none`). |
| `EV` | Last three input/scene events with timestamps. |
| `ERR` | Newest of the last ten errors (`window.error`, `unhandledrejection`, frame errors). |
| `HEAD` | Head position in world x/z. |

A thrown frame is caught and logged; the render loop keeps running. This is deliberate: three.js stops requesting frames if the animation callback throws.

## 10. Dev loop, stale builds and the cable

**One command:** `npm run quest` frees port 5173, clears `node_modules/.vite`, starts Vite with `strictPort`, waits for `/__build`, runs `adb reverse tcp:5173 tcp:5173`, verifies the mapping, then prints the URL and the build id. If any step fails it prints exactly which one and exits non-zero. Keep that terminal open.

**Stale build detection:** the page polls `/__build` every 10 seconds. If the served id differs from the loaded one, a red **STALE BUILD — RELOAD** notice appears below the debug panel and `STALE YES` shows in the panel. Reload in the headset browser.

**Hard-clear the Quest Browser cache for localhost:** open the site, tap the padlock/site-info icon → Site settings → Clear & reset, or Meta Quest Browser menu → Settings → Privacy and security → Clear browsing data (cached images and files, cookies and site data). Then reload `http://localhost:5173`.

**Wireless debugging (no cable):**
```powershell
adb tcpip 5555
# Headset IP: Settings -> Wi-Fi -> your network -> IP address
adb connect <headset-ip>:5555
adb -s <headset-ip>:5555 reverse tcp:5173 tcp:5173
```
If `adb tcpip` or `adb shell` hangs, do it with the headset awake but out of an immersive session; the shell can block while the browser is in VR. Wireless adb resets after a headset reboot or long sleep — re-run `adb connect` and the reverse.

**Secure context:** WebXR only runs on `https://` or `localhost`. A plain `http://192.168.x.x` LAN address will load the page but the **Enter WebXR** button will report WebXR unavailable. Use `adb reverse` (localhost) or an HTTPS tunnel/deploy. An optional cable-free option is `cloudflared tunnel --url http://localhost:5173`, which gives an HTTPS URL; it is not required.

The initial page load always needs the dev server (Vite fetches modules at load; all five modules are imported eagerly so entering one never fetches after load). Once loaded, unplugging the cable is safe unless the page reloads.

## 11. Known gaps

1. No in-app help card — this document is the reference.
2. M2–M5 have no exit portal; use reload or the console hook.
3. Desktop cannot perform grab-based challenges.
4. Hands have no locomotion, visuals or haptics.
5. Grip, face buttons and menu are unwired.
6. All headset feel claims remain **NOT verified on headset**; see `docs/DEVICE_TEST_BACKLOG.md` DT-003/DT-008/DT-009.
