import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';

export interface ComfortSettings {
  vignetteEnabled: boolean;
}

/**
 * Dynamic radial comfort vignette.
 *
 * All radii and darkening come from `ActiveTuning.comfort`; nothing here hardcodes a
 * feel value, so edits in the runtime tuning panel take effect immediately.
 */
export class ComfortSystem {
  public settings: ComfortSettings = {
    vignetteEnabled: true,
  };

  private vignetteMesh: THREE.Mesh;
  private vignetteOpacity = 0.0;

  constructor(camera: THREE.Camera) {
    // 1. Radial dark vignette mesh attached to camera front plane
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uIntensity: { value: 0.0 },
        uMinEdge: { value: ActiveTuning.comfort.vignetteMinEdge },
        uMaxEdge: { value: ActiveTuning.comfort.vignetteMaxEdge },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uIntensity;
        uniform float uMinEdge;
        uniform float uMaxEdge;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          // Darken edges between the tuned inner and outer radii.
          float edge = smoothstep(uMinEdge, uMaxEdge, dist);
          gl_FragColor = vec4(0.0, 0.0, 0.0, edge * uIntensity);
        }
      `,
    });

    this.vignetteMesh = new THREE.Mesh(geo, mat);
    this.vignetteMesh.frustumCulled = false;
    this.vignetteMesh.renderOrder = 9999;
    camera.add(this.vignetteMesh);
  }

  public setMotionIntensity(intensity: number): void {
    if (!this.settings.vignetteEnabled) {
      this.vignetteOpacity = 0.0;
    } else {
      this.vignetteOpacity = Math.max(0.0, Math.min(1.0, intensity));
    }
    const mat = this.vignetteMesh.material as THREE.ShaderMaterial;
    mat.uniforms.uIntensity.value = this.vignetteOpacity;
    // Re-read the edges so live tuning changes are respected.
    mat.uniforms.uMinEdge.value = ActiveTuning.comfort.vignetteMinEdge;
    mat.uniforms.uMaxEdge.value = ActiveTuning.comfort.vignetteMaxEdge;
  }

  public getSnapAngleRad(): number {
    return (ActiveTuning.comfort.snapTurnAngleDeg * Math.PI) / 180;
  }
}
