import type { CourseEvent, MissionDefinition } from '../../core/types.js';

/**
 * Aerospace & Rocket Propulsion — course missions.
 *
 * Data only. Every factual claim is backed by a source id in SOURCES.md.
 * Rocket content stays at textbook, system level: principles, flow paths and
 * trade-offs only — no propellant formulations, mixing, ignition or fabrication
 * instructions (AGENTS.md / D-013).
 *
 * M3 (turbofan) runs against a clearly labelled procedural stand-in until the
 * missing GLB arrives; it is NOT final.
 *
 * ASSET REQUESTS: the assets these missions still need, with the part ids,
 * authored size, interactions and extras required, are listed under
 * "Asset requests" in docs/STATE.md. A mission whose asset is missing must
 * degrade gracefully — never fake it.
 */

/** True when the learner moved a control to within `tolerance` of `target`. */
function reachedValue(
  events: CourseEvent[],
  controlId: string,
  target: number,
  tolerance: number,
): boolean {
  return events.some(
    (e) =>
      (e.type === 'sliderChanged' || e.type === 'rotated' || e.type === 'explodeChanged') &&
      e.target === controlId &&
      typeof e.value === 'number' &&
      Math.abs(e.value - target) <= tolerance,
  );
}

/** True when the learner rotated a control to within `tolerance` degrees of `target`. */
function rotatedTo(
  events: CourseEvent[],
  controlId: string,
  target: number,
  tolerance: number,
): boolean {
  return events.some(
    (e) =>
      e.type === 'rotated' &&
      e.target === controlId &&
      typeof e.value === 'number' &&
      Math.abs(e.value - target) <= tolerance,
  );
}

/** True when the learner docked a peg into a named anchor. */
function dockedInto(events: CourseEvent[], pegId: string, anchorName: string): boolean {
  return events.some(
    (e) =>
      e.type === 'docked' &&
      e.target === pegId &&
      e.meta?.['anchorName'] === anchorName,
  );
}

/** True when the learner placed N parts whose target id starts with `prefix`. */
function placedCount(events: CourseEvent[], prefix: string, count: number): boolean {
  return events.filter((e) => e.type === 'placed' && e.target?.startsWith(prefix)).length >= count;
}

