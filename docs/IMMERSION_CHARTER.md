# MAARIFY IMMERSION CHARTER
_Status: BINDING GOVERNANCE — Every module, system, and document must strictly adhere._
_Owner: Lead Engineer & immersion-reviewer_

## Preamble
The product's entire value is that learning happens in Virtual Reality in ways a physical classroom, textbook, video, website, or slide deck cannot match. Maarify rejects the presentation of flat floating web pages, floating text cards, scrollbars, or slide-deck bullet points inside VR headsets. If any feature or explanation could ship as a flat website or video with no functional or conceptual loss, it fails the charter and must be redesigned.

---

## The Ten Binding Principles

### 1. VR-FIRST (Non-Negotiable)
- All interaction and architecture must be conceived, designed, and optimized for 6DOF head tracking, physical hands, controller grips, and bodily locomotion.
- The desktop/mobile fallback (mouse look/click, WASD to teleport) is strictly a **graceful degradation** for convenience and headless CI. It is never the design target. No spatial interaction may be compromised to make desktop testing easier.

### 2. SHOW, DON'T TELL (Active Experiential Mechanics)
- If an idea, principle, or mechanism can be demonstrated, manipulated, heard, or physically experienced, it is **strictly forbidden** to deliver it as a static paragraph of text.
- Level 2 technical content must itself be an interactive 3D simulation or mechanical manipulation:
  - *Do not merely read that a mitral valve prevents backflow:* physically grab and scrub the ventricular pressure lever to watch the valve leaflets seal under systolic pressure.
  - *Do not merely read about aerodynamic stall:* pitch a physical wing spar with your hands in a streamline smoke tunnel and feel the buffet rumble in the controllers as the boundary layer tears away.
  - *Do not merely read about the Bloch sphere:* pinch and rotate the state vector arrow $|\psi\rangle$ across the sphere with your fingers, feeling the haptic detents at $|0\rangle$ and $|1\rangle$.
- Written language is limited to brief spatial callouts ($\le 40$ words) acting as secondary supporting captions to the 3D phenomenon.

### 3. DIEGETIC INFORMATION (Spatial Anchors & Exploded Micro-Sims)
- Information lives **on, inside, or immediately adjacent to the physical 3D object**.
- **No Head-Locked HUDs:** Floating windows that stick to the user's field of view or follow the nose are banned. They cause nausea, eye fatigue, and break presence.
- **The Spatial Anchor Pattern (Replacing "Info Cards"):**
  - **Resting State:** Interactive parts emit a subtle organic specular pulse or contour resonance.
  - **State 1 — Spatial Anchor Tag (Tap 1 / Hover):** A small, minimalist 3D tag anchored to the component with a glowing spatial leader line. Displays object name and a concise plain note ($\le 40$ words, zero jargon).
  - **State 2 — Exploded Micro-Simulation (Tap 2):** The component expands into an interactive 3D physical demonstration at that exact location. The user can grab the simulation, pull it closer into personal inspection space (0.5–0.8 m), rotate it with both hands, scrub parameters, and dismiss it by tossing it away or tapping its dismiss node.
  - **State 3 — Closed (Dismiss / Tap 3):** Smoothly contracts back into the parent assembly.

### 4. DIRECT MANIPULATION (Natural Hands & Haptics)
- Default interaction must be direct physical contact:
  - **Grab and assemble:** Pick up components and snap them into place with magnetic detents.
  - **Exploded views:** Pull an engine, qubit cryostat, or virion apart along its axis with two hands.
  - **Cross-section slicing:** Push a cutting plane through the beating heart or Earth's atmosphere to reveal interior dynamics.
  - **Scale transformations:** Pinch and expand the world to shrink down to molecular DNA or expand to galactic superclusters.
  - **Direct poking/pinching:** In hand tracking, poke buttons with an index fingertip or pinch parameters directly. Laser pointers are a secondary fallback for distant objects only.

### 5. USE THE WHOLE BODY (Embodied Kinematics)
- Every module must mandate interactions that require physical bodily movement impossible or pointless on a 2D monitor:
  - **Walking around:** Physically inspecting a room-scale satellite or quantum processor from all 360 degrees.
  - **Leaning in & crouching:** Bending down to peer into the combustion chamber or underneath a wing slat.
  - **Head-tilt alignment:** Tilting the head to match an orbital velocity vector or align an optical laser beam.
  - **Gaze fixation (Dwell):** Looking directly at an astronomical phenomenon or slit detector to trigger wave-function collapse.
  - **Seated Parity:** Every bodily mechanic must map cleanly to an equivalent seated posture (e.g., upper body lean, head roll $\le 30^\circ$, teleportation to any viewpoint).

### 6. SCALE AND PERSPECTIVE (Embodied Scale Shifts)
- Learners must not remain passive spectators; they must **inhabit the scale of the phenomenon**:
  - *Cosmos:* Stand on the Karman line looking down at the curvature of Earth, then shrink the solar system to the size of a grapefruit in your hands.
  - *Human Body:* Shrink to the size of a red blood cell ($7.5\ \mu\text{m}$) and ride the turbulent current through the aortic arch.
  - *DNA:* Walk along the minor and major grooves of a double helix as tall as a skyscraper.
- Scale transitions must maintain a visual frame of reference (e.g., cockpit canopy, portal ring, hand frame) and execute smoothly over 1.0–2.0 seconds with peripheral vignette to eliminate motion discomfort.

### 7. SPATIAL AUDIO AND HAPTIC DETENTS
- Every interactive element must emit 3D positional audio using the Web Audio API HRTF (Head-Related Transfer Function) panner. Sound sources must attenuate accurately over distance ($1/r$).
- Physical contacts, snaps, and limit stops must trigger haptic pulses on Quest controllers (`pulse()` via the WebXR Gamepad API `hapticActuators`).
- High-frequency tick haptics (10–15 ms) denote detent snaps; low-frequency continuous rumbling denotes turbulence, blood flow, or engine thrust.

### 8. OPTIONAL MIXED REALITY (MR) PASSTHROUGH
- Where placing the object into the learner's physical living room adds cognitive or spatial value (e.g., examining a beating heart, quantum cryostat, or turbofan on your real coffee table), modules must offer an optional **Passthrough Tabletop Mode**.
- Must use WebXR `'immersive-ar'` session mode with `'alpha-blend'` blend mode when supported (Quest 3/3S).
- Mr modes run on Quest 3/3S only. No Quest 3-only mixed-reality feature may be required for a lesson; every MR feature needs a non-MR fallback. Full immersive VR remains the primary showcase.

### 9. STRICT FORBIDDEN ANTI-PATTERNS
The following are prohibited in Maarify:
- ❌ **Head-Locked HUDs:** No text, stats, or UI elements fixed to the camera viewport.
- ❌ **Webpage-Style Scroll Panels:** No 2D boxes with scrollbars or large reading panes.
- ❌ **Multiple-Choice Quizzes:** No A/B/C/D floating dialogs or quiz buttons.
- ❌ **Passive Video / Slide Decks:** No virtual TV screens playing prerecorded lectures.
- ❌ **Laser-Only Interfaces:** Laser pointers must not be the sole way to interact with reachable items.

### 10. SPATIAL ORIENTATION & AMBIENT GUIDANCE
- Learners must never feel lost or wonder "what do I do next?".
- Orientation is provided by **diegetic environmental cues** (subtle light pathways, particle drifts, sound beacons) and the concise spatial voice of the ambient mentor ("Dr. Amani", $\le 15$ seconds per intervention).
- Navigation between modules occurs exclusively through physical portals in the Hub, never through flat dropdown menus.

