import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

export interface SliderOptions {
  axis?: 'x' | 'y' | 'z';
  minDistance?: number;
  maxDistance?: number;
  snapSteps?: number;
  onValueChange?: (normalizedValue: number) => void;
}

export class SpatialSliderPrimitive {
  public value = 0.5; // Normalized [0, 1]
  public isDragging = false;
  private minPos: number;
  private maxPos: number;
  private axis: 'x' | 'y' | 'z';
  private lastSnapIndex = -1;

  constructor(
    public handleMesh: THREE.Object3D,
    public options: SliderOptions = {}
  ) {
    this.axis = options.axis ?? 'x';
    this.minPos = options.minDistance ?? -0.2;
    this.maxPos = options.maxDistance ?? 0.2;
    handleMesh.userData.isSliderHandle = true;
    handleMesh.userData.sliderPrimitive = this;
    this.updatePositionFromValue();
  }

  public setNormalizedValue(val: number): void {
    this.value = Math.max(0.0, Math.min(1.0, val));
    this.updatePositionFromValue();
    this.options.onValueChange?.(this.value);
  }

  private updatePositionFromValue(): void {
    const pos = this.minPos + this.value * (this.maxPos - this.minPos);
    this.handleMesh.position[this.axis] = pos;
  }

  public updateDrag(
    interactorPos: THREE.Vector3,
    inputSource?: XRInputSource
  ): void {
    // Project interactor onto slider local axis
    const localPos = this.handleMesh.parent
      ? this.handleMesh.parent.worldToLocal(interactorPos.clone())
      : interactorPos;

    const clamped = Math.max(this.minPos, Math.min(this.maxPos, localPos[this.axis]));
    const rawNormalized = (clamped - this.minPos) / (this.maxPos - this.minPos);

    const steps = this.options.snapSteps ?? ActiveTuning.input.sliderSnapSteps;
    const snapIndex = Math.round(rawNormalized * steps);
    this.value = snapIndex / steps;
    this.updatePositionFromValue();

    if (snapIndex !== this.lastSnapIndex) {
      this.lastSnapIndex = snapIndex;
      if (inputSource) {
        triggerHapticPulse(
          inputSource,
          ActiveTuning.haptics.detent.intensity,
          ActiveTuning.haptics.detent.durationMs
        );
      }
      this.options.onValueChange?.(this.value);
    }
  }
}

