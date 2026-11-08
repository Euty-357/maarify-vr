import * as THREE from 'three';

export interface ExoplanetData {
  id: string;
  name: string;
  hostStar: string;
  spectralType: string;
  distanceLy: number;
  lightTravelTimeYears: number;
  voyagerTravelTimeYears: number; // Based on Voyager 1 speed ~17 km/s
  discoveryYear: number;
  detectionMethod: 'Transit Photometry' | 'Radial Velocity' | 'Pulsar Timing' | 'Direct Imaging';
  radiusEarthRadii: number;
  massEarthMasses: number;
  inHabitableZone: boolean;
  atmosphereStatus: 'Unknown' | 'Volatile-rich detected' | 'Stripped / none' | 'Unverified';
  artistConceptionNote: string;
  keyFact: string;
  visualColor: number;
  hasRing?: boolean;
}

export const EXOPLANET_CATALOG: ExoplanetData[] = [
  {
    id: 'proxima-b',
    name: 'Proxima Centauri b',
    hostStar: 'Proxima Centauri (Alpha Centauri C)',
    spectralType: 'M5.5V Red Dwarf',
    distanceLy: 4.246,
    lightTravelTimeYears: 4.246,
    voyagerTravelTimeYears: 74800,
    discoveryYear: 2016,
    detectionMethod: 'Radial Velocity',
    radiusEarthRadii: 1.07,
    massEarthMasses: 1.17,
    inHabitableZone: true,
    atmosphereStatus: 'Unknown',
    artistConceptionNote: 'Artist\'s conception — surface imaging not possible with current telescopes.',
    keyFact: 'Closest known exoplanet to Earth. Orbits inside the habitable zone, but subject to intense stellar flares.',
    visualColor: 0xd97706,
  },
  {
    id: 'trappist-1e',
    name: 'TRAPPIST-1e',
    hostStar: 'TRAPPIST-1',
    spectralType: 'M8V Ultra-Cool Dwarf',
    distanceLy: 40.66,
    lightTravelTimeYears: 40.66,
    voyagerTravelTimeYears: 717000,
    discoveryYear: 2017,
    detectionMethod: 'Transit Photometry',
    radiusEarthRadii: 0.92,
    massEarthMasses: 0.69,
    inHabitableZone: true,
    atmosphereStatus: 'Unknown',
    artistConceptionNote: 'Artist\'s conception — based on bulk density and transmission spectra constraints.',
    keyFact: 'One of seven Earth-sized worlds orbiting an ultra-cool red dwarf. Compact resonant orbital chain.',
    visualColor: 0x3b82f6,
  },
  {
    id: '51-pegasi-b',
    name: '51 Pegasi b (Dimidium)',
    hostStar: '51 Pegasi (Helvetios)',
    spectralType: 'G5V Sun-like Star',
    distanceLy: 50.45,
    lightTravelTimeYears: 50.45,
    voyagerTravelTimeYears: 889000,
    discoveryYear: 1995,
    detectionMethod: 'Radial Velocity',
    radiusEarthRadii: 13.5, // ~1.2 Jupiter radii
    massEarthMasses: 146.0, // ~0.46 Jupiter masses
    inHabitableZone: false,
    atmosphereStatus: 'Volatile-rich detected',
    artistConceptionNote: 'Artist\'s conception — hot gas giant tidally locked to host star.',
    keyFact: 'First confirmed exoplanet around a main-sequence Sun-like star (Mayor & Queloz, Nobel Prize 2019).',
    visualColor: 0xf97316,
  },
  {
    id: 'kepler-16b',
    name: 'Kepler-16b',
    hostStar: 'Kepler-16A / Kepler-16B (Binary)',
    spectralType: 'K-dwarf / M-dwarf Binary',
    distanceLy: 245.0,
    lightTravelTimeYears: 245.0,
    voyagerTravelTimeYears: 4320000,
    discoveryYear: 2011,
    detectionMethod: 'Transit Photometry',
    radiusEarthRadii: 8.45, // ~Saturn size
    massEarthMasses: 105.0,
    inHabitableZone: false,
    atmosphereStatus: 'Unknown',
    artistConceptionNote: 'Artist\'s conception — circumbinary Saturn-mass planet orbiting two stars.',
    keyFact: 'First unambiguous circumbinary planet discovered. Experiences two sunsets every orbit.',
    visualColor: 0xa855f7,
    hasRing: true,
  },
  {
    id: '55-cancri-e',
    name: '55 Cancri e (Janssen)',
    hostStar: '55 Cancri A (Copernicus)',
    spectralType: 'G8V Main-Sequence',
    distanceLy: 41.06,
    lightTravelTimeYears: 41.06,
    voyagerTravelTimeYears: 724000,
    discoveryYear: 2004,
    detectionMethod: 'Radial Velocity',
    radiusEarthRadii: 1.87,
    massEarthMasses: 7.99,
    inHabitableZone: false,
    atmosphereStatus: 'Volatile-rich detected',
    artistConceptionNote: 'Artist\'s conception — ultra-short-period super-Earth with molten magma surface.',
    keyFact: 'Orbits host star in just 17 hours 41 minutes. Surface temperature exceeds 2,000°C.',
    visualColor: 0xef4444,
  },
  {
    id: 'psr-b1257-12-c',
    name: 'PSR B1257+12 c (Poltergeist)',
    hostStar: 'PSR B1257+12 (Lich)',
    spectralType: 'Millisecond Pulsar',
    distanceLy: 2300.0,
    lightTravelTimeYears: 2300.0,
    voyagerTravelTimeYears: 40500000,
    discoveryYear: 1992,
    detectionMethod: 'Pulsar Timing',
    radiusEarthRadii: 1.5,
    massEarthMasses: 4.3,
    inHabitableZone: false,
    atmosphereStatus: 'Stripped / none',
    artistConceptionNote: 'Artist\'s conception — rocky super-Earth bathed in relativistic pulsar wind.',
    keyFact: 'First exoplanetary system ever confirmed in history (Wolszczan & Frail 1992).',
    visualColor: 0x06b6d4,
  },
  {
    id: 'kepler-452b',
    name: 'Kepler-452b',
    hostStar: 'Kepler-452',
    spectralType: 'G2V Sun-like Star',
    distanceLy: 1799.0,
    lightTravelTimeYears: 1799.0,
    voyagerTravelTimeYears: 31700000,
    discoveryYear: 2015,
    detectionMethod: 'Transit Photometry',
    radiusEarthRadii: 1.63,
    massEarthMasses: 4.9,
    inHabitableZone: true,
    atmosphereStatus: 'Unknown',
    artistConceptionNote: 'Artist\'s conception — super-Earth in habitable zone of a Sun-like star.',
    keyFact: '385-day orbit around a star very similar to our Sun; often termed "Earth\'s older cousin".',
    visualColor: 0x10b981,
  },
];

