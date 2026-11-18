import * as THREE from 'three';
import type { ChallengeDefinition, ModuleMission } from '../types.js';
import { createTextPanel, setTextPanelText } from '../ui/text-panel.js';

/** Diegetic, data-driven objective lectern shared by every module. */
export class MissionBoard extends THREE.Group {
  private readonly wood: THREE.Mesh;
  private readonly title: THREE.Mesh;
  private readonly closeBtn: THREE.Mesh;
  private readonly expandBadge: THREE.Mesh;
  private readonly objectivePanel: THREE.Mesh;
  private isCollapsed = false;
  private completed = new Set<string>();
  private _glowTarget: THREE.Object3D | null = null;
  private _glowElapsed = 0;
  private _glowOriginalEmissiveIntensity = 0;

  constructor(private readonly mission: ModuleMission, private readonly challenges: ChallengeDefinition[]) {
    super();
    this.name = 'module-mission-board';
    this.wood = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.95, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x241610, metalness: 0.15, roughness: 0.72 }),
    );
    this.wood.position.z = -0.04;
    this.add(this.wood);

    this.title = createTextPanel(`${mission.title}\n${mission.guideName}'S MISSION`, {
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
    this.expandBadge = createTextPanel(`[ + ${mission.title} MISSION ]`, {
      widthMeters: 0.65, heightMeters: 0.12, fontSizePx: 22, align: 'center',
      background: '#241610', color: '#f2d8a5', accent: '#b08d57', lines: 1,
    });
    this.expandBadge.position.set(0, 0, 0.02);
    this.expandBadge.visible = false;
    this.expandBadge.userData['activate'] = () => this.toggleCollapse();
    this.add(this.expandBadge);

    this.objectivePanel = createTextPanel('', {
      widthMeters: 0.95, heightMeters: 0.65, fontSizePx: 21, align: 'left',
      background: '#e8dcc0', color: '#241610', accent: '#b08d57', lines: 8,
      pixelWidth: 900, pixelHeight: 680,
    });
    this.objectivePanel.position.set(0, -0.09, 0.012);
    this.add(this.objectivePanel);
    this.paint();
    this.position.set(0, 1.2, -1.45);
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.wood.visible = !this.isCollapsed;
    this.title.visible = !this.isCollapsed;
    this.closeBtn.visible = !this.isCollapsed;
    this.objectivePanel.visible = !this.isCollapsed;
    this.expandBadge.visible = this.isCollapsed;
  }

  public complete(challengeId: string): void {
    this.completed.add(challengeId);
    this.paint();
  }

  /**
   * Fire a next-objective glow cue on the next challenge's target object: three
   * emissive pulses driven by `update(dt)`. The target's original emissive intensity
   * is captured here and restored when the cue finishes.
   */
  public nextObjectiveGlow(targetObject: THREE.Object3D): void {
    this._glowTarget = targetObject;
    this._glowElapsed = 0;
    const mat = this.glowMaterial(targetObject);
    if (mat) {
      this._glowOriginalEmissiveIntensity = mat.emissiveIntensity;
    }
  }

  /**
   * Per-frame update driving the next-objective glow. The cue runs for 1.2 s total:
   * three 0.4 s pulses where emissiveIntensity follows 0.8 * sin(t * PI) within each
   * pulse. After 1.2 s the original emissive intensity is restored and the cue clears.
   * @param dt Delta time in seconds.
   */
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

  /** Resolve the target's material to a MeshStandardMaterial if it has one. */
  private glowMaterial(obj: THREE.Object3D): THREE.MeshStandardMaterial | null {
    if (!(obj instanceof THREE.Mesh)) return null;
    const mat = obj.material;
    return mat instanceof THREE.MeshStandardMaterial ? mat : null;
  }

  private paint(): void {
    const hint = this.mission.tutorial[0]?.instruction ?? 'Point, grab, and use the folio tabs when you need context.';
    const objectives = this.challenges.slice(0, 5).map((challenge, index) =>
      `${this.completed.has(challenge.id) ? '✓' : '○'} ${index + 1}. ${challenge.title}`,
    );
    setTextPanelText(this.objectivePanel, `START: ${hint}\n\n${objectives.join('\n')}`);
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
 * Build a blank Dr. Amani caption panel.
 * Position at y=1.65, z=1.5 in module-local space; never head-locked.
 * @returns A blank text panel mesh ready for `setTextPanelText`.
 */
export function buildDrAmaniCaptionPanel(): THREE.Mesh {
  const panel = createTextPanel('', {
    widthMeters: 0.6,
    heightMeters: 0.12,
    fontSizePx: 22,
    align: 'center',
    background: '#241610',
    color: '#f2d8a5',
    accent: '#b08d57',
    lines: 3,
  });
  panel.position.set(0, 1.65, 1.5);
  return panel;
}
