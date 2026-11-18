import * as THREE from 'three';

/** Two particle streams (aorta red, pulmonary blue) animated along spline paths. */
export class BloodFlowSystem {
  private readonly aortaPoints: THREE.Points;
  private readonly pulmonaryPoints: THREE.Points;
  private readonly aortaPositions: Float32Array;
  private readonly pulmonaryPositions: Float32Array;
  private readonly aortaSpline: THREE.CatmullRomCurve3;
  private readonly pulmonarySpline: THREE.CatmullRomCurve3;
  private readonly aortaTs: Float32Array;
  private readonly pulmonaryTs: Float32Array;
  private heartRateNorm = 0.5;

  readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'blood-flow-system';

    // Aorta path: left ventricle → aortic arch → descending aorta
    this.aortaSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0, 0),
      new THREE.Vector3(0.05, 0.25, 0),
      new THREE.Vector3(0.1, 0.35, 0),
      new THREE.Vector3(0.0, 0.4, 0),
      new THREE.Vector3(-0.1, 0.35, 0),
      new THREE.Vector3(-0.05, 0.1, 0),
      new THREE.Vector3(-0.05, -0.3, 0),
    ], false);

    // Pulmonary trunk path: right ventricle → pulmonary artery → lungs
    this.pulmonarySpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 0, 0),
      new THREE.Vector3(-0.1, 0.2, 0),
      new THREE.Vector3(-0.2, 0.3, 0.1),
      new THREE.Vector3(-0.15, 0.1, 0.2),
      new THREE.Vector3(0.0, 0.0, 0.2),
      new THREE.Vector3(0.15, 0.1, 0.1),
      new THREE.Vector3(0.1, 0.3, 0.05),
    ], false);

    const COUNT = 48;
    this.aortaPositions = new Float32Array(COUNT * 3);
    this.pulmonaryPositions = new Float32Array(COUNT * 3);
    this.aortaTs = new Float32Array(COUNT);
    this.pulmonaryTs = new Float32Array(COUNT);

    // Distribute particles evenly along their paths
    for (let i = 0; i < COUNT; i++) {
      this.aortaTs[i] = i / COUNT;
      this.pulmonaryTs[i] = i / COUNT;
    }

    const aortaGeo = new THREE.BufferGeometry();
    aortaGeo.setAttribute('position', new THREE.BufferAttribute(this.aortaPositions, 3));
    this.aortaPoints = new THREE.Points(aortaGeo, new THREE.PointsMaterial({ color: 0xef4444, size: 0.015, sizeAttenuation: true }));
    this.aortaPoints.name = 'aorta-particles';

    const pulmonaryGeo = new THREE.BufferGeometry();
    pulmonaryGeo.setAttribute('position', new THREE.BufferAttribute(this.pulmonaryPositions, 3));
    this.pulmonaryPoints = new THREE.Points(pulmonaryGeo, new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.015, sizeAttenuation: true }));
    this.pulmonaryPoints.name = 'pulmonary-particles';

    this.group.add(this.aortaPoints);
    this.group.add(this.pulmonaryPoints);

    // Initial position update
    this._syncBuffers();
  }

  setHeartRate(normalised: number): void {
    this.heartRateNorm = Math.max(0, Math.min(1, normalised));
  }

  update(dt: number): void {
    const speed = 0.08 + this.heartRateNorm * 0.22; // 0.08–0.30 turns/sec
    const COUNT = 48;
    for (let i = 0; i < COUNT; i++) {
      this.aortaTs[i] = (this.aortaTs[i] + speed * dt) % 1;
      this.pulmonaryTs[i] = (this.pulmonaryTs[i] + speed * dt) % 1;
    }
    this._syncBuffers();
  }

  private _syncBuffers(): void {
    const COUNT = 48;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      this.aortaSpline.getPoint(this.aortaTs[i], tmp);
      this.aortaPositions[i * 3] = tmp.x;
      this.aortaPositions[i * 3 + 1] = tmp.y;
      this.aortaPositions[i * 3 + 2] = tmp.z;

      this.pulmonarySpline.getPoint(this.pulmonaryTs[i], tmp);
      this.pulmonaryPositions[i * 3] = tmp.x;
      this.pulmonaryPositions[i * 3 + 1] = tmp.y;
      this.pulmonaryPositions[i * 3 + 2] = tmp.z;
    }
    (this.aortaPoints.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    (this.pulmonaryPoints.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.aortaPoints.geometry.dispose();
    this.pulmonaryPoints.geometry.dispose();
  }
}
