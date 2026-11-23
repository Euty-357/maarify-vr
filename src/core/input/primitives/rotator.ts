import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';
import { courseEventBus } from '../../course/event-bus.js';

export interface RotatorOptions {
  axis?: 'x' | 'y' | 'z';
  detentStepDeg?: number;
  continuous?: boolean;
  onRotate?: (angleDeg: number, totalRotations: number) => void;
  /** Stable id used by the course system to identify this control. */
  courseId?: string;
}

export class SpatialRotatorPrimitive {
  public angleDeg = 0;
  public totalRotations = 0;
  private lastDetentIndex = 0;
  private axis: 'x' | 'y' | 'z';
  private detentStepDeg: number;

  constructor(
    public dialObject: THREE.Object3D,
    public options: RotatorOptions = {}
  ) {
    this.axis = options.axis ?? 'y';
    this.detentStepDeg = options.detentStepDeg ?? ActiveTuning.input.rotatorDetentStepDeg;
    dialObject.userData.isRotator = true;
    dialObject.userData.rotatorPrimitive = this;
  }

  public setAngleDeg(deg: number, inputSource?: XRInputSource): void {
    this.angleDeg = deg;
    const rad = (this.angleDeg * Math.PI) / 180;
    this.dialObject.rotation[this.axis] = rad;

    const detentIndex = Math.floor(this.angleDeg / this.detentStepDeg);
    if (detentIndex !== this.lastDetentIndex) {
      this.lastDetentIndex = detentIndex;
      if (inputSource) {
        triggerHapticPulse(
          inputSource,
          ActiveTuning.haptics.detent.intensity,
          ActiveTuning.haptics.detent.durationMs
        );
      }
    }

    this.totalRotations = this.angleDeg / 360;
    this.options.onRotate?.(this.angleDeg, this.totalRotations);
    courseEventBus.emit('rotated', this.options.courseId ?? this.dialObject.name, this.angleDeg);
  }

  public addDeltaDeg(deltaDeg: number, inputSource?: XRInputSource): void {
    this.setAngleDeg(this.angleDeg + deltaDeg, inputSource);
  }
}