export const AEROSPACE_MISSIONS: MissionDefinition[] = [
  {
    id: 'aero-m1-wings-work',
    title: 'How Wings Work',
    objective: 'You find the angle of attack that gives an airliner the best lift-to-drag ratio.',
    outcomes: {
      foundation:
        'You set the wing angle and watch the airflow. Lift rises, then the wing stalls.',
      advanced:
        'You find the best lift-to-drag ratio near 6 to 8 degrees, before the stall near 15 degrees.',
      expert:
        'You combine the thin-aerofoil lift slope, the stall boundary, and the induced-drag polar.',
    },
    steps: [
      {
        id: 'aero-m1-hook',
        caption: 'You commit to a guess: where do you think this wing stops making lift?',
        highlights: ['aero-wing-pitch-slider'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' && e.target === 'aero-wing-pitch-slider'),
      },
      {
        id: 'aero-m1-explore',
        caption: 'You sweep the angle of attack and watch the streamlines separate at the stall.',
        highlights: ['aero-wing-pitch-slider', 'aero-stall-indicator'],
        completed: (events) =>
          reachedValue(events, 'aero-wing-pitch-slider', 0.85, 0.05) ||
          reachedValue(events, 'aero-wing-pitch-slider', 0.1, 0.05),
      },
      {
        id: 'aero-m1-apply',
        caption: 'You settle the wing where lift is high and drag is still small.',
        highlights: ['aero-wing-pitch-slider'],
        completed: (events) => reachedValue(events, 'aero-wing-pitch-slider', 0.25, 0.06),
      },
    ],
    hints: [
      'The wing spar and its angle-of-attack slider are glowing beside the tunnel.',
      'Slide until the stall indicator turns red, then back away from it.',
      'Slide the handle to the middle of the travel, near the low end of the scale.',
    ],
    feedback: {
      success: 'You found the sweet spot: strong lift, little drag. Air over the top arrives first.',
      nearMiss: 'You are close. Ease the angle back a little from the stall and try again.',
      wrong: 'That angle is past the stall. Move the slider back toward the low end and watch again.',
    },
    successPredicate: (events) => reachedValue(events, 'aero-wing-pitch-slider', 0.25, 0.08),
    tolerance: 0.08,
    xp: 150,
    badge: 'aero-badge-wings',
    panelRefs: ['aerospace-anchor-aerofoil-lift'],
    sources: ['NASA-GLENN-LIFT-MYTHS', 'ANDERSON-AERODYNAMICS-2016'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'Seated at the tunnel, the slider handle sits at 0.95 m; reach it with either hand.',
    reducedMotionVariant: 'The streamlines scroll slowly and the stall shake is removed.',
  },
  {
    id: 'aero-m2-fly-the-controls',
    title: 'Fly the Controls',
    objective: 'You match a target roll, pitch and yaw using the aircraft control surfaces.',
    outcomes: {
      foundation:
        'You move the ailerons, elevator and rudder and see the aircraft respond in roll, pitch and yaw.',
      advanced:
        'You trim roll, pitch and yaw to the target attitudes and notice the control forces fall away.',
      expert:
        'You relate the control deflections to the aerodynamic moments and the neutral trim point.',
    },
    steps: [
      {
        id: 'aero-m2-hook',
        caption: 'You predict which control turns the aircraft left and which turns it right.',
        highlights: ['aero-yoke', 'aero-pedals'],
        completed: (events) =>
          events.some((e) => e.type === 'grabbed' && (e.target === 'aero-yoke' || e.target === 'aero-pedals')),
      },
      {
        id: 'aero-m2-explore',
        caption: 'You roll, pitch and yaw the aircraft and watch the attitude readout follow.',
        highlights: ['aero-yoke', 'aero-pedals'],
        completed: (events) =>
          events.some((e) => e.type === 'grabbed' && e.target === 'aero-yoke') &&
          events.some((e) => e.type === 'grabbed' && e.target === 'aero-pedals'),
      },
      {
        id: 'aero-m2-apply',
        caption: 'You trim the aircraft until roll, pitch and yaw all sit at the target marks.',
        highlights: ['aero-yoke', 'aero-pedals'],
        completed: (events) =>
          rotatedTo(events, 'aero-control-roll', 0, 12) &&
          rotatedTo(events, 'aero-control-pitch', 0, 12) &&
          rotatedTo(events, 'aero-control-yaw', 0, 12),
      },
    ],
    hints: [
      'The yoke and the rudder pedals are lit on the aircraft bench.',
      'Roll uses the ailerons, pitch uses the elevator, yaw uses the rudder.',
      'Bring each of the three readouts back to the centre mark one at a time.',
    ],
    feedback: {
      success: 'The aircraft flies straight and level. Small inputs give smooth, predictable turns.',
      nearMiss: 'Almost there. One of the three readouts is still off its mark.',
      wrong: 'That control changes a different axis. Try the yoke for roll and pitch, the pedals for yaw.',
    },
    successPredicate: (events) =>
      rotatedTo(events, 'aero-control-roll', 0, 15) &&
      rotatedTo(events, 'aero-control-pitch', 0, 15) &&
      rotatedTo(events, 'aero-control-yaw', 0, 15),
    tolerance: 15,
    xp: 150,
    badge: 'aero-badge-controls',
    panelRefs: ['aerospace-anchor-aerofoil-lift'],
    sources: ['ANDERSON-AERODYNAMICS-2016'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'Seated in the pilot seat, the yoke is at 0.95 m and the pedals at 0.25 m.',
    reducedMotionVariant: 'The attitude indicator eases rather than snaps.',
  },
  {
    id: 'aero-m3-turbofan-order',
    title: 'Engines That Breathe Air',
    objective: 'You assemble a high-bypass turbofan in the correct order along the airflow.',
    outcomes: {
      foundation:
        'You place fan, compressors, combustor, turbines and nozzle in the order air passes through them.',
      advanced:
        'You track pressure and temperature rising through the compressors and falling through the turbines.',
      expert:
        'You balance the Brayton cycle work and judge the engine against its bypass ratio.',
    },
    steps: [
      {
        id: 'aero-m3-hook',
        caption: 'You predict which end of the engine air enters and which end it leaves.',
        highlights: ['fan'],
        completed: (events) => events.some((e) => e.type === 'grabbed' && e.target === 'fan'),
      },
      {
        id: 'aero-m3-explore',
        caption: 'You place the sections one by one and watch the pressure bars climb and fall.',
        highlights: ['fan', 'low-pressure-compressor', 'high-pressure-compressor'],
        completed: (events) => placedCount(events, 'aero-turbofan-slot-', 3),
      },
      {
        id: 'aero-m3-apply',
        caption: 'You complete the engine so every stage sits in the true order of the airflow.',
        highlights: ['combustor', 'high-pressure-turbine', 'low-pressure-turbine'],
        completed: (events) => placedCount(events, 'aero-turbofan-slot-', 6),
      },
    ],
    hints: [
      'The empty engine frame is lit in the engine hall.',
      'Air enters at the fan, is squeezed by the compressors, burns in the combustor, then drives the turbines.',
      'Place the fan first, then low-pressure compressor, high-pressure compressor, combustor, high-pressure turbine, low-pressure turbine.',
    ],
    feedback: {
      success: 'The engine breathes correctly. Compressors squeeze, the combustor heats, turbines extract work.',
      nearMiss: 'The order is nearly right. Check what comes immediately before and after the combustor.',
      wrong: 'That stage cannot sit there in the airflow. Follow the air from the fan to the nozzle.',
    },
    successPredicate: (events) => placedCount(events, 'aero-turbofan-slot-', 6),
    tolerance: 0,
    xp: 175,
    badge: 'aero-badge-turbofan',
    panelRefs: [],
    sources: ['BOEING-COMMERCIAL-JET-CYCLE'],
    assetIds: ['engine_turbofan'],
    partIds: [
      'fan',
      'low-pressure-compressor',
      'high-pressure-compressor',
      'combustor',
      'high-pressure-turbine',
      'low-pressure-turbine',
    ],
    seatedVariant: 'Seated at the engine frame, every slot is within 1.2 m of the seat.',
    reducedMotionVariant: 'The airflow ribbon animates without pulsing.',
  },
  {
    id: 'aero-m4-trace-the-propellant',
    title: 'Trace the Propellant',
    objective: 'You route fuel and oxidiser through the rocket engine to its injector.',
    outcomes: {
      foundation:
        'You follow the fuel line and the oxidiser line from the tanks to the injector.',
      advanced:
        'You connect the turbopump, gas generator and injector so the two streams stay separate until they mix.',
      expert:
        'You explain how a gas generator drives the turbopump and why the streams must never cross.',
    },
    steps: [
      {
        id: 'aero-m4-hook',
        caption: 'You predict which line carries fuel and which carries the oxidiser.',
        highlights: ['feed-lines'],
        completed: (events) => events.some((e) => e.type === 'grabbed' && e.target === 'feed-lines'),
      },
      {
        id: 'aero-m4-explore',
        caption: 'You pull the engine apart and trace each line from its tank to the injector.',
        highlights: ['feed-lines', 'injector', 'gas-generator'],
        completed: (events) => reachedValue(events, 'aero-explode-amount', 1, 0.1),
      },
      {
        id: 'aero-m4-apply',
        caption: 'You dock the turbopump into its socket without crossing the two streams.',
        highlights: ['turbopump'],
        completed: (events) => dockedInto(events, 'turbopump', 'anchor_turbopump-socket'),
      },
    ],
    hints: [
      'The feed lines and the turbopump are lit on the gas-generator engine stand.',
      'Orange marks fuel, cyan marks oxidiser. The gas generator burns a small fraction to spin the pump.',
      'Dock the turbopump into the single socket on the engine frame.',
    ],
    feedback: {
      success: 'The circuit is routed cleanly. The propellants meet only where they should.',
      nearMiss: 'The pump is not home yet. Bring it closer to its socket and let go.',
      wrong: 'That pump does not feed that socket. Orange is fuel, cyan is oxidiser — never cross them.',
    },
    successPredicate: (events) => dockedInto(events, 'turbopump', 'anchor_turbopump-socket'),
    tolerance: 0,
    xp: 200,
    badge: 'aero-badge-propellant',
    panelRefs: [],
    sources: ['SUTTON-BIBLARZ-ROCKET-2016', 'HILL-PETERSON-PROPULSION'],
    assetIds: ['engine_gas_generator', 'engine_ffsc_methalox'],
    partIds: ['feed-lines', 'turbopump', 'gas-generator', 'injector'],
    seatedVariant: 'Seated at the engine stand, the two-handed pinch-pull explode gesture and the turbopump are within reach.',
    reducedMotionVariant: 'The engine separates in slow steps without overshoot.',
  },
  {
    id: 'aero-m5-to-orbit',
    title: 'To Orbit',
    objective: 'You build a launch stack that reaches orbital speed with the rocket equation.',
    outcomes: {
      foundation:
        'You choose a bigger booster or a second stage so the stack gains enough speed.',
      advanced:
        'You apply the rocket equation and find the delta-v your stage masses deliver.',
      expert:
        'You budget stage delta-v against the losses and find the minimum staging that reaches orbit.',
    },
    steps: [
      {
        id: 'aero-m5-hook',
        caption: 'You predict whether one stage alone can reach orbit.',
        highlights: ['aero-stack-builder'],
        completed: (events) => events.some((e) => (e.type === 'sliderChanged' || e.type === 'rotated') && e.target === 'aero-stack-stage-count'),
      },
      {
        id: 'aero-m5-explore',
        caption: 'You change the stage masses and watch the delta-v readout respond.',
        highlights: ['aero-stack-builder'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' && e.target === 'aero-stack-stage-mass'),
      },
      {
        id: 'aero-m5-apply',
        caption: 'You split the stack and find the configuration that reaches orbital speed.',
        highlights: ['aero-stack-builder'],
        completed: (events) =>
          reachedValue(events, 'aero-stack-stage-count', 1, 0.01) &&
          reachedValue(events, 'aero-stack-delta-v', 0.95, 0.08),
      },
    ],
    hints: [
      'The stack builder panel is lit in the engine hall.',
      'Delta-v grows when you throw away empty mass, so staging is worth more than a bigger engine.',
      'Set two stages and trim the mass sliders until the delta-v bar reaches the orbit line.',
    ],
    feedback: {
      success: 'Your stack reaches orbital speed. Staging threw away dead weight at exactly the right moment.',
      nearMiss: 'Close, but the delta-v bar is still short. Try a second stage.',
      wrong: 'One stage cannot reach orbit from Earth. Split the stack in two.',
    },
    successPredicate: (events) => reachedValue(events, 'aero-stack-delta-v', 0.95, 0.08),
    tolerance: 0.08,
    xp: 200,
    badge: 'aero-badge-orbit',
    panelRefs: [],
    sources: ['BATE-MUELLER-WHITE-ASTRODYNAMICS', 'SUTTON-BIBLARZ-ROCKET-2016'],
    assetIds: ['engine_ffsc_methalox', 'engine_hydrolox_staged', 'engine_srm'],
    partIds: [],
    seatedVariant: 'Seated at the stack builder, every slider is within 1 m of the seat.',
    reducedMotionVariant: 'The delta-v bar fills without animation.',
  },
  {
    id: 'aero-m6-kenya-connection',
    title: 'Kenya Connection',
    objective: 'You judge whether an aircraft can safely take off from a hot, high airport.',
    outcomes: {
      foundation:
        'You see that high airports have less air, so the wing and the engine have less to work with.',
      advanced:
        'You compute density altitude and watch takeoff performance fall as the day heats up.',
      expert:
        'You combine the ISA density relation with the engine and aerofoil limits to set a safe margin.',
    },
    steps: [
      {
        id: 'aero-m6-hook',
        caption: 'You predict whether midday at a high airport is easier or harder than sea level.',
        highlights: ['aero-density-altitude-slider'],
        completed: (events) => events.some((e) => e.type === 'sliderChanged' && e.target === 'aero-density-altitude-slider'),
      },
      {
        id: 'aero-m6-explore',
        caption: 'You raise the temperature and elevation and watch the runway performance fall away.',
        highlights: ['aero-density-altitude-slider'],
        completed: (events) => reachedValue(events, 'aero-density-altitude-slider', 0.8, 0.06),
      },
      {
        id: 'aero-m6-apply',
        caption: 'You set the conditions so the aircraft still clears the runway with margin.',
        highlights: ['aero-density-altitude-slider'],
        completed: (events) => reachedValue(events, 'aero-density-altitude-slider', 0.35, 0.07),
      },
    ],
    hints: [
      'The density-altitude panel is lit beside the Kenya map.',
      'Thin air means less lift for the same speed, and less power for the same thrust.',
      'Bring the elevation and temperature down until the takeoff margin turns green.',
    ],
    feedback: {
      success: 'The takeoff margin is healthy. Cool, lower conditions give the wing and engine more to work with.',
      nearMiss: 'The margin is thin. Lower the temperature a little and check again.',
      wrong: 'Hot high conditions leave very little margin. Try cooling the day and lowering the field.',
    },
    successPredicate: (events) => reachedValue(events, 'aero-density-altitude-slider', 0.35, 0.1),
    tolerance: 0.1,
    xp: 150,
    badge: 'aero-badge-kenya',
    panelRefs: [],
    sources: ['KCAA-WILSON-ELEVATION-2025', 'KSA-TAIFA1-LAUNCH-2023', 'UON-TAIFA1-LAUNCH-2023', 'SAN-MARCO-MALINDI-HISTORY'],
    assetIds: [],
    partIds: [],
    seatedVariant: 'Seated at the Kenya panel, both sliders are within 0.8 m.',
    reducedMotionVariant: 'The map shading changes without a fade transition.',
  },
  {
    id: 'aero-capstone-design-to-mission',
    title: 'Capstone: Design to Mission',
    objective: 'You configure an aircraft or launcher that meets a real mission card.',
    outcomes: {
      foundation:
        'You read the mission card and pick the vehicle that plainly fits the job.',
      advanced:
        'You check the performance numbers against the card and adjust until every line passes.',
      expert:
        'You trade payload against range and explain each margin you left, including the losses.',
    },
    steps: [
      {
        id: 'aero-cap-hook',
        caption: 'You choose a mission card and commit to the vehicle you think will work.',
        highlights: ['aero-mission-cards'],
        completed: (events) => events.some((e) => e.type === 'grabbed' && e.target === 'aero-mission-cards'),
      },
      {
        id: 'aero-cap-explore',
        caption: 'You configure the vehicle and watch the scored lines of the card fill in.',
        highlights: ['aero-capstone-config'],
        completed: (events) =>
          events.some((e) => e.type === 'sliderChanged' && (e.target?.startsWith('aero-capstone-') ?? false)),
      },
      {
        id: 'aero-cap-apply',
        caption: 'You tune every scored line until the card reads mission ready.',
        highlights: ['aero-capstone-config'],
        completed: (events) => reachedValue(events, 'aero-capstone-score', 1, 0.05),
      },
    ],
    hints: [
      'The three mission cards sit on the briefing lectern.',
      'Read the card first, then change only the numbers it asks about.',
      'Push each scored line into the green band; the score bar fills as they all pass.',
    ],
    feedback: {
      success: 'Mission ready. Every scored line on the card passes with margin.',
      nearMiss: 'One scored line is still short. Read which line is amber and adjust that one.',
      wrong: 'This vehicle does not suit that card. Try a different card and start again.',
    },
    successPredicate: (events) => reachedValue(events, 'aero-capstone-score', 1, 0.05),
    tolerance: 0.05,
    xp: 350,
    badge: 'aero-badge-capstone',
    panelRefs: [],
    sources: ['BATE-MUELLER-WHITE-ASTRODYNAMICS', 'ANDERSON-AERODYNAMICS-2016'],
    assetIds: ['engine_ffsc_methalox', 'engine_hydrolox_staged', 'engine_srm'],
    partIds: [],
    seatedVariant: 'Seated at the briefing lectern, the card rail and both sliders are within reach.',
    reducedMotionVariant: 'The score bar fills instantly instead of animating.',
  },
];

export function getMissions(): MissionDefinition[] {
  return AEROSPACE_MISSIONS;
}
