import * as THREE from 'three';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';
import type { ComfortSystem } from '../../comfort/comfort.js';

export interface TeleportTarget {
  position: THREE.Vector3;
  isValid: boolean;
}

export class SpatialTeleportPrimitive {
  public isAiming = false;
  private arcPoints: THREE.Vector3[] = [];
  private arcLine: THREE.Line;
  private landingMarker: THREE.Mesh;
  public target: TeleportTarget = { position: new THREE.Vector3(), isValid: false };

  constructor(
    private scene: THREE.Scene,
    private cameraRig: THREE.Object3D,
    private comfort?: ComfortSystem
  ) {
    // Parabolic arc visualization
    const maxPoints = 30;
    const initialPoints = new Array(maxPoints).fill(new THREE.Vector3());
    const arcGeo = new THREE.BufferGeometry().setFromPoints(initialPoints);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });
    this.arcLine = new THREE.Line(arcGeo, arcMat);
    this.arcLine.visible = false;
    this.scene.add(this.arcLine);

    // Landing circle indicator
    const ringGeo = new THREE.RingGeometry(0.25, 0.35, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.landingMarker = new THREE.Mesh(ringGeo, ringMat);
    this.landingMarker.visible = false;
    this.scene.add(this.landingMarker);
  }

  public startAim(): void {
    this.isAiming = true;
    this.arcLine.visible = true;
    this.landingMarker.visible = true;
  }

  public updateAim(
    originPos: THREE.Vector3,
    direction: THREE.Vector3,
    groundY = 0
  ): void {
    if (!this.isAiming) return;

    this.arcPoints = [];
    const pos = originPos.clone();
    const vel = direction.clone().normalize().multiplyScalar(ActiveTuning.comfort.teleportLaunchVelocity);
    const gravity = new THREE.Vector3(0, -ActiveTuning.comfort.teleportArcGravity, 0);
    const dt = 0.04;

    this.target.isValid = false;

    for (let i = 0; i < 30; i++) {
      this.arcPoints.push(pos.clone());

      pos.addScaledVector(vel, dt);
      vel.addScaledVector(gravity, dt);

      // Hit test against ground plane
      if (pos.y <= groundY) {
        pos.y = groundY;
        this.arcPoints.push(pos.clone());
        this.target.position.copy(pos);
        // Range is a walking distance, so measure it on the floor plane. A 3D distance
        // includes the drop from controller height and rejects ordinary throws.
        const horizontalDistance = Math.hypot(pos.x - originPos.x, pos.z - originPos.z);
        const horizontalRadius = Math.hypot(pos.x, pos.z);
        this.target.isValid =
          horizontalDistance <= ActiveTuning.comfort.teleportMaxDistanceMeters &&
          horizontalRadius <= ActiveTuning.comfort.teleportMaxRadiusMeters;
        break;
      }
    }

    this.arcLine.geometry.setFromPoints(this.arcPoints);
    (this.arcLine.material as THREE.LineBasicMaterial).color.setHex(
      this.target.isValid ? 0x38bdf8 : 0xef4444
    );

    if (this.target.isValid) {
      this.landingMarker.position.copy(this.target.position);
      this.landingMarker.position.y += 0.01;
      this.landingMarker.visible = true;
      (this.landingMarker.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
    } else {
      this.landingMarker.visible = false;
    }
  }

  public commitTeleport(inputSource?: XRInputSource): boolean {
    if (!this.isAiming || !this.target.isValid) {
      this.cancelAim();
      return false;
    }

    // Apply instantaneous camera rig translation
    this.cameraRig.position.x = this.target.position.x;
    this.cameraRig.position.z = this.target.position.z;

    // Flash comfort vignette
    if (this.comfort) {
      this.comfort.setMotionIntensity(ActiveTuning.comfort.vignetteMaxDarkness);
      setTimeout(() => {
        this.comfort?.setMotionIntensity(0.0);
      }, 100);
    }

    if (inputSource) {
      triggerHapticPulse(
        inputSource,
        ActiveTuning.haptics.snap.intensity,
        ActiveTuning.haptics.snap.durationMs
      );
    }

    this.cancelAim();
    return true;
  }

  public cancelAim(): void {
    this.isAiming = false;
    this.arcLine.visible = false;
    this.landingMarker.visible = false;
  }

  public dispose(): void {
    this.scene.remove(this.arcLine);
    this.scene.remove(this.landingMarker);
  }
}

