/**
 * MissionRunner — the course state machine.
 *
 * States: locked → available → active → done.
 * Fed exclusively by CourseEventBus events emitted from the shared interaction
 * primitives and the pointer pipeline. No raw XR input is read here.
 *
 * Owns:
 * - step progression inside the active mission
 * - the three-level hint ladder (20 s highlight, 45 s clearer hint, 90 s show me)
 * - the never-fail feedback path (wrong attempts get a gentle explanation)
 * - scoring (base XP, no-hint bonus, accuracy bonus) into the progress store
 */

import type {
  CourseEvent,
  CourseTier,
  MissionDefinition,
  MissionStep,
} from '../types.js';
import { CourseEventBus } from './event-bus.js';

/** Lifecycle state of a mission. */
export type MissionState = 'locked' | 'available' | 'active' | 'done';

/** Hint ladder timings in seconds of inactivity. */
export const HINT_TIMINGS = { highlight: 20, clearer: 45, showMe: 90 } as const;

/**
 * Which hint level is currently showing.
 * 0 = none, 1 = highlight (20 s), 2 = clearer hint (45 s), 3 = show me (90 s).
 */
export type HintLevel = 0 | 1 | 2 | 3;

/** Scoring outcome for a completed mission. */
export interface MissionScore {
  missionId: string;
  xp: number;
  baseXp: number;
  noHintBonus: number;
  accuracyBonus: number;
  hintsUsed: number;
}

/** Optional sink for scoring so the runner does not depend on the store directly. */
export interface MissionScoreSink {
  awardXp(amount: number): void;
  unlockBadge?(badgeId: string): void;
}

/** Options for MissionRunner. */
export interface MissionRunnerOptions {
  tier?: CourseTier;
  scoreSink?: MissionScoreSink;
  onStateChange?: (missionId: string, state: MissionState) => void;
  onCaption?: (caption: string) => void;
  onHighlight?: (targets: string[]) => void;
  onSuccess?: (mission: MissionDefinition, caption: string) => void;
  onNearMiss?: (mission: MissionDefinition, caption: string, kind: 'nearMiss' | 'wrong') => void;
  onComplete?: (mission: MissionDefinition, score: MissionScore) => void;
}

/** Bonus XP for finishing without any hint. */
export const NO_HINT_BONUS = 25;
/** Bonus XP for finishing within one attempt (perfect accuracy). */
export const ACCURACY_BONUS = 15;

export class MissionRunner {
  private readonly missions: MissionDefinition[];
  private readonly states: Map<string, MissionState> = new Map();
  private readonly events: Map<string, CourseEvent[]> = new Map();
  private readonly attemptCounts: Map<string, number> = new Map();
  private readonly retryCounts: Map<string, number> = new Map();
  private readonly hintLevels: Map<string, HintLevel> = new Map();
  private readonly hintsUsed: Map<string, number> = new Map();
  private activeMissionId: string | null = null;
  private stepIndex = 0;
  private idleSeconds = 0;
  private stepSeconds = 0;
  private currentHintLevel: HintLevel = 0;
  private unsubscribe: (() => void) | null = null;
  private tier: CourseTier;
  private readonly scoreSink?: MissionScoreSink;
  private readonly options: MissionRunnerOptions;

  constructor(missions: MissionDefinition[], options: MissionRunnerOptions = {}) {
    this.missions = missions;
    this.options = options;
    this.tier = options.tier ?? 'foundation';
    this.scoreSink = options.scoreSink;

    for (const mission of missions) {
      this.states.set(mission.id, 'locked');
      this.events.set(mission.id, []);
      this.attemptCounts.set(mission.id, 0);
      this.retryCounts.set(mission.id, 0);
      this.hintLevels.set(mission.id, 0);
      this.hintsUsed.set(mission.id, 0);
    }
  }

  /** Attach to a bus. Returns a detach function. */
  public attach(bus: CourseEventBus): () => void {
    this.detach();
    this.unsubscribe = bus.subscribe((event) => this.handleEvent(event));
    return () => this.detach();
  }

