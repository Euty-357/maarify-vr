import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';

export class SpatialAudioManager {
  private listener: THREE.AudioListener;
  private audioContextInitialized = false;

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
  }

  public initContext(): void {
    if (!this.audioContextInitialized && this.listener.context.state === 'suspended') {
      this.listener.context.resume().then(() => {
        this.audioContextInitialized = true;
      });
    }
  }

  /**
   * Synthesizes an instantaneous spatial frequency ping (chime/detent click)
   * using Web Audio API oscillator with HRTF spatialization.
   */
  public playSpatialPing(
    emitterMesh: THREE.Object3D,
    freq = ActiveTuning.audio.spatialPingFreqHz,
    durationMs = ActiveTuning.audio.spatialPingDurationMs
  ): void {
    this.initContext();
    const ctx = this.listener.context;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createPanner();

    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = ActiveTuning.audio.refDistance;
    panner.maxDistance = ActiveTuning.audio.maxDistance;
    panner.rolloffFactor = ActiveTuning.audio.rolloffFactor;

    // Sync panner position to 3D object world coordinates
    const worldPos = new THREE.Vector3();
    emitterMesh.getWorldPosition(worldPos);
    panner.positionX.setValueAtTime(worldPos.x, ctx.currentTime);
    panner.positionY.setValueAtTime(worldPos.y, ctx.currentTime);
    panner.positionZ.setValueAtTime(worldPos.z, ctx.currentTime);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Natural decay envelope
    gain.gain.setValueAtTime(ActiveTuning.audio.masterGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.listener.getInput());

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }
}

