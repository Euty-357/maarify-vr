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

  public dispose(): void {
    for (const anchor of this.anchors.values()) {
      this.containerGroup.remove(anchor);
    }
    this.anchors.clear();
  }
}

