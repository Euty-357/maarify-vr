#!/usr/bin/env node
/**
 * @file scripts/create-test-glb.mjs
 * @description Creates a small synthetic GLB fixture for unit tests.
 *   Does NOT depend on C:\MaarifyAssets.
 *
 * The GLB contains:
 * - A mesh part "part-nozzle" with explode metadata (moving)
 * - A mesh part "part-chamber" with zero explode distance (non-moving)
 * - An anchor_peg_1 empty with snapRadiusMeters, acceptsPegId, acceptsGateIds
 * - A flow-oxygenated empty with flowPath and flowColor
 * - A role peg object
 *
 * @usage node scripts/create-test-glb.mjs
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'tests', 'fixtures', 'test-asset.glb');

// ── Build a minimal glTF 2.0 JSON ──
// One mesh: a triangle (3 vertices, 1 triangle) with a partId
// Second mesh: a single vertex (degenerate) for non-moving part
const positions = new Float32Array([
  0, 0, 0,   // v0
  0.1, 0, 0, // v1
  0, 0.1, 0, // v2
]);
const indices = new Uint16Array([0, 1, 2]);

// Interleave: positions buffer
const posBytes = positions.buffer.slice(
  positions.byteOffset,
  positions.byteOffset + positions.byteLength
);
const idxBytes = indices.buffer.slice(
  indices.byteOffset,
  indices.byteOffset + indices.byteLength
);

const binBlob = new Uint8Array(posBytes.length + idxBytes.length);
binBlob.set(new Uint8Array(posBytes), 0);
binBlob.set(new Uint8Array(idxBytes), posBytes.length);

const gltf = {
  asset: { version: '2.0', generator: 'maarify-test-fixture' },
  scene: 0,
  scenes: [{ nodes: [0, 1, 2, 3] }],
  nodes: [
    // 0: mesh part - moving
    {
      mesh: 0,
      name: 'part-nozzle',
      userData: {
        partId: 'nozzle',
        label: 'Nozzle',
        description: 'Directs exhaust flow aft.',
        explodeDirection: [1, 0, 0],
        explodeDistanceMeters: 0.4,
      },
    },
    // 1: mesh part - non-moving (zero distance)
    {
      mesh: 1,
      name: 'part-chamber',
      userData: {
        partId: 'chamber',
        label: 'Combustion Chamber',
        description: 'Contains combustion pressure.',
        explodeDistanceMeters: 0,
        explodeDirection: [0, 0, 0],
      },
    },
    // 2: anchor empty
    {
      name: 'anchor_peg_1',
      userData: {
        anchorName: 'peg-socket-1',
        snapRadiusMeters: 0.2,
        acceptsPegId: 'peg-insti',
        acceptsGateIds: JSON.stringify(['gate-a', 'gate-b']),
      },
    },
    // 3: flow empty
    {
      name: 'flow-oxygenated',
      userData: {
        flowName: 'oxygenated-flow',
        flowPath: JSON.stringify([[0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]]),
        flowColor: '#ee3344',
      },
    },
  ],
  meshes: [
    // 0: triangle mesh
    {
      primitives: [
        {
          attributes: { POSITION: 0 },
          indices: 1,
          material: 0,
        },
      ],
    },
    // 1: single-point mesh (degenerate)
    {
      primitives: [
        {
          attributes: { POSITION: 0 },
          material: 0,
        },
      ],
    },
  ],
  accessors: [
    // 0: positions (3 vertices x 3 floats)
    {
      bufferView: 0,
      componentType: 5126, // FLOAT
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [0.1, 0.1, 0],
    },
    // 1: indices (3 uint16)
    {
      bufferView: 1,
      componentType: 5123, // UNSIGNED_SHORT
      count: 3,
      type: 'SCALAR',
      min: [0],
      max: [2],
    },
  ],
  bufferViews: [
    // 0: positions
    { buffer: 0, byteOffset: 0, byteLength: posBytes.length },
    // 1: indices
    { buffer: 0, byteOffset: posBytes.length, byteLength: idxBytes.length },
  ],
  buffers: [
    { byteLength: binBlob.length },
  ],
  materials: [
    {
      name: 'default',
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.8, 0.8, 1],
      },
    },
  ],
};

const jsonChunk = new TextEncoder().encode(JSON.stringify(gltf));
const jsonPadded = new Uint8Array(Math.ceil(jsonChunk.length / 4) * 4);
jsonPadded.set(jsonChunk);

// GLB header
const header = new Uint8Array(12);
header.writeUInt32LE(0x46546C67, 0); // magic "glTF"
header.writeUInt32LE(2, 4); // version 2
const totalLength = 12 + (8 + jsonPadded.length) + (8 + binBlob.length);
header.writeUInt32LE(totalLength, 8);

// Chunk 0: JSON
const chunk0 = new Uint8Array(8 + jsonPadded.length);
chunk0.writeUInt32LE(jsonPadded.length, 0);
chunk0.writeUInt32LE(0x4E4F534A, 4); // "JSON"
chunk0.set(jsonPadded, 8);

// Chunk 1: BIN
const chunk1 = new Uint8Array(8 + binBlob.length);
chunk1.writeUInt32LE(binBlob.length, 0);
chunk1.writeUInt32LE(0x004E4942, 4); // "BIN\0"
chunk1.set(binBlob, 8);

const glb = new Uint8Array(totalLength);
glb.set(header, 0);
glb.set(chunk0, 12);
glb.set(chunk1, 12 + chunk0.length);

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, Buffer.from(glb));
console.log(`Created synthetic GLB fixture: ${OUT_PATH} (${glb.length} bytes)`);
console.log(`  parts: nozzle (moving), chamber (non-moving)`);
console.log(`  anchor: anchor_peg_1`);
console.log(`  flow: flow-oxygenated`);