/**
 * Aerospace & Rocket Propulsion — Thermodynamic Cycles, Propellant Chemistries, and Aerodynamics.
 * 
 * SAFETY SCOPE COMPLIANCE:
 * High-level textbook educational principles, system-level thermodynamics, propellant trade-offs,
 * and plumbing flow paths only.
 * STRICTLY NO propellant formulation recipes, mixing or chemical synthesis procedures,
 * grain casting/curing techniques, pyrotechnic ignition mixtures, or fabrication instructions.
 */

export interface RocketEngineCycle {
  id: string;
  name: string;
  description: string;
  turbopumpDrive: string;
  ispVacuumRange: [number, number]; // seconds
  chamberPressureRange: [number, number]; // bar
  complexityRating: number; // 1-5 scale
  reusabilityPotential: string;
  flowPathSummary: {
    fuel: string;
    oxidizer: string;
    turbineExhaust: string;
  };
}

export const ROCKET_ENGINE_CYCLES: Record<string, RocketEngineCycle> = {
  'pressure-fed': {
    id: 'pressure-fed',
    name: 'Pressure-Fed Cycle',
    description: 'Simplest liquid cycle. High-pressure inert gas pushes propellants into the chamber without turbopumps.',
    turbopumpDrive: 'None (gas bottle pressurization, e.g. Helium/Nitrogen)',
    ispVacuumRange: [300, 325],
    chamberPressureRange: [10, 35],
    complexityRating: 1,
    reusabilityPotential: 'High (few moving parts, but heavy propellant tank walls limit mass fraction)',
    flowPathSummary: {
      fuel: 'Helium tank -> Fuel tank -> Main valve -> Injector -> Chamber',
      oxidizer: 'Helium tank -> Oxidizer tank -> Main valve -> Injector -> Chamber',
      turbineExhaust: 'None',
    },
  },
  'gas-generator': {
    id: 'gas-generator',
    name: 'Gas-Generator (Open Cycle)',
    description: 'A small preburner burns a fraction of propellants to spin the turbopump turbine, exhausting overboard.',
    turbopumpDrive: 'Fuel-rich or oxidizer-rich gas generator turbine exhaust dumped overboard',
    ispVacuumRange: [310, 340],
    chamberPressureRange: [70, 110],
    complexityRating: 3,
    reusabilityPotential: 'Moderate (used in Merlin 1D, Saturn V F-1)',
    flowPathSummary: {
      fuel: 'Tank -> Fuel Pump -> Split (97% to cooling jacket -> injector, 3% to gas generator)',
      oxidizer: 'Tank -> LOX Pump -> Split (97% to injector, 3% to gas generator)',
      turbineExhaust: 'Gas generator -> Turbine -> Overboard exhaust nozzle (lost specific impulse)',
    },
  },
  'open-expander': {
    id: 'open-expander',
    name: 'Expander Bleed (Open Expander)',
    description: 'Cryogenic fuel cools nozzle and boils into high-pressure gas driving the turbine, then dumps overboard.',
    turbopumpDrive: 'Warmed gaseous fuel bleed drives turbine and exhausts overboard',
    ispVacuumRange: [420, 445],
    chamberPressureRange: [40, 80],
    complexityRating: 2,
    reusabilityPotential: 'High (clean burning, moderate pressure, e.g. LE-9 engine)',
    flowPathSummary: {
      fuel: 'Tank -> Pump -> Regenerative cooling jacket (expands) -> Turbine -> Overboard dump',
      oxidizer: 'Tank -> LOX Pump -> Injector -> Chamber',
      turbineExhaust: 'Expander turbine bleed dumped into ambient or nozzle skirt',
    },
  },
  'closed-expander': {
    id: 'closed-expander',
    name: 'Closed Expander Cycle',
    description: 'Cryogenic fuel cools nozzle, boils into gas, drives turbopump turbine, then all enters injector (closed loop).',
    turbopumpDrive: 'Warmed gaseous fuel drives turbine, then routes 100% into combustion chamber',
    ispVacuumRange: [445, 465],
    chamberPressureRange: [40, 70],
    complexityRating: 3,
    reusabilityPotential: 'Exceptional (clean steam, zero soot, e.g. RL10 upper stage)',
    flowPathSummary: {
      fuel: 'Tank -> Fuel Pump -> Regenerative cooling jacket (expands) -> Turbine -> Main Injector',
      oxidizer: 'Tank -> LOX Pump -> Main Injector',
      turbineExhaust: 'All turbine gas enters main combustion chamber (zero dumped mass)',
    },
  },
  'fuel-rich-staged': {
    id: 'fuel-rich-staged',
    name: 'Fuel-Rich Staged Combustion (FRSC)',
    description: 'All fuel + small fraction of LOX enters preburner. High-pressure hot fuel-rich gas drives turbine and feeds main injector.',
    turbopumpDrive: 'High-pressure fuel-rich preburner gas drives single turbine',
    ispVacuumRange: [450, 453],
    chamberPressureRange: [180, 220],
    complexityRating: 4,
    reusabilityPotential: 'High for Hydrolox (Space Shuttle RS-25 / SSME), prone to coking for Kerolox',
    flowPathSummary: {
      fuel: 'Tank -> LP Pump -> HP Pump -> Preburners (combines with partial LOX) -> Turbine -> Main Injector',
      oxidizer: 'Tank -> LOX Pump -> Split (minor to preburners, bulk to Main Injector)',
      turbineExhaust: '100% injected into main chamber at extreme pressure (>200 bar)',
    },
  },
  'oxidizer-rich-staged': {
    id: 'oxidizer-rich-staged',
    name: 'Oxidizer-Rich Staged Combustion (ORSC)',
    description: 'All oxidizer + small fraction of fuel burns in preburner. Oxygen-rich hot gas drives turbine (prevents soot/coking).',
    turbopumpDrive: 'High-pressure oxidizer-rich preburner gas (requires exotic oxygen-resistant superalloys)',
    ispVacuumRange: [335, 360],
    chamberPressureRange: [190, 260],
    complexityRating: 4,
    reusabilityPotential: 'High for Kerolox/Methalox (pioneered in RD-180, RD-191)',
    flowPathSummary: {
      fuel: 'Tank -> Fuel Pump -> Split (minor to preburner, bulk to main injector)',
      oxidizer: 'Tank -> LOX Pump -> Preburner (all oxidizer) -> Turbine -> Main Injector',
      turbineExhaust: '100% oxidizer-rich gas enters main combustion chamber',
    },
  },
  'full-flow-staged': {
    id: 'full-flow-staged',
    name: 'Full-Flow Staged Combustion (FFSC)',
    description: 'Twin preburners: fuel-rich preburner powers fuel turbopump; oxidizer-rich preburner powers LOX turbopump. 100% gas-gas combustion.',
    turbopumpDrive: 'Dual independent preburners: fuel turbine runs cooler; oxidizer turbine runs cooler',
    ispVacuumRange: [360, 382],
    chamberPressureRange: [250, 330],
    complexityRating: 5,
    reusabilityPotential: 'Maximum theoretical efficiency and reusability (SpaceX Raptor)',
    flowPathSummary: {
      fuel: 'Tank -> Fuel Pump -> Cooling jacket -> Fuel-rich preburner -> Fuel Turbine -> Gas Injector',
      oxidizer: 'Tank -> LOX Pump -> Oxidizer-rich preburner -> LOX Turbine -> Gas Injector',
      turbineExhaust: '100% gaseous fuel and 100% gaseous oxidizer mix in chamber for rapid combustion',
    },
  },
  'electric-pump': {
    id: 'electric-pump',
    name: 'Electric-Pump-Fed Cycle',
    description: 'Electric brushless motors powered by lithium-polymer batteries drive propellant turbopumps independently.',
    turbopumpDrive: 'High-RPM electric motors powered by onboard battery packs',
    ispVacuumRange: [311, 335],
    chamberPressureRange: [40, 80],
    complexityRating: 2,
    reusabilityPotential: 'Very High (eliminates hot gas preburners & turbopump shafts, e.g. Electron Rutherford)',
    flowPathSummary: {
      fuel: 'Tank -> Electric Fuel Pump -> Main Injector',
      oxidizer: 'Tank -> Electric LOX Pump -> Main Injector',
      turbineExhaust: 'None (spent battery packs can be hot-swapped or jettisoned during ascent)',
    },
  },
};

