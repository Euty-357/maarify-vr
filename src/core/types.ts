import * as THREE from 'three';

export interface SpatialAnchorDefinition {
  id: string;
  anchorPosition: THREE.Vector3;
  label: string;
  level1Note: string;
  level2Simulation: {
    foundation: {
      type: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
      description: string;
      caption: string;
    };
    advanced: {
      type: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
      description: string;
      caption: string;
    };
    expert: {
      type: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
      description: string;
      caption: string;
    };
  };
  sourceRefs: string[];
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: 'sequence-walk' | 'assembly' | 'alignment' | 'gaze-hold' | 'steer' | 'tune' | 'scale-shift';
  xpReward: number;
  seatedCompatible: boolean;
}

export interface ModuleDefinition {
  id: string;
  displayName: string;
  description: string;
  estimatedMinutes: [number, number];
  thumbnail: string;
  load(container: THREE.Scene): Promise<THREE.Object3D>;
  unload(): void;
  /** Optional per-frame animation tick, driven by the application render loop. */
  update?(deltaSeconds: number): void;
  /** Optional serialisable state for automated playthrough assertions. */
  getState?(): Record<string, unknown> | null;
  /** Optional depth-tier hook so the hub selector reaches module content. */
  setDepthTier?(tier: 'foundation' | 'advanced' | 'expert'): void;
  getChallenges(): ChallengeDefinition[];
  getSpatialAnchors(): SpatialAnchorDefinition[];
}

