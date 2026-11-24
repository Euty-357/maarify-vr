import * as THREE from 'three';
import type { ChallengeDefinition, ModuleMission, MissionDefinition } from '../types.js';
import type { MissionRunner } from '../course/mission-runner.js';
import { createTextPanel, setTextPanelText } from '../ui/text-panel.js';

/** Diegetic, data-driven objective lectern shared by every module. */
export class MissionBoard extends THREE.Group {
  private readonly wood: THREE.Mesh;
  private readonly title: THREE.Mesh;
  private readonly closeBtn: THREE.Mesh;
  private readonly expandBadge: THREE.Mesh;
  private readonly objectivePanel: THREE.Mesh;
  private readonly missionRowHitBoxes: THREE.Mesh[] = [];
  private isCollapsed = false;
  private completed = new Set<string>();
  private courseMissions: MissionDefinition[] = [];
  private runner: MissionRunner | null = null;
  private _glowTarget: THREE.Object3D | null = null;
  private _glowElapsed = 0;
  private _glowOriginalEmissiveIntensity = 0;

  public onSelectMission: ((missionId: string) => void) | null = null;

  constructor(
    private readonly mission: ModuleMission,
    private readonly challenges: ChallengeDefinition[] = [],
    courseMissions: MissionDefinition[] = [],
  ) {
    super();
    this.name = 'module-mission-board';
    this.courseMissions = courseMissions;

    this.wood = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.95, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x241610, metalness: 0.15, roughness: 0.72 }),
    );
    this.wood.position.z = -0.04;
    this.add(this.wood);

    this.title = createTextPanel(`${mission.title}\n${mission.guideName}'S MISSIONS`, {
      widthMeters: 0.70, heightMeters: 0.16, fontSizePx: 26, align: 'center',
      background: '#241610', color: '#f2d8a5', accent: '#b08d57', lines: 2,
    });
    this.title.position.set(-0.12, 0.36, 0.01);
    this.title.userData['activate'] = () => this.toggleCollapse();
    this.add(this.title);

    // Large, easily clickable Close / Collapse button on top right
    this.closeBtn = createTextPanel('CLOSE ✕', {
      widthMeters: 0.26, heightMeters: 0.10, fontSizePx: 20, align: 'center',
      background: '#991b1b', color: '#ffffff', accent: '#ef4444',
    });
    this.closeBtn.position.set(0.36, 0.36, 0.02);
    this.closeBtn.userData['activate'] = () => this.toggleCollapse();
    this.add(this.closeBtn);

    // Compact badge shown when collapsed so the learner can re-open anytime
    this.expandBadge = createTextPanel(`[ + ${mission.title} MISSIONS ]`, {
      widthMeters: 0.65, heightMeters: 0.12, fontSizePx: 22, align: 'center',
      background: '#241610', color: '#f2d8a5', accent: '#b08d57', lines: 1,
    });
    this.expandBadge.position.set(0, 0, 0.02);
    this.expandBadge.visible = false;
    this.expandBadge.userData['activate'] = () => this.toggleCollapse();
    this.add(this.expandBadge);

    this.objectivePanel = createTextPanel('', {
      widthMeters: 0.95, heightMeters: 0.65, fontSizePx: 18, align: 'left',
      background: '#e8dcc0', color: '#241610', accent: '#b08d57', lines: 12,
      pixelWidth: 960, pixelHeight: 680,
    });
    this.objectivePanel.position.set(0, -0.09, 0.012);
    this.add(this.objectivePanel);

    // Initial placement: in front of spawn within 40 deg FOV, 1.68m reach, eye-level adjusted
    this.position.set(0.65, 1.25, -1.35);
    this.lookAt(0, 1.25, 0);

    this.paint();
  }

  public setCourseMissions(missions: MissionDefinition[], runner?: MissionRunner): void {
    this.courseMissions = missions;
    if (runner) this.runner = runner;
    this.paint();
  }

  public updateCourseState(runner?: MissionRunner): void {
    if (runner) this.runner = runner;
    this.paint();
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.wood.visible = !this.isCollapsed;
    this.title.visible = !this.isCollapsed;
    this.closeBtn.visible = !this.isCollapsed;
    this.objectivePanel.visible = !this.isCollapsed;
    this.expandBadge.visible = this.isCollapsed;
    for (const box of this.missionRowHitBoxes) {
      box.visible = !this.isCollapsed;
    }
  }

  public complete(challengeOrMissionId: string): void {
    this.completed.add(challengeOrMissionId);
    this.paint();
  }

  public nextObjectiveGlow(targetObject: THREE.Object3D): void {
    this._glowTarget = targetObject;
    this._glowElapsed = 0;
    const mat = this.glowMaterial(targetObject);
    if (mat) {
      this._glowOriginalEmissiveIntensity = mat.emissiveIntensity;
    }
  }

  public update(dt: number): void {
    if (!this._glowTarget) return;
    this._glowElapsed += dt;
    const mat = this.glowMaterial(this._glowTarget);
    if (this._glowElapsed >= 1.2) {
      if (mat) mat.emissiveIntensity = this._glowOriginalEmissiveIntensity;
      this._glowTarget = null;
      return;
    }
    const t = (this._glowElapsed % 0.4) / 0.4;
    if (mat) mat.emissiveIntensity = 0.8 * Math.sin(t * Math.PI);
  }

  private glowMaterial(obj: THREE.Object3D): THREE.MeshStandardMaterial | null {
    if (!(obj instanceof THREE.Mesh)) return null;
    const mat = obj.material;
    return mat instanceof THREE.MeshStandardMaterial ? mat : null;
  }

  private paint(): void {
    // Clear old hit boxes
    for (const box of this.missionRowHitBoxes) {
      this.remove(box);
      box.geometry.dispose();
      (box.material as THREE.Material).dispose();
    }
    this.missionRowHitBoxes.length = 0;

    const lines: string[] = [];

    if (this.courseMissions && this.courseMissions.length > 0) {
      const activeMission = this.runner?.getActiveMission();
      const currentTier = this.runner?.getTier() ?? 'foundation';

      if (activeMission) {
        lines.push(`ACTIVE: ${activeMission.title}`);
        const step = activeMission.steps[0];
        if (step) {
          lines.push(`▶ ${step.caption}`);
        }
        lines.push('─'.repeat(42));
      } else {
        lines.push('Tap any unlocked mission below to start:');
        lines.push('─'.repeat(42));
      }

      // Display up to 6 missions at a time with clear state indicators
      const displayMissions = this.courseMissions.slice(0, 6);
      displayMissions.forEach((m, idx) => {
        const state = this.runner?.getState(m.id) ?? (this.completed.has(m.id) ? 'done' : 'locked');
        let symbol = '🔒';
        if (state === 'done' || this.completed.has(m.id)) symbol = '✓';
        else if (state === 'active') symbol = '▶';
        else if (state === 'available') symbol = '○';

        const tierOutcome = m.outcomes?.[currentTier] ?? m.objective;
        const shortObjective = tierOutcome.length > 55 ? `${tierOutcome.slice(0, 52)}...` : tierOutcome;
        lines.push(`${symbol} [${idx + 1}] ${m.title}`);
        lines.push(`   ${shortObjective}`);

        // Add interactive touch/ray hit box for unlocked missions
        if (state !== 'locked') {
          const hitBox = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.08),
            new THREE.MeshBasicMaterial({ visible: false }),
          );
          hitBox.position.set(0, 0.16 - idx * 0.09, 0.02);
          hitBox.userData['activate'] = () => {
            if (this.onSelectMission) {
              this.onSelectMission(m.id);
            } else if (this.runner) {
              const cur = this.runner.getActiveMission();
              if (cur && cur.id !== m.id) this.runner.abandon();
              this.runner.start(m.id);
              this.paint();
            }
          };
          this.missionRowHitBoxes.push(hitBox);
          this.add(hitBox);
        }
      });

      // If legacy challenges exist, append unmapped ones
      if (this.challenges.length > 0) {
        const unmapped = this.challenges.filter(c => !this.courseMissions.some(m => m.id === c.id));
        if (unmapped.length > 0) {
          lines.push('─'.repeat(42));
          lines.push('EXTRA CHALLENGES:');
          for (const c of unmapped.slice(0, 2)) {
            const sym = this.completed.has(c.id) ? '✓' : '○';
            lines.push(`${sym} ${c.title}`);
          }
        }
      }
    } else {
      // Legacy challenge fallback
      const hint = this.mission.tutorial?.[0]?.instruction ?? 'Point, grab, and use the folio tabs when you need context.';
      const objectives = this.challenges.slice(0, 5).map((challenge, index) =>
        `${this.completed.has(challenge.id) ? '✓' : '○'} ${index + 1}. ${challenge.title}`,
      );
      lines.push(`START: ${hint}`);
      lines.push('');
      lines.push(...objectives);
    }

    setTextPanelText(this.objectivePanel, lines.join('\n'));
  }
}

export function defaultMissionFor(moduleName: string): ModuleMission {
  return {
    title: moduleName,
    guideName: 'DR. AMANI',
    tutorial: [
      { id: 'point', instruction: 'Point at a glowing exhibit, then press trigger or pinch.', target: 'anchor' },
      { id: 'folio', instruction: 'Use the brass folio tabs to choose your depth.', target: 'folio' },
      { id: 'move', instruction: 'Use teleport and snap turn to reach the next station.', target: 'locomotion' },
    ],
  };
}

/**
 * Build a Dr. Amani caption panel placed in the learner's initial field of view:
 * at (0, 1.45, -1.35) facing spawn; never head-locked.
 */
export function buildDrAmaniCaptionPanel(): THREE.Mesh {
  const panel = createTextPanel('', {
    widthMeters: 0.75,
    heightMeters: 0.16,
    fontSizePx: 22,
    align: 'center',
    background: '#241610',
    color: '#f2d8a5',
    accent: '#b08d57',
    lines: 3,
  });
  panel.position.set(0, 1.45, -1.35);
  panel.lookAt(0, 1.45, 0);
  return panel;
}
