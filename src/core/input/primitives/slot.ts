import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

/**
 * Grab-and-slot primitive.
 *
 * A module owns the payload's grab primitive and calls `attempt()` from the grab
 * `onRelease` callback. The slot decides whether the drop is close enough, whether
 * the payload is acceptable, and whether to snap, reject or ignore it. This is the
 * shared mechanic behind base-pair snapping and the diversity causal chain.
 */

export type SlotAttempt = 'accepted' | 'rejected' | 'ignored';

export interface SpatialSlotOptions {
  /** How close (metres) a released payload must be for the slot to consider it. */
  claimRadius?: number;
  /** Accept/reject predicate. Returning false triggers the rejection path. */
  accept?: (payload: THREE.Object3D) => boolean;
  onAccept?: (payload: THREE.Object3D) => void;
  onReject?: (payload: THREE.Object3D) => void;
}

export class SpatialSlotPrimitive {
  public occupiedBy: THREE.Object3D | null = null;
  private readonly claimRadius: number;

  constructor(
    public slotObject: THREE.Object3D,
    public options: SpatialSlotOptions = {}
  ) {
    this.claimRadius = options.claimRadius ?? 0.34;
    slotObject.userData.slotPrimitive = this;
  }

  public getWorldPosition(): THREE.Vector3 {
    return this.slotObject.getWorldPosition(new THREE.Vector3());
  }

  public get isOccupied(): boolean {
    return this.occupiedBy !== null;
  }

  public attempt(payload: THREE.Object3D, inputSource?: XRInputSource): SlotAttempt {
    if (this.occupiedBy) return 'ignored';

    const payloadPosition = payload.getWorldPosition(new THREE.Vector3());
    const distance = payloadPosition.distanceTo(this.getWorldPosition());
    if (distance > this.claimRadius) return 'ignored';

    const accepted = this.options.accept ? this.options.accept(payload) : true;
    if (!accepted) {
      triggerHapticPulse(
        inputSource,
        ActiveTuning.haptics.error.intensity,
        ActiveTuning.haptics.error.durationMs
      );
      this.options.onReject?.(payload);
      return 'rejected';
    }

    this.occupiedBy = payload;
    payload.position.copy(this.getWorldPosition());
    payload.quaternion.copy(this.slotObject.getWorldQuaternion(new THREE.Quaternion()));
    triggerHapticPulse(
      inputSource,
      ActiveTuning.haptics.success.intensity,
      ActiveTuning.haptics.success.durationMs
    );
    this.options.onAccept?.(payload);
    return 'accepted';
  }

  public release(): void {
    this.occupiedBy = null;
  }
}
