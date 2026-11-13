import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

export interface GrabbableOptions {
  onGrab?: (hand: 'left' | 'right' | 'pointer') => void;
  onRelease?: (inputSource?: XRInputSource) => void;
  onMove?: (newPosition: THREE.Vector3, newQuaternion: THREE.Quaternion) => void;
  constrainY?: boolean;
}

export class SpatialGrabPrimitive {
  public isGrabbed = false;
  public grabbingSource: XRInputSource | 'desktop' | null = null;
  private grabOffset = new THREE.Vector3();
  private grabQuaternionOffset = new THREE.Quaternion();

  constructor(
    public targetObject: THREE.Object3D,
    public options: GrabbableOptions = {}
  ) {
    targetObject.userData.isGrabbable = true;
    targetObject.userData.grabPrimitive = this;
  }

  public tryGrab(
    interactorPos: THREE.Vector3,
    interactorQuat: THREE.Quaternion,
    inputSource?: XRInputSource
  ): boolean {
    if (this.isGrabbed) return false;

    const targetPos = new THREE.Vector3();
    this.targetObject.getWorldPosition(targetPos);
    const dist = interactorPos.distanceTo(targetPos);

    const threshold = inputSource?.hand
      ? ActiveTuning.input.handGrabThresholdMeters
      : ActiveTuning.input.grabThresholdMeters;
    if (dist <= threshold) {
      this.isGrabbed = true;
      this.grabbingSource = inputSource || 'desktop';

      // Compute relative offset
      this.grabOffset.copy(targetPos).sub(interactorPos);
      this.grabQuaternionOffset.copy(interactorQuat).invert().multiply(this.targetObject.quaternion);

      if (inputSource) {
        triggerHapticPulse(
          inputSource,
          ActiveTuning.haptics.grab.intensity,
          ActiveTuning.haptics.grab.durationMs
        );
      }

      const hand = inputSource?.handedness === 'left' ? 'left' : inputSource?.handedness === 'right' ? 'right' : 'pointer';
      this.options.onGrab?.(hand);
      return true;
    }

    return false;
  }

  public update(interactorPos: THREE.Vector3, interactorQuat: THREE.Quaternion): void {
    if (!this.isGrabbed) return;

    const newPos = interactorPos.clone().add(this.grabOffset);
    if (this.options.constrainY) {
      newPos.y = this.targetObject.position.y;
    }

    // Apply smoothed motion
    this.targetObject.position.lerp(newPos, ActiveTuning.input.handSmoothingAlpha);
    const newQuat = interactorQuat.clone().multiply(this.grabQuaternionOffset);
    this.targetObject.quaternion.slerp(newQuat, ActiveTuning.input.handSmoothingAlpha);

    const worldPos = this.targetObject.getWorldPosition(new THREE.Vector3());
    const worldQuat = this.targetObject.getWorldQuaternion(new THREE.Quaternion());
    this.options.onMove?.(worldPos, worldQuat);
  }

  public release(inputSource?: XRInputSource): void {
    if (!this.isGrabbed) return;
    this.isGrabbed = false;
    this.grabbingSource = null;

    if (inputSource) {
      triggerHapticPulse(
        inputSource,
        ActiveTuning.haptics.release.intensity,
        ActiveTuning.haptics.release.durationMs
      );
    }

    this.options.onRelease?.(inputSource);
  }
}

