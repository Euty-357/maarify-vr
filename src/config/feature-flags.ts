/**
 * Module Feature Flags and Readiness Status.
 * Only modules flagged as 'ready' are active in production hub builds.
 * 'experimental' modules are hidden or visually locked unless dev mode is active.
 */

export type ModuleReadiness = 'ready' | 'experimental' | 'planned';

export interface ModuleFeatureConfig {
  id: string;
  name: string;
  readiness: ModuleReadiness;
  enabled: boolean;
}

export const MODULE_FLAGS: Record<string, ModuleFeatureConfig> = {
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos & Astronomy',
    readiness: 'ready',
    enabled: true,
  },
  quantum: {
    id: 'quantum',
    name: 'Quantum Mechanics',
    readiness: 'experimental',
    enabled: false,
  },
  'human-body': {
    id: 'human-body',
    name: 'Human Body & Medicine',
    readiness: 'experimental',
    enabled: false,
  },
  aerospace: {
    id: 'aerospace',
    name: 'Aerospace & Rocket Propulsion',
    readiness: 'experimental',
    enabled: false,
  },
  'dna-genetics': {
    id: 'dna-genetics',
    name: 'DNA & Genetics',
    readiness: 'experimental',
    enabled: false,
  },
  environment: {
    id: 'environment',
    name: 'Climate & Environment',
    readiness: 'experimental',
    enabled: false,
  },
  'urban-development': {
    id: 'urban-development',
    name: 'Urban Infrastructure',
    readiness: 'experimental',
    enabled: false,
  },
};

export function isDevModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('dev') === 'true' || Boolean((window as any).__MAARIFY_DEV__);
}

export function isModuleAvailable(moduleId: string): boolean {
  const flag = MODULE_FLAGS[moduleId];
  if (!flag) return false;
  if (isDevModeActive()) return true;
  return flag.readiness === 'ready' && flag.enabled;
}