/**
 * Creates an interactive 3D Exoplanet Display Pod.
 * Allows the learner to rotate the planet, scrub transit light curves,
 * and view verified distance and light travel times.
 */
export function createExoplanetDisplay(planet: ExoplanetData): THREE.Group {
  const group = new THREE.Group();
  group.name = `exoplanet-${planet.id}`;

  // 1. Planet Sphere
  const planetGeo = new THREE.SphereGeometry(0.2, 24, 24);
  const planetMat = new THREE.MeshStandardMaterial({
    color: planet.visualColor,
    roughness: 0.7,
    metalness: 0.1,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  group.add(planetMesh);

  // Optional planetary ring for Kepler-16b
  if (planet.hasRing) {
    const ringGeo = new THREE.RingGeometry(0.26, 0.38, 32);
    ringGeo.rotateX(Math.PI / 3);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
  }

  // 2. Information Display Canvas Plaque
  const isBrowser = typeof document !== 'undefined';
  let plaqueTex: THREE.Texture;
  if (isBrowser) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 504, 248);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(planet.name, 20, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Host: ${planet.hostStar} (${planet.spectralType})`, 20, 68);
      ctx.fillText(`Distance: ${planet.distanceLy} light-years`, 20, 94);
      ctx.fillText(`Light Travel Time: ${planet.lightTravelTimeYears.toFixed(1)} years`, 20, 120);
      ctx.fillText(`Voyager 1 Speed: ~${planet.voyagerTravelTimeYears.toLocaleString()} years`, 20, 146);
      ctx.fillText(`Method: ${planet.detectionMethod} (${planet.discoveryYear})`, 20, 172);

      // Habitable zone badge
      ctx.fillStyle = planet.inHabitableZone ? '#10b981' : '#f59e0b';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(
        planet.inHabitableZone ? 'HABITABLE ZONE (CONFIRMED)' : 'EXTREME ENVIRONMENT',
        20,
        202
      );

      // Mandatory honest disclaimer
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText(planet.artistConceptionNote, 20, 234);
    }
    plaqueTex = new THREE.CanvasTexture(canvas);
  } else {
    plaqueTex = new THREE.Texture();
  }

  const plaqueGeo = new THREE.PlaneGeometry(0.5, 0.25);
  const plaqueMat = new THREE.MeshBasicMaterial({
    map: plaqueTex,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaqueMesh.position.set(0, -0.32, 0);
  group.add(plaqueMesh);

  return group;
}

