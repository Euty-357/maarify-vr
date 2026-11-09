/**
 * Dr. Amani Audio Guidance Beats — Aerospace & Rocket Propulsion.
 * 
 * Culturally grounded in Kenyan aviation and space milestones:
 * - Nairobi Wilson Airport (1,680m high-altitude density altitude challenge)
 * - Historic Malindi Broglio Space Centre (separate from Taifa-1's Vandenberg launch)
 * - Taifa-1 Kenya Space Agency Earth observation mission
 * - Rigorous physics: debunking equal-transit-time myth, Newton's 3rd law, de Laval supersonic nozzle flow.
 */

export interface NarrativeBeat {
  id: string;
  beatIndex: number;
  speaker: string;
  title: string;
  transcript: string;
  durationEstimateSec: number;
  triggerEvent: string;
}

export const DR_AMANI_AEROSPACE_BEATS: NarrativeBeat[] = [
  {
    id: 'aero-beat-1',
    beatIndex: 1,
    speaker: 'Dr. Amani',
    title: 'High-Altitude Tarmac: Wilson & Malindi Horizons',
    transcript:
      'Welcome to Aerospace. Look around you — we stand between two worlds. Here at Nairobi’s Wilson Airport, roughly sixteen hundred and eighty meters above sea level, thin air alters aircraft performance before your wheels even leave the ground. Across the tarmac is an orbital rocket test stand. Malindi’s historic Broglio range is part of Kenya’s space history; it is not the launch site of Taifa-1. Let us master the forces that conquer both skies and space.',
    durationEstimateSec: 22,
    triggerEvent: 'module-start',
  },
  {
    id: 'aero-beat-2',
    beatIndex: 2,
    speaker: 'Dr. Amani',
    title: 'The Four Forces & Debunking Equal Transit Time',
    transcript:
      'Lift, weight, thrust, and drag. For decades, textbooks taught the myth of equal transit time — claiming air over the curved upper camber must meet air from below at the trailing edge. That is pure fiction. Real lift is fluid turning: the wing turns massive volumes of oncoming air downward, and by Newton’s third law, the air pushes the aircraft skyward with equal and opposite force.',
    durationEstimateSec: 24,
    triggerEvent: 'aerofoil-inspected',
  },
  {
    id: 'aero-beat-3',
    beatIndex: 3,
    speaker: 'Dr. Amani',
    title: 'Transonic Wind Tunnel: Boundary Layers & Stall',
    transcript:
      'Step up to the wind tunnel. Grab the wing handles and pitch the leading edge up into the airstream. Watch the laminar smoke streamlines hug the surface until — past fifteen degrees angle of attack — the boundary layer tears away into turbulent vortices. That shudder in your controllers is stall buffeting. The wing hasn’t stopped flying because it ran out of air; it stalled because the flow separated.',
    durationEstimateSec: 25,
    triggerEvent: 'wind-tunnel-pitch',
  },
  {
    id: 'aero-beat-4',
    beatIndex: 4,
    speaker: 'Dr. Amani',
    title: 'Exploded Liquid Rocket Engine: Regenerative Cooling',
    transcript:
      'Now pull the gimbal ring on our staged liquid rocket engine. Watch it explode into its core assemblies. Notice those thousands of tiny milled channels wrapping around the nozzle bell — that is regenerative cooling. Cryogenic fuel passes through the nozzle walls at hundreds of degrees below zero, soaking up extreme heat to prevent the metal from melting before injecting into the main chamber.',
    durationEstimateSec: 26,
    triggerEvent: 'engine-exploded',
  },
  {
    id: 'aero-beat-5',
    beatIndex: 5,
    speaker: 'Dr. Amani',
    title: 'Thermodynamic Cycles: Gas-Generator to Full-Flow Staged',
    transcript:
      'Swap between engine powerheads on the cycle plinth. The gas-generator dumps turbine exhaust overboard, trading peak specific impulse for mechanical simplicity. Staged combustion feeds all exhaust into the main chamber at brutal pressures over two hundred bar. And full-flow staged combustion powers separate fuel and oxidizer turbopumps with gas-gas preburners for peak reusability.',
    durationEstimateSec: 26,
    triggerEvent: 'cycle-swapped',
  },
  {
    id: 'aero-beat-6',
    beatIndex: 6,
    speaker: 'Dr. Amani',
    title: 'Supersonic de Laval Nozzles & Shock Diamonds',
    transcript:
      'Inspect the converging-diverging de Laval nozzle. In the convergent section, hot combustion gas accelerates to Mach 1 at the narrow throat. In the diverging bell, supersonic gas paradoxically accelerates further, expanding to Mach 3. Scrub the atmospheric backpressure slider: see how mismatch between nozzle exit pressure and ambient air produces oblique shock reflections — the famous glowing shock diamonds.',
    durationEstimateSec: 25,
    triggerEvent: 'nozzle-scrubbed',
  },
  {
    id: 'aero-beat-7',
    beatIndex: 7,
    speaker: 'Dr. Amani',
    title: 'Orbital Horizon: Taifa-1 & African Aerospace Leadership',
    transcript:
      'You have balanced wing aerodynamics, routed high-pressure turbopump loops, and shaped supersonic nozzle flows. In April 2023, Taifa-1 launched aboard SpaceX Transporter-7 from Vandenberg Space Force Base in California into a Sun-Synchronous Orbit. It supports Earth observation for agriculture, environment, and disaster-management uses. Well done, Flight Director.',
    durationEstimateSec: 24,
    triggerEvent: 'capstone-complete',
  },
];
