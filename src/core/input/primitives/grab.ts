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
  public homePosition: THREE.Vector3;
  public homeQuaternion: THREE.Quaternion;
  private grabOffset = new THREE.Vector3();
  private grabQuaternionOffset = new THREE.Quaternion();

  constructor(
    public targetObject: THREE.Object3D,
    public options: GrabbableOptions = {}
  ) {
    targetObject.userData.isGrabbable = true;
    targetObject.userData.grabPrimitive = this;
    this.homePosition = targetObject.position.clone();
    this.homeQuaternion = targetObject.quaternion.clone();
  }

  public resetPose(): void {
    if (this.isGrabbed) this.release();
    this.targetObject.position.copy(this.homePosition);
    this.targetObject.quaternion.copy(this.homeQuaternion);
  }

  public saveHomePose(): void {
    this.homePosition.copy(this.targetObject.position);
    this.homeQuaternion.copy(this.targetObject.quaternion);
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

      // Compute relative offset in world coordinates
      this.grabOffset.copy(targetPos).sub(interactorPos);
      const targetQuat = this.targetObject.getWorldQuaternion(new THREE.Quaternion());
      this.grabQuaternionOffset.copy(interactorQuat).invert().multiply(targetQuat);

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

    const desiredWorldPos = interactorPos.clone().add(this.grabOffset);
    if (this.options.constrainY) {
      const currentWorldPos = this.targetObject.getWorldPosition(new THREE.Vector3());
      desiredWorldPos.y = currentWorldPos.y;
    }

    const desiredWorldQuat = interactorQuat.clone().multiply(this.grabQuaternionOffset);

    if (this.targetObject.parent) {
      this.targetObject.parent.updateWorldMatrix(true, false);
      const desiredLocalPos = this.targetObject.parent.worldToLocal(desiredWorldPos.clone());
      this.targetObject.position.lerp(desiredLocalPos, ActiveTuning.input.handSmoothingAlpha);

      const parentWorldQuat = this.targetObject.parent.getWorldQuaternion(new THREE.Quaternion());
      const desiredLocalQuat = parentWorldQuat.invert().multiply(desiredWorldQuat);
      this.targetObject.quaternion.slerp(desiredLocalQuat, ActiveTuning.input.handSmoothingAlpha);
    } else {
      this.targetObject.position.lerp(desiredWorldPos, ActiveTuning.input.handSmoothingAlpha);
      this.targetObject.quaternion.slerp(desiredWorldQuat, ActiveTuning.input.handSmoothingAlpha);
    }

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

