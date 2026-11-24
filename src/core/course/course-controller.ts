/**
 * CourseController — binds a module's MissionDefinitions to the shared scene.
 *
 * Relationship to `src/core/mission/` (no duplication):
 * - `src/core/mission/mission-board.ts` owns the DIEGETIC BOARD (the lectern
 *   that lists objectives and shows ticks) and the Dr. Amani caption panel
 *   factory. The course system reuses them: `buildDrAmaniCaptionPanel()` is
 *   the only caption panel implementation, and the board is told when a
 *   mission completes so its tick list stays in step.
 * - `src/core/mission/tutorial-controller.ts` owns the ORIENTATION TUTORIAL
 *   (the 60–90 s opening steps). Missions start after it.
 * - `src/core/mission/summary-plinth.ts` owns the end-of-module summary.
 * - `src/core/course/` owns the COURSE itself: the data-driven mission
 *   definitions, the runner state machine, the hint ladder and the mission
 *   scoring. It never draws a board or a caption panel of its own.
 * - SCORING lives in ONE place: the progress store (`InMemoryProgressStore`).
 *   The runner computes the score; the controller forwards it to the store
 *   through the score sink. No second copy of XP or badge bookkeeping exists.
 *
 * See docs/DECISIONS.md D-019 and docs/STATE.md for the full relationship.
 */

import * as THREE from 'three';
import type { CourseTier, MissionDefinition } from '../types.js';
import { MissionRunner, type MissionScore } from './mission-runner.js';
import { CourseEventBus } from './event-bus.js';
import { buildDrAmaniCaptionPanel } from '../mission/mission-board.js';
import { setTextPanelText } from '../ui/text-panel.js';
import { triggerHapticPulse } from '../haptics/haptics.js';
import { ActiveTuning } from '../../config/tuning.js';

/**
 * The single scoring sink. The in-memory progress store implements this, so
 * XP, badges, completed missions and the capstone score are all recorded in
 * one place.
 */
export interface CourseScoreSink {
  awardXp(amount: number): void;
  unlockBadge?(badgeId: string): void;
  completeMission?(missionId: string, xp: number): void;
}

/** The diegetic mission board, told when a mission completes so its ticks update. */
export interface CourseMissionBoard {
  complete(challengeId: string): void;
  updateCourseState?(runner: MissionRunner): void;
}

export interface CourseControllerOptions {
  missions: MissionDefinition[];
  bus: CourseEventBus;
  /** Scoring sink — normally the in-memory progress store. */
  scoreSink?: CourseScoreSink;
  /** Optional mission board whose objective list should follow the course. */
  missionBoard?: CourseMissionBoard;
  /** Resolve a highlight target id to an object in the scene. */
  resolveHighlight?: (targetId: string) => THREE.Object3D | undefined;
  tier?: CourseTier;
}

export class CourseController {
  public readonly runner: MissionRunner;
  public readonly captionPanel: THREE.Mesh;
  public activeInputSource: XRInputSource | null = null;
  private readonly bus: CourseEventBus;
  private readonly options: CourseControllerOptions;
  private readonly highlighted: THREE.Object3D[] = [];
  private detachBus: (() => void) | null = null;
  private captionTimer = 0;
  private welcomeTimer = 0;
  private pendingAutoStartId: string | null = null;

  constructor(options: CourseControllerOptions) {
    this.options = options;
    this.bus = options.bus;
    this.captionPanel = buildDrAmaniCaptionPanel();

    this.runner = new MissionRunner(options.missions, {
      tier: options.tier ?? 'foundation',
      scoreSink: {
        awardXp: (amount) => options.scoreSink?.awardXp(amount),
        unlockBadge: (badgeId) => options.scoreSink?.unlockBadge?.(badgeId),
      },
      onStateChange: (_id, _state) => {
        this.options.missionBoard?.updateCourseState?.(this.runner);
      },
      onCaption: (caption) => this.showCaption(caption),
      onHighlight: (targets) => this.highlightTargets(targets),
      onSuccess: (_mission, caption) => {
        this.showCaption(caption);
        this.pulseHaptics(ActiveTuning.haptics.success);
      },
      onNearMiss: (_mission, caption, kind) => {
        this.showCaption(caption);
        this.pulseHaptics(
          kind === 'nearMiss' ? ActiveTuning.haptics.detent : ActiveTuning.haptics.error,
        );
      },
      onComplete: (mission, score) => this.onMissionComplete(mission, score),
    });

    this.detachBus = this.runner.attach(this.bus);
  }

