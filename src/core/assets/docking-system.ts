/**
 * DockingSystem — grab-and-slot interactions for asset parts.
 *
 * Grabbable parts (role "peg" or any part with a dock anchor) snap into anchors
 * when released within snapRadiusMeters and accepted by acceptsPegId /
 * acceptsGateIds. Emits docked / rejected / undocked events. Supports re-grab
 * and reset.
 *
 * Reuses the existing SpatialGrabPrimitive and SpatialSlotPrimitive from
 * src/core/input/primitives/. No changes to those primitives are needed.
 */

import * as THREE from 'three';
import { SpatialGrabPrimitive } from '../input/primitives/grab.js';
import { SpatialSlotPrimitive } from '../input/primitives/slot.js';
import { ActiveTuning } from '../../config/tuning.js';
import { triggerHapticPulse } from '../../core/haptics/haptics.js';
import { courseEventBus } from '../course/event-bus.js';
import type { AssetAnchor } from './types.js';

/** Docking event types. */
export type DockingEvent =
  | { type: 'docked'; pegId: string; anchorName: string }
  | { type: 'rejected'; pegId: string; anchorName: string }
  | { type: 'undocked'; pegId: string; anchorName: string };

/** A registered dockable peg (grabbable part). */
interface DockPeg {
  partId: string;
  pegId: string | undefined;
  object: THREE.Object3D;
  grab: SpatialGrabPrimitive;
  dockedTo: string | null;
}

/** A registered dock anchor. */
interface DockAnchor {
  anchor: AssetAnchor;
  slot: SpatialSlotPrimitive;
  occupiedBy: string | null;
}

/** Options for DockingSystem. */
export interface DockingSystemOptions {
  onEvent?: (event: DockingEvent) => void;
  defaultClaimRadiusMeters?: number;
}

/**
 * DockingSystem manages grab-and-slot docking between pegs and anchors.
 *
 * Call registerPeg() for each grabbable part and registerAnchor() for each
 * asset anchor. On grab release, the system checks whether the released peg
 * is within snapRadiusMeters of an unoccupied anchor and whether the anchor
 * accepts the peg (by pegId or gate id). On accept, the peg snaps to the
 * anchor's docked pose and a 'docked' event fires. On reject, a 'rejected'
 * event fires and the peg stays where released.
 */
export class DockingSystem {
  private readonly pegs: Map<string, DockPeg> = new Map();
  private readonly anchors: Map<string, DockAnchor> = new Map();
  private readonly onEvent?: (event: DockingEvent) => void;
  private readonly defaultClaimRadiusMeters: number;

  constructor(options: DockingSystemOptions = {}) {
    this.onEvent = options.onEvent;
    this.defaultClaimRadiusMeters = options.defaultClaimRadiusMeters ?? ActiveTuning.input.grabThresholdMeters;
  }

  /** Register a grabbable part as a dockable peg. */
  public registerPeg(
    partId: string,
    object: THREE.Object3D,
    pegId: string | undefined,
    grab: SpatialGrabPrimitive,
  ): void {
    if (this.pegs.has(partId)) throw new Error(`Peg already registered: ${partId}`);

    const dockPeg: DockPeg = {
      partId,
      pegId,
      object,
      grab,
      dockedTo: null,
    };

    const originalOnRelease = grab.options.onRelease;
    grab.options.onRelease = (inputSource) => {
      originalOnRelease?.(inputSource);
      this.tryDockOnRelease(dockPeg, inputSource);
    };

    this.pegs.set(partId, dockPeg);
  }

  /** Register an asset anchor as a docking slot. */
  public registerAnchor(anchor: AssetAnchor): void {
    if (this.anchors.has(anchor.anchorName)) throw new Error(`Anchor already registered: ${anchor.anchorName}`);

    const slotObject = anchor.object;
    const claimRadius = anchor.snapRadiusMeters ?? this.defaultClaimRadiusMeters;

    const slot = new SpatialSlotPrimitive(slotObject, {
      claimRadius,
      accept: (payload) => this.acceptsPayload(payload, anchor),
      onAccept: (payload) => {
        const peg = this.findPegByObject(payload);
        if (!peg) return;
        const dockAnchor = this.anchors.get(anchor.anchorName);
        if (!dockAnchor) return;
        this.dock(peg, dockAnchor);
      },
      onReject: (payload) => {
        const peg = this.findPegByObject(payload);
        if (!peg) return;
        const dockAnchor = this.anchors.get(anchor.anchorName);
        if (!dockAnchor) return;
        this.reject(peg, dockAnchor);
      },
    });

    this.anchors.set(anchor.anchorName, { anchor, slot, occupiedBy: null });
  }

  /** Re-grab a docked peg (undocks it first). */
  public regrabPeg(partId: string): boolean {
    const peg = this.pegs.get(partId);
    if (!peg) return false;
    if (peg.dockedTo) {
      this.undock(peg);
    }
    peg.grab.tryGrab(
      peg.object.getWorldPosition(new THREE.Vector3()),
      new THREE.Quaternion(),
    );
    return true;
  }

