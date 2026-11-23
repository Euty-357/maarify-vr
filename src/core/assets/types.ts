/**
 * Typed contract for parsed GLB asset nodes.
 *
 * GlTF extras arrive in node.userData. Authoring conventions (see
 * C:\MaarifyAssets\CONVENTIONS.md):
 * - GLB, Y-up, metres, front of every model faces +Z toward the learner.
 * - Each explodable part is a top-level mesh node named in kebab-case.
 * - part extras: partId, label, description (<=40 words), explodeDirection ([x,y,z]),
 *   explodeDistanceMeters. Zero distance or zero vector => non-moving (never normalise zero).
 * - anchor_* empties: snapRadiusMeters, dockedPose, acceptsPegId, acceptsGateIds (JSON string),
 *   facing, attackRangeMeters.
 * - flow-* empties: flowPath (JSON string of [[x,y,z],...]), flowColor hex.
 * - Other keys: drugClass, drugExamples, role ("peg"|"bench"), pegId, targetProteinId,
 *   snapAnchorName, fitOffset, gateId, gateName, qubits, matrix (JSON string), temperatureK,
 *   stageLabel, chamberLabels (JSON string), residueId, zoomTargetAsset, scaleLabel,
 *   wellFitReport. Parse JSON strings defensively with typed errors.
 */

import * as THREE from 'three';

/** A parsed explodable part from a GLB asset. */
export interface AssetPart {
  /** Stable part id from userData.partId. */
  partId: string;
  label: string;
  /** Level 1 tag text, <= 40 words. Flagged in warnings if longer. */
  description: string;
  /** The mesh object from the scene graph. */
  object: THREE.Mesh;
  /** Normalised explode direction, or null if the part does not move. */
  explodeDirection: THREE.Vector3 | null;
  explodeDistanceMeters: number;
  /** True when distance > 0 and direction is a non-zero vector. */
  isMoving: boolean;
  triangleCount: number;
  materials: readonly THREE.Material[];
}

/** A parsed dock anchor (anchor_* empty). */
export interface AssetAnchor {
  anchorName: string;
  snapRadiusMeters: number;
  /** Optional docked pose in the asset's local space. */
  dockedPose?: { position: THREE.Vector3; quaternion: THREE.Quaternion };
  acceptsPegId?: string;
  acceptsGateIds: string[];
  facing?: THREE.Vector3;
  attackRangeMeters?: number;
  object: THREE.Object3D;
}

/** A parsed flow path (flow-* empty). */
export interface AssetFlow {
  flowName: string;
  /** Path points in the asset's local space. */
  flowPath: [number, number, number][];
  flowColor: number;
  object: THREE.Object3D;
}

/** A parsed role marker object. */
export interface AssetRole {
  role: 'peg' | 'bench';
  pegId?: string;
  targetProteinId?: string;
  snapAnchorName?: string;
  fitOffset?: [number, number, number];
  gateId?: string;
  gateName?: string;
  qubits?: number;
  matrix?: number[][];
  temperatureK?: number;
  stageLabel?: string;
  chamberLabels?: string[];
  residueId?: string;
  zoomTargetAsset?: string;
  scaleLabel?: string;
  wellFitReport?: string;
  object: THREE.Object3D;
}

/** Result of parsing a GLB scene graph. */
export interface ParsedAsset {
  parts: AssetPart[];
  anchors: AssetAnchor[];
  flows: AssetFlow[];
  roles: AssetRole[];
  warnings: string[];
  totalTriangles: number;
}

/** A loaded, cached asset with reference counting. */
export interface LoadedAsset {
  url: string;
  scene: THREE.Scene;
  parsed: ParsedAsset;
  refCount: number;
}

/** Options for loadGlbAsset. */
export interface LoadGlbOptions {
  /** Base path prepended to relative URLs. Default '/models/'. */
  basePath?: string;
}