  /** Stop listening to the bus. */
  public detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Switch depth tier. Mission text must follow the selected tier. */
  public setTier(tier: CourseTier): void {
    this.tier = tier;
    const active = this.getActiveMission();
    if (active) this.showStepCaption(active);
  }

  /** The tier currently driving mission copy. */
  public getTier(): CourseTier {
    return this.tier;
  }

  /** All mission ids in order. */
  public getMissionIds(): string[] {
    return this.missions.map((m) => m.id);
  }

  /** Look up a mission definition. */
  public getMission(id: string): MissionDefinition | undefined {
    return this.missions.find((m) => m.id === id);
  }

  /** Current lifecycle state of a mission. */
  public getState(id: string): MissionState {
    return this.states.get(id) ?? 'locked';
  }

  /** True if mission is unlocked (available, active, or done). */
  public isUnlocked(id: string): boolean {
    const s = this.getState(id);
    return s === 'available' || s === 'active' || s === 'done';
  }

  /** The currently active step definition, or null if no mission is active. */
  public getActiveStep(): MissionStep | null {
    const mission = this.getActiveMission();
    if (!mission) return null;
    return mission.steps[this.stepIndex] ?? null;
  }

  /** The mission currently in progress, if any. */
  public getActiveMission(): MissionDefinition | null {
    if (!this.activeMissionId) return null;
    return this.getMission(this.activeMissionId) ?? null;
  }

  /** Unlock a mission so the learner can start it. */
  public unlock(id: string): void {
    const state = this.getState(id);
    if (state === 'locked') this.setState(id, 'available');
  }

  /** Unlock every mission (used by free-exploration mode and by tests). */
  public unlockAll(): void {
    for (const mission of this.missions) this.unlock(mission.id);
  }

  /** Start a mission. Returns false if it is locked or already running. */
  public start(id: string): boolean {
    const mission = this.getMission(id);
    if (!mission) return false;
    if (this.getState(id) === 'locked') return false;
    if (this.activeMissionId === id) return true;

    this.activeMissionId = id;
    this.stepIndex = 0;
    this.idleSeconds = 0;
    this.stepSeconds = 0;
    this.currentHintLevel = 0;
    this.hintLevels.set(id, 0);
    this.events.set(id, []);
    this.attemptCounts.set(id, 0);
    this.setState(id, 'active');
    this.showStepCaption(mission);
    return true;
  }

  /** Abandon the active mission and return to 'available'. Never a fail state. */
  public abandon(): void {
    const id = this.activeMissionId;
    if (!id) return;
    this.setState(id, 'available');
    this.activeMissionId = null;
    this.stepIndex = 0;
    this.idleSeconds = 0;
    this.currentHintLevel = 0;
  }

  /**
   * Per-frame tick. Drives the hint ladder.
   *
   * The ladder has three levels, matching `hints[0..2]`:
   *   20 s -> level 1: highlight the target objects
   *   45 s -> level 2: a clearer written hint
   *   90 s -> level 3: a "show me" demonstration
   *
   * @param dt Delta time in seconds.
   */
  public update(dt: number): void {
    const mission = this.getActiveMission();
    if (!mission) return;

    this.idleSeconds += dt;
    this.stepSeconds += dt;

    const step = mission.steps[this.stepIndex];
    if (step?.narrative && this.stepSeconds >= 3.5) {
      this.advanceStep(mission);
      return;
    }

    let target: HintLevel = 0;
    if (this.idleSeconds >= HINT_TIMINGS.showMe) target = 3;
    else if (this.idleSeconds >= HINT_TIMINGS.clearer) target = 2;
    else if (this.idleSeconds >= HINT_TIMINGS.highlight) target = 1;

    if (target > this.currentHintLevel) {
      this.currentHintLevel = target;
      this.hintLevels.set(mission.id, target);
      this.hintsUsed.set(mission.id, this.hintsUsed.get(mission.id)! + 1);
      const hintText = mission.hints[target - 1];
      this.options.onCaption?.(hintText);
      if (target === 1) {
        this.options.onHighlight?.(mission.steps[this.stepIndex]?.highlights ?? []);
      }
    }
  }

  /** Events recorded for a mission — used by tests and by the audit script. */
  public getRecordedEvents(id: string): CourseEvent[] {
    return this.events.get(id) ?? [];
  }

