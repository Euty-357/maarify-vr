/**
 * Dr. Amani — 7-Beat Spatial Audio Narrative & Guidance.
 * Ties the scientific principles to physical demonstrations and the Kenyan context.
 */

export interface NarrativeBeat {
  beatNumber: number;
  timeRange: string;
  title: string;
  guidanceText: string;
  stemContext: string;
}

export const DR_AMANI_COSMOS_BEATS: NarrativeBeat[] = [
  {
    beatNumber: 1,
    timeRange: '0:00–2:00',
    title: 'Opening Hook: The Malindi Horizon',
    guidanceText:
      'Welcome to Cosmos. You are standing on the Kenyan coast near Malindi. Just offshore lies the historic Luigi Broglio Space Centre. Feel the stillness of the ocean, look up at the equatorial night sky, and watch a launch trail pierce the darkness.',
    stemContext:
      'San Marco platform (Malindi) launched 27 rockets between 1967 and 1988 due to equatorial rotational velocity advantages.',
  },
  {
    beatNumber: 2,
    timeRange: '2:00–5:00',
    title: 'Atmospheric Ascent & The Karman Line',
    guidanceText:
      'We are ascending through the atmospheric blanket. Notice how pressure drops exponentially. At 100 kilometers, inspect the Karman Line anchor: it is an agreed human convention where aerodynamic lift gives way to orbital mechanics, not a physical wall.',
    stemContext:
      'Standard atmospheric scale height H ≈ 8.5 km; density follows exponential decay P = P0 * e^(-h/H).',
  },
  {
    beatNumber: 3,
    timeRange: '5:00–8:00',
    title: 'Physical Challenge: Atmospheric Probe Sorting',
    guidanceText:
      'A storm of atmospheric data pods needs deployment. Grab each sounding pod and physically snap it into its correct atmospheric layer by matching temperature and lapse rate characteristics.',
    stemContext:
      'Stratospheric ozone absorption creates a temperature inversion between 20 km and 50 km.',
  },
  {
    beatNumber: 4,
    timeRange: '8:00–12:00',
    title: 'Low Earth Orbit & Cosmic Scale Shift',
    guidanceText:
      'Look at the International Space Station and Kenya\'s Taifa-1 satellite orbiting above the continent. Now, use both hands to grab space and pinch: collapse the entire solar system into your grasp until the Sun is an orange in your hands.',
    stemContext:
      'Taifa-1, Kenya\'s first operational earth observation satellite, launched to monitor agriculture and environmental change in 2023.',
  },
  {
    beatNumber: 5,
    timeRange: '12:00–16:00',
    title: 'The Exoplanet Frontier & Travel Honesties',
    guidanceText:
      'Beyond our Sun lie thousands of confirmed worlds. Explore Proxima b and TRAPPIST-1e. Toggle between real light-speed travel—taking years to traverse interstellar voids—and cinematic warp fiction. Remember: faster-than-light travel violates causality.',
    stemContext:
      'Over 5,500 exoplanets confirmed by Kepler, TESS, and ground observatories using transit photometry and radial velocity.',
  },
  {
    beatNumber: 6,
    timeRange: '16:00–18:00',
    title: 'Singularities: Sagittarius A*',
    guidanceText:
      'At the center of our Milky Way sits Sagittarius A*, a supermassive black hole with 4 million times our Sun\'s mass. Walk around the event horizon. Observe the Doppler brightening where the accretion disc approaches you.',
    stemContext:
      'Event Horizon Telescope confirmed the shadow and photon ring of Sagittarius A* in 2022 (Nobel Prize 2020 for Penrose, Genzel, Ghez).',
  },
  {
    beatNumber: 7,
    timeRange: '18:00–20:00',
    title: 'Capstone: Mars Orbital Injection & Horizon',
    guidanceText:
      'Final test: align your propulsion vector along the Hohmann transfer ellipse to execute the Mars capture burn. Complete the insertion to claim the Orbital Navigator badge and step through the spatial portal back to the Hub.',
    stemContext:
      'Vis-viva equation governs orbital transfer: v^2 = GM(2/r - 1/a).',
  },
];

