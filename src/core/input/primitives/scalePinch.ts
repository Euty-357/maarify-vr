import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

export interface ScalePinchOptions {
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scaleFactor: number, deltaDistance: number) => void;
  onExplodeFraction?: (fraction: number) => void; // 0.0 to 1.0 exploded
}

export class SpatialScalePinchPrimitive {
  public currentScale = 1.0;
  public explodeFraction = 0.0;
  public isTwoHandedActive = false;
  private initialHandDistance = 0;
  private initialObjectScale = 1.0;
  private minScale: number;
  private maxScale: number;

  constructor(
    public targetObject: THREE.Object3D,
    public options: ScalePinchOptions = {}
  ) {
    this.minScale = options.minScale ?? ActiveTuning.input.scalePinchMin;
    this.maxScale = options.maxScale ?? ActiveTuning.input.scalePinchMax;
    targetObject.userData.isScalable = true;
    targetObject.userData.scalePinchPrimitive = this;
  }

  public startTwoHanded(hand1Pos: THREE.Vector3, hand2Pos: THREE.Vector3): void {
    this.isTwoHandedActive = true;
    this.initialHandDistance = hand1Pos.distanceTo(hand2Pos);
    this.initialObjectScale = this.currentScale;
  }

  public updateTwoHanded(
    hand1Pos: THREE.Vector3,
    hand2Pos: THREE.Vector3,
    source1?: XRInputSource,
    source2?: XRInputSource
  ): void {
    if (!this.isTwoHandedActive || this.initialHandDistance <= 0.001) return;

    const currentDist = hand1Pos.distanceTo(hand2Pos);
    const ratio = currentDist / this.initialHandDistance;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.initialObjectScale * ratio));

    if (Math.abs(newScale - this.currentScale) > 0.005) {
      this.currentScale = newScale;
      this.targetObject.scale.setScalar(this.currentScale);

      // Explode fraction is normalized between 1.0 (unexploded) and maxScale (fully exploded)
      this.explodeFraction = Math.max(0.0, Math.min(1.0, (this.currentScale - 1.0) / (this.maxScale - 1.0)));

      this.options.onScaleChange?.(this.currentScale, currentDist - this.initialHandDistance);
      this.options.onExplodeFraction?.(this.explodeFraction);

      // Subtle feedback on expansion
      if (source1) {
        triggerHapticPulse(
          source1,
          ActiveTuning.haptics.hover.intensity,
          ActiveTuning.haptics.hover.durationMs
        );
      }
      if (source2) {
        triggerHapticPulse(
          source2,
          ActiveTuning.haptics.hover.intensity,
          ActiveTuning.haptics.hover.durationMs
        );
      }
    }
  }

  public endTwoHanded(): void {
    this.isTwoHandedActive = false;
  }
}

