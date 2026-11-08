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
  private lineMesh: THREE.Line;
  private tagMesh: THREE.Mesh;
  private microSimRoot: THREE.Group;

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
      new THREE.Vector3(0.15, 0.2, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8,
    });
    this.lineMesh = new THREE.Line(lineGeo, lineMat);
    this.add(this.lineMesh);

    // 2. Spatial Anchor Tag (3D pill badge)
    const tagGeo = new THREE.BoxGeometry(0.28, 0.08, 0.02);
    const tagMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.tagMesh = new THREE.Mesh(tagGeo, tagMat);
    this.tagMesh.position.set(0.15, 0.2, 0);
    this.tagMesh.name = `anchor-tag-${id}`;
    this.add(this.tagMesh);

    // 3. Interactive Micro-Simulation Root (State 2)
    this.microSimRoot = new THREE.Group();
    this.microSimRoot.position.set(0.15, 0.35, 0);
    this.microSimRoot.visible = false;
    this.microSimRoot.name = `micro-sim-root-${id}`;
    this.add(this.microSimRoot);

    this.position.copy(targetPosition);
  }

  /**
   * Toggles between State 1 (Spatial Tag) and State 2 (Exploded Micro-Sim)
   */
  public toggleExpansion(): boolean {
    this.isExpanded = !this.isExpanded;
    this.microSimRoot.visible = this.isExpanded;
    (this.tagMesh.material as THREE.MeshStandardMaterial).color.setHex(
      this.isExpanded ? 0x2563eb : 0x1e293b
    );
    return this.isExpanded;
  }

  public setMicroSimContent(mesh: THREE.Object3D): void {
    while (this.microSimRoot.children.length > 0) {
      this.microSimRoot.remove(this.microSimRoot.children[0]);
    }
    this.microSimRoot.add(mesh);
  }

  public getState(activeTier: 'foundation' | 'advanced' | 'expert' = 'foundation'): SpatialAnchorState {
    return {
      id: this.anchorId,
      position: this.position.clone(),
      label: this.name,
      level1Note: this.level1Note,
      isExpanded: this.isExpanded,
      activeTier,
      simulationType: this.simulationData.type,
      simulationCaption: this.simulationData.caption,
    };
  }
}
