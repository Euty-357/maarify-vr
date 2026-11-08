# Urban Development Module — SPEC
_Status: PLANNED (Immersion Audit Updated)_

## 1. Learning Objectives (Tier-Adapted)
- **Foundation:** Understand that growing cities require balanced housing, water, and transport; expanding roads attracts more cars instead of fixing traffic (induced demand); informal settlements need clean water and sanitation, not just eviction; Nairobi case study.
- **Advanced:** Explain macroscopic traffic flow dynamics ($q = k \cdot v$) and backward-propagating shockwaves; analyze informal settlement upgrading models (Kibera, Mathare); model the Digital Matatus paratransit network using GTFS open-transit data; evaluate 8 urban stakeholder interactions (formal residents, informal settlement dwellers, developers, urban planners, matatu operators, informal traders, environment, county government).
- **Expert:** Formulate Macroscopic Fundamental Diagrams (MFD); calculate user equilibrium under Wardrop's First Principle; analyze spatial econometrics of land value capture and urban heat island mitigation via albedo and canopy cover metrics.

---

## 2. Immersion Map (MANDATORY)

| Interaction / Object | What Makes It Spatial (Impossible on Flat Screen) | Hands / Controller / Body Input Used | Seated Parity Alternative |
| :--- | :--- | :--- | :--- |
| **Rooftop City Transit Dispatcher** | Standing on a high rooftop skyscraper overlooking a living 3D miniature model of Nairobi's Central Business District and Waiyaki Way; traffic streams of matatus, private cars, and pedestrians circulate beneath your feet with spatial city sounds. | Bodily leaning over roof railing to inspect street-level bottlenecks; direct point-and-drag of transit lane dividers. | Head pitch down; seated snap-turn to track traffic corridors. |
| **Matatu Paratransit Route Rerouting** | Grasping an informal matatu route line in 3D mid-air (based on Digital Matatus GTFS data) and physically dragging its path through a feeder neighborhood to link informal settlement commuters directly to industrial jobs. | Direct two-handed grab and pull of glowing 3D vector transit curve; haptic pulses on stop snaps. | Raycast point-and-drag on curve control points. |
| **Nairobi Expressway Induced Demand Lever** | Grasping an infrastructure investment lever to double highway lane capacity; physically watching new waves of private vehicles materialize and choke downstream roundabouts within 30 seconds (Braess's Paradox demonstrated physically). | Right hand pulls highway expansion lever down; 360° glance around city grid to watch congestion spread. | Vertical raycast pull on lever; thumbstick navigation across junctions. |
| **Informal Settlement Upgrading Grid** | Reaching down into a dense 3D district block of Kibera/Mathare; physically swapping dilapidated zinc shacks with multi-story communal housing blocks, inserting water points, storm drainage trenches, and fire access corridors. | Direct hand grabbing of modular 3D building blocks; snapping infrastructure pipes into street trenches with tactile detents. | Raycast pickup and drop of building modules on grid plinth. |
| **Urban Heat Island Thermal Slicing** | Moving a physical infrared thermal scanner plate across the city; watching color shifts from deep cool blue over Uhuru Park ($24^\circ\text{C}$) to fiery incandescent magenta over asphalt parking lots and unshaded zinc roofs ($38^\circ\text{C}$). | Hand translation of physical scanner handle over 3D city model; live readout on scanner frame. | Linear slider handle on diagnostic plinth. |

---

## 3. Beat Timeline (15–20 minutes)
1. **0:00–2:00 (Beat 1 — Opening Hook):** Stand on a rooftop overlooking downtown Nairobi at dusk. Sounds of bustling street markets, matatu horns, and distant thunderstorms.
2. **2:00–5:00 (Beat 2 — Urban Systems & Transit Corridors):** Inspect 3D city grid. Trace morning commuter flows from residential zones to commercial CBD.
3. **5:00–8:00 (Beat 3 — First Physical Challenge: Matatu Corridor Flow):** Optimize lane priority along an arterial corridor (e.g., Jogoo Road or Waiyaki Way) to maximize passenger throughput using paratransit.
4. **8:00–12:00 (Beat 4 — Informal Settlements & Basic Services):** Move down to ground level in an informal settlement. Insert clean piped water kiosks, solar streetlights, and paved pedestrian lanes without causing mass displacement.
5. **12:00–16:00 (Beat 5 — Capstone Challenge: Master District Plan):** Balance a rapidly expanding 100,000-resident district under strict budget, carbon, and equity constraints. Balance developer profits with green space and affordable housing.
6. **16:00–18:00 (Beat 6 — Urban Heat Islands & Green Corridors):** Map thermal hotspots; plant urban tree canopies and restore the Nairobi River riparian zone to cool the city center.
7. **18:00–20:00 (Beat 7 — Reflection & Exit Horizon):** Earn "Urban Master Planner" badge. Dr. Amani links to real African smart-city initiatives. Return through portal to Hub.

---

## 4. Stakeholder Simulation Architecture (Shared with Environment)
- Shares `src/core/simulation/stakeholder-sim.ts`.
- Simulates 8 urban agents (Formal Residents, Informal Residents, Developers, Planners, Matatu SACCOs, Traders, County Government, Environment).
- Visibly labelled: *"Simplified educational model — real urban dynamics are more complex."*
