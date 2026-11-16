import * as THREE from 'three';
import type { SpatialAnchorDefinition } from '../../core/types.js';

export function getSpatialAnchors(): SpatialAnchorDefinition[] {
  return [
    {
      id: 'environment-anchor-water-tower',
      anchorPosition: new THREE.Vector3(-1.2, 1.35, -1.2),
      label: 'Mau Forest Complex Water Tower',
      level1Note:
        'Kenya\'s largest montane forest acts as a natural sponge, storing rainwater during wet seasons and releasing steady baseflow to 12 major rivers year-round.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Interactive soil sponge cross-section: pull open the organic humus layer to observe dense root matrices capturing rainwater and preventing flash runoff.',
          caption: 'Forest soils absorb up to 10x more water than compacted deforested slopes.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Watershed hydrological mass balance P = Q + ET + delta S slider: adjust precipitation and canopy cover to calculate seasonal river discharge.',
          caption: 'Deforestation reduces evapotranspiration (ET) and increases destructive peak flood runoff (Q).',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Richards unsaturated soil-moisture flux solver displaying matrix potential gradients and hydraulic conductivity across root depth profiles.',
          caption: 'Darcy-Richards flux q = -K(theta) * grad(psi + z) governs infiltration and aquifer recharge.',
        },
      },
      sourceRefs: ['UNEP-MAU-2008', 'GOK-WATER-TOWERS-2015', 'IPCC-WG2-2022'],
    },
    {
      id: 'environment-anchor-stakeholder-graph',
      anchorPosition: new THREE.Vector3(0, 1.5, -2.2),
      label: '9-Stakeholder Causal Feedback Graph',
      level1Note:
        'Interconnected social-ecological system linking smallholders, pastoralists, commercial farms, wildlife corridors, and municipal consumers across the basin.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Spatial network web: pull any stakeholder node to highlight direct dependencies and observe ripples spreading through connected communities.',
          caption: 'Upstream water decisions propagate downstream within hours through river networks.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Tipping point threshold simulator: increase agricultural water abstraction past critical levels to witness non-linear ecological regime collapse.',
          caption: 'Ecological hysteresis means degraded catchments require far greater restoration effort to recover.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Bifurcation manifold diagram showing saddle-node transitions and alternate stable states in lake eutrophication and river dry-up.',
          caption: 'Coupled non-linear differential equations dx/dt = f(x, p) demonstrate critical slowing down before tipping.',
        },
      },
      sourceRefs: ['OSTROM-SES-2009', 'SCHEFFER-NATURE-2001', 'WWF-MARA-2018'],
    },
    {
      id: 'environment-anchor-naivasha-wetland',
      anchorPosition: new THREE.Vector3(1.2, 1.35, -1.2),
      label: 'Lake Naivasha Riparian Papyrus Filter',
      level1Note:
        'A freshwater endorheic lake surrounded by commercial horticulture. Cyperus papyrus wetlands trap agricultural sediments and absorb agrochemical nutrients.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Two-handed grab reveals the root mat biofilter: papyrus stems dissipate wave energy while submerged roots absorb nitrates and phosphates.',
          caption: 'Intact papyrus fringing zones remove over 70% of suspended agricultural sediment.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Nitrogen and phosphorus nutrient loading dial: adjust fertilizer runoff vs wetland buffer width to measure dissolved oxygen levels.',
          caption: 'Wetland buffer stripping prevents toxic cyanobacterial blooms and fish die-offs.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Biochemical sediment trap flux model displaying microbial denitrification and phosphorus sedimentation rates per hectare.',
          caption: 'Denitrification kinetics NO3- -> N2(g) catalyzed by anaerobic Pseudomonas bacteria in wetland bogs.',
        },
      },
      sourceRefs: ['HARPER-NAIVASHA-2002', 'BECHT-HYDROBIOLOGIA-2002', 'RAMSAR-NAIVASHA-1995'],
    },
    {
      id: 'environment-anchor-mangrove-buffer',
      anchorPosition: new THREE.Vector3(0, 1.25, 1.8),
      label: 'Lamu Coastal Mangrove Blue Carbon',
      level1Note:
        'Rhizophora stilt roots attenuate storm surge wave energy, protect the shoreline against sea-level rise, and bury carbon in anaerobic marine mud.',
      level2Simulation: {
        foundation: {
          type: 'exploded-view',
          description:
            'Exploded Rhizophora prop root architecture: observe how branching stilt roots disperse incoming wave momentum and build land.',
          caption: '100 meters of healthy mangrove forest can reduce incoming wave energy by up to 66%.',
        },
        advanced: {
          type: 'scrubbable-mechanism',
          description:
            'Storm surge damping lever: increase ocean wave height and inspect force dissipation through dense vs cleared mangrove coastlines.',
          caption: 'Mangroves provide natural green infrastructure protecting coastal villages from tropical cyclones.',
        },
        expert: {
          type: 'cross-section-flux',
          description:
            'Blue Carbon sedimentary flux profile measuring centuries of soil organic carbon burial rate (3-5x higher than terrestrial forests).',
          caption: 'Anaerobic saline soils inhibit microbial breakdown, sequestering refractory carbon for millennia.',
        },
      },
      sourceRefs: ['ALONGI-BLUE-CARBON-2012', 'KMFRI-MANGROVES-2017', 'MAZORDAH-KENYA-MANGROVE-2020'],
    },
  ];
}
