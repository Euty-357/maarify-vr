# Aerospace Module — SPEC
_Status: PLANNED (Immersion Audit & Rocket Engine Update)_
_Target Hardware: Meta Quest 3 and Meta Quest 3S only_

## 1. Learning Objectives (Tier-Adapted)
- **Foundation:** Understand the four forces of flight (lift, weight, thrust, drag); how wings deflect air downward to create lift (Newton's 3rd law); how turbofans use high bypass air for efficiency; how rockets produce thrust in vacuum without pushing against air; basic rocket engine cycles and flow paths; Kenyan high-altitude aerodynamics (Wilson & JKIA airports) and space missions (Taifa-1).
- **Advanced:** Explain aerofoil circulation, pressure distribution, angle of attack, boundary layer separation, and stall; analyze turbofan thermodynamic stages (Brayton cycle, bypass ratio); calculate rocket staging delta-v using the Tsiolkovsky equation ($\Delta v = I_{sp} g_0 \ln(m_0/m_f)$); compare rocket engine thermodynamic cycles (gas-generator vs staged combustion vs expander); compare propellant chemistries (methalox, kerolox, hydrolox, hypergolic, solid); debunk equal-transit-time lift myth.
- **Expert:** Formulate Navier-Stokes equations and Euler turbine equations; analyze compressible flow, Mach cones, shock waves, and Prandtl-Meyer expansion fans; optimize converging-diverging de Laval rocket nozzles using method of characteristics; analyze full-flow staged combustion cycle (FFSC) chamber pressure and mass-flow coupling; evaluate electric-pump cycle battery energy density limits.

---

## 2. Safety & Curriculum Scope Guardrail (MANDATORY)
> **Safety Directive:** All rocket propulsion content is strictly limited to high-level textbook principles, system thermodynamics, propellant trade-offs, and plumbing flow paths.
> **Strictly Prohibited:** Propellant formulation recipes, mixing or chemical synthesis procedures, grain casting or curing techniques, ignition pyrotechnic chemical mixtures, or any hardware fabrication dimensions that could function as build instructions.
> *Confirmed by science-medical-reviewer.*

---

## 3. Immersion Map (MANDATORY)

| Interaction / Object | What Makes It Spatial (Impossible on Flat Screen) | Hands / Controller / Body Input Used | Seated Parity Alternative |
| :--- | :--- | :--- | :--- |
| **Rocket Engine 3D Exploded View** | Standing next to a 3-meter full-scale liquid rocket engine; physically grasping the outer gimbal ring with two hands and pulling outwards to explode the engine into combustion chamber, turbopumps, preburners, injectors, and regenerative cooling jacket along radial and axial axes with tactile detents. | Two-handed grab and pull along central thrust axis; wrist rotation re-orients engine assembly in 3D space. | Single-hand raycast pull on assembly handle plinth; elevation slider on inspection stand. |
| **Propellant Particle Flow Tracing** | Hand-tracing fuel (methane/kerosene/hydrogen) and oxidizer (liquid oxygen) particle streams through complex plumbing; using a fingertip to follow fuel through the regenerative cooling jacket tubes around the nozzle up into the injector head. | Index finger pointing and tracing along 3D pipe manifolds; haptic ticking increases in frequency as finger follows fluid flow velocity. | Raycast pointer tracking along highlighted pipe path; automatic camera zoom along flow trajectory. |
| **Thermodynamic Cycle Swap Plinth** | Physically swapping modular 3D powerhead assemblies (Gas-Generator, Expander, Staged Combustion, Full-Flow Staged Combustion, Electric-Pump) onto the engine thrust chamber; watching plumbing re-route, turbine drive loops reconfigure, and chamber pressure dials animate dynamically in 3D. | Direct grab of powerhead module; snap-fit into engine mounting ring with magnetic haptic detent. | Raycast select-and-snap on component plinth; thumbstick selection. |
| **Transonic Wind Tunnel Smoke Spar** | Standing inside an active virtual wind tunnel holding two interactive smoke wands in 3D space; moving wands upstream of an aerofoil shows silky laminar streamlines conforming to the curved upper surface. | Hand movement of smoke wands in 3D volume; trigger adjusts airflow velocity. | Controller pointing wand position; trigger squeeze controls smoke flow rate. |
| **Wing Spar Pitch & Stall Buffeting** | Grasping the physical wing spar with both hands and pitching the angle of attack upwards; passing $15^\circ$ causes boundary layer streamlines to detach violently into turbulent vortices, triggering heavy controller vibration. | Two-handed grip on wing handles; physical rotation of wrists/arms to pitch wing. | Single joystick pitch slider on plinth; haptic feedback transmitted through controller. |
| **Nozzle Expansion Shock Diamond Slicing** | Crouching underneath a staged rocket engine nozzle; moving a physical atmospheric backpressure slider to watch supersonic shock diamonds expand and contract in exhaust plume, demonstrating over-expanded vs under-expanded flow. | Physical crouching under nozzle; hand translation of atmospheric pressure lever. | Elevation adjustment of rocket stand to seated height; raycast slider drag. |

---

## 4. Rocket Engine Architecture & Exploded Systems

### 4.1 Thermodynamic Engine Cycles (Explorable & Swappable)
1. **Pressure-Fed Cycle:** Simplest architecture. High-pressure helium tank forces propellants into chamber. No turbopumps. Low chamber pressure ($P_c \sim 10\text{--}20\text{ bar}$), low dry mass, high tank mass. Example: Apollo Lunar Module Ascent Engine, SuperDraco.
2. **Gas-Generator (Open Cycle):** Small portion of propellants burned in a preburner to drive a turbine, exhausting overboard. Moderate chamber pressure ($P_c \sim 70\text{--}100\text{ bar}$), slight specific impulse ($I_{sp}$) penalty from unexpanded exhaust. Example: Merlin 1D, F-1, Vulcain.
3. **Expander Cycle (Closed & Open):** Fuel (liquid hydrogen or methane) flows through regenerative cooling channels, absorbs heat from chamber, expands through turbine to drive pumps, then injected into combustion chamber. Extremely clean, high efficiency, but thrust limited by chamber heat transfer area. Example: RL10, Vinci.
4. **Oxidizer-Rich Staged Combustion (ORSC):** All oxidizer and a small amount of fuel burn in preburner at high pressure; hot, oxygen-rich gas drives turbine and exhausts entirely into main combustion chamber. High chamber pressure ($P_c > 200\text{ bar}$), high $I_{sp}$, requires exotic metallurgy to prevent oxygen fire. Example: RD-180, NK-33.
5. **Fuel-Rich Staged Combustion (FRSC):** Fuel-rich preburner gas drives turbine; all gas exhausts into main chamber. Ideal for hydrolox. Example: RS-25 (Space Shuttle Main Engine).
6. **Full-Flow Staged Combustion (FFSC):** Two separate preburners: fuel-rich preburner powers fuel turbopump; oxidizer-rich preburner powers oxidizer pump. 100% of propellants pass through turbines as gases before entering chamber. Maximum efficiency, lowest turbine operating temperatures for given power, highest chamber pressure ($P_c \sim 300+\text{ bar}$), high plumbing complexity. Example: Raptor.
7. **Electric-Pump-Fed Cycle:** High-energy-density lithium battery pack drives high-RPM brushless DC electric motors powering fuel and oxidizer pumps. Eliminates preburners and turbine plumbing entirely. Lightweight, throttleable, battery mass scales with total burn time. Example: Rutherford (Electron).

### 4.2 Propellant Systems & Trade-Offs
- **Methalox ($CH_4 / LOX$):** High density, clean burning (minimal soot), excellent for reusability, readily liquefiable at similar temperatures to $LOX$, potential for in-situ resource utilization (Sabatier reaction on Mars). $I_{sp} \sim 330\text{--}380\text{s}$.
- **Kerolox ($RP\text{-}1 / LOX$):** High propellant density (compact tanks), cheap, room-temperature fuel storage, but coking/sooting inside cooling channels limits reusability. $I_{sp} \sim 280\text{--}350\text{s}$.
- **Hydrolox ($LH_2 / LOX$):** Maximum chemical efficiency ($I_{sp} \sim 380\text{--}455\text{s}$), clean steam exhaust, but ultra-low density requires massive tanks, extreme cryogenic insulation ($20\text{ K}$), and hydrogen embrittlement.
- **Hypergolic ($N_2O_4 / UDMH$ / $MMH$):** Spontaneously ignites on contact, zero ignition system needed, indefinitely storable at room temperature, highly toxic and corrosive. Used in satellite maneuvering and deep-space kick stages.
- **Solid Propellant Motors:** Fuel and oxidizer cast into solid grain inside casing (star grain, cylinder, conical). Simple, instant high-thrust launch, cannot be shut down or throttled easily once ignited. Burn profile determined by grain cross-section surface area.
- **Non-Chemical & Advanced Propulsion (Conceptual Overview):**
  - *Ion & Hall Thrusters:* Electric field accelerates ionized xenon/krypton propellant to enormous exhaust velocities ($v_e > 30\text{ km/s}$, $I_{sp} > 3000\text{s}$), delivering micropounds of continuous thrust for interplanetary deep space.
  - *Nuclear Thermal Propulsion (NTP):* Nuclear fission reactor heats liquid hydrogen to extreme temperatures, expanding out a nozzle ($I_{sp} \sim 900\text{s}$).
  - *Air-Breathing Ramjets & Scramjets:* Ingest atmospheric oxygen at Mach 3+ (ramjet) and Mach 5+ (scramjet), requiring forward vehicle speed to compress incoming air without a mechanical compressor.

---

## 5. Beat Timeline (15–20 minutes)
1. **0:00–2:00 (Beat 1 — Opening Hook):** Stand on runway at Nairobi's Wilson Airport at high noon. An aircraft takes off overhead while an orbital rocket engine ignites on a static test stand across the tarmac.
2. **2:00–5:00 (Beat 2 — Aircraft Aerodynamics & 4 Forces):** Inspect aerofoil wing. Grab control surfaces (ailerons, elevator, rudder); observe dynamic 3D lift/drag force vectors.
3. **5:00–8:00 (Beat 3 — Virtual Wind Tunnel & Stall):** Pitch wing spar with both hands in smoke tunnel; feel boundary layer separation buffet in controllers; debunk equal-transit-time myth.
4. **8:00–12:00 (Beat 4 — Turbofan & Rocket Exploded Disassembly):**
   - Disassemble high-bypass turbofan stages along central axis.
   - Explode liquid rocket engine; trace fuel through regenerative nozzle cooling channels and oxidizer through turbopump into injector.
5. **12:00–16:00 (Beat 5 — Capstone Challenge: Propulsion & Orbital Insertion):**
   - *Part A (Engine Cycle Plumber):* Route fuel, oxidizer, and turbine drive gas loops correctly on a full-flow staged combustion powerhead.
   - *Part B (Launch & Orbit):* Select staging throttle and pitch angle from Malindi launch latitude to achieve 200 km circular low Earth orbit.
6. **16:00–18:00 (Beat 6 — Supersonic Nozzle Shock Diamonds):** Scrub backpressure on de Laval nozzle; observe underexpanded vs overexpanded flow regimes and oblique shock reflection.
7. **18:00–20:00 (Beat 7 — Reflection & Exit Horizon):** Earn "Aerospace Flight Director" badge. Dr. Amani highlights Kenya Space Agency Taifa-1. Hub portal opens.

---

## 6. Challenges (Physical & Seated-Compatible)
1. **Challenge 1 — Wing Trim & Angle of Attack Balancing:** Mechanically pitch wing to maintain maximum lift-to-drag ratio ($L/D$) in thin high-altitude Nairobi air ($1,680\text{ m}$ elevation).
2. **Challenge 2 — Rocket Turbopump Plumbing:** Hand-trace and connect propellant lines on a staged combustion engine without crossing high-pressure oxidizer lines into fuel turbines.
3. **Challenge 3 — Supersonic Nozzle Contour Tuning:** Adjust nozzle expansion area ratio ($\epsilon = A_e/A_t$) to eliminate flow separation inside the nozzle bell at sea level.
4. **Capstone Challenge — Orbit Injection from Malindi:** Execute multi-stage launch profile; throttle engine during Max-Q; stage fairings and booster cleanly; circularize orbit at 7.8 km/s.

---

## 7. Sources & References
- Sutton, G. P., & Biblarz, O. (2016). *Rocket Propulsion Elements* (9th ed.). John Wiley & Sons.
- NASA Glenn Research Center (2021). *Beginner's Guide to Aerodynamics: Incorrect Lift Theories*. https://www.grc.nasa.gov/WWW/K-12/airplane/wrong1.html
- Hill, P., & Peterson, C. (1992). *Mechanics and Thermodynamics of Propulsion* (2nd ed.). Addison-Wesley.
- Kenya Space Agency (2023). *Taifa-1 Mission Overview*. https://ksa.go.ke
