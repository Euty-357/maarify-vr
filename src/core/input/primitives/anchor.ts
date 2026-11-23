import * as THREE from 'three';
import { DiegeticSpatialAnchor } from '../../spatial-anchors/diegetic-anchor.js';
import type { SpatialAnchorDefinition } from '../../types.js';
import { ActiveTuning } from '../../../config/tuning.js';
import { triggerHapticPulse } from '../../haptics/haptics.js';

export class SpatialAnchorPrimitive {
  private anchors: Map<string, DiegeticSpatialAnchor> = new Map();
  private definitions: Map<string, SpatialAnchorDefinition> = new Map();

  constructor(private containerGroup: THREE.Group) {}

  public registerAnchor(
    def: SpatialAnchorDefinition,
    tier: 'foundation' | 'advanced' | 'expert' = 'foundation'
  ): DiegeticSpatialAnchor {
    const tierSim = def.level2Simulation[tier];
    const anchor = new DiegeticSpatialAnchor(
      def.id,
      def.anchorPosition,
      def.label,
      def.level1Note,
      tierSim
    );

    anchor.position.copy(def.anchorPosition);
    this.containerGroup.add(anchor);
    this.anchors.set(def.id, anchor);
    this.definitions.set(def.id, def);
    return anchor;
  }

  public getAnchor(id: string): DiegeticSpatialAnchor | undefined {
    return this.anchors.get(id);
  }

  /**
   * Information System V3 removed the per-anchor leader line entirely, so
   * there is nothing left to batch. The method is kept as a no-op so the
   * existing module call sites do not need to change, and so a future
   * diegetic leader line has an obvious home.
   *
   * The previous implementation built a batched LineSegments from the hidden
   * per-anchor lines and left it VISIBLE, which drew a permanent ray from
   * every anchor to nowhere — the "leftover rays from the i pointers" bug.
   */
  public batchLeaderLines(): void {
    // Intentionally empty: no leader lines exist any more.
  }

  public getAllAnchors(): DiegeticSpatialAnchor[] {
    return Array.from(this.anchors.values());
  }

  public updateTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    for (const [id, anchor] of this.anchors) {
      const definition = this.definitions.get(id);
      if (!definition) continue;
      anchor.applyTier(tier, definition.level2Simulation[tier]);
    }
  }

  public checkInteraction(
    interactorPos: THREE.Vector3,
    inputSource?: XRInputSource
  ): DiegeticSpatialAnchor | null {
    for (const anchor of this.anchors.values()) {
      const worldPos = new THREE.Vector3();
      anchor.getWorldPosition(worldPos);

      const dist = interactorPos.distanceTo(worldPos);
      if (dist <= ActiveTuning.input.grabThresholdMeters) {
        anchor.toggleExpanded();
        if (inputSource) {
          triggerHapticPulse(
            inputSource,
            ActiveTuning.haptics.snap.intensity,
            ActiveTuning.haptics.snap.durationMs
          );
        }
        return anchor;
      }
    }
    return null;
  }

  public dismissAll(): void {
    for (const anchor of this.anchors.values()) {
      if (anchor.isExpanded) {
        anchor.toggleExpanded();
      }
    }
  }


  public staggerOverlapping(): void {
    const list=Array.from(this.anchors.values());
    for(let i=0;i<list.length;i++){
      for(let j=i+1;j<list.length;j++){
        const a=list[i].getWorldPosition(new THREE.Vector3());
        const b=list[j].getWorldPosition(new THREE.Vector3());
        const hDist=Math.hypot(a.x-b.x,a.z-b.z);
        if(hDist<0.4){list[j].position.y+=0.2;}
      }
    }
  }

  public dispose(): void {
    for (const anchor of this.anchors.values()) {
      // Release the anchor's own geometries, materials and canvas texture.
      anchor.dispose();
      this.containerGroup.remove(anchor);
    }
    this.anchors.clear();
    this.definitions.clear();
  }
}

