/**
 * Parse a GLB scene graph into typed asset nodes.
 *
 * Reads glTF extras from node.userData following the Maarify asset conventions
 * (C:\MaarifyAssets\CONVENTIONS.md). JSON strings are parsed defensively with
 * typed errors collected as warnings rather than thrown.
 */

import * as THREE from 'three';
import type {
  AssetPart,
  AssetAnchor,
  AssetFlow,
  AssetRole,
  ParsedAsset,
} from './types.js';

const LEVEL1_MAX_WORDS = 40;
const VECTOR_EPSILON = 1e-9;

/** Count triangles in a mesh geometry. */
function countTriangles(mesh: THREE.Mesh): number {
  const geometry = mesh.geometry;
  const index = geometry.index;
  if (index) return index.count / 3;
  const posAttr = geometry.getAttribute('position');
  if (posAttr) return posAttr.count / 3;
  return 0;
}

/** Count words in a plain string. */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Parse a hex color string like "#rrggbb" or "rrggbb" to a Three.js color integer. */
function parseHexColor(value: unknown, field: string, warnings: string[]): number | null {
  if (typeof value !== 'string') return null;
  const hex = value.replace('#', '');
  const parsed = parseInt(hex, 16);
  if (Number.isNaN(parsed)) {
    warnings.push(`flow ${field}: invalid hex color "${value}", defaulting to 0xffffff`);
    return 0xffffff;
  }
  return parsed;
}

/** Parse a JSON string defensively. Returns null with a warning on failure. */
function parseJson<T>(value: unknown, field: string, warnings: string[]): T | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    warnings.push(`${field}: expected JSON string, got ${typeof value}`);
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    warnings.push(`${field}: invalid JSON "${value}"`);
    return null;
  }
}