export interface PropellantChemistry {
  id: string;
  name: string;
  fuel: string;
  oxidizer: string;
  density: string;
  temperature: string;
  ispVacuumNominal: number; // seconds
  cokingTendency: 'None' | 'Moderate' | 'High';
  toxicity: 'Non-toxic' | 'Toxic/Corrosive' | 'Hazardous';
  tradeoffs: string;
}

export const PROPELLANT_CHEMISTRIES: Record<string, PropellantChemistry> = {
  methalox: {
    id: 'methalox',
    name: 'Methalox (LCH4 / LOX)',
    fuel: 'Liquid Methane (CH4)',
    oxidizer: 'Liquid Oxygen (LOX)',
    density: 'Moderate (~0.83 g/cm³ bulk)',
    temperature: 'Cryogenic (~111 K fuel / 90 K LOX)',
    ispVacuumNominal: 375,
    cokingTendency: 'None',
    toxicity: 'Non-toxic',
    tradeoffs: 'Clean burning, soft cryogen, matched storage temps, ideal for reusability & Mars ISRU.',
  },
  kerolox: {
    id: 'kerolox',
    name: 'Kerolox (RP-1 / LOX)',
    fuel: 'Refined Kerosene (RP-1)',
    oxidizer: 'Liquid Oxygen (LOX)',
    density: 'High (~1.03 g/cm³ bulk)',
    temperature: 'Room temperature fuel (~293 K) / Cryogenic LOX (90 K)',
    ispVacuumNominal: 340,
    cokingTendency: 'High',
    toxicity: 'Non-toxic',
    tradeoffs: 'Compact tanks, high thrust-to-volume for booster first stages, but soot/coking fouls turbines.',
  },
  hydrolox: {
    id: 'hydrolox',
    name: 'Hydrolox (LH2 / LOX)',
    fuel: 'Liquid Hydrogen (LH2)',
    oxidizer: 'Liquid Oxygen (LOX)',
    density: 'Very Low (~0.36 g/cm³ bulk)',
    temperature: 'Deep Cryogenic (20 K fuel / 90 K LOX)',
    ispVacuumNominal: 455,
    cokingTendency: 'None',
    toxicity: 'Non-toxic',
    tradeoffs: 'Highest chemical Isp, clean steam exhaust, but requires enormous bulky tanks and complex insulation.',
  },
  hypergolic: {
    id: 'hypergolic',
    name: 'Hypergolic (UDMH / N2O4)',
    fuel: 'Unsymmetrical Dimethylhydrazine (UDMH)',
    oxidizer: 'Dinitrogen Tetroxide (N2O4)',
    density: 'High (~1.20 g/cm³ bulk)',
    temperature: 'Storable Liquid (~293 K)',
    ispVacuumNominal: 318,
    cokingTendency: 'None',
    toxicity: 'Toxic/Corrosive',
    tradeoffs: 'Spontaneous hypergolic ignition on contact, zero igniters needed, indefinitely storable in deep space.',
  },
  solid: {
    id: 'solid',
    name: 'Solid Propellant Motor',
    fuel: 'Solid composite polymer / aluminum fuel grain',
    oxidizer: 'Ammonium perchlorate oxidizer embedded in grain',
    density: 'Very High (~1.75 g/cm³)',
    temperature: 'Ambient solid matrix',
    ispVacuumNominal: 285,
    cokingTendency: 'None',
    toxicity: 'Hazardous',
    tradeoffs: 'Massive instant thrust, simple storage, cannot be throttled or extinguished once ignited.',
  },
};

