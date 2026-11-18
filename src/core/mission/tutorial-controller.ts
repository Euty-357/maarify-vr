import * as THREE from 'three';
import type { ModuleMission, ModuleTutorialStep } from '../types.js';
import { setTextPanelText } from '../ui/text-panel.js';

/**
 * TutorialController drives data-driven tutorial steps from a ModuleMission's
 * tutorial array through a caption panel (Dr. Amani text panel). It is
 * module-agnostic: every module supplies its own tutorial steps via its
 * ModuleDefinition.mission, and the controller advances through them on user
 * interaction (advance) or after 90 s of inactivity (auto-advance).
 */
export class TutorialController {
  private stepIndex = 0;
  private _complete = false;
  private elapsed = 0;
  private readonly steps: ModuleTutorialStep[];
  private readonly captionPanel: THREE.Mesh;

  constructor(mission: ModuleMission, captionPanel: THREE.Mesh) {
    this.steps = mission.tutorial;
    this.captionPanel = captionPanel;
  }

  /** Start the tutorial from step 0. */
  public start(): void {
    this.stepIndex = 0;
    this._complete = false;
    this.elapsed = 0;
    if (this.steps.length > 0) {
      setTextPanelText(this.captionPanel, this.steps[0].instruction);
    }
  }

  /** Advance to the next step; fires onComplete when all steps are exhausted. */
  public advance(): void {
    if (this._complete) return;
    this.stepIndex += 1;
    if (this.stepIndex >= this.steps.length) {
      this._complete = true;
      this.onComplete?.();
      return;
    }
    this.elapsed = 0;
    setTextPanelText(this.captionPanel, this.steps[this.stepIndex].instruction);
  }

  /** Skip directly to the end and fire onComplete. */
  public skip(): void {
    this.stepIndex = this.steps.length;
    this._complete = true;
    this.onComplete?.();
  }

  /** Whether the tutorial has been completed (all steps advanced or skipped). */
  public isComplete(): boolean {
    return this._complete;
  }

  /** The current step, or null if the tutorial is complete. */
  public getCurrentStep(): ModuleTutorialStep | null {
    if (this._complete || this.stepIndex >= this.steps.length) return null;
    return this.steps[this.stepIndex];
  }

  /**
   * Per-frame update: auto-advance after 90 seconds of no interaction.
   * @param dt Delta time in seconds.
   */
  public update(dt: number): void {
    if (this._complete) return;
    this.elapsed += dt;
    if (this.elapsed > 90) {
      this.advance();
    }
  }

  /** Callback fired when the tutorial completes (by advancing through all steps or by skip). */
  public onComplete: (() => void) | null = null;
}