/** Parse a 3-vector from userData (array or object). */
function parseVector3(value: unknown, field: string, warnings: string[]): THREE.Vector3 | null {
  if (value === undefined || value === null) return null;
  let arr: number[] | null = null;
  if (Array.isArray(value)) {
    arr = value as number[];
  } else if (typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
    arr = [(value as { x: number; y: number; z: number }).x, (value as { x: number; y: number; z: number }).y, (value as { x: number; y: number; z: number }).z];
  } else {
    warnings.push(`${field}: unrecognised vector format`);
    return null;
  }
  if (arr.length !== 3 || arr.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    warnings.push(`${field}: vector must be three finite numbers`);
    return null;
  }
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

/**
 * Parse a loaded Three.js scene into typed asset nodes.
 * Traverses every node in the scene graph. Mesh nodes with userData.partId are
 * explodable parts. Empty nodes with anchor-* / flow-* names or role keys are
 * classified accordingly. Warnings are non-fatal.
 */
export function parseAssetNodes(scene: THREE.Scene): ParsedAsset {
  const parts: AssetPart[] = [];
  const anchors: AssetAnchor[] = [];
  const flows: AssetFlow[] = [];
  const roles: AssetRole[] = [];
  const warnings: string[] = [];
  let totalTriangles = 0;

  scene.traverse((object) => {
    const ud = object.userData as Record<string, unknown> | undefined;
    if (!ud) return;

    if (object instanceof THREE.Mesh) {
      const partId = ud['partId'];
      if (typeof partId === 'string' && partId.length > 0) {
        const label = typeof ud['label'] === 'string' ? ud['label'] : partId;
        const description = typeof ud['description'] === 'string' ? ud['description'] : '';
        if (countWords(description) > LEVEL1_MAX_WORDS) {
          warnings.push(
            `part ${partId}: description is ${countWords(description)} words, exceeds ${LEVEL1_MAX_WORDS}-word Level 1 limit`,
          );
        }
        const explodeDistance =
          typeof ud['explodeDistanceMeters'] === 'number'
            ? ud['explodeDistanceMeters']
            : 0;
        const explodeDirRaw = ud['explodeDirection'];
        const explodeDir = explodeDirRaw
          ? parseVector3(explodeDirRaw, `part ${partId} explodeDirection`, warnings)
          : null;
        let isMoving = false;
        let normalisedDirection: THREE.Vector3 | null = null;
        if (explodeDistance > 0 && explodeDir) {
          const lenSq = explodeDir.lengthSq();
          if (lenSq > VECTOR_EPSILON) {
            normalisedDirection = explodeDir.clone().normalize();
            isMoving = true;
          } else {
            warnings.push(
              `part ${partId}: explodeDistanceMeters > 0 but explodeDirection is a zero vector; treating as non-moving`,
            );
          }
        }
        const triangles = countTriangles(object);
        totalTriangles += triangles;
        const materials: THREE.Material[] = [];
        const mat = object.material;
        if (Array.isArray(mat)) materials.push(...mat);
        else if (mat) materials.push(mat);
        parts.push({
          partId,
          label,
          description,
          object,
          explodeDirection: normalisedDirection,
          explodeDistanceMeters: isMoving ? explodeDistance : 0,
          isMoving,
          triangleCount: triangles,
          materials,
        });
        return;
      }
    }
    const name = object.name || '';

    if (name.startsWith('anchor_') || typeof ud['snapRadiusMeters'] === 'number') {
      const anchorName =
        typeof ud['anchorName'] === 'string' ? ud['anchorName'] : name.replace(/^anchor_/, '');
      const snapRadiusMeters =
        typeof ud['snapRadiusMeters'] === 'number' ? ud['snapRadiusMeters'] : 0.15;
      const acceptsGateIds = parseJson<string[]>(ud['acceptsGateIds'], `anchor ${anchorName} acceptsGateIds`, warnings) ?? [];
      const anchor: AssetAnchor = { anchorName, snapRadiusMeters, acceptsGateIds, object };
      if (typeof ud['acceptsPegId'] === 'string') anchor.acceptsPegId = ud['acceptsPegId'];
      if (ud['facing']) anchor.facing = parseVector3(ud['facing'], `anchor ${anchorName} facing`, warnings) ?? new THREE.Vector3();
      if (typeof ud['attackRangeMeters'] === 'number') anchor.attackRangeMeters = ud['attackRangeMeters'] as number;

      if (ud['dockedPose']) {
        const parsed = parseJson<{ position?: number[]; quaternion?: number[] }>(
          typeof ud['dockedPose'] === 'string' ? ud['dockedPose'] : JSON.stringify(ud['dockedPose']),
          `anchor ${anchorName} dockedPose`,
          warnings,
        );
        if (parsed) {
          const pos = parsed.position ? new THREE.Vector3(parsed.position[0], parsed.position[1], parsed.position[2]) : new THREE.Vector3();
          const quat = parsed.quaternion ? new THREE.Quaternion(parsed.quaternion[0], parsed.quaternion[1], parsed.quaternion[2], parsed.quaternion[3]) : new THREE.Quaternion();
          anchor.dockedPose = { position: pos, quaternion: quat };
        }
      }
      anchors.push(anchor);
      return;
    }

    if (name.startsWith('flow-') || ud['flowPath']) {
      const flowName =
        typeof ud['flowName'] === 'string' ? ud['flowName'] : name.replace(/^flow-/, '');
      const flowPathRaw = ud['flowPath'];
      const flowPath: [number, number, number][] = [];
      if (flowPathRaw) {
        const parsed = parseJson<number[][]>(flowPathRaw, `flow ${flowName} flowPath`, warnings);
        if (parsed) {
          for (const point of parsed) {
            if (Array.isArray(point) && point.length === 3) {
              flowPath.push([point[0], point[1], point[2]] as [number, number, number]);
            } else {
              warnings.push(`flow ${flowName}: invalid flowPath point ${JSON.stringify(point)}`);
            }
          }
        }
      }
      const flowColor = parseHexColor(ud['flowColor'], `flow ${flowName} flowColor`, warnings) ?? 0xffffff;
      flows.push({ flowName, flowPath, flowColor, object });
      return;
    }

    if (typeof ud['role'] === 'string' && (ud['role'] === 'peg' || ud['role'] === 'bench')) {
      const fitOffsetRaw = ud['fitOffset'];
      let fitOffset: [number, number, number] | undefined;
      if (fitOffsetRaw) {
        const parsed = parseJson<number[]>(fitOffsetRaw, `role fitOffset`, warnings);
        if (parsed && parsed.length === 3) {
          fitOffset = [parsed[0], parsed[1], parsed[2]] as [number, number, number];
        }
      }
      const chamberLabels = parseJson<string[]>(ud['chamberLabels'], `role chamberLabels`, warnings);
      const matrix = parseJson<number[][]>(ud['matrix'], `role matrix`, warnings);
      const role: AssetRole = { role: ud['role'] as 'peg' | 'bench', object };
      if (typeof ud['pegId'] === 'string') role.pegId = ud['pegId'] as string;
      if (typeof ud['targetProteinId'] === 'string') role.targetProteinId = ud['targetProteinId'] as string;
      if (typeof ud['snapAnchorName'] === 'string') role.snapAnchorName = ud['snapAnchorName'] as string;
      if (fitOffset) role.fitOffset = fitOffset;
      if (typeof ud['gateId'] === 'string') role.gateId = ud['gateId'] as string;
      if (typeof ud['gateName'] === 'string') role.gateName = ud['gateName'] as string;
      if (typeof ud['qubits'] === 'number') role.qubits = ud['qubits'] as number;
      if (matrix) role.matrix = matrix;
      if (typeof ud['temperatureK'] === 'number') role.temperatureK = ud['temperatureK'] as number;
      if (typeof ud['stageLabel'] === 'string') role.stageLabel = ud['stageLabel'] as string;
      if (chamberLabels) role.chamberLabels = chamberLabels;
      if (typeof ud['residueId'] === 'string') role.residueId = ud['residueId'] as string;
      if (typeof ud['zoomTargetAsset'] === 'string') role.zoomTargetAsset = ud['zoomTargetAsset'] as string;
      if (typeof ud['scaleLabel'] === 'string') role.scaleLabel = ud['scaleLabel'] as string;
      if (typeof ud['wellFitReport'] === 'string') role.wellFitReport = ud['wellFitReport'] as string;
      roles.push(role);
    }
  });

  return { parts, anchors, flows, roles, warnings, totalTriangles };
}