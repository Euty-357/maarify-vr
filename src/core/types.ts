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

/** Data-driven onboarding and mission-board contract shared by every module. */
export interface ModuleTutorialStep {
  id: string;
  instruction: string;
  target: string;
}

export interface ModuleMission {
  title: string;
  guideName: string;
  tutorial: ModuleTutorialStep[];
}

export interface ModuleSetting {
  id: string;
  name: string;
  environment: 'interior' | 'exterior' | 'space';
  lighting: string;
  palette: string[];
  props: string[];
  ambience: string;
}

export interface ModuleSection {
  id: string;
  title: string;
  settingId: string;
  summary: string;
  entryPosition: [number, number, number];
}

export type AssetPlanInteraction = 'explode' | 'scrub' | 'flow' | 'dock' | 'gaze-hold' | 'tune';

/** Depth tier ids used across the course system. Matches the repo's tier names. */
export type CourseTier = 'foundation' | 'advanced' | 'expert';

/**
 * Interaction events the MissionRunner consumes. These are emitted by the
 * shared interaction primitives and the pointer pipeline — never by raw XR
 * input. Mission code subscribes to these instead of polling controllers.
 */
export type CourseEventType =
  | 'grabbed'
  | 'released'
  | 'placed'
  | 'docked'
  | 'rejected'
  | 'sliderChanged'
  | 'leverChanged'
  | 'rotated'
  | 'measured'
  | 'enteredZone'
  | 'panelOpened'
  | 'panelClosed'
  | 'tierChanged'
  | 'explodeChanged'
  | 'flowToggled'
  | 'gazeHeld';

/** A single interaction event delivered to the MissionRunner. */
export interface CourseEvent {
  type: CourseEventType;
  /** Object or part id the event refers to (stable asset part id when available). */
  target?: string;
  /** Numeric value for continuous controls (slider, lever, rotator). */
  value?: number;
  /** Free-form extra payload (docked anchor name, measured distance, ...). */
  meta?: Record<string, unknown>;
}

/**
 * Completion predicate over the interaction event stream.
 * Pure function — must not touch Three.js or raw input.
 */
export type MissionPredicate = (events: CourseEvent[]) => boolean;

/** One beat inside a mission. */
export interface MissionStep {
  id: string;
  /** Instruction caption shown to the learner (second person, <= 18 words per sentence). */
  caption: string;
  /** Object/part ids this step highlights (soft light path / emissive pulse). */
  highlights?: string[];
  /** Predicate over the events seen during this step. */
  completed: MissionPredicate;
}

/** Feedback copy for the three learner-facing outcomes. Never a fail state. */
export interface MissionFeedback {
  success: string;
  nearMiss: string;
  wrong: string;
}

/** A data-driven mission definition. Content lives in each module's missions.ts. */
export interface MissionDefinition {
  id: string;
  title: string;
  /** One sentence stating what the learner will achieve. */
  objective: string;
  /** Per-tier outcome text. Foundation plain, Advanced quantitative, Expert formal. */
  outcomes: Record<CourseTier, string>;
  steps: MissionStep[];
  /** Exactly three hint levels: highlight (20 s), clearer hint (45 s), show me (90 s). */
  hints: [string, string, string];
  feedback: MissionFeedback;
  /** Final measurable success condition, with tolerance. */
  successPredicate: MissionPredicate;
  /** Numeric tolerance for the success check (metres, degrees, normalised units). */
  tolerance: number;
  xp: number;
  badge?: string;
  /** Folio / panel content ids that carry the supporting detail. */
  panelRefs?: string[];
  /** Source ids backing every factual claim in this mission. */
  sources: string[];
  /** Asset ids this mission depends on (from the asset registry). */
  assetIds?: string[];
  /** Part ids this mission interacts with. */
  partIds?: string[];
  /** Seated-reachable variant note (how the learner completes this seated). */
  seatedVariant?: string;
  /** Reduced-motion variant note (what is toned down). */
  reducedMotionVariant?: string;
}

export interface AssetPlanStep {
  step: number;
  anchorId?: string;
  challengeId?: string;
  asset: string;
  partIds: string[];
  interaction: AssetPlanInteraction;
  tier: 'foundation' | 'advanced' | 'expert';
  narrationKey: string;
  successCondition: string;
  /** True when this step relies on facts not yet cited in the module SOURCES.md. */
  unverified?: boolean;
}

export interface AssetPlan {
  moduleId: string;
  steps: AssetPlanStep[];
}

export interface ModuleDefinition {
  id: string;
  displayName: string;
  description: string;
  estimatedMinutes: [number, number];
  thumbnail: string;
  /** Optional declared setting for the module's main scene. */
  setting?: ModuleSetting;
  /** Optional ordered sections (wings, chapters) with their own settings. */
  sections?: ModuleSection[];
  load(container: THREE.Scene): Promise<THREE.Object3D>;
  unload(): void;
  /** Optional per-frame animation tick, driven by the application render loop. */
  update?(deltaSeconds: number): void;
  /** Optional serialisable state for automated playthrough assertions. */
  getState?(): Record<string, unknown> | null;
  /** Optional depth-tier hook so the hub selector reaches module content. */
  setDepthTier?(tier: 'foundation' | 'advanced' | 'expert'): void;
  /** Optional bounds validator to constrain teleport landing points within module walkable areas. */
  isWalkable?(position: THREE.Vector3): boolean;
  getChallenges(): ChallengeDefinition[];
  getSpatialAnchors(): SpatialAnchorDefinition[];
  /** Optional authored tutorial; the core derives a safe default from challenges. */
  mission?: ModuleMission;
  /** Optional course missions. The core wires the MissionRunner to these. */
  missions?: MissionDefinition[];
}

