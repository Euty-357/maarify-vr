/**
 * DEV-ONLY Debug Logger for Maarify WebXR.
 *
 * Enabled only when:
 *   import.meta.env.DEV && (?debug=1 || ?log=1)
 *
 * In production builds every export is a no-op so the entire module
 * tree-shakes away. Never calls the network in production.
 *
 * Transport: NDJSON events POSTed to /__log (Vite dev-server middleware).
 * Ring buffer (max 2 000 events) absorbs drops; flushed on reconnect and on
 * mark-bug gesture.
 */

declare const __BUILD_ID__: string;

import { ActiveTuning } from '../../config/tuning.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogCategory =
  | 'xr-session'
  | 'pose'
  | 'pointer'
  | 'grab'
  | 'lever'
  | 'slider'
  | 'rotator'
  | 'teleport'
  | 'panel'
  | 'module'
  | 'frame'
  | 'error'
  | 'mark';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  seq: number;
  wall: number;           // Date.now()
  perf: number;           // performance.now()
  sessionId: string;
  buildId: string;
  module: string;
  category: LogCategory;
  level: LogLevel;
  data: unknown;
}

// ---------------------------------------------------------------------------
// Anomaly detector thresholds — read from ActiveTuning at runtime
// ---------------------------------------------------------------------------

/** Reads debug tuning from ActiveTuning (always available via ESM import). */
function getDebugTuning() {
  return ActiveTuning.debug;
}

// ---------------------------------------------------------------------------
// Enabled gate
// ---------------------------------------------------------------------------

function checkEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1' || params.get('log') === '1';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// No-op fast path for production / when disabled
// ---------------------------------------------------------------------------

export function isLoggerEnabled(): boolean {
  return checkEnabled();
}

// ---------------------------------------------------------------------------
// Session / build identity
// ---------------------------------------------------------------------------

let sessionId = '';
function getSessionId(): string {
  if (!isLoggerEnabled()) return '';
  if (!sessionId) {
    try {
      sessionId = crypto.randomUUID();
    } catch {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }
  return sessionId;
}

const BUILD_ID: string = (() => {
  try {
    return typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'unknown-build';
  } catch {
    return 'unknown-build';
  }
})();

// ---------------------------------------------------------------------------
// Ring buffer (max 2 000 events)
// ---------------------------------------------------------------------------

const RING_CAPACITY = 2000;

class RingBuffer<T> {
  private buf: (T | undefined)[];
  private head = 0;   // next write index
  private count = 0;

  constructor(capacity: number) {
    this.buf = new Array<T | undefined>(capacity);
  }

  push(item: T): void {
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.buf.length;
    if (this.count < this.buf.length) this.count++;
  }

  /** Return all items in FIFO order without clearing the buffer. */
  toArray(): T[] {
    const items: T[] = [];
    if (this.count === 0) return items;
    const start = this.count < this.buf.length
      ? 0
      : this.head; // oldest slot when full
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.buf.length;
      const item = this.buf[idx];
      if (item !== undefined) items.push(item);
    }
    return items;
  }

  /** Drain all items in FIFO order, clearing the buffer. */
  drainAll(): T[] {
    const items: T[] = [];
    if (this.count === 0) return items;
    const start = this.count < this.buf.length
      ? 0
      : this.head; // oldest slot when full
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.buf.length;
      const item = this.buf[idx];
      if (item !== undefined) items.push(item);
    }
    this.head = 0;
    this.count = 0;
    this.buf = new Array<T | undefined>(this.buf.length);
    return items;
  }

  get size(): number {
    return this.count;
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let seq = 0;
let currentModule = 'hub';

const ringBuffer = new RingBuffer<LogEvent>(RING_CAPACITY);

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

let pendingFlush: ReturnType<typeof setTimeout> | null = null;
const flushQueue: LogEvent[] = [];
let flushInFlight = false;

function scheduleFlush(): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  if (pendingFlush !== null) return;
  pendingFlush = setTimeout(() => {
    pendingFlush = null;
    void performFlush();
  }, 50);
}

async function performFlush(): Promise<void> {
  if (flushInFlight || flushQueue.length === 0) return;
  flushInFlight = true;
  const batch = flushQueue.splice(0, flushQueue.length);
  const tuning = getDebugTuning();
  const ndjson = batch.map((e) => JSON.stringify(e)).join('\n');
  try {
    await fetch(tuning.logEndpointPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-ndjson' },
      body: ndjson,
      keepalive: true,
    });
    // On success, check if the ring buffer has events accumulated during the outage
    const buffered = ringBuffer.toArray();
    if (buffered.length > 0) {
      flushQueue.push(...buffered);
      scheduleFlush();
    }
  } catch {
    // Connection dropped: push batch back into ring buffer
    for (const e of batch) ringBuffer.push(e);
  } finally {
    flushInFlight = false;
  }
}

