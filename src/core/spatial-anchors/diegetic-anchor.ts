import * as THREE from 'three';
import { ActiveTuning } from '../../config/tuning.js';

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
  private tagMesh: THREE.Mesh;
  private microSimRoot: THREE.Group;
  private tagCanvas: HTMLCanvasElement;
  private tagTexture: THREE.CanvasTexture | THREE.Texture;
  /** True once dispose() has run, so a double dispose is harmless. */
  private disposed = false;

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

    // Information System V3: the floating "i" badge and the leader line were
    // replaced by engraved brass placards. Both were permanently hidden but
    // still allocated a geometry, a material and a canvas texture per anchor,
    // and the hidden leader line was the source of the "leftover rays from the
    // i pointers" bug. They are deleted rather than kept hidden.

    // 1. Spatial Anchor Tag with HTML Canvas Texture (offline, zero network calls)
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

    // A plane keeps the readable canvas and physical raycast target.
    // FrontSide ensures text is never read mirrored/reversed from behind.
    const tagGeo = new THREE.PlaneGeometry(
      ActiveTuning.anchors.tagWidth,
      ActiveTuning.anchors.tagHeight
    );
    const tagMat = new THREE.MeshBasicMaterial({
      map: this.tagTexture,
      transparent: false,
      side: THREE.FrontSide,
    });
    this.tagMesh = new THREE.Mesh(tagGeo, tagMat);
    this.tagMesh.position.set(0.2, 0.24, 0);
    this.tagMesh.name = `anchor-tag-${id}`;
    this.tagMesh.userData.isAnchorTag = true;
    this.tagMesh.userData.billboard = true;
    this.tagMesh.visible = false;
    this.add(this.tagMesh);

    // 3. Interactive Micro-Simulation Root (State 2)
    this.microSimRoot = new THREE.Group();
    this.microSimRoot.position.set(0.2, 0.42, 0);
    this.microSimRoot.visible = false;
    this.microSimRoot.name = `micro-sim-root-${id}`;
    this.add(this.microSimRoot);

    this.position.copy(targetPosition);
  }

  /** Apply a depth tier: swaps the caption and scales the micro-simulation. */
  public applyTier(
    tier: 'foundation' | 'advanced' | 'expert',
    simulation: {
      type: 'exploded-view' | 'scrubbable-mechanism' | 'cross-section-flux';
      caption: string;
    }
  ): void {
    this.activeTier = tier;
    this.simulationData = simulation;
    const scale = tier === 'foundation' ? 0.85 : tier === 'advanced' ? 1 : 1.2;
    this.microSimRoot.scale.setScalar(scale);
    this.renderTagCanvas(this.isExpanded);
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

    // Text rendering: label, Level 1 subtext and the active tier caption
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(this.anchorLabel.slice(0, 26), 26, 48);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    ctx.fillText(this.level1Note.slice(0, 48), 26, 84);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(this.simulationData.caption.slice(0, 62), 26, 112);

    // Tier chip makes the selected depth visible at a glance.
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(394, 14, 100, 28);
    ctx.fillStyle = '#0b1728';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.activeTier.toUpperCase(), 444, 34);
    ctx.textAlign = 'left';

    this.tagTexture.needsUpdate = true;
  }

  /**
   * Toggles between State 1 (Spatial Tag) and State 2 (Exploded Micro-Sim)
   */
  public toggleExpansion(cameraWorldPos?: THREE.Vector3): boolean {
    this.isExpanded = !this.isExpanded;
    this.tagMesh.visible = this.isExpanded;
    this.microSimRoot.visible = this.isExpanded;
    this.renderTagCanvas(this.isExpanded);
    // Adapt tag position and face toward the opening camera position
    if (this.isExpanded && cameraWorldPos) {
      const worldPos = this.getWorldPosition(new THREE.Vector3());
      const dir = cameraWorldPos.clone().sub(worldPos).setY(0);
      if (dir.lengthSq() > 0.0001) {
        dir.normalize();
        this.tagMesh.position.set(dir.x * 0.35, 0.24, dir.z * 0.35);
        this.tagMesh.lookAt(dir.x * 0.35 + dir.x, 0.24, dir.z * 0.35 + dir.z);
      }
    }
    return this.isExpanded;
  }

  /** Alias for toggleExpansion */
  public toggleExpanded(cameraWorldPos?: THREE.Vector3): boolean {
    return this.toggleExpansion(cameraWorldPos);
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

  /**
   * Release every GPU resource this anchor owns: geometries, materials and the
   * canvas texture behind the tag.
   *
   * Called when the anchor is removed from a module and when the module
   * unloads, so anchors do not leak a texture per instance across module
   * transitions. Safe to call twice.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
        object.geometry?.dispose();
        const material = object.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else if (material) {
          material.dispose();
        }
      }
    });

    // The tag texture is a CanvasTexture owned by this anchor.
    (this.tagTexture as THREE.Texture).dispose();

    // Remove the tag mesh and micro-sim content from the graph.
    this.remove(this.tagMesh);
    while (this.microSimRoot.children.length > 0) {
      this.microSimRoot.remove(this.microSimRoot.children[0]);
    }
  }
}
