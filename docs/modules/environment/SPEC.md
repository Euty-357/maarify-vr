# Environment Module — SPEC
_Status: PLANNED (Immersion Audit Updated)_

## 1. Learning Objectives (Tier-Adapted)
- **Foundation:** Understand that ecosystems are connected webs where changes to one part affect all living things; forests act as water catchments; deforestation causes flash floods and dries rivers; Kenyan examples (Mau Forest Complex, Lake Naivasha, coastal mangroves).
- **Advanced:** Explain watershed hydrological balance ($P = Q + ET + \Delta S$); analyze trophic cascades and keystone species dynamics; model cause-and-effect feedbacks across 9 stakeholder groups (farmers, pastoralists, wildlife, downstream users, fisherfolk, tourism, future generations, industry, county government); evaluate Kenya's Five Water Towers.
- **Expert:** Formulate 1D Richards unsaturated soil flux equations; calculate non-linear ecological tipping points and regime shifts via bifurcation analysis; evaluate Blue Carbon sequestration rates in coastal *Rhizophora* mangrove ecosystems.

---

## 2. Immersion Map (MANDATORY)

| Interaction / Object | What Makes It Spatial (Impossible on Flat Screen) | Hands / Controller / Body Input Used | Seated Parity Alternative |
| :--- | :--- | :--- | :--- |
| **Mau Forest Watershed Time Scrub** | Standing on a high ridge overlooking a 1:1000 scale 3D terrain of the Mau Forest Complex and Mara River Basin; physically grabbing a heavy 3D time lever to scrub between 1980 and 2024, watching tree canopies vanish and riverbeds dry into cracked stone in real 3D depth. | Two-handed grasp on brass time-lever; forward/backward pull motion with tactile ratchets. | Single controller raycast grab; thumbstick scrub. |
| **Mangrove Root Storm Buffer Ring** | Kneeling down to water level in a tidal mangrove estuary; physically weaving intertwined prop roots (*Rhizophora*) to observe how complex 3D root matrices attenuate incoming ocean storm waves and trap suspended sediment. | Crouching to water surface; hand grabbing and positioning root geometry into matrix slots. | Elevate simulation table to eye level; raycast root placement. |
| **Ecosystem Stakeholder Ripple Lever** | Interacting with a room-scale spatial graph floating in mid-air: pulling an agricultural irrigation water-gate open causes physical light beams to propagate downriver, turning downstream fisherfolk and pastoralist nodes red while farm yields brighten green. | Direct hand contact pushing/pulling water sluice gate; looking around 360° to monitor stakeholder node colors. | Seated raycast push/pull; snap-turn to observe all stakeholder indicators. |
| **Lake Naivasha Water Balance Dial** | Grasping an oversized hydrological control valve on a 3D cutaway model of Lake Naivasha; balancing flower farm abstraction against geothermal recharge and papyrus wetland filtration. | Two-handed twisting of valve wheel with continuous haptic detents. | Controller joystick rotation; raycast grab handle. |
| **Deforestation Erosion Stream** | Holding a virtual rainfall sprinkler wand over forested vs deforested hillsides; watching mud torrents scour soil down bare slopes while forested slopes absorb clear groundwater. | Tilting rainfall wand over 3D terrain; physical inspection of resulting erosion gully depth. | Raycast aiming of rain clouds; controller trigger activates rain. |

---

## 3. Beat Timeline (15–20 minutes)
1. **0:00–2:00 (Beat 1 — Opening Hook):** Stand on a cliff overlooking the dense Mau Forest canopy at dawn. Sounds of African fish eagles and roaring waterfalls.
2. **2:00–5:00 (Beat 2 — Watershed Anatomy & Sponge Effect):** Inspect 3D terrain. Probe deep soil root networks; observe water absorption and transpiration.
3. **5:00–8:00 (Beat 3 — First Physical Challenge: Water Tower Infiltration):** Place reforestation plots along degraded slopes to restore baseflow infiltration above $50\text{ mm/h}$.
4. **8:00–12:00 (Beat 4 — Trophic Cascades & Stakeholder Causal Sim):** Enter room-scale stakeholder graph. Manipulate agricultural expansion; observe multi-agent ripple effects on pastoralists and wildlife corridors.
5. **12:00–16:00 (Beat 5 — Capstone Challenge: Kenya Water Basin Equilibrium):** Balance a multi-stakeholder scenario across Mau Forest and Lake Naivasha: achieve sustainable flower export, food security, and wetland health under drought stress.
6. **16:00–18:00 (Beat 6 — Coastal Mangroves & Blue Carbon):** Travel to Kenyan coast; build mangrove wave buffers; measure carbon burial in tidal sediments.
7. **18:00–20:00 (Beat 7 — Reflection & Exit Horizon):** Earn "Ecosystem Guardian" badge. Review Kenyan conservation initiatives (Wangari Maathai Green Belt Movement legacy). Hub portal opens.

---

## 4. Stakeholder Simulation Architecture (Shared with Urban Development)
- Utilizes the shared graph engine `src/core/simulation/stakeholder-sim.ts`.
- Simulates 9 distinct agent nodes with mutual dependencies and feedback loops.
- Visibly labelled: *"Simplified educational model — real ecosystem dynamics are more complex."*