/** Queue an event for transport and add it to the ring buffer. */
function enqueue(event: LogEvent): void {
  ringBuffer.push(event);
  flushQueue.push(event);
  scheduleFlush();
}

/** Immediately flush the ring buffer and queued events (mark-bug / anomaly). */
async function flushImmediate(): Promise<void> {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  if (pendingFlush !== null) {
    clearTimeout(pendingFlush);
    pendingFlush = null;
  }
  const buffered = ringBuffer.toArray();
  // Merge buffered events that aren't already in flushQueue
  const inQueue = new Set(flushQueue.map((e) => e.seq));
  for (const e of buffered) {
    if (!inQueue.has(e.seq)) flushQueue.unshift(e);
  }
  flushQueue.sort((a, b) => a.seq - b.seq);
  await performFlush();
}

// ---------------------------------------------------------------------------
// Core log function
// ---------------------------------------------------------------------------

export function logEvent(category: LogCategory, level: LogLevel, data: unknown): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  const event: LogEvent = {
    seq: seq++,
    wall: Date.now(),
    perf: performance.now(),
    sessionId: getSessionId(),
    buildId: BUILD_ID,
    module: currentModule,
    category,
    level,
    data,
  };
  enqueue(event);
}

// ---------------------------------------------------------------------------
// Module context
// ---------------------------------------------------------------------------

export function setCurrentModule(name: string): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  currentModule = name;
  logEvent('module', 'info', { event: 'module-entered', name });
}

// ---------------------------------------------------------------------------
// Pose logging (10 Hz sampled) & STALE_POSE detector (> 1s unchanged)
// ---------------------------------------------------------------------------

let lastPoseLogMs: Record<string, number> = {};
const lastRecordedPoses: Record<string, { origin: { x: number; y: number; z: number }; quaternion: { x: number; y: number; z: number; w: number }; time: number }> = {};
const stalePoseReported: Record<string, boolean> = {};

export function logPose(
  hand: 'left' | 'right' | 'head',
  origin: { x: number; y: number; z: number },
  quaternion: { x: number; y: number; z: number; w: number }
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  const tuning = getDebugTuning();
  const intervalMs = 1000 / tuning.poseLogHz;
  const now = performance.now();

  // STALE_POSE check: if pose origin and quaternion haven't moved at all for > 1.0s
  const prev = lastRecordedPoses[hand];
  if (prev) {
    const dPos = Math.hypot(origin.x - prev.origin.x, origin.y - prev.origin.y, origin.z - prev.origin.z);
    const dQuat = Math.abs(quaternion.x - prev.quaternion.x) + Math.abs(quaternion.y - prev.quaternion.y) + Math.abs(quaternion.z - prev.quaternion.z) + Math.abs(quaternion.w - prev.quaternion.w);
    if (dPos < 0.0001 && dQuat < 0.0001) {
      if (now - prev.time > 1000 && !stalePoseReported[hand]) {
        stalePoseReported[hand] = true;
        void reportAnomaly('STALE_POSE', { hand, idleDurationMs: now - prev.time, origin });
      }
    } else {
      lastRecordedPoses[hand] = { origin: { ...origin }, quaternion: { ...quaternion }, time: now };
      stalePoseReported[hand] = false;
    }
  } else {
    lastRecordedPoses[hand] = { origin: { ...origin }, quaternion: { ...quaternion }, time: now };
    stalePoseReported[hand] = false;
  }

  const last = lastPoseLogMs[hand] ?? 0;
  if (now - last < intervalMs) return;
  lastPoseLogMs[hand] = now;
  logEvent('pose', 'debug', { hand, origin, quaternion });
}

// ---------------------------------------------------------------------------
// Pointer decision logging (only on change + 4 Hz heartbeat)
// ---------------------------------------------------------------------------

interface PointerDecisionRecord {
  targetName: string | null;
  decision: string;
  lastLogPerf: number;
}

const lastPointerDecisions: Record<string, PointerDecisionRecord> = {};

export function logPointerDecision(
  hand: 'left' | 'right',
  targetName: string | null,
  decision: string,
  extra?: unknown
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  const now = performance.now();
  const prev = lastPointerDecisions[hand];
  const changed = !prev || prev.targetName !== targetName || prev.decision !== decision;
  const heartbeatDue = prev ? (now - prev.lastLogPerf >= 250) : true; // 4 Hz

  if (changed || heartbeatDue) {
    lastPointerDecisions[hand] = { targetName, decision, lastLogPerf: now };
    logEvent('pointer', 'debug', { hand, targetName, decision, changed, extra });
  }

  // Run hover anomaly detectors on every call
  updateHoverDetectors(hand, targetName, now);
}

