import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';
import { courseEventBus } from '../../course/event-bus.js';

export interface LeverOptions {
  axis?: 'x' | 'y' | 'z';
  minAngleDeg?: number;
  maxAngleDeg?: number;
  onAngleChange?: (angleDeg: number, normalized: number) => void;
  onSnapExtreme?: (extreme: 'min' | 'max') => void;
  /** Stable id used by the course system to identify this control. */
  courseId?: string;
}

export class SpatialLeverPrimitive {
  public currentAngleDeg = 0;
  public normalizedValue = 0.5; // [0, 1]
  private minAngleDeg: number;
  private maxAngleDeg: number;
  private axis: 'x' | 'y' | 'z';
  private lastExtreme: 'min' | 'max' | null = null;

  constructor(
    public pivotObject: THREE.Object3D,
    public options: LeverOptions = {}
  ) {
    this.axis = options.axis ?? 'z';
    this.minAngleDeg = options.minAngleDeg ?? -45;
    this.maxAngleDeg = options.maxAngleDeg ?? 45;
    pivotObject.userData.isLever = true;
    pivotObject.userData.leverPrimitive = this;
    this.setAngle(0);
  }

  public setAngle(angleDeg: number): void {
    this.currentAngleDeg = Math.max(this.minAngleDeg, Math.min(this.maxAngleDeg, angleDeg));
    const range = this.maxAngleDeg - this.minAngleDeg;
    this.normalizedValue = range > 0 ? (this.currentAngleDeg - this.minAngleDeg) / range : 0.5;

    const rad = (this.currentAngleDeg * Math.PI) / 180;
    this.pivotObject.rotation[this.axis] = rad;
    this.options.onAngleChange?.(this.currentAngleDeg, this.normalizedValue);
    this.publishChange();
  }

  /** Publish the change to the course bus so missions can observe it. */
  private publishChange(): void {
    const id = this.options.courseId ?? this.pivotObject.name;
    courseEventBus.emit('leverChanged', id, this.normalizedValue);
  }

  public throwToExtreme(extreme: 'min' | 'max', inputSource?: XRInputSource): void {
    this.setAngle(extreme === 'min' ? this.minAngleDeg : this.maxAngleDeg);
    if (inputSource) {
      triggerHapticPulse(
        inputSource,
        ActiveTuning.haptics.snap.intensity,
        ActiveTuning.haptics.snap.durationMs
      );
    }
    this.options.onSnapExtreme?.(extreme);
  }

  public updateFromGrab(
    interactorPos: THREE.Vector3,
    inputSource?: XRInputSource
  ): void {
    const pivotPos = new THREE.Vector3();
    this.pivotObject.getWorldPosition(pivotPos);

    // Compute angle from pivot to interactor
    const delta = interactorPos.clone().sub(pivotPos);
    let targetAngleRad = 0;

    if (this.axis === 'z') {
      targetAngleRad = Math.atan2(delta.y, delta.x) - Math.PI / 2;
    } else if (this.axis === 'x') {
      targetAngleRad = Math.atan2(delta.y, delta.z) - Math.PI / 2;
    } else {
      targetAngleRad = Math.atan2(delta.x, delta.z);
    }

    const deg = (targetAngleRad * 180) / Math.PI;
    this.setAngle(deg);

    // Check extremes for tactile snap
    if (Math.abs(this.currentAngleDeg - this.minAngleDeg) < 3 && this.lastExtreme !== 'min') {
      this.lastExtreme = 'min';
      if (inputSource) {
        triggerHapticPulse(
          inputSource,
          ActiveTuning.haptics.snap.intensity,
          ActiveTuning.haptics.snap.durationMs
        );
      }
      this.options.onSnapExtreme?.('min');
    } else if (Math.abs(this.currentAngleDeg - this.maxAngleDeg) < 3 && this.lastExtreme !== 'max') {
      this.lastExtreme = 'max';
      if (inputSource) {
        triggerHapticPulse(
          inputSource,
          ActiveTuning.haptics.snap.intensity,
          ActiveTuning.haptics.snap.durationMs
        );
      }
      this.options.onSnapExtreme?.('max');
    } else if (Math.abs(this.currentAngleDeg - this.minAngleDeg) >= 3 && Math.abs(this.currentAngleDeg - this.maxAngleDeg) >= 3) {
      this.lastExtreme = null;
    }
  }
}

