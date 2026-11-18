import * as THREE from 'three';
import { SpatialAnchorPrimitive } from '../input/primitives/anchor.js';
import { FolioPanel } from '../ui/folio-panel.js';
import { placeFolioBesideExhibit } from '../ui/folio-placement.js';
import { createTextPanel } from '../ui/text-panel.js';

/**
 * Information System V3 options.
 *
 * `roomBounds` is the AABB of the spatial sub-room a folio must stay inside of
 * (Requirement 9); `autoCloseDistanceMeters` is the head-to-anchor distance beyond
 * which an open, unpinned folio auto-closes (Requirement 6, default 2.5 m).
 */
export interface InformationSystemOptions {
  roomBounds?: THREE.Box3;
  autoCloseDistanceMeters?: number;
}

/**
 * Per-module manager that sits between `main.ts` and the existing
 * `DiegeticSpatialAnchor` / `FolioPanel` / `SpatialAnchorPrimitive` primitives.
 *
 * It owns: resting-state brass placards (Req 1), hover outline + name tag
 * (Req 2), single-open folio enforcement (Req 5), auto-close on distance
 * (Req 6), orientation lock (Req 7), pin toggle (Req 4.5) and the double-pinch
 * dismiss-all gesture (Req 10). It is deliberately not a singleton: `main.ts`
 * constructs one per module entry.
 */
export class InformationSystemManager {
  /** Id of the anchor whose folio is currently open, or null. */
  private openAnchorId: string | null = null;
  /** Id of the anchor currently hovered, or null. */
  private hoveredAnchorId: string | null = null;
  /** World orientation captured at open time; re-applied each frame (Req 7). */
  private _lockedQuaternion: THREE.Quaternion | null = null;
  /** Timestamp of the last pinch, for double-pinch dismiss detection (Req 10). */
  private _lastPinchTimestamp = 0;

  private readonly autoCloseDistanceMeters: number;
  /** Brass placard mesh per anchor (the hover-highlight target). */
  private readonly placards = new Map<string, THREE.Mesh>();
  /** Placard material handles, for O(1) emissive swap on hover. */
  private readonly placardMaterials = new Map<string, THREE.MeshStandardMaterial>();
  /** Pre-built hover name-tag plane per anchor; toggled visible on hover. */
  private readonly hoverNameTags = new Map<string, THREE.Mesh>();
  /** Scratch vector reused every frame so update() allocates nothing. */
  private readonly _tmpVec = new THREE.Vector3();

  constructor(
    private readonly anchorPrimitive: SpatialAnchorPrimitive,
    private readonly folioPanel: FolioPanel,
    private readonly options: InformationSystemOptions = {}
  ) {
    this.autoCloseDistanceMeters = options.autoCloseDistanceMeters ?? 2.5;
  }

  /**
   * Build a permanently-visible engraved brass placard on every registered
   * exhibit (Req 1.1) plus a hidden hover name-tag plane (Req 2.2). Call once
   * after all anchors are registered. No floating text renders at rest (Req
   * 1.2): the placard is a physical brass plate, not a floating glyph.
   */
  public buildPlacards(): void {
    const anchors = this.anchorPrimitive.getAllAnchors();
    for (const anchor of anchors) {
      const id = anchor.anchorId;
      if (this.placards.has(id)) continue; // idempotent

      const placard = this.createPlacard(id, anchor.anchorLabel);
      anchor.add(placard);
      this.placards.set(id, placard);
      this.placardMaterials.set(id, placard.material as THREE.MeshStandardMaterial);

      const nameTag = this.createHoverNameTag(anchor.anchorLabel);
      nameTag.position.set(0, 0.12, 0); // above the indicator badge
      nameTag.visible = false;
      anchor.add(nameTag);
      this.hoverNameTags.set(id, nameTag);
    }
  }

