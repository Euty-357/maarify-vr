import * as THREE from 'three';
import { SpatialGrabPrimitive } from './grab.js';

export interface ExplodablePartOptions {
  label?: string;
  /** Direction the part travels when exploded; normalised automatically. */
  explodeDirection?: THREE.Vector3;
  explodeDistanceMeters?: number;
  /** Distance within which a released part snaps back to its slot. */
  snapDistanceMeters?: number;
}

export interface ExplodablePart {
  id: string;
  object: THREE.Object3D;
  label: string;
  homePosition: THREE.Vector3;
  homeQuaternion: THREE.Quaternion;
  explodeDirection: THREE.Vector3;
  explodeDistanceMeters: number;
  snapDistanceMeters: number;
  detached: boolean;
  grab: SpatialGrabPrimitive;
}

const DEFAULT_EXPLODE_DISTANCE = 0.35;
const DEFAULT_SNAP_DISTANCE = 0.12;

/**
 * Reusable explodable assembly: named parts, an explode amount driven by a lever,
 * individually grabbable parts, magnetic snap re-assembly and a stable home pose.
 *
 * Parts should be direct children of `root`; the primitive converts the grab's
 * world-space motion back into the root's local space so assemblies can sit anywhere.
 */
export class ExplodableAssembly {
  public parts: Map<string, ExplodablePart> = new Map();
  public explodeAmount = 0;

  constructor(public root: THREE.Group) {}

  public addPart(id: string, object: THREE.Object3D, options: ExplodablePartOptions = {}): ExplodablePart {
    if (this.parts.has(id)) throw new Error(`Explodable part already registered: ${id}`);
    const explodeDirection = (options.explodeDirection ?? new THREE.Vector3(0, 0.2, 0)).clone();
    if (explodeDirection.lengthSq() === 0) explodeDirection.set(0, 0.2, 0);
    explodeDirection.normalize();

    const part: ExplodablePart = {
      id,
      object,
      label: options.label ?? id,
      homePosition: object.position.clone(),
      homeQuaternion: object.quaternion.clone(),
      explodeDirection,
      explodeDistanceMeters: options.explodeDistanceMeters ?? DEFAULT_EXPLODE_DISTANCE,
      snapDistanceMeters: options.snapDistanceMeters ?? DEFAULT_SNAP_DISTANCE,
      detached: false,
      grab: undefined as unknown as SpatialGrabPrimitive,
    };

    object.userData.explodablePartId = id;
    object.name = object.name || `explodable-part-${id}`;

    part.grab = new SpatialGrabPrimitive(object, {
      onGrab: () => {
        part.detached = true;
      },
      onRelease: () => this.trySnap(part),
      onMove: (worldPosition, worldQuaternion) => {
        const parent = object.parent;
        if (!parent) return;
        const localPosition = parent.worldToLocal(worldPosition.clone());
        const parentQuaternion = parent.getWorldQuaternion(new THREE.Quaternion());
        const localQuaternion = parentQuaternion.invert().multiply(worldQuaternion);
        object.position.copy(localPosition);
        object.quaternion.copy(localQuaternion);
      },
    });

    this.parts.set(id, part);
    return part;
  }

  public getPart(id: string): ExplodablePart | undefined {
    return this.parts.get(id);
  }

  public getParts(): ExplodablePart[] {
    return Array.from(this.parts.values());
  }

  /** Lerp every unheld part between its home pose (0) and exploded slot (1). */
  public setExplodeAmount(amount: number): void {
    this.explodeAmount = THREE.MathUtils.clamp(amount, 0, 1);
    for (const part of this.parts.values()) {
      if (part.detached || part.grab.isGrabbed) continue;
      const slot = this.slotPosition(part);
      part.object.position.copy(slot);
      part.object.quaternion.copy(part.homeQuaternion);
    }
  }

  public slotPosition(part: ExplodablePart): THREE.Vector3 {
    return part.homePosition
      .clone()
      .addScaledVector(part.explodeDirection, part.explodeDistanceMeters * this.explodeAmount);
  }

  /** Force a part out of its slot without a grab (used by tests and scripted demos). */
  public detach(id: string): void {
    const part = this.parts.get(id);
    if (!part) return;
    part.detached = true;
    part.object.position.addScaledVector(part.explodeDirection, 0.2);
  }

  /** Snap a part back to its current slot. */
  public attach(id: string): void {
    const part = this.parts.get(id);
    if (!part) return;
    part.detached = false;
    part.object.position.copy(this.slotPosition(part));
    part.object.quaternion.copy(part.homeQuaternion);
  }

  public attachAll(): void {
    for (const part of this.parts.values()) this.attach(part.id);
  }

  public reset(): void {
    this.explodeAmount = 0;
    for (const part of this.parts.values()) {
      part.detached = false;
      part.object.position.copy(part.homePosition);
      part.object.quaternion.copy(part.homeQuaternion);
    }
  }

  private trySnap(part: ExplodablePart): void {
    const slot = this.slotPosition(part);
    if (part.object.position.distanceTo(slot) <= part.snapDistanceMeters) {
      part.detached = false;
      part.object.position.copy(slot);
      part.object.quaternion.copy(part.homeQuaternion);
    }
  }
}