// ---------------------------------------------------------------------------
// Grab event logging
// ---------------------------------------------------------------------------

export function logGrabEvent(
  hand: 'left' | 'right',
  objectName: string,
  eventType: 'grab' | 'release' | 'follow-check',
  extra?: unknown
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  logEvent('grab', 'debug', { hand, objectName, eventType, extra });
}

// ---------------------------------------------------------------------------
// Frame stats logging + FRAME_STALL detector
// ---------------------------------------------------------------------------

export function logFrameStats(frameTimeMs: number): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  logEvent('frame', 'debug', { frameTimeMs });
  const tuning = getDebugTuning();
  if (frameTimeMs >= tuning.frameStallThresholdMs) {
    void reportAnomaly('FRAME_STALL', { frameTimeMs, thresholdMs: tuning.frameStallThresholdMs });
  }
}

// ---------------------------------------------------------------------------
// Mark-bug gesture
// ---------------------------------------------------------------------------

export function triggerMarkBug(counter: number): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  logEvent('mark', 'info', { event: 'mark-bug', counter, wall: Date.now() });
  void flushImmediate();
}

// ---------------------------------------------------------------------------
// Anomaly detectors
// ---------------------------------------------------------------------------

async function reportAnomaly(type: string, details: unknown): Promise<void> {
  const payload = typeof details === 'object' && details !== null
    ? { anomaly: type, ...details, details }
    : { anomaly: type, details };
  logEvent('error', 'warn', payload);
  await flushImmediate();
}

// --- STICKY_HOVER & HOVER_FLAP ---

interface HoverState {
  target: string | null;
  startPerf: number;
  lastRayDir: { x: number; y: number; z: number } | null;
  flapHistory: number[]; // perf timestamps of target changes
}

const hoverState: Record<string, HoverState> = {};

function updateHoverDetectors(hand: string, targetName: string | null, now: number): void {
  if (!hoverState[hand]) {
    hoverState[hand] = { target: null, startPerf: now, lastRayDir: null, flapHistory: [] };
  }
  const state = hoverState[hand];
  const tuning = getDebugTuning();

  if (state.target !== targetName) {
    // Target changed — check HOVER_FLAP
    state.flapHistory.push(now);
    // Keep only entries within hoverFlapWindowSec
    const windowMs = tuning.hoverFlapWindowSec * 1000;
    state.flapHistory = state.flapHistory.filter((t) => now - t <= windowMs);
    if (
      state.flapHistory.length > tuning.hoverFlapCountThreshold &&
      state.target !== null &&
      targetName !== null &&
      state.target === targetName // same object alternating
    ) {
      void reportAnomaly('HOVER_FLAP', {
        hand,
        target: state.target,
        flapCount: state.flapHistory.length,
        windowMs,
      });
    }
    // Check HOVER_FLAP regardless of object sameness (count rapid changes)
    if (state.flapHistory.length > tuning.hoverFlapCountThreshold) {
      void reportAnomaly('HOVER_FLAP', {
        hand,
        fromTarget: state.target,
        toTarget: targetName,
        flapCount: state.flapHistory.length,
        windowMs,
      });
    }
    state.target = targetName;
    state.startPerf = now;
    state.lastRayDir = null;
  } else if (state.target !== null) {
    // Same target — STICKY_HOVER is checked in updateHoverRayDir per frame.
    // Nothing to do here; the ray-direction handler has the full picture.
  }
}

/** Call once per frame with the current ray direction for STICKY_HOVER detection. */
export function updateHoverRayDir(
  hand: string,
  dir: { x: number; y: number; z: number }
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  if (!hoverState[hand] || hoverState[hand].target === null) return;
  const state = hoverState[hand];
  const tuning = getDebugTuning();
  const now = performance.now();
  if (state.lastRayDir !== null) {
    const angleDeg = vectorAngleDeg(state.lastRayDir, dir);
    const durationSec = (now - state.startPerf) / 1000;
    if (durationSec > tuning.stickyHoverThresholdSec && angleDeg > tuning.stickyHoverRayChangeDeg) {
      void reportAnomaly('STICKY_HOVER', {
        hand,
        target: state.target,
        durationSec,
        angleDeg,
      });
      // Reset to avoid spam — reset the start time
      hoverState[hand] = { ...state, startPerf: now };
    }
  }
  state.lastRayDir = dir;
}

