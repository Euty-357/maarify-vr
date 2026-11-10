import * as THREE from 'three';
import { ActiveTuning, DEFAULT_TUNING, exportTuningJson } from '../../config/tuning.js';

type PanelButtonId =
  | 'grab-down' | 'grab-up'
  | 'haptics-down' | 'haptics-up'
  | 'snap-down' | 'snap-up'
  | 'reset' | 'export' | 'close';

interface PanelButton {
  id: PanelButtonId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
}

const CANVAS_SIZE = 768;
const PANEL_SIZE_METERS = 0.62;

/**
 * Runtime tuning console.
 *
 * Desktop opens it with `T`; in VR it is opened from the physical console in the hub
 * and operated by pointing the controller (or hand) ray at the drawn buttons. The
 * mesh is world-anchored once opened, never head-locked.
 */
export class RuntimeTuningPanel {
  public panelGroup: THREE.Group;
  private isVisible = false;
  private statusText = '';
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private panelMesh: THREE.Mesh;
  private buttons: PanelButton[] = [];

  constructor(private camera: THREE.Camera) {
    this.panelGroup = new THREE.Group();
    this.panelGroup.name = 'runtime-tuning-panel';
    this.panelGroup.visible = false;

    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const panelGeo = new THREE.PlaneGeometry(PANEL_SIZE_METERS, PANEL_SIZE_METERS);
    const panelMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.panelMesh = new THREE.Mesh(panelGeo, panelMat);
    this.panelMesh.name = 'runtime-tuning-panel-surface';
    this.panelMesh.userData.tuningPanelSurface = true;
    this.panelGroup.add(this.panelMesh);

    const borderGeo = new THREE.RingGeometry(PANEL_SIZE_METERS * 0.7, PANEL_SIZE_METERS * 0.72, 4);
    borderGeo.rotateZ(Math.PI / 4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = -0.005;
    this.panelGroup.add(borderMesh);

    this.renderCanvas();

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => {
        if (event.key === 't' || event.key === 'T') this.toggleVisibility();
      });
    }
  }

  public get isOpen(): boolean {
    return this.isVisible;
  }

  public toggleVisibility(): void {
    if (this.isVisible) this.hide();
    else this.openInFrontOf(this.camera);
  }

  /** Place the console 0.85 m in front of the viewer, slightly below eye height. */
  public openInFrontOf(camera: THREE.Camera): void {
    this.isVisible = true;
    this.panelGroup.visible = true;

    const direction = new THREE.Vector3();
    const camPosition = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.getWorldPosition(camPosition);

    this.panelGroup.position.copy(camPosition).add(direction.multiplyScalar(0.85));
    this.panelGroup.position.y = Math.max(1.0, camPosition.y - 0.12);
    this.panelGroup.lookAt(camPosition);
    this.panelGroup.updateMatrixWorld(true);
    this.statusText = 'Aim at a button and press the trigger.';
    this.renderCanvas();
  }

  public hide(): void {
    this.isVisible = false;
    this.panelGroup.visible = false;
  }

  /**
   * Route a raycast hit on the panel to the button under the pointer.
   * `u`/`v` are the intersection UVs (0..1, v up). Returns true when a button fired.
   */
  public handlePointer(u: number, v: number): boolean {
    if (!this.isVisible) return false;
    const x = u * CANVAS_SIZE;
    const y = (1 - v) * CANVAS_SIZE;
    const button = this.buttons.find(
      (candidate) => x >= candidate.x && x <= candidate.x + candidate.width && y >= candidate.y && y <= candidate.y + candidate.height
    );
    if (!button) return false;
    this.activate(button.id);
    return true;
  }

  private activate(id: PanelButtonId): void {
    switch (id) {
      case 'grab-down': this.adjustGrabThreshold(-0.02); break;
      case 'grab-up': this.adjustGrabThreshold(0.02); break;
      case 'haptics-down': this.adjustHaptics(-0.1); break;
      case 'haptics-up': this.adjustHaptics(0.1); break;
      case 'snap-down': this.adjustSnapAngle(-15); break;
      case 'snap-up': this.adjustSnapAngle(15); break;
      case 'reset': this.resetConfig(); break;
      case 'export': this.exportConfig(); break;
      case 'close': this.statusText = 'Console closed.'; this.hide(); break;
    }
  }

  public adjustGrabThreshold(delta: number): void {
    ActiveTuning.input.grabThresholdMeters = Math.max(
      0.05,
      Math.min(0.35, ActiveTuning.input.grabThresholdMeters + delta)
    );
    this.statusText = `Grab Threshold: ${ActiveTuning.input.grabThresholdMeters.toFixed(2)} m`;
    this.renderCanvas();
  }

  public adjustHaptics(delta: number): void {
    const newIntensity = Math.max(0.1, Math.min(1.0, ActiveTuning.haptics.grab.intensity + delta));
    ActiveTuning.haptics.grab.intensity = newIntensity;
    ActiveTuning.haptics.snap.intensity = Math.min(1.0, newIntensity * 1.3);
    this.statusText = `Haptic Intensity: ${newIntensity.toFixed(2)}`;
    this.renderCanvas();
  }

  public adjustSnapAngle(deltaDeg: number): void {
    ActiveTuning.comfort.snapTurnAngleDeg = Math.max(
      15,
      Math.min(90, ActiveTuning.comfort.snapTurnAngleDeg + deltaDeg)
    );
    this.statusText = `Snap Turn: ${ActiveTuning.comfort.snapTurnAngleDeg}°`;
    this.renderCanvas();
  }

  public exportConfig(): string {
    const json = exportTuningJson();
    console.log('[MAARIFY TUNING EXPORT]\n', json);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
    this.statusText = 'Exported to clipboard and console log.';
    this.renderCanvas();
    return json;
  }

  public resetConfig(): void {
    Object.assign(ActiveTuning, JSON.parse(JSON.stringify(DEFAULT_TUNING)));
    this.statusText = 'Reset to factory defaults.';
    this.renderCanvas();
  }

  private renderCanvas(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('MAARIFY TUNING', 40, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Point at a button, then press the trigger.', 40, 94);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 112);
    ctx.lineTo(728, 112);
    ctx.stroke();

    const readouts = [
      `Grab threshold   ${ActiveTuning.input.grabThresholdMeters.toFixed(2)} m`,
      `Haptic intensity ${(ActiveTuning.haptics.grab.intensity * 100).toFixed(0)} %`,
      `Snap turn        ${ActiveTuning.comfort.snapTurnAngleDeg}°`,
      `Vignette max     ${(ActiveTuning.comfort.vignetteMaxDarkness * 100).toFixed(0)} %`,
      `Fixed step       ${ActiveTuning.physics.fixedStepHz} Hz`,
    ];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px sans-serif';
    readouts.forEach((line, index) => ctx.fillText(line, 40, 158 + index * 40));

    this.buttons = this.buildButtons();
    this.buttons.forEach((button) => {
      ctx.fillStyle = button.accent;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(button.x, button.y, button.width, button.height);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = button.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x, button.y, button.width, button.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2 + 8);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 700, 688, 44);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 20px sans-serif';
    ctx.fillText(this.statusText || 'Ready for tuning.', 56, 728);

    this.texture.needsUpdate = true;
  }

  private buildButtons(): PanelButton[] {
    const margin = 40;
    const gap = 16;
    const width = (CANVAS_SIZE - margin * 2 - gap) / 2;
    const height = 56;
    const rows = [372, 440, 508, 576];
    const left = margin;
    const right = margin + width + gap;

    return [
      { id: 'grab-down', label: 'GRAB −', x: left, y: rows[0], width, height, accent: '#38bdf8' },
      { id: 'grab-up', label: 'GRAB +', x: right, y: rows[0], width, height, accent: '#38bdf8' },
      { id: 'haptics-down', label: 'HAPTICS −', x: left, y: rows[1], width, height, accent: '#a855f7' },
      { id: 'haptics-up', label: 'HAPTICS +', x: right, y: rows[1], width, height, accent: '#a855f7' },
      { id: 'snap-down', label: 'SNAP −', x: left, y: rows[2], width, height, accent: '#10b981' },
      { id: 'snap-up', label: 'SNAP +', x: right, y: rows[2], width, height, accent: '#10b981' },
      { id: 'reset', label: 'RESET', x: left, y: rows[3], width, height, accent: '#f59e0b' },
      { id: 'export', label: 'EXPORT', x: right, y: rows[3], width, height, accent: '#f59e0b' },
      { id: 'close', label: 'CLOSE', x: margin, y: 644, width: CANVAS_SIZE - margin * 2, height: 48, accent: '#ef4444' },
    ];
  }
}