  /** Undock a peg from its anchor. */
  public undock(peg: DockPeg): void {
    if (!peg.dockedTo) return;
    const anchor = this.anchors.get(peg.dockedTo);
    if (anchor) {
      anchor.slot.release();
      anchor.occupiedBy = null;
      this.onEvent?.({ type: 'undocked', pegId: peg.pegId ?? peg.partId, anchorName: peg.dockedTo });
    }
    peg.dockedTo = null;
  }

  /** Reset all docking state (undock everything). */
  public reset(): void {
    for (const peg of this.pegs.values()) {
      if (peg.dockedTo) {
        const anchor = this.anchors.get(peg.dockedTo);
        if (anchor) {
          anchor.slot.release();
          anchor.occupiedBy = null;
          this.onEvent?.({ type: 'undocked', pegId: peg.pegId ?? peg.partId, anchorName: peg.dockedTo });
        }
        peg.dockedTo = null;
      }
    }
  }

  /** Get all registered pegs. */
  public getPegs(): DockPeg[] {
    return Array.from(this.pegs.values());
  }

  /** Get all registered anchors. */
  public getAnchors(): DockAnchor[] {
    return Array.from(this.anchors.values());
  }

  /** Check whether a peg is currently docked. */
  public isDocked(partId: string): boolean {
    const peg = this.pegs.get(partId);
    return Boolean(peg?.dockedTo);
  }

  private tryDockOnRelease(peg: DockPeg, inputSource?: XRInputSource): void {
    if (peg.dockedTo) return;

    const pegWorldPos = peg.object.getWorldPosition(new THREE.Vector3());
    let best: { anchor: DockAnchor; distance: number } | null = null;

    for (const anchor of this.anchors.values()) {
      if (anchor.occupiedBy) continue;
      const anchorWorldPos = anchor.slot.getWorldPosition();
      const distance = pegWorldPos.distanceTo(anchorWorldPos);
      if (distance <= anchor.anchor.snapRadiusMeters) {
        if (!best || distance < best.distance) {
          best = { anchor, distance };
        }
      }
    }

    if (!best) return;

    const result = best.anchor.slot.attempt(peg.object, inputSource);
    if (result === 'accepted') {
      this.dock(peg, best.anchor);
    } else if (result === 'rejected') {
      this.reject(peg, best.anchor);
    }
  }

  private acceptsPayload(payload: THREE.Object3D, anchor: AssetAnchor): boolean {
    const peg = this.findPegByObject(payload);
    if (!peg) return false;

    if (anchor.acceptsPegId && peg.pegId && anchor.acceptsPegId === peg.pegId) {
      return true;
    }

    const gateId = (peg.object.userData as { gateId?: string })?.gateId;
    if (gateId && anchor.acceptsGateIds.includes(gateId)) {
      return true;
    }

    if (!anchor.acceptsPegId && anchor.acceptsGateIds.length === 0) {
      return true;
    }

    return false;
  }

  private dock(peg: DockPeg, anchor: DockAnchor): void {
    if (anchor.anchor.dockedPose) {
      peg.object.position.copy(anchor.anchor.dockedPose.position);
      peg.object.quaternion.copy(anchor.anchor.dockedPose.quaternion);
    } else {
      peg.object.position.copy(anchor.slot.getWorldPosition());
      peg.object.quaternion.copy(anchor.anchor.object.getWorldQuaternion(new THREE.Quaternion()));
    }

    peg.dockedTo = anchor.anchor.anchorName;
    anchor.occupiedBy = peg.partId;

    this.onEvent?.({
      type: 'docked',
      pegId: peg.pegId ?? peg.partId,
      anchorName: anchor.anchor.anchorName,
    });
    courseEventBus.emit('docked', peg.pegId ?? peg.partId, undefined, {
      anchorName: anchor.anchor.anchorName,
    });
    courseEventBus.emit('placed', peg.pegId ?? peg.partId, undefined, {
      anchorName: anchor.anchor.anchorName,
    });

    triggerHapticPulse(
      undefined as unknown as XRInputSource,
      ActiveTuning.haptics.success.intensity,
      ActiveTuning.haptics.success.durationMs,
    );
  }

  private reject(peg: DockPeg, anchor: DockAnchor): void {
    this.onEvent?.({
      type: 'rejected',
      pegId: peg.pegId ?? peg.partId,
      anchorName: anchor.anchor.anchorName,
    });
    courseEventBus.emit('rejected', peg.pegId ?? peg.partId, undefined, {
      anchorName: anchor.anchor.anchorName,
    });

    triggerHapticPulse(
      undefined as unknown as XRInputSource,
      ActiveTuning.haptics.error.intensity,
      ActiveTuning.haptics.error.durationMs,
    );
  }

  private findPegByObject(object: THREE.Object3D): DockPeg | undefined {
    for (const peg of this.pegs.values()) {
      if (peg.object === object) return peg;
    }
    return undefined;
  }
}