function vectorAngleDeg(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const magA = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
  const magB = Math.sqrt(b.x ** 2 + b.y ** 2 + b.z ** 2);
  if (magA === 0 || magB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

// --- GRAB_NO_FOLLOW ---

interface GrabFollowState {
  interactorPosAtGrab: { x: number; y: number; z: number };
  objectPosAtGrab: { x: number; y: number; z: number };
  grabStartPerf: number;
}

const grabFollowState: Record<string, GrabFollowState> = {};

export function trackGrabStart(
  hand: string,
  interactorPos: { x: number; y: number; z: number },
  objectPos: { x: number; y: number; z: number }
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  grabFollowState[hand] = {
    interactorPosAtGrab: { ...interactorPos },
    objectPosAtGrab: { ...objectPos },
    grabStartPerf: performance.now(),
  };
}

export function checkGrabFollow(
  hand: string,
  interactorPos: { x: number; y: number; z: number },
  objectPos: { x: number; y: number; z: number }
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  const state = grabFollowState[hand];
  if (!state) return;
  const tuning = getDebugTuning();
  const elapsedSec = (performance.now() - state.grabStartPerf) / 1000;
  if (elapsedSec < 1.0) return;
  const interactorMovedCm = dist3(interactorPos, state.interactorPosAtGrab) * 100;
  const objectMovedCm = dist3(objectPos, state.objectPosAtGrab) * 100;
  if (
    objectMovedCm < tuning.grabNoFollowObjectCm &&
    interactorMovedCm > tuning.grabNoFollowInteractorCm
  ) {
    void reportAnomaly('GRAB_NO_FOLLOW', {
      hand,
      objectMovedCm,
      interactorMovedCm,
      elapsedSec,
    });
  }
  // Update baseline for next check window
  grabFollowState[hand] = {
    interactorPosAtGrab: { ...interactorPos },
    objectPosAtGrab: { ...objectPos },
    grabStartPerf: performance.now(),
  };
}

export function clearGrabFollow(hand: string): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  delete grabFollowState[hand];
}

function dist3(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// --- INPUT_SOURCE_FLAP ---

const inputSourceFlapHistory: number[] = [];

export function logInputSourceChange(gained: boolean): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  const tuning = getDebugTuning();
  const now = performance.now();
  inputSourceFlapHistory.push(now);
  const windowMs = tuning.inputSourceFlapWindowSec * 1000;
  const recent = inputSourceFlapHistory.filter((t) => now - t <= windowMs);
  inputSourceFlapHistory.length = 0;
  inputSourceFlapHistory.push(...recent);
  if (recent.length > tuning.inputSourceFlapCount) {
    void reportAnomaly('INPUT_SOURCE_FLAP', {
      gained,
      changeCount: recent.length,
      windowMs,
    });
  }
  logEvent('xr-session', 'info', { event: gained ? 'input-source-added' : 'input-source-removed' });
}

// --- RAY_BACKWARD ---

let rayBackwardFrameCount = 0;

export function checkRayBackward(
  hand: string,
  rayDir: { x: number; y: number; z: number },
  headForward: { x: number; y: number; z: number }
): void {
  if (!import.meta.env.DEV || !isLoggerEnabled()) return;
  if (rayBackwardFrameCount >= 10) return;
  rayBackwardFrameCount++;
  const tuning = getDebugTuning();
  const angle = vectorAngleDeg(rayDir, headForward);
  if (angle > tuning.rayBackwardThresholdDeg) {
    void reportAnomaly('RAY_BACKWARD', { hand, angleDeg: angle, frame: rayBackwardFrameCount });
  }
}

// ---------------------------------------------------------------------------
// Export the ring buffer drain for testing
// ---------------------------------------------------------------------------

/** For testing only. Returns all current ring buffer contents without flushing to network. */
export function _testDrainRingBuffer(): LogEvent[] {
  return ringBuffer.drainAll();
}

/** For testing only. Returns current ring buffer size. */
export function _testRingBufferSize(): number {
  return ringBuffer.size;
}

/** For testing only. Force-enqueue without transport. */
export function _testEnqueueRaw(event: LogEvent): void {
  ringBuffer.push(event);
}

/** For testing: reset all state (called between tests). */
export function _testReset(): void {
  sessionId = '';
  seq = 0;
  currentModule = 'hub';
  lastPoseLogMs = {};
  for (const k of Object.keys(hoverState)) delete hoverState[k];
  for (const k of Object.keys(grabFollowState)) delete grabFollowState[k];
  inputSourceFlapHistory.length = 0;
  rayBackwardFrameCount = 0;
  flushQueue.length = 0;
  ringBuffer.drainAll();
}