/**
 * Aerodynamic 4-forces calculations and Lift-to-Drag optimization.
 */
export interface AerodynamicState {
  angleOfAttackDeg: number;
  altitudeMeters: number; // Wilson Airport = 1680m (Nairobi)
  airspeedMps: number;
  wingAreaM2: number;
  liftNewtons: number;
  dragNewtons: number;
  liftToDragRatio: number;
  isStalled: boolean;
}

export function calculateAerodynamics(
  angleOfAttackDeg: number,
  altitudeMeters: number = 1680,
  airspeedMps: number = 70,
  wingAreaM2: number = 16.0
): AerodynamicState {
  // ISA atmospheric air density lapse rate
  const seaLevelRho = 1.225; // kg/m^3
  const airDensity = seaLevelRho * Math.exp(-altitudeMeters / 8500); // ~1.005 kg/m^3 at Nairobi (1680m)

  // Thin aerofoil theory with stall onset at ~15 degrees
  const rad = (angleOfAttackDeg * Math.PI) / 180;
  const isStalled = angleOfAttackDeg > 15.0 || angleOfAttackDeg < -10.0;

  let cl: number;
  let cd: number;

  if (isStalled) {
    // Post-stall lift breakdown and massive form drag increase
    cl = 0.5 * Math.sin(2 * rad);
    cd = 0.04 + 1.2 * Math.sin(rad) * Math.sin(rad);
  } else {
    // Linear pre-stall lift slope dCl/dalpha approx 2*pi
    cl = 0.25 + 5.7 * rad;
    // Induced drag cd = cd0 + k * cl^2
    const cd0 = 0.02;
    const aspectRatio = 8.0;
    const oswaldEfficiency = 0.85;
    const k = 1 / (Math.PI * aspectRatio * oswaldEfficiency);
    cd = cd0 + k * cl * cl;
  }

  const dynamicPressure = 0.5 * airDensity * airspeedMps * airspeedMps;
  const liftNewtons = cl * dynamicPressure * wingAreaM2;
  const dragNewtons = cd * dynamicPressure * wingAreaM2;
  const liftToDragRatio = cd > 0.0001 ? liftNewtons / dragNewtons : 0;

  return {
    angleOfAttackDeg,
    altitudeMeters,
    airspeedMps,
    wingAreaM2,
    liftNewtons,
    dragNewtons,
    liftToDragRatio,
    isStalled,
  };
}

