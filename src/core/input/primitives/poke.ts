import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

export interface PokeOptions {
  depthLimitMeters?: number;
  onPress?: () => void;
  onRelease?: () => void;
}

export class SpatialPokePrimitive {
  public isPressed = false;
  private restPosition = new THREE.Vector3();
  private depthLimit = 0.025;

  constructor(
    public buttonMesh: THREE.Object3D,
    public options: PokeOptions = {}
  ) {
    this.restPosition.copy(buttonMesh.position);
    this.depthLimit = options.depthLimitMeters ?? 0.025;
    buttonMesh.userData.isPokeable = true;
    buttonMesh.userData.pokePrimitive = this;
  }

  public checkPoke(
    tipPosition: THREE.Vector3,
    inputSource?: XRInputSource
  ): boolean {
    const worldPos = new THREE.Vector3();
    this.buttonMesh.getWorldPosition(worldPos);

    const dist = tipPosition.distanceTo(worldPos);
    if (dist <= ActiveTuning.input.pokeThresholdMeters) {
      if (!this.isPressed) {
        this.isPressed = true;
        // Press displacement along local Y / Z
        this.buttonMesh.position.y = this.restPosition.y - this.depthLimit;

        if (inputSource) {
          triggerHapticPulse(
            inputSource,
            ActiveTuning.haptics.snap.intensity,
            ActiveTuning.haptics.snap.durationMs
          );
        }

        this.options.onPress?.();
        return true;
      }
    } else {
      if (this.isPressed) {
        this.isPressed = false;
        // Return to rest position
        this.buttonMesh.position.copy(this.restPosition);
        this.options.onRelease?.();
      }
    }

    return false;
  }
}