  /**
   * Initialize course on module entry: unlock the first non-deferred mission,
   * show a 3-second welcome caption, then auto-start it.
   */
  public initCourse(): void {
    const missions = this.options.missions;
    if (!missions || missions.length === 0) return;
    const first = missions[0];
    this.runner.unlock(first.id);
    this.options.missionBoard?.updateCourseState?.(this.runner);

    this.showCaption(`Welcome! Mission 1: ${first.title}`);
    this.welcomeTimer = 3.0;
    this.pendingAutoStartId = first.id;
  }

  public setActiveInputSource(source: XRInputSource | null): void {
    this.activeInputSource = source;
  }

  /** Start a mission by id. If another mission is active, abandons it first. Returns false when locked. */
  public startMission(id: string): boolean {
    this.welcomeTimer = 0;
    this.pendingAutoStartId = null;
    const currentActive = this.runner.getActiveMission();
    if (currentActive && currentActive.id !== id) {
      this.runner.abandon();
    }
    const ok = this.runner.start(id);
    if (ok) {
      this.options.missionBoard?.updateCourseState?.(this.runner);
    }
    return ok;
  }

  /** Switch depth tier. The runner re-renders the active step caption. */
  public setTier(tier: CourseTier): void {
    this.runner.setTier(tier);
  }

  /** Unlock every mission (free-exploration mode). */
  public unlockAll(): void {
    this.runner.unlockAll();
  }

  /** Per-frame update: drives the hint ladder and auto-start welcome timer. */
  public update(dt: number): void {
    this.runner.update(dt);
    if (this.welcomeTimer > 0) {
      this.welcomeTimer -= dt;
      if (this.welcomeTimer <= 0 && this.pendingAutoStartId) {
        const id = this.pendingAutoStartId;
        this.pendingAutoStartId = null;
        this.runner.start(id);
        this.options.missionBoard?.updateCourseState?.(this.runner);
      }
    }
    if (this.captionTimer > 0) {
      this.captionTimer -= dt;
      if (this.captionTimer <= 0) {
        // Fade the caption back to the current step caption.
        const active = this.runner.getActiveMission();
        const step = active?.steps[0];
        if (step) setTextPanelText(this.captionPanel, step.caption);
      }
    }
  }

  /** Release the bus subscription and clear highlights. */
  public dispose(): void {
    this.detachBus?.();
    this.detachBus = null;
    this.clearHighlights();
    this.captionPanel.parent?.remove(this.captionPanel);
    this.captionPanel.geometry.dispose();
    const mat = this.captionPanel.material as THREE.Material;
    mat.dispose();
  }

  private showCaption(caption: string): void {
    setTextPanelText(this.captionPanel, caption);
    this.captionTimer = 0;
  }

  private highlightTargets(targets: string[]): void {
    this.clearHighlights();
    for (const target of targets) {
      const object = this.options.resolveHighlight?.(target);
      if (!object) continue;
      this.highlighted.push(object);
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (material?.emissive) {
        material.emissive.setHex(0x38bdf8);
      }
    }
  }

  private clearHighlights(): void {
    for (const object of this.highlighted) {
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (material?.emissive) {
        material.emissive.setHex(0x000000);
      }
    }
    this.highlighted.length = 0;
  }

  private pulseHaptics(preset: { intensity: number; durationMs: number }): void {
    if (this.activeInputSource) {
      triggerHapticPulse(
        this.activeInputSource,
        preset.intensity,
        preset.durationMs,
      );
    }
  }

  private onMissionComplete(mission: MissionDefinition, score: MissionScore): void {
    this.options.scoreSink?.completeMission?.(mission.id, score.xp);
    this.options.missionBoard?.complete(mission.id);
    this.options.missionBoard?.updateCourseState?.(this.runner);
    this.pulseHaptics(ActiveTuning.haptics.success);
  }
}