  /** Show the emissive outline + hover name tag for an exhibit (Req 2.1, 2.2). */
  public onHoverEnter(anchorId: string): void {
    if (this.hoveredAnchorId === anchorId) return;
    this.onHoverLeave();

    const material = this.placardMaterials.get(anchorId);
    if (material) {
      material.emissive.setHex(0xb08d57);
      material.emissiveIntensity = 0.45;
    }
    const nameTag = this.hoverNameTags.get(anchorId);
    if (nameTag) nameTag.visible = true;
    this.hoveredAnchorId = anchorId;
  }

  /** Remove the outline + name tag (Req 2.3). O(1), allocation-free. */
  public onHoverLeave(): void {
    if (this.hoveredAnchorId === null) return;
    const material = this.placardMaterials.get(this.hoveredAnchorId);
    if (material) {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
    const nameTag = this.hoverNameTags.get(this.hoveredAnchorId);
    if (nameTag) nameTag.visible = false;
    this.hoveredAnchorId = null;
  }

  /**
   * Open the folio for an exhibit. Enforces single-open (Req 5.2): any
   * previously open folio is collapsed first. The panel is positioned beside the
   * exhibit via `placeFolioBesideExhibit`, clamped inside `roomBounds` when set
   * (Req 9), then its orientation is recorded for the lock (Req 7). The caller
   * remains responsible for `folioPanel.setContent(...)`; this method owns
   * placement, visibility and open-state bookkeeping.
   */
  public onActivate(anchorId: string, cameraWorldPos: THREE.Vector3): void {
    this.onHoverLeave();

    // Single-open: collapse the previously open folio before opening the new one.
    if (this.openAnchorId !== null && this.openAnchorId !== anchorId) {
      this.closeFolio();
    }

    const anchor = this.anchorPrimitive.getAnchor(anchorId);
    if (!anchor) return;

    const anchorWorldPos = anchor.getWorldPosition(new THREE.Vector3());
    const placement = placeFolioBesideExhibit(anchorWorldPos, cameraWorldPos);
    if (this.options.roomBounds) {
      this.options.roomBounds.clampPoint(placement.position, placement.position);
    }

    this.folioPanel.position.copy(placement.position);
    this.folioPanel.lookAt(placement.lookAt);
    this.folioPanel.visible = true;
    this._lockedQuaternion = this.folioPanel.quaternion.clone();
    this.openAnchorId = anchorId;

    // Keep the anchor micro-sim and the folio in sync when the panel closes.
    this.folioPanel.onClose = () => this.closeFolio();
  }

  /**
   * Per-frame update. Enforces the orientation lock (Req 7.1, 7.2) — the panel
   * keeps its open-time orientation regardless of head movement, unless the
   * learner is actively grabbing it — and auto-closes an unpinned panel once
   * the head moves beyond the distance threshold (Req 6.1).
   */
  public update(headWorldPos: THREE.Vector3): void {
    if (!this.folioPanel.visible || this.openAnchorId === null) return;

    if (this._lockedQuaternion && !this.folioPanel.grab.isGrabbed) {
      this.folioPanel.quaternion.copy(this._lockedQuaternion);
    }

    if (this.folioPanel.pinned) return;

    const anchor = this.anchorPrimitive.getAnchor(this.openAnchorId);
    if (!anchor) return;
    const anchorWorldPos = anchor.getWorldPosition(this._tmpVec);
    if (headWorldPos.distanceTo(anchorWorldPos) > this.autoCloseDistanceMeters) {
      this.closeFolio();
    }
  }

  /** Close all open folios and collapse every expanded anchor (Req 10.1). */
  public dismissAll(): void {
    this.closeFolio();
    this.anchorPrimitive.dismissAll();
  }

  /** Pin / unpin the currently open panel so auto-close is bypassed (Req 4.5). */
  public togglePin(): void {
    this.folioPanel.pinned = !this.folioPanel.pinned;
  }

  /**
   * Track pinch timing; two pinches within 500 ms fire `dismissAll` (Req 10.1).
   * Filtering to the non-dominant hand is the caller's responsibility.
   */
  public onPinch(): void {
    const now = Date.now();
    if (now - this._lastPinchTimestamp <= 500) {
      this.dismissAll();
      this._lastPinchTimestamp = 0;
    } else {
      this._lastPinchTimestamp = now;
    }
  }

  /** Tear down placards, name tags and hover/open state. */
  public dispose(): void {
    this.onHoverLeave();
    this.closeFolio();

    for (const [id, placard] of this.placards) {
      const anchor = this.anchorPrimitive.getAnchor(id);
      if (anchor) anchor.remove(placard);
      placard.geometry.dispose();
      (placard.material as THREE.MeshStandardMaterial).dispose();
      const title = placard.children[0] as THREE.Mesh | undefined;
      if (title) {
        title.geometry.dispose();
        this.disposeBasicMaterial(title.material as THREE.MeshBasicMaterial);
      }

      const nameTag = this.hoverNameTags.get(id);
      if (anchor && nameTag) anchor.remove(nameTag);
      if (nameTag) {
        nameTag.geometry.dispose();
        this.disposeBasicMaterial(nameTag.material as THREE.MeshBasicMaterial);
      }
    }

    this.placards.clear();
    this.placardMaterials.clear();
    this.hoverNameTags.clear();
  }

  // --- internals -----------------------------------------------------------

  /**
   * Close the open folio and collapse its anchor. Single source of truth so the
   * close button, auto-close and dismiss-all stay consistent. Does not call
   * `folioPanel.close()` (which would re-enter via `onClose`).
   */
  private closeFolio(): void {
    if (this.openAnchorId !== null) {
      const anchor = this.anchorPrimitive.getAnchor(this.openAnchorId);
      if (anchor?.isExpanded) anchor.toggleExpansion();
    }
    this.folioPanel.visible = false;
    this.folioPanel.pinned = false;
    this.openAnchorId = null;
    this._lockedQuaternion = null;
  }

  /** Thin brass plate with an engraved title face, facing the learner. */
  private createPlacard(id: string, label: string): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(0.22, 0.06, 0.004);
    const material = new THREE.MeshStandardMaterial({
      color: 0xb08d57,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const placard = new THREE.Mesh(geometry, material);
    placard.name = `anchor-placard-${id}`;
    placard.position.set(0, 0.07, 0);
    placard.userData.isPlacard = true;
    placard.userData.billboard = true; // main.ts traverse orients it toward the camera
    placard.raycast = () => {}; // decorative label, not a ray target

    const titleTexture = this.buildTitleTexture(label);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      side: THREE.FrontSide,
    });
    if (!titleTexture) titleMaterial.color.set(0x241610);
    const titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), titleMaterial);
    titlePlane.position.set(0, 0, 0.0023); // just in front of the plate face
    titlePlane.raycast = () => {};
    placard.add(titlePlane);
    return placard;
  }

  /** Canvas-texture engraved title; null in non-DOM environments. */
  private buildTitleTexture(label: string): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#241610'; // engraved dark text on brass
    ctx.font = 'bold 46px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.slice(0, 28), canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /** Small styled name-tag panel shown only while hovering (Req 2.2). */
  private createHoverNameTag(label: string): THREE.Mesh {
    const tag = createTextPanel(label, {
      widthMeters: 0.26,
      heightMeters: 0.06,
      fontSizePx: 26,
      background: '#0f172a',
      color: '#f8fafc',
      accent: '#38bdf8',
      pixelWidth: 512,
      pixelHeight: 128,
      lines: 1,
      align: 'center',
    });
    tag.userData.billboard = true;
    tag.raycast = () => {};
    return tag;
  }

  private disposeBasicMaterial(material: THREE.MeshBasicMaterial): void {
    if (material.map) material.map.dispose();
    material.dispose();
  }
}
