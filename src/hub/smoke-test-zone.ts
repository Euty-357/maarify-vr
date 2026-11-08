import * as THREE from 'three';
import { DiegeticSpatialAnchor } from '../core/spatial-anchors/diegetic-anchor';
import { SpatialAudioManager } from '../core/audio/spatial-audio';
import { triggerHapticPulse } from '../core/haptics/haptics';

export interface SmokeTestEvent {
  action: string;
  success: boolean;
  timestamp: number;
}

export class SmokeTestZone extends THREE.Group {
  public chimeSphere: THREE.Mesh;
  public grabBlock: THREE.Mesh;
  public testAnchor: DiegeticSpatialAnchor;
  private soundManager: SpatialAudioManager;
  public eventLog: SmokeTestEvent[] = [];

  constructor(soundManager: SpatialAudioManager) {
    super();
    this.name = 'hub-device-smoke-test-zone';
    this.soundManager = soundManager;

    // Tabletop plinth
    const plinthGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 24);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.2,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.4, -1.8);
    this.add(plinth);

    // 1. Chime Sphere (Direct Finger Poke Test)
    const sphereGeo = new THREE.SphereGeometry(0.08, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.chimeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.chimeSphere.position.set(-0.3, 0.9, -1.8);
    this.chimeSphere.name = 'smoke-test-chime-sphere';
    this.add(this.chimeSphere);

    // 2. Calibration Cube (Grip Grab & Magnetic Snap Test)
    const boxGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      metalness: 0.6,
    });
    this.grabBlock = new THREE.Mesh(boxGeo, boxMat);
    this.grabBlock.position.set(0.3, 0.86, -1.8);
    this.grabBlock.name = 'smoke-test-grab-cube';
    this.add(this.grabBlock);

    // 3. Diegetic Spatial Anchor with interactive micro-sim
    this.testAnchor = new DiegeticSpatialAnchor(
      'smoke-test-anchor',
      new THREE.Vector3(0, 0.95, -1.8),
      'Smoke Test Anchor',
      'Spatial anchor with physical leader line and micro-sim toggle.',
      {
        type: 'exploded-view',
        caption: 'Micro-simulation expanded in inspection space.',
      }
    );
    // Add micro-simulation child (gear / gyro ring)
    const gyroGeo = new THREE.TorusGeometry(0.08, 0.015, 16, 32);
    const gyroMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 });
    const gyroMesh = new THREE.Mesh(gyroGeo, gyroMat);
    gyroMesh.rotation.x = Math.PI / 2;
    this.testAnchor.setMicroSimContent(gyroMesh);
    this.add(this.testAnchor);
  }

  public pokeChime(inputSource?: XRInputSource): void {
    this.soundManager.playSpatialPing(this.chimeSphere, 1046.5, 150); // High C chime
    triggerHapticPulse(inputSource, 0.4, 20); // Tactile detent tick

    (this.chimeSphere.material as THREE.MeshStandardMaterial).color.setHex(0xf43f5e);
    setTimeout(() => {
      (this.chimeSphere.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
    }, 200);

    this.eventLog.push({ action: 'pokeChime', success: true, timestamp: performance.now() });
  }

  public grabCalibrationBlock(inputSource?: XRInputSource): void {
    triggerHapticPulse(inputSource, 0.8, 35); // Grip snap detent
    (this.grabBlock.material as THREE.MeshStandardMaterial).color.setHex(0x10b981);
    this.eventLog.push({ action: 'grabBlock', success: true, timestamp: performance.now() });
  }

  public releaseCalibrationBlock(): void {
    (this.grabBlock.material as THREE.MeshStandardMaterial).color.setHex(0xf59e0b);
  }
}

