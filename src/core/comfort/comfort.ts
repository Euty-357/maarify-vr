import * as THREE from 'three';

export interface ComfortSettings {
  vignetteEnabled: boolean;
  snapTurnAngleDeg: number;
  seatedModeOffsetMeters: number;
}

export class ComfortSystem {
  public settings: ComfortSettings = {
    vignetteEnabled: true,
    snapTurnAngleDeg: 30,
    seatedModeOffsetMeters: 0.0,
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
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          // Darken edges starting from radius 0.35 to 0.70
          float edge = smoothstep(0.35, 0.70, dist);
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
  }

  public getSnapAngleRad(): number {
    return (this.settings.snapTurnAngleDeg * Math.PI) / 180;
  }
}

