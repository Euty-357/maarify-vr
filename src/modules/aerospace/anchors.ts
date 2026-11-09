import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'aerospace-anchor-aerodynamics',
      anchorPosition: new THREE.Vector3(-1.2, 1.4, -0.9),
      label: 'Aerofoil Circulation & Lift Physics',
      level1Note:
        'Wings create lift by turning oncoming airflow downward. By Newton’s third law, the deflected mass of air exerts an equal upward reaction force.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Grasp the wing pitch handle: rotate angle of attack from 0° to 20° to watch airflow streamlines deflect downward until stall onset at 15°.',
          caption: 'Lift is reaction force to downwash: equal-transit-time theory is an aerodynamic myth.',
        },
        advanced: {
          type: 'cross-section-flux',
          description:
            'Pressure coefficient (Cp) distribution: examine the upper surface suction peak and adverse pressure gradient causing boundary layer separation.',
          caption: 'Circulation Gamma produces lift per unit span via Kutta-Joukowski theorem: L = rho * V * Gamma.',
        },
        expert: {
          type: 'exploded-view',
          description:
            'Boundary layer velocity profile visualizer: inspect laminar vs turbulent shear stress and boundary layer displacement thickness delta*.',
          caption: 'Navier-Stokes boundary layer momentum integral equation: d(theta)/dx + (2*theta + delta*)/U * dU/dx = Cf/2.',
        },
      },
      sourceRefs: ['NASA-GLENN-LIFT-MYTHS', 'ANDERSON-AERODYNAMICS-2016'],
    },
    {
      id: 'aerospace-anchor-exploded-engine',
      anchorPosition: new THREE.Vector3(0.0, 1.3, -1.2),
      label: 'Staged Rocket Engine & Regenerative Cooling',
      level1Note:
        'Liquid rocket engines use cryogenic propellants flowing through regenerative nozzle channels to cool metal walls before high-pressure combustion.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Pull the engine gimbal ring: explode the powerhead into turbopumps, preburners, injector faceplate, and regenerative cooling jacket.',
          caption: 'Milled copper-alloy channels carry sub-zero fuel to prevent 3,000°C combustion gas from melting walls.',
        },
        advanced: {
          type: 'cross-section-flux',
          description:
            'Thermodynamic cycle comparison: toggle between Gas-Generator (open) and Staged Combustion (closed) to observe turbopump exhaust routing.',
          caption: 'Staged combustion routes 100% of propellant through combustion chamber, boosting vacuum Isp by 20–30s.',
        },
        expert: {
          type: 'scrubbable-mechanism',
          description:
            'Full-Flow Staged Combustion mass-flow coupling: inspect twin preburners (fuel-rich and oxidizer-rich) operating at 300+ bar chamber pressure.',
          caption: 'Gas-gas injection eliminates droplet vaporization lag, enabling compact, high-efficiency combustion chambers.',
        },
      },
      sourceRefs: ['SUTTON-BIBLARZ-ROCKET-2016', 'HILL-PETERSON-PROPULSION'],
    },
    {
      id: 'aerospace-anchor-delaval-nozzle',
      anchorPosition: new THREE.Vector3(1.2, 1.2, -0.9),
      label: 'Supersonic de Laval Nozzle & Shock Diamonds',
      level1Note:
        'The converging-diverging de Laval nozzle chokes gas to Mach 1 at the throat and expands supersonic flow to Mach 3+ at the exit bell.',
      level2Simulation: {
        foundation: {
          type: 'scrubbable-mechanism',
          description:
            'Move the ambient pressure slider from sea level (1.0 bar) to vacuum (0.0 bar) to see the plume expand from overexpanded to underexpanded.',
          caption: 'Shock diamonds appear when exit pressure mismatches ambient, creating reflecting oblique shocks.',
        },
        advanced: {
          type: 'cross-section-flux',
          description:
            'Area-Mach number relation visualizer: inspect isentropic expansion curves: A/A* = (1/M) * [(2 + (gamma-1)M^2)/(gamma+1)]^((gamma+1)/(2*(gamma-1))).',
          caption: 'Nozzle area expansion ratio epsilon = Ae/At governs exit Mach and optimum altitude.',
        },
        expert: {
          type: 'exploded-view',
          description:
            'Prandtl-Meyer expansion fan and oblique shock reflection slice: observe flow turning and total pressure loss across regular vs Mach reflections.',
          caption: 'Method of characteristics defines bell contour to minimize divergence and shock losses.',
        },
      },
      sourceRefs: ['SUTTON-BIBLARZ-ROCKET-2016', 'ANDERSON-COMPRESSIBLE-FLOW'],
    },
    {
      id: 'aerospace-anchor-taifa-mission',
      anchorPosition: new THREE.Vector3(0.0, 1.8, -0.6),
      label: 'Taifa-1: Vandenberg Launch & Sun-Synchronous Orbit',
      level1Note:
        'Taifa-1 is Kenya’s first operational 3U Earth-observation satellite. It launched from Vandenberg, California in April 2023 into a Sun-Synchronous Orbit.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Inspect the 3U CubeSat bus: deploy solar arrays, optical telescope payload, reaction wheels, and magnetorquer attitude coils.',
          caption: 'Taifa-1 was deployed to a Sun-Synchronous Orbit at about 508 km, completing an orbit in about 95 minutes.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Hohmann transfer orbital maneuver simulator: burn perigee and apogee delta-v vectors to transfer from low Earth parking orbit to operational altitude.',
          caption: 'Delta-v budget: Tsiolkovsky rocket equation Delta_v = Isp * g0 * ln(m0 / mf).',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Compare launch geometry: the historic Malindi range favored low-inclination trajectories, while Vandenberg provides polar access for Sun-Synchronous Orbits.',
          caption: 'This comparison is a simplified model — not engineering grade. Taifa-1 launched from Vandenberg, not Malindi.',
        },
      },
      sourceRefs: ['KSA-TAIFA1-LAUNCH-2023', 'UON-TAIFA1-LAUNCH-2023', 'BATE-MUELLER-WHITE-ASTRODYNAMICS'],
    },
  ];
}
