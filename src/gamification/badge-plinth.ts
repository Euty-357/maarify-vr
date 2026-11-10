import * as THREE from 'three';
import { createTextPanel, setTextPanelText } from '../core/ui/text-panel.js';
import { SpatialGrabPrimitive } from '../core/input/primitives/grab.js';

/**
 * Shared exit-horizon kit: a badge plinth plus a return portal.
 *
 * Every module ends the same way — a physical badge that unlocks only when the
 * module is complete, and a portal that takes the learner back to the hub. Keeping
 * it here means M2–M5 can adopt the same object in M9 instead of each inventing a
 * different ending.
 */

export interface SpatialBadgePlinthOptions {
  badgeId: string;
  badgeName: string;
  subtitle?: string;
  exitLabel?: string;
  accentColor?: number;
}

export class SpatialBadgePlinth extends THREE.Group {
  public isUnlocked = false;
  public readonly badgeId: string;

  private readonly badgePanel: THREE.Mesh;
  private readonly lightColumn: THREE.Mesh;
  private readonly portalRing: THREE.Mesh;
  private readonly glowMaterial: THREE.MeshStandardMaterial;

  constructor(options: SpatialBadgePlinthOptions) {
    super();
    this.badgeId = options.badgeId;
    const accent = options.accentColor ?? 0x38bdf8;

    const stone = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.45 });
    const trim = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.8 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.28, 16), stone);
    base.position.y = 0.14;
    this.add(base);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.62, 14), stone);
    column.position.y = 0.58;
    this.add(column);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.06, 16), trim);
    cap.position.y = 0.92;
    this.add(cap);

    this.badgePanel = createTextPanel(options.badgeName, {
      widthMeters: 0.44,
      heightMeters: 0.16,
      fontSizePx: 30,
      align: 'center',
      accent: '#38bdf8',
      background: '#0b1728',
      lines: 1,
    });
    this.badgePanel.position.set(0, 1.04, 0.14);
    this.badgePanel.lookAt(0, 1.04, 2);
    this.add(this.badgePanel);

    if (options.subtitle) {
      const subtitle = createTextPanel(options.subtitle, {
        widthMeters: 0.44,
        heightMeters: 0.2,
        fontSizePx: 20,
        align: 'center',
        background: '#0b1728',
      });
      subtitle.position.set(0, 1.22, 0.12);
      subtitle.lookAt(0, 1.22, 2);
      this.add(subtitle);
    }

    // Light column: invisible until the badge is earned.
    this.glowMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.lightColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.5, 14, 1, true), this.glowMaterial);
    this.lightColumn.position.y = 1.7;
    this.lightColumn.visible = false;
    this.add(this.lightColumn);

    // Return portal beside the plinth.
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0.72, 1.15, 0.24);
    this.portalRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 30), trim);
    this.portalRing.name = 'exit-portal-ring';
    portalGroup.add(this.portalRing);
    const portalInner = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 28),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    portalGroup.add(portalInner);

    const exit = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('maarify:return-to-hub'));
      }
    };
    this.portalRing.userData.activate = exit;
    portalInner.userData.activate = exit;
    new SpatialGrabPrimitive(this.portalRing, { onGrab: exit });

    const exitLabel = createTextPanel(options.exitLabel ?? 'RETURN TO HUB', {
      widthMeters: 0.4,
      heightMeters: 0.1,
      fontSizePx: 24,
      align: 'center',
      background: '#0b1728',
    });
    exitLabel.position.set(0, 1.78, 0.06);
    exitLabel.lookAt(0, 1.78, 2);
    portalGroup.add(exitLabel);
    this.add(portalGroup);
  }

  public unlock(): boolean {
    if (this.isUnlocked) return false;
    this.isUnlocked = true;
    this.lightColumn.visible = true;
    setTextPanelText(this.badgePanel, `UNLOCKED — ${this.badgeId.replace(/-/g, ' ').toUpperCase()}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('maarify:badge-unlocked', { detail: { badgeId: this.badgeId } }));
    }
    return true;
  }

  /** Animated glow; called from the owning module's update loop. */
  public tick(deltaSeconds: number): void {
    if (this.isUnlocked) {
      this.glowMaterial.opacity = Math.min(0.3, this.glowMaterial.opacity + deltaSeconds * 0.5);
      this.glowMaterial.emissiveIntensity = 0.9 + Math.sin(performance.now() * 0.002) * 0.25;
    }
    this.portalRing.rotation.z += deltaSeconds * 0.35;
  }
}
