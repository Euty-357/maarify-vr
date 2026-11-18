# DEVICE_TEST_BACKLOG.md — Headset-Only Test Cases
_Target Devices: Meta Quest 3 (primary) and Meta Quest 3S (design floor). Quest 2 and Quest Pro are not supported._
_Last Updated: 2026-11-12_
_All items here cannot be verified in headless CI or emulator and are strictly labelled **NOT verified on headset**._
> **Companion Procedure:** See [HEADSET_TEST.md](file:///c:/maarify/docs/HEADSET_TEST.md) for ADB reverse setup, MQDH profiling, and the Quest 3/3S device check list.

## Recorded device results
- **Quest 3, 2026-11-12:** controls, portal entry and hub↔module transitions observed working by Euty. Grab at distance, bounded teleport and smooth locomotion still pending. No Quest 3S session yet.

---

## DT-001 — Refresh Rate & Dynamic Quality Adaptation (Quest 3 and 3S)
- **What:** Confirm 90 Hz default with 72 Hz floor on both headsets, record the exact `session.supportedFrameRates` list, and verify the dynamic quality controller adjusts `framebufferScaleFactor` and `fixedFoveation` when frame time spikes.
- **Why device needed:** Emulator runs on a host GPU; it cannot reproduce Snapdragon XR2 Gen 2 thermals, clock scaling, panel differences between Quest 3 and 3S, or real refresh-rate negotiation.
- **Module / System:** Core / dynamic quality controller and XR session
- **How to test:** `adb reverse tcp:5173 tcp:5173`; OVR Metrics overlay; heavy Cosmos scene for 5 minutes on each headset; log the frame rate list.
- **Pass criteria:** Steady 90 fps (72 acceptable floor); dropped frames < 0.1 %; no jarring resolution pop; the exposed refresh list is recorded per device.
- **Status:** NOT verified on headset

## DT-002 — Touch Plus & Touch Pro Controller Haptic Detents
- **What:** Verify distinct haptic impulses fire on Touch Plus controllers during grab, poke, part assembly snap, and aerodynamic stall buffeting.
- **Why device needed:** IWER and Playwright cannot simulate physical voice-coil and resonant haptic actuators.
- **Module / System:** Core / Haptics (`src/core/haptics/`)
- **How to test:** In a module, grab a part, snap it into place, and hold the wing in the stall wind tunnel; feel vibrations in left/right controllers.
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
- **How to test:** From a module, request MR/tabletop mode when it exists; observe room in stereoscopic color passthrough; place a model onto a physical table using hit-test.
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

## DT-008 — M6 DNA / Genetics Reachability, Scale and Anchor Legibility
- **What:** Verify that the helix slider, base pieces, tRNA loop and Cas9 alignment dial are naturally reachable while seated, that their scale conveys the intended molecular analogy, and that all four spatial anchor tags are readable without blocking the working volume.
- **Why device needed:** Controller/hand reach envelopes, stereo depth, hand occlusion, haptic detents and perceived world scale cannot be assessed by desktop screenshots or the WebXR emulator.
- **Module / System:** M6 DNA / Genetics (`src/modules/dna-genetics/scene.ts`, `src/modules/dna-genetics/anchors.ts`)
- **How to test:** From the seated default pose, complete the four M6 interactions with Touch Plus controllers, then repeat the handle and scale-pinch interaction with hand tracking. Open each anchor at 1–2 m and check that it neither occludes the interaction nor requires leaning.
- **Pass criteria:** Every control is reachable without standing or torso strain; tags are legible at normal viewing distance; haptic feedback is distinct; no forced camera motion, accidental grabs, or uncomfortable occlusion occur.
- **First tuning target if failed:** `src/modules/dna-genetics/scene.ts` station positions and `src/config/tuning.ts` interaction/comfort constants.
- **Status:** NOT verified on headset

## DT-009 — XR Locomotion, Portal Entry and Haptic Confirmation
- **What:** Verify that the left thumbstick aims and commits a teleport, the right thumbstick snaps the view in 30° detents with the vignette pulse, the controller ray activates hub portals and module anchors/sliders, and grab/release/snap haptics are felt on Touch Plus controllers.
- **Why device needed:** The camera rig, input-source capture, haptic actuators and ray length were only exercised in the desktop fallback and Playwright/emulator. Comfort of the vignette and the feel of the detents cannot be assessed in a browser.
- **Module / System:** Core (`src/main.ts`, `src/core/input/primitives/teleport.ts`, `snapTurn.ts`, `src/core/haptics/haptics.ts`)
- **How to test:** Enter VR from the hub. Teleport to each of the seven portals, turn across a module, point at an anchor and a slider, grab a M6 nucleotide, and release it into a socket. Repeat seated, then standing with physical walking.
- **Pass criteria:** Teleport lands where the arc shows; snap turn never overshoots; the ray visibly changes colour on a hit; haptics fire distinctly on grab, snap, detent and error; no nausea or unintended movement; every control is reachable seated.
- **First tuning target if failed:** `src/config/tuning.ts` (`comfort.*`, `haptics.*`, `input.rotatorDetentStepDeg`) and `src/main.ts` stick deadzones.
- **Status:** NOT verified on headset

## DT-010 — Quest 3S Legibility and MR Fallback
- **What:** On Quest 3S, read anchor text and panels at 1 m and 2 m and confirm nothing depends on a Quest 3-only depth or mixed-reality feature.
- **Why device needed:** Quest 3S uses a lower-density panel and Fresnel optics than Quest 3 and has no depth projector; only the device shows the real legibility and MR behaviour.
- **Module / System:** Core / spatial anchors, panels v2, optional MR
- **How to test:** Run the same module on Quest 3 and 3S; compare text legibility at the 1 m and 2 m marks; disable MR and confirm every lesson remains completable.
- **Pass criteria:** 24 pt-equivalent text legible at 2 m on 3S; no lesson blocks without MR; no Quest 3-only feature is required.
- **Status:** NOT verified on headset

## DT-011 — M5 Explodable Engine and Wind-Tunnel Flow
- **What:** Verify that the five liquid-engine parts can each be grabbed, inspected and magnetically snapped back; confirm the wind tunnel enters with clear flow visible, the flow on/off and density levers are reachable seated, and high angle of attack visibly changes the flow to separated/stall behaviour.
- **Why device needed:** Hand reach, individual-grab reliability, haptic snap feel, stereo visibility of particles/lines, perceived streamline density and stall readability cannot be established by Playwright or an emulator.
- **Module / System:** M5 Aerospace (`src/modules/aerospace/scene.ts`, `src/core/input/primitives/explodable-assembly.ts`)
- **How to test:** From the seated default position on Quest 3, pull the amber explode lever, grab and release injector, chamber, turbopump, cooling jacket and nozzle near their slots, then operate both wind-tunnel levers and move the pitch slider from attached flow through stall.
- **Pass criteria:** All five parts are reachable and snap predictably without accidental grabs; streamlines and tracer particles are clear on entry; levers work with Touch Plus and hands; stall is visually distinct; no forced motion or unsafe/obscured controls.
- **First tuning target if failed:** engine and lever positions in `src/modules/aerospace/scene.ts`; interaction thresholds in `src/config/tuning.ts`.
- **Status:** NOT verified on headset

## DT-012 — Headset Boundary & Session Feature Negotiation
- **What:** Confirm Quest 3 enters WebXR immediately without prompting for Guardian redraw, Room Space Setup, or stationary-mode boundary dialogues.
- **Why device needed:** WebXR session configuration (`requiredFeatures: ['local-floor']`) behaviour depends entirely on Quest OS system UI prompts which do not exist in desktop or emulator.
- **Module / System:** Core (`src/main.ts`)
- **How to test:** Put on Quest 3 from standard room-scale boundary; navigate to Maarify; click "Enter WebXR".
- **Pass criteria:** Immediate transition into spatial hub; zero system prompts for boundary reconfiguration; floor level exactly matches physical floor.
- **Status:** NOT verified on headset

## DT-013 — Teleport Bounds & Portal Exclusion
- **What:** Verify teleport arc respects module boundaries and blocks landing behind hub portals or outside walkable areas.
- **Why device needed:** Arc aiming feel, boundary clamping feedback, and spatial comfort can only be validated with physical controllers.
- **Module / System:** Core (`src/core/input/primitives/teleport.ts`, `src/main.ts`)
- **How to test:** Stand in Hub; aim teleport arc directly through and behind portals (radius > 4.0m); attempt to teleport into wall bounds.
- **Pass criteria:** Reticle changes to invalid / clamps to max walkable radius; user never lands behind portal geometry.
- **Status:** NOT verified on headset

## DT-014 — Cosmos Walkthrough Scale, Black Hole Warp & Lensing Shader
- **What:** Verify Option B walkthrough scale (Sun at origin, planets along -Z walkway up to 7m), exoplanet zone at +12m, warp travel to Sagittarius A* at (-40, 1.5, -60), and shader appearance (shadow, photon ring, Doppler beaming).
- **Why device needed:** Stereo depth perception of the solar system walkway, comfort during warp transition, and performance/visual quality of the gravitational lensing fragment shader on Snapdragon XR2 Gen 2.
- **Module / System:** Cosmos (`src/modules/cosmos/scene.ts`, `src/modules/cosmos/black-hole-shader.ts`)
- **How to test:** Enter Cosmos; walk down the solar system path; inspect scale plinth; step onto warp pad to travel to black hole; observe lensing and jet animation; return via return warp pad.
- **Pass criteria:** Walkway feels spacious and physically grounded; warp transition is instantaneous/comfortable; black hole displays distinct dark shadow, bright photon ring, and Doppler-asymmetric accretion disc; steady 90 fps maintained.
- **Status:** NOT verified on headset

## DT-015 — Medicine Six Wing Rooms Physical Separation
- **What:** Verify that each of the 6 Medicine wings exists as its own room radially placed at 5.4m with equipment and lighting, while the central atrium contains only signage, portal doors, and the Body Scale ladder.
- **Why device needed:** Spatial audio reverberation, room scale feel, doorway transitions, and occlusion cannot be judged without stereo headset presence.
- **Module / System:** Medicine (`src/modules/human-body/scene.ts`, `src/modules/human-body/sections.ts`)
- **How to test:** Enter Human Body module; stand in atrium and verify unobstructed view of doors; walk through each portal into wing rooms; verify organ models are placed centrally within their respective rooms.
- **Pass criteria:** Zero visual intersections between organ models and doorways; each wing feels like a dedicated clinical/research room; atrium remains spacious.
- **Status:** NOT verified on headset

## DT-016 — Diegetic Hotspots & Folio Panel Usability
- **What:** Verify glowing ⓘ badge legibility, single-open auto-collapse behavior, front-only billboard orientation, and stacked text readability on folio panels.
- **Why device needed:** World-space panel text legibility at arm's length (0.8m–1.5m), canvas texture sharpness, and gaze/ray targeting ergonomics.
- **Module / System:** Core (`src/core/spatial-anchors/diegetic-anchor.ts`, `src/core/ui/folio-panel.ts`)
- **How to test:** Approach an anchor; observe glowing ⓘ glyph; trigger expansion via controller ray; walk around anchor to verify backface is clean (no mirrored text); open a second anchor to confirm previous collapses automatically.
- **Pass criteria:** Text blocks are cleanly stacked without overlap; panel faces user on open; only one panel active per region; ⓘ glyph is sharp and distinct.
- **Status:** NOT verified on headset

## DT-017 — Brand Plaque & Cultural Motif Clarity
- **What:** Verify Maarify logo renders clearly on the hub arch plaque (y=2.75) with crisp Swahili carved-door fretwork geometry.
- **Why device needed:** High-contrast canvas texture rendering, font rendering, and overhead viewing angles through pancake lenses.
- **Module / System:** Hub (`src/core/brand/brand.ts`)
- **How to test:** In Hub, look up at the main portal arch plaque; inspect logo icon and Swahili diamond/kikapu border.
- **Pass criteria:** Logo image is sharp; Swahili fretwork border is rendered cleanly without artifacting or distortion.
- **Status:** NOT verified on headset

## DT-018 — Quantum Upright Pedestals & Bloch Rotation
- **What:** Confirm Quantum module space has floor perfectly level at y=0, pedestals are upright, and Bloch sphere rotator rotates around polar Z-axis.
- **Why device needed:** Vestibular orientation alignment (any accidental scene roll/pitch creates nausea) and angular dial manipulation feel.
- **Module / System:** Quantum (`src/modules/quantum/scene.ts`)
- **How to test:** Enter Quantum module; verify horizon is level with real room floor; rotate Bloch sphere dial with controller ray and direct hand pinch.
- **Pass criteria:** Perfect horizon alignment; zero tilt sensation; Bloch polar rotation matches theoretical |0⟩ to |1⟩ latitude.
- **Status:** NOT verified on headset

## DT-019 — M7 Climate & Environment Watershed Time Scrub & Stakeholder Graph
- **What:** Verify Mau watershed time lever scrubs smoothly from 1980 to 2024, tree canopies scale responsively, grabbable sapling plots place cleanly on degraded slope, Naivasha valve rotates with tactile detents, and 9-stakeholder node graph displays clear colored dependency beams in 3D stereo.
- **Why device needed:** Two-handed reach envelopes on terrain table, depth perception of river gully and 3D stakeholder network, and optical comfort in exterior daylight environment.
- **Module / System:** Climate & Environment (`src/modules/environment/scene.ts`, `src/core/simulation/stakeholder-sim.ts`)
- **How to test:** Enter Environment portal from Hub; operate time lever with left/right controllers; grab sapling plot and plant on slope; rotate Naivasha valve wheel; inspect 3D stakeholder network and toggle policy interventions; walk to coastal mangrove station and observe wave attenuation.
- **Pass criteria:** All controls reachable seated; time scrub is fluid; stakeholder beam lines are distinct in stereo; steady 90 fps maintained; zero motion discomfort.
- **Status:** NOT verified on headset

## DT-020 — Pre-VR Landing Page and XR Entry
- **What:** Confirm the landing page is legible and usable in Quest Browser, reports an accurate readiness state, and enters immersive VR only after the learner presses **Enter VR**.
- **Why device needed:** Quest Browser security context, real WebXR capability detection, page-scale readability, and the user-activation hand-off into an immersive session cannot be validated by a desktop browser alone.
- **Module / System:** Core entry (`index.html`, `src/main.ts`)
- **How to test:** Start the wireless Quest dev loop; open the localhost page in Quest Browser; review the safety checklist; press **Enter VR**; then end the session and reload the page.
- **Pass criteria:** No Three.js scene appears behind the landing page before entry; Enter VR is enabled only when immersive VR is supported in a secure context; the session starts without a browser/system error; all landing text is comfortably legible on Quest 3 and 3S.
- **Status:** NOT verified on headset

## DT-021 — Information System V3 & Auto-positioning Folio
- **What:** Confirm Information System V3 exhibits have engraved brass placards on plinths; pointing highlights the exhibit; trigger/pinch opens the folio panel 0.4–0.8 m on the user-facing side; tabs switch tier cleanly; grab handle repositions the panel; walking away (>2.5 m) auto-collapses it; text is legible at 1.5° angular height.
- **Why device needed:** World-space spatial ergonomics, depth perception, pancake lens angular legibility, and head motion auto-collapse.
- **Module / System:** Core / Info-System (src/core/info-system/, src/core/ui/)
- **How to test:** In Hub and any module, trigger an exhibit placard; inspect folio positioning and angular font size; switch tiers; walk 3 meters away and verify auto-close.
- **Pass criteria:** Panel never spawns inside geometry or user face; smooth grab handle dragging; zero overlap; auto-close cleanly fires.
- **Status:** NOT verified on headset

## DT-022 — Aerospace Engine Test Hall & Nozzle Base Raycast Bypass
- **What:** Confirm pointer ray passes freely through the engine base colliders (y <= 0.1 m) to operate explode levers, throttle sliders, and cycle dials without getting stuck on the nozzle cone. Confirm 3 engine stands (Raptor FFSC, Hydrolox, SRM) render with orange/cyan flow lines.
- **Why device needed:** 6DOF controller raycast precision and visual beam feedback in spatial room.
- **Module / System:** Aerospace (src/modules/aerospace/scene.ts, src/main.ts)
- **How to test:** Enter Aerospace module; aim controller ray at rocket engine and stand bases; verify ray hits levers/throttle and does not stick to floor cone; operate levers.
- **Pass criteria:** Levers and sliders highlight and drag smoothly; zero beam latching to base cone; steady 90 fps.
- **Status:** NOT verified on headset

## DT-023 — Quantum Cryostat Dilution Plates & Bloch State Proximity
- **What:** Confirm dilution refrigerator stage plates (50K to 15mK) can each be grabbed, pulling them out opens an explanation folio; approaching Bloch sphere within 1.5 m reveals state labels and proximity folio.
- **Why device needed:** Direct grab ergonomics, 6DOF near-field proximity triggers, and tactile feel.
- **Module / System:** Quantum (src/modules/quantum/scene.ts)
- **How to test:** Walk up to dilution refrigerator; grab each plate; verify folio opens; walk to Bloch sphere; verify proximity folio.
- **Pass criteria:** Grab works reliably; folio auto-positions comfortably; gate token tooltips appear on grab.
- **Status:** NOT verified on headset

## DT-024 — Cosmos Sgr A* Black Hole Shader & Relativistic Jets
- **What:** Verify Sgr A* black hole renders with Einstein ring, photon sphere, Doppler-boosted accretion disc, and blue/white relativistic jet cones without visual artifacting or frame drops.
- **Why device needed:** Stereo fragment shader performance, bloom/glare simulation in VR, and high-frequency noise textures through Quest pancake lenses.
- **Module / System:** Cosmos (src/modules/cosmos/scene.ts, src/modules/cosmos/black-hole-shader.ts, src/modules/cosmos/quasar.ts)
- **How to test:** Use navigation console to warp to Black Hole; observe accretion disc rotation, Einstein ring lensing, and jet cones from multiple angles.
- **Pass criteria:** Accretion disc is Doppler-asymmetric (brighter on approaching side); no shader compilation stutter; steady frame rate.
- **Status:** NOT verified on headset