import * as THREE from 'three';
import { ActiveTuning, DEFAULT_TUNING, exportTuningJson } from '../../config/tuning.js';

export class RuntimeTuningPanel {
  public panelGroup: THREE.Group;
  private isVisible = false;
  private statusText = '';
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private panelMesh: THREE.Mesh;

  constructor(private camera: THREE.Camera) {
    this.panelGroup = new THREE.Group();
    this.panelGroup.name = 'runtime-tuning-panel';
    this.panelGroup.visible = false;

    // 1. Off-screen canvas for rendering crisp live UI in VR
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const panelGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const panelMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.panelMesh = new THREE.Mesh(panelGeo, panelMat);
    this.panelGroup.add(this.panelMesh);

    // Frame border
    const borderGeo = new THREE.RingGeometry(0.35, 0.36, 4);
    borderGeo.rotateZ(Math.PI / 4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = -0.005;
    this.panelGroup.add(borderMesh);

    this.renderCanvas();

    // Desktop keyboard shortcut 'T' to toggle
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 't' || e.key === 'T') {
          this.toggleVisibility();
        }
      });
    }
  }

  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.panelGroup.visible = this.isVisible;

    if (this.isVisible) {
      // Reposition 1.0m in front of camera
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const camPos = new THREE.Vector3();
      this.camera.getWorldPosition(camPos);

      this.panelGroup.position.copy(camPos).add(dir.multiplyScalar(0.9));
      this.panelGroup.position.y = Math.max(1.1, this.panelGroup.position.y);
      this.panelGroup.lookAt(camPos);
      this.statusText = 'Panel open. Click/Poke buttons to tune.';
      this.renderCanvas();
    }
  }

  public adjustGrabThreshold(delta: number): void {
    ActiveTuning.input.grabThresholdMeters = Math.max(
      0.05,
      Math.min(0.35, ActiveTuning.input.grabThresholdMeters + delta)
    );
    this.statusText = `Grab Threshold: ${ActiveTuning.input.grabThresholdMeters.toFixed(2)}m`;
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
    this.statusText = 'Exported to clipboard & console log!';
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

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('MAARIFY TUNING PANEL', 24, 46);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press [T] on desktop or poke in VR', 24, 74);

    // Separator line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 88);
    ctx.lineTo(488, 88);
    ctx.stroke();

    // Tuning Parameters readout
    ctx.fillStyle = '#f8fafc';
    ctx.font = '20px sans-serif';

    const items = [
      `Grab Threshold: ${ActiveTuning.input.grabThresholdMeters.toFixed(2)} m`,
      `Fixed Step: ${ActiveTuning.physics.fixedStepHz} Hz`,
      `Snap Turn Angle: ${ActiveTuning.comfort.snapTurnAngleDeg}°`,
      `Grab Haptic: ${(ActiveTuning.haptics.grab.intensity * 100).toFixed(0)}%`,
      `Vignette Max: ${(ActiveTuning.comfort.vignetteMaxDarkness * 100).toFixed(0)}%`,
      `Tier A Star Particles: ${ActiveTuning.tiers.tierA.starParticleCount}`,
      `Tier B Star Particles: ${ActiveTuning.tiers.tierB.starParticleCount}`,
    ];

    let y = 125;
    for (const item of items) {
      ctx.fillText(item, 24, y);
      y += 34;
    }

    // Status box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(24, 380, 464, 48);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(this.statusText || 'Ready for tuning.', 36, 410);

    // Instructions footer
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('Export logs JSON to adb logcat and clipboard.', 24, 465);
    ctx.fillText('Quest 3: Check OVR Metrics overlay while tuning.', 24, 488);

    this.texture.needsUpdate = true;
  }
}

