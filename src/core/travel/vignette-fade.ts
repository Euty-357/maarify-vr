import * as THREE from 'three';

export class VignetteFade {
  private overlay: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;
  private animating: 'none' | 'fadeOut' | 'fadeIn' = 'none';
  private elapsed = 0;
  private duration = 0.4;
  private resolveFn: (() => void) | null = null;

  constructor(cameraRig: THREE.Group) {
    // Create a large plane that sits in front of the camera
    const geo = new THREE.PlaneGeometry(100, 100);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    this.overlay = new THREE.Mesh(geo, this.material);
    this.overlay.name = 'vignette-fade-overlay';
    this.overlay.renderOrder = 999;
    this.overlay.position.set(0, 0, -0.05); // slightly in front of camera
    this.overlay.visible = false;
    cameraRig.add(this.overlay);
  }

  // Start fade to black. Returns a promise that resolves when fully opaque.
  public async fadeOut(durationSeconds: number = 0.4): Promise<void> {
    return new Promise((resolve) => {
      this.duration = durationSeconds;
      this.animating = 'fadeOut';
      this.elapsed = 0;
      this.overlay.visible = true;
      this.resolveFn = resolve;
    });
  }

  // Start fade from black to transparent. Returns a promise that resolves when fully clear.
  public async fadeIn(durationSeconds: number = 0.4): Promise<void> {
    return new Promise((resolve) => {
      this.duration = durationSeconds;
      this.animating = 'fadeIn';
      this.elapsed = 0;
      this.overlay.visible = true;
      this.resolveFn = resolve;
    });
  }

  // Call every frame to drive the animation
  public update(dt: number): void {
    if (this.animating === 'none') return;
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / this.duration);

    if (this.animating === 'fadeOut') {
      this.material.opacity = t;
      if (t >= 1) {
        this.animating = 'none';
        this.resolveFn?.();
        this.resolveFn = null;
      }
    } else if (this.animating === 'fadeIn') {
      this.material.opacity = 1 - t;
      if (t >= 1) {
        this.material.opacity = 0;
        this.overlay.visible = false;
        this.animating = 'none';
        this.resolveFn?.();
        this.resolveFn = null;
      }
    }
  }

  public get isAnimating(): boolean {
    return this.animating !== 'none';
  }

  public dispose(): void {
    this.overlay.geometry.dispose();
    this.material.dispose();
    this.overlay.parent?.remove(this.overlay);
  }
}
