# Aerospace & Rocket Propulsion — Asset Plan (WP7)

_Data and docs only. Maps each course mission to a GLB asset, part ids, interaction,
tier, and narration key. The mission data itself lives in
`src/modules/aerospace/missions.ts` and is validated by
`npm run audit:missions`._

## Choreography Steps

| Step | Mission | Asset | Part ids | Interaction | Tier | Narration key | Success condition |
|------|---------|-------|----------|-------------|------|---------------|-------------------|
| 1 | aero-m1-wings-work | — (procedural wing) | aerofoil spar | scrub | Foundation | aero-lift-foundation | Angle of attack set to 0.25 ± 0.08 (best lift-to-drag before stall). |
| 2 | aero-m2-fly-the-controls | — (procedural aircraft) | aileron, elevator, rudder | tune | Foundation | aero-controls-foundation | Roll, pitch and yaw all trimmed to 0° ± 15°. |
| 3 | aero-m3-turbofan-order | engine_turbofan | fan, low-pressure-compressor, high-pressure-compressor, combustor, high-pressure-turbine, low-pressure-turbine | place | Advanced | aero-turbofan-advanced | Six stages placed in the true order of the airflow. |
| 4 | aero-m4-trace-the-propellant | engine_gas_generator (+ engine_ffsc_methalox) | feed-lines, turbopump, gas-generator, injector | dock | Expert | aero-turbopump-expert | The turbopump docked into its socket without crossing the two propellant streams. |
| 5 | aero-m5-to-orbit | engine_ffsc_methalox, engine_hydrolox_staged, engine_srm | — | tune | Expert | aero-orbit-expert | Delta-v reaches 0.95 ± 0.08 of the orbit line with two stages. |
| 6 | aero-m6-kenya-connection | — (procedural Kenya panel) | — | scrub | Foundation | aero-kenya-foundation | Density altitude set to 0.35 ± 0.10 so the takeoff margin is healthy. |
| 7 | aero-capstone-design-to-mission | all three engines | — | tune | Expert | aero-capstone-expert | Capstone score reaches 1.0 ± 0.05 on the chosen mission card. |

## Notes
- Every mission cites source ids in `src/modules/aerospace/SOURCES.md`:
  `NASA-GLENN-LIFT-MYTHS`, `ANDERSON-AERODYNAMICS-2016`, `SUTTON-BIBLARZ-ROCKET-2016`,
  `HILL-PETERSON-PROPULSION`, `BATE-MUELLER-WHITE-ASTRODYNAMICS`,
  `BOEING-COMMERCIAL-JET-CYCLE`, `KCAA-WILSON-ELEVATION-2025`,
  `KSA-TAIFA1-LAUNCH-2023`, `UON-TAIFA1-LAUNCH-2023`, `SAN-MARCO-MALINDI-HISTORY`.
- Respects the Rocket Propulsion Safety Scope: system-level education only — no propellant formulations, mixing, ignition, or fabrication instructions (AGENTS.md / D-013).
- Asset part ids and triangle counts come from `C:\MaarifyAssets\manifest.json`.
- `aero_wing_section` and `aircraft_general_aviation` are listed under
  "Asset requests" in docs/STATE.md. Until they arrive, M1 and M2 run against the
  existing procedural geometry and are marked **NOT final**.
- The mission control ids the scene must build are listed under "Open questions"
  in docs/STATE.md.