/**
 * Supersonic de Laval Nozzle & Shock Diamond physics.
 */
export interface NozzleState {
  areaRatio: number; // Ae / At
  ambientPressureBar: number; // 1.013 at sea level, 0.0 in vacuum
  chamberPressureBar: number;
  expansionRegime: 'overexpanded' | 'ideally-expanded' | 'underexpanded';
  shockDiamondCount: number;
  machExit: number;
}

export function evaluateNozzleExpansion(
  areaRatio: number,
  ambientPressureBar: number,
  chamberPressureBar: number = 100
): NozzleState {
  // Mach exit from area ratio (isentropic expansion for gamma ~ 1.2)
  const machExit = Math.sqrt(1 + 3.2 * Math.log(Math.max(1.1, areaRatio)));
  // Exit pressure decreases exponentially with expansion area ratio
  const exitPressureBar = chamberPressureBar * Math.pow(areaRatio, -1.35);

  let expansionRegime: 'overexpanded' | 'ideally-expanded' | 'underexpanded';
  let shockDiamondCount = 0;

  const ratio = exitPressureBar / Math.max(0.0001, ambientPressureBar);
  if (ratio < 0.85) {
    expansionRegime = 'overexpanded'; // Ambient pressure exceeds exit pressure -> oblique shock diamonds form
    shockDiamondCount = Math.min(6, Math.max(1, Math.round(5 * (1 - ratio))));
  } else if (ratio > 1.15) {
    expansionRegime = 'underexpanded'; // Exit pressure exceeds ambient -> expansion fans bloom outwards
    shockDiamondCount = Math.min(8, Math.max(2, Math.round(3 * Math.min(3, ratio))));
  } else {
    expansionRegime = 'ideally-expanded'; // Exit pressure equals ambient
    shockDiamondCount = 0;
  }

  return {
    areaRatio,
    ambientPressureBar,
    chamberPressureBar,
    expansionRegime,
    shockDiamondCount,
    machExit,
  };
}
