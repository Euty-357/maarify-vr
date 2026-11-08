import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';
import type { ComfortSystem } from '../../comfort/comfort.js';

export class SpatialSnapTurnPrimitive {
  private canTurn = true;

  constructor(
    private cameraRig: THREE.Object3D,
    private comfort?: ComfortSystem
  ) {}

  /**
   * Turns the camera rig by snapTurnAngleDeg left (-1) or right (+1).
   * Direction: -1 for left (clockwise view), +1 for right (counter-clockwise view).
   */
  public turn(direction: -1 | 1, inputSource?: XRInputSource): boolean {
    if (!this.canTurn) return false;
    this.canTurn = false;

    const angleDeg = ActiveTuning.comfort.snapTurnAngleDeg * direction;
    const rad = (-angleDeg * Math.PI) / 180;

    this.cameraRig.rotateY(rad);

    // Vignette pulse during angular displacement
    if (this.comfort) {
      this.comfort.setMotionIntensity(ActiveTuning.comfort.vignetteMaxDarkness * 0.7);
      setTimeout(() => {
        this.comfort?.setMotionIntensity(0.0);
      }, 80);
    }

    if (inputSource) {
      triggerHapticPulse(
        inputSource,
        ActiveTuning.haptics.detent.intensity,
        ActiveTuning.haptics.detent.durationMs
      );
    }

    // Cooldown to prevent runaway turning
    setTimeout(() => {
      this.canTurn = true;
    }, 200);

    return true;
  }

  public handleThumbstick(thumbstickX: number, inputSource?: XRInputSource): void {
    const deadzone = 0.6;
    if (thumbstickX > deadzone) {
      this.turn(1, inputSource);
    } else if (thumbstickX < -deadzone) {
      this.turn(-1, inputSource);
    }
  }
}

