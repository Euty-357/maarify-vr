# DEVICE_TEST_BACKLOG.md — Headset-Only Test Cases
_Target Device: Meta Quest 3 (Primary), Quest 3S, Quest 2 (Baseline)_
_Last Updated: 2026-11-08_
_All items here cannot be verified in headless CI or emulator and are strictly labelled **NOT verified on headset**._
> **Companion Procedure:** See [HEADSET_TEST.md](file:///c:/maarify/docs/HEADSET_TEST.md) for ADB reverse setup, MQDH profiling, and smoke-test protocols.

---

## DT-001 — Target Refresh Rate & Dynamic Quality Adaptation (Quest 3 vs Quest 2)
- **What:** Confirm application runs at locked 90 Hz / 120 Hz on Quest 3 (Tier B) and 72 Hz on Quest 2 (Tier A) without frame drops. Verify dynamic quality controller adjusts `framebufferScaleFactor` and `fixedFoveation` if frame time spikes.
- **Why device needed:** Emulator runs on host PC GPU; cannot simulate Snapdragon XR2 Gen 2 (Quest 3) vs Gen 1 (Quest 2) hardware thermals, clock scaling, and real refresh rate negotiation.
- **Module / System:** Core / Dynamic Quality Controller & XR Session
- **How to test:** Connect via `adb reverse tcp:5173 tcp:5173`; enable OVR Metrics Tool persistent overlay; navigate heavy Cosmos scene; observe FPS readout over 5 minutes.
- **Pass criteria:** Steady 90 fps sustained on Quest 3 (or 72 fps on Quest 2); frame drop rate $< 0.1\%$; dynamic resolution maintains frame rate without jarring visual pop.
- **Status:** NOT verified on headset

## DT-002 — Touch Plus & Touch Pro Controller Haptic Detents
- **What:** Verify distinct haptic impulses fire on Touch Plus controllers during grab, poke, part assembly snap, and aerodynamic stall buffeting.
- **Why device needed:** IWER and Playwright cannot simulate physical voice-coil and resonant haptic actuators.
- **Module / System:** Core / Haptics (`src/core/haptics/`)
- **How to test:** In Hub Smoke-Test Zone, tap calibration cube, snap turbofan stage, and hold wing in stall wind tunnel; feel vibrations in left/right controllers.
- **Pass criteria:** Crisp, tactile 15ms pulse on button poke/part snap; continuous low-frequency rumble during stall buffeting; zero unhandled promise rejections.
- **Status:** NOT verified on headset

## DT-003 — Direct Optical Hand Tracking & Pinch Precision
- **What:** Confirm optical hand tracking accurately detects pinch gestures, index finger direct poking, and two-handed exploded view pulls without controllers.
- **Why device needed:** Requires physical cameras, computer-vision depth pipeline, and real human hands.
- **Module / System:** Core / Input (`src/core/input/`)
- **How to test:** Put down controllers; use bare hands in front of Quest 3 cameras; pinch spatial anchors, poke chime sphere, pull apart rocket engine.
- **Pass criteria:** Pinch recognized with $> 95\%$ natural gesture reliability; direct finger touch triggers chime within 5 mm of surface contact.
- **Status:** NOT verified on headset

## DT-004 — Full-Color Passthrough & Mixed Reality Tabletop Mode
- **What:** Verify Quest 3 4MP RGB color passthrough renders accurately with correct real-world scale and depth perception; verify virtual objects blend on real desk with transparent background.
- **Why device needed:** Passthrough cameras and optical compositing do not exist in emulator.
- **Module / System:** Core / XR Session (`immersive-ar` session mode)
- **How to test:** In Hub Smoke-Test Zone, click "Toggle MR Mode"; observe room in stereoscopic color passthrough; place beating heart or turbofan engine onto physical table using hit-test.
- **Pass criteria:** Real room visible in color; virtual model rests stably on real tabletop; zero visual flicker or depth distortion.
- **Status:** NOT verified on headset

## DT-005 — Pancake Lens Optical Clarity & Diegetic Text Legibility
- **What:** Confirm diegetic spatial anchor tags and micro-simulation callouts are razor-sharp and easily readable at 1.0 m, 1.5 m, and 2.0 m distances through Quest 3 pancake lenses.
- **Why device needed:** Pancake optics, dual display panel pixel density (2064x2208 per eye), and physical IPD adjustment cannot be simulated on 2D desktop screens.
- **Module / System:** Core / Spatial Anchors (`src/core/spatial-anchors/`)
- **How to test:** Stand at 1.0m, 1.5m, and 2.0m markers; read text tags without straining; rotate head to edge of lens to check for chromatic aberration or foveation distortion.
- **Pass criteria:** 24 pt equivalent text legible with normal vision at 2.0 meters; no distracting chromatic fringing.
- **Status:** NOT verified on headset

## DT-006 — Comfort: Locomotion Vignette & Warp Frame Verification
- **What:** Confirm smooth locomotion with dynamic radial vignette and Cosmos cinematic warp travel remain comfortable and non-nauseating during active motion.
- **Why device needed:** Vestibular-ocular mismatch and visual vection can only be assessed on a physical human sensory system inside a headset.
- **Module / System:** Core / Comfort & Cosmos Travel System
- **How to test:** Enable smooth locomotion in settings; traverse Hub and Cosmos for 10 minutes continuously; trigger 3 warp travel sequences.
- **Pass criteria:** Radial FOV reduction triggers smoothly on stick tilt; visual cockpit canopy provides stable frame of reference; tester reports zero nausea or disorientation.
- **Status:** NOT verified on headset

## DT-007 — Fixed Timestep Determinism across Refresh Rates (72 vs 90 vs 120 Hz)
- **What:** Verify that rocket thrust, planetary orbits, fluid streamlines, and stakeholder dynamics behave identically regardless of whether Quest 3 runs at 72 Hz, 90 Hz, or 120 Hz.
- **Why device needed:** Hardware display refresh rates must be switched dynamically on device while measuring simulated motion distance.
- **Module / System:** Core / Fixed Timestep Physics (`src/core/physics/`)
- **How to test:** Switch display refresh rate in Hub between 72Hz, 90Hz, and 120Hz; run Mars transfer challenge; verify orbit trajectory matches exactly across all rates.
- **Pass criteria:** Trajectory delta $< 0.01\%$ across different display refresh rates.
- **Status:** NOT verified on headset