  /** How many hints the learner consumed for a mission. */
  public getHintsUsed(id: string): number {
    return this.hintsUsed.get(id) ?? 0;
  }

  /** Attempts made on the active step. */
  public getAttemptCount(id: string): number {
    return this.attemptCounts.get(id) ?? 0;
  }

  /** Wrong attempts (retries) made on a mission. A clean run has zero. */
  public getRetryCount(id: string): number {
    return this.retryCounts.get(id) ?? 0;
  }

  private handleEvent(event: CourseEvent): void {
    const mission = this.getActiveMission();
    if (!mission) return;

    const log = this.events.get(mission.id)!;
    log.push(event);

    const step = mission.steps[this.stepIndex];
    if (!step) return;

    // A wrong attempt never fails the mission: it explains and retries.
    if (event.type === 'rejected') {
      this.attemptCounts.set(mission.id, this.getAttemptCount(mission.id) + 1);
      this.retryCounts.set(mission.id, (this.retryCounts.get(mission.id) ?? 0) + 1);
      this.options.onCaption?.(mission.feedback.wrong);
      this.options.onNearMiss?.(mission, mission.feedback.wrong, 'wrong');
      this.idleSeconds = 0;
      return;
    }

    if (step.completed(log)) {
      this.attemptCounts.set(mission.id, this.getAttemptCount(mission.id) + 1);
      this.advanceStep(mission);
      return;
    }

    // Any other interaction resets the idle timer so the hint ladder waits again.
    this.idleSeconds = 0;
  }

  private advanceStep(mission: MissionDefinition): void {
    this.stepIndex += 1;
    this.idleSeconds = 0;
    this.stepSeconds = 0;
    this.currentHintLevel = 0;

    if (this.stepIndex < mission.steps.length) {
      this.showStepCaption(mission);
      return;
    }

    // All steps done — check the mission success predicate.
    const log = this.events.get(mission.id)!;
    if (mission.successPredicate(log)) {
      this.completeMission(mission);
    } else {
      // Not yet within tolerance: give the near-miss feedback and stay on the last step.
      this.stepIndex = mission.steps.length - 1;
      this.options.onCaption?.(mission.feedback.nearMiss);
      this.options.onNearMiss?.(mission, mission.feedback.nearMiss, 'nearMiss');
    }
  }

  private completeMission(mission: MissionDefinition): void {
    const hintsUsed = this.hintsUsed.get(mission.id) ?? 0;
    // Accuracy counts *retries*: a step that needed a second attempt means the
    // learner was not right first time. A clean run has zero retries.
    const retries = this.retryCounts.get(mission.id) ?? 0;
    const noHintBonus = hintsUsed === 0 ? NO_HINT_BONUS : 0;
    const accuracyBonus = retries === 0 ? ACCURACY_BONUS : 0;
    const xp = mission.xp + noHintBonus + accuracyBonus;

    const score: MissionScore = {
      missionId: mission.id,
      xp,
      baseXp: mission.xp,
      noHintBonus,
      accuracyBonus,
      hintsUsed,
    };

    this.setState(mission.id, 'done');
    this.activeMissionId = null;
    this.stepIndex = 0;

    this.scoreSink?.awardXp(xp);
    if (mission.badge) this.scoreSink?.unlockBadge?.(mission.badge);

    // The debrief caption always goes through onCaption so a single caption
    // sink sees step copy, hint copy and the debrief.
    this.options.onCaption?.(mission.feedback.success);
    this.options.onSuccess?.(mission, mission.feedback.success);
    this.options.onComplete?.(mission, score);

    // Unlock the next mission so the guided path continues.
    const index = this.missions.findIndex((m) => m.id === mission.id);
    const next = this.missions[index + 1];
    if (next) this.unlock(next.id);
  }

  private showStepCaption(mission: MissionDefinition): void {
    const step = mission.steps[this.stepIndex];
    if (!step) return;
    this.options.onCaption?.(step.caption);
    if (step.highlights?.length) this.options.onHighlight?.(step.highlights);
  }

  private setState(id: string, state: MissionState): void {
    this.states.set(id, state);
    this.options.onStateChange?.(id, state);
  }
}