import * as THREE from 'three';

export interface SpatialAnchorState {
  id: string;
  position: THREE.Vector3;
  label: string;
  level1Note: string;
  isExpanded: boolean;
  activeTier: 'foundation' | 'advanced' | 'expert';
  simulationType: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
  simulationCaption: string;
}

export class DiegeticSpatialAnchor extends THREE.Group {
  public anchorId: string;
  public anchorLabel: string;
  public isExpanded = false;
  public activeTier: 'foundation' | 'advanced' | 'expert' = 'foundation';
  private lineMesh: THREE.Line;
  private tagMesh: THREE.Mesh;
  private microSimRoot: THREE.Group;
  private tagCanvas: HTMLCanvasElement;
  private tagTexture: THREE.CanvasTexture | THREE.Texture;

  constructor(
    id: string,
    targetPosition: THREE.Vector3,
    label: string,
    private level1Note: string,
    private simulationData: {
      type: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
      caption: string;
    }
  ) {
    super();
    this.anchorId = id;
    this.anchorLabel = label;
    this.name = `diegetic-anchor-${id}`;

    // 1. Leader Line from target object to spatial label tag
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.2, 0.24, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.85,
    });
    this.lineMesh = new THREE.Line(lineGeo, lineMat);
    this.add(this.lineMesh);

    // 2. Spatial Anchor Tag with HTML Canvas Texture (offline, zero network calls)
    const isBrowser = typeof document !== 'undefined';
    if (isBrowser) {
      this.tagCanvas = document.createElement('canvas');
      this.tagCanvas.width = 512;
      this.tagCanvas.height = 128;
      this.tagTexture = new THREE.CanvasTexture(this.tagCanvas);
      this.tagTexture.minFilter = THREE.LinearFilter;
      this.renderTagCanvas(false);
    } else {
      this.tagCanvas = null as any;
      this.tagTexture = new THREE.Texture();
    }

    const tagGeo = new THREE.BoxGeometry(0.46, 0.13, 0.02);
    // Multi-material box: face 4 (+Z front) has the canvas texture
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7,
    });
    const frontMat = new THREE.MeshBasicMaterial({
      map: this.tagTexture,
      transparent: false,
    });
    const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

    this.tagMesh = new THREE.Mesh(tagGeo, materials);
    this.tagMesh.position.set(0.2, 0.24, 0);
    this.tagMesh.name = `anchor-tag-${id}`;
    this.add(this.tagMesh);

    // 3. Interactive Micro-Simulation Root (State 2)
    this.microSimRoot = new THREE.Group();
    this.microSimRoot.position.set(0.2, 0.42, 0);
    this.microSimRoot.visible = false;
    this.microSimRoot.name = `micro-sim-root-${id}`;
    this.add(this.microSimRoot);

    this.position.copy(targetPosition);
  }

  private renderTagCanvas(highlighted: boolean): void {
    if (!this.tagCanvas) return;
    const ctx = this.tagCanvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = highlighted ? '#1d4ed8' : '#0f172a';
    ctx.fillRect(0, 0, 512, 128);

    // Cyan accent left pill bar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 14, 128);

    // Text rendering: label & Level 1 subtext
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(this.anchorLabel.slice(0, 28), 26, 52);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '22px sans-serif';
    ctx.fillText(this.level1Note.slice(0, 62), 26, 94);

    this.tagTexture.needsUpdate = true;
  }

  /**
   * Toggles between State 1 (Spatial Tag) and State 2 (Exploded Micro-Sim)
   */
  public toggleExpansion(): boolean {
    this.isExpanded = !this.isExpanded;
    this.microSimRoot.visible = this.isExpanded;
    this.renderTagCanvas(this.isExpanded);
    return this.isExpanded;
  }

  /** Alias for toggleExpansion */
  public toggleExpanded(): boolean {
    return this.toggleExpansion();
  }

  public setTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    this.activeTier = tier;
  }

  public setMicroSimContent(mesh: THREE.Object3D): void {
    while (this.microSimRoot.children.length > 0) {
      this.microSimRoot.remove(this.microSimRoot.children[0]);
    }
    this.microSimRoot.add(mesh);
  }

  public getState(): SpatialAnchorState {
    return {
      id: this.anchorId,
      position: this.position.clone(),
      label: this.name,
      level1Note: this.level1Note,
      isExpanded: this.isExpanded,
      activeTier: this.activeTier,
      simulationType: this.simulationData.type,
      simulationCaption: this.simulationData.caption,
    };
  }
}
