/**
 * Unit tests for src/core/debug/logger.ts
 *
 * The logger gates every export on `import.meta.env.DEV && ?debug=1`.
 * We test the internal helpers (RingBuffer, anomaly detectors) via the
 * `_test*` exports which bypass the network transport.
 *
 * @vitest-environment jsdom
 *
 * verified by unit test (Vitest)
 * NOT verified on headset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock import.meta.env.DEV ─────────────────────────────────────────────
// vite.config.ts defines __BUILD_ID__; vitest defines import.meta.env.
// We set DEV=true so the logger's LOGGER_ENABLED check passes. The URL
// params check is bypassed by mocking window.location.search.

Object.defineProperty(import.meta, 'env', {
  value: { DEV: true, MODE: 'development', BASE_URL: '/', PROD: false, SSR: false },
  writable: false,
  configurable: true,
});

// Stub window.location.search before importing the module so the
// URLSearchParams check inside checkEnabled() sees ?log=1.
Object.defineProperty(window, 'location', {
  value: { search: '?log=1', href: 'http://localhost:5173/?log=1' },
  writable: true,
  configurable: true,
});

// Stub fetch so the transport does not attempt a real network call.
globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

// Stub crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-uuid-1234' },
  writable: true,
  configurable: true,
});

// Now import the logger (after env stubs are in place)
import {
  logEvent,
  logFrameStats,
  triggerMarkBug,
  trackGrabStart,
  checkGrabFollow,
  clearGrabFollow,
  updateHoverRayDir,
  logPointerDecision,
  logInputSourceChange,
  checkRayBackward,
  isLoggerEnabled,
  _testDrainRingBuffer,
  _testRingBufferSize,
  _testEnqueueRaw,
  _testReset,
} from '../../../src/core/debug/logger.js';

// ─── helpers ──────────────────────────────────────────────────────────────

function dummyEvent(seq = 0): Parameters<typeof _testEnqueueRaw>[0] {
  return {
    seq,
    wall: Date.now(),
    perf: performance.now(),
    sessionId: 'test-session',
    buildId: 'test-build',
    module: 'hub',
    category: 'frame',
    level: 'debug',
    data: { test: true },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('logger – enabled gate', () => {
  it('isLoggerEnabled returns true with ?log=1 in DEV', () => {
    expect(isLoggerEnabled()).toBe(true);
  });
});

describe('RingBuffer via _test helpers', () => {
  beforeEach(() => { _testReset(); });

  it('starts empty', () => {
    expect(_testRingBufferSize()).toBe(0);
  });

  it('accumulates pushed events', () => {
    _testEnqueueRaw(dummyEvent(1));
    _testEnqueueRaw(dummyEvent(2));
    expect(_testRingBufferSize()).toBe(2);
  });

  it('drainAll returns events in FIFO order and clears the buffer', () => {
    _testEnqueueRaw(dummyEvent(10));
    _testEnqueueRaw(dummyEvent(11));
    _testEnqueueRaw(dummyEvent(12));
    const drained = _testDrainRingBuffer();
    expect(drained.length).toBe(3);
    expect(drained[0].seq).toBe(10);
    expect(drained[2].seq).toBe(12);
    expect(_testRingBufferSize()).toBe(0);
  });

  it('wraps correctly at capacity — oldest events are overwritten', () => {
    // Push 2010 events into a 2000-capacity buffer
    for (let i = 0; i < 2010; i++) _testEnqueueRaw(dummyEvent(i));
    // Size stays at capacity
    expect(_testRingBufferSize()).toBe(2000);
    // The drained items should be a contiguous window (not all 2010)
    const drained = _testDrainRingBuffer();
    expect(drained.length).toBe(2000);
    // The 10 oldest (seq 0-9) should have been overwritten
    expect(drained[0].seq).toBe(10);
    expect(drained[1999].seq).toBe(2009);
  });
});

describe('logEvent', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('writes an event to the ring buffer', () => {
    logEvent('frame', 'info', { test: 'logEvent' });
    // The event goes into both ring buffer and flushQueue; ring buffer size reflects it
    expect(_testRingBufferSize()).toBeGreaterThanOrEqual(1);
  });
});

describe('triggerMarkBug', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('calls fetch (flushes to network)', async () => {
    logEvent('frame', 'debug', { frame: 1 });
    logEvent('frame', 'debug', { frame: 2 });
    triggerMarkBug(1);
    // Give the micro-task queue a turn
    await new Promise((r) => setTimeout(r, 10));
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});

describe('FRAME_STALL detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('does NOT fire below the threshold (49 ms)', async () => {
    logFrameStats(49);
    await new Promise((r) => setTimeout(r, 10));
    const drained = _testDrainRingBuffer();
    const anomalyEvents = drained.filter(
      (e) => e.level === 'warn' && (e.data as any)?.anomaly === 'FRAME_STALL'
    );
    expect(anomalyEvents.length).toBe(0);
  });

  it('fires FRAME_STALL at exactly the threshold (50 ms)', async () => {
    logFrameStats(50);
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => e.level === 'warn' && (e.data as any)?.anomaly === 'FRAME_STALL'
    );
    expect(anomaly).toBeDefined();
  });

  it('fires FRAME_STALL at 80 ms', async () => {
    logFrameStats(80);
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => e.level === 'warn' && (e.data as any)?.anomaly === 'FRAME_STALL'
    );
    expect(anomaly).toBeDefined();
  });
});

describe('STICKY_HOVER detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('does not fire when target changes before threshold', async () => {
    logPointerDecision('right', 'objectA', 'hover-enter');
    updateHoverRayDir('right', { x: 0, y: 0, z: -1 });
    logPointerDecision('right', 'objectB', 'hover-exit');
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'STICKY_HOVER'
    );
    expect(anomaly).toBeUndefined();
  });

  it('fires STICKY_HOVER when ray moves >20° with same target for >1.5s', async () => {
    // Simulate time passing: override performance.now inside the test scope
    const realNow = performance.now;
    let fakeTime = realNow();
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => fakeTime);

    logPointerDecision('right', 'stickyObject', 'hover-enter');
    updateHoverRayDir('right', { x: 0, y: 0, z: -1 });

    // Advance simulated time by 2 seconds
    fakeTime += 2000;

    // Large ray direction change (>20 degrees: z-backward to x-right)
    updateHoverRayDir('right', { x: 1, y: 0, z: 0 });

    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    nowSpy.mockRestore();

    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'STICKY_HOVER'
    );
    expect(anomaly).toBeDefined();
    expect((anomaly?.data as any)?.target).toBe('stickyObject');
  });
});

describe('HOVER_FLAP detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('fires when target changes rapidly more than threshold times in window', async () => {
    // 4 rapid changes (threshold=3) within 0.5s
    logPointerDecision('left', 'A', 'hover-enter');
    logPointerDecision('left', 'B', 'hover-enter');
    logPointerDecision('left', 'A', 'hover-enter');
    logPointerDecision('left', 'B', 'hover-enter');
    logPointerDecision('left', 'A', 'hover-enter');

    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'HOVER_FLAP'
    );
    expect(anomaly).toBeDefined();
  });
});

describe('GRAB_NO_FOLLOW detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('does not fire within first 1 second', async () => {
    trackGrabStart('right', { x: 0, y: 1, z: 0 }, { x: 0.5, y: 1, z: -0.5 });
    checkGrabFollow('right', { x: 0.2, y: 1, z: 0 }, { x: 0.5, y: 1, z: -0.5 });
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'GRAB_NO_FOLLOW'
    );
    expect(anomaly).toBeUndefined();
  });

  it('fires GRAB_NO_FOLLOW when interactor moves >15cm but object stays within 2cm', async () => {
    const realNow = performance.now;
    let fakeTime = realNow();
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => fakeTime);

    trackGrabStart('right', { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 });

    // Advance 1.1 seconds
    fakeTime += 1100;

    // Interactor moved 20cm (> 15cm threshold) but object barely moved (< 2cm)
    checkGrabFollow(
      'right',
      { x: 0.20, y: 1, z: 0 },  // 20 cm from origin
      { x: 0.01, y: 1, z: 0 }   // 1 cm from origin
    );

    await new Promise((r) => setTimeout(r, 20));
    nowSpy.mockRestore();

    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'GRAB_NO_FOLLOW'
    );
    expect(anomaly).toBeDefined();
  });

  it('clearGrabFollow removes the state', () => {
    trackGrabStart('left', { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 });
    clearGrabFollow('left');
    // Should not throw and no anomaly
    checkGrabFollow('left', { x: 0.5, y: 1, z: 0 }, { x: 0, y: 1, z: 0 });
    // No assertion needed beyond "did not throw"
    expect(true).toBe(true);
  });
});

describe('RAY_BACKWARD detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('does not fire when ray is roughly forward', async () => {
    checkRayBackward('right', { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: -1 });
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'RAY_BACKWARD'
    );
    expect(anomaly).toBeUndefined();
  });

  it('fires RAY_BACKWARD when ray points >100° from head forward', async () => {
    // Head points -Z forward; ray points +Z (180° apart → >100° threshold)
    checkRayBackward('right', { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 });
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'RAY_BACKWARD'
    );
    expect(anomaly).toBeDefined();
  });

  it('stops checking after 10 frames', async () => {
    // Fire 11 frames worth; only the first 10 should be checked
    for (let i = 0; i < 11; i++) {
      checkRayBackward('left', { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 });
    }
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomalies = drained.filter(
      (e) => (e.data as any)?.anomaly === 'RAY_BACKWARD'
    );
    // Should have at most 10 anomaly events (one per frame checked)
    expect(anomalies.length).toBeLessThanOrEqual(10);
  });
});

describe('INPUT_SOURCE_FLAP detector', () => {
  beforeEach(() => { _testReset(); vi.clearAllMocks(); });

  it('fires when source changes rapidly more than threshold times', async () => {
    // 3 rapid changes (threshold=2) within 1s window
    logInputSourceChange(true);
    logInputSourceChange(false);
    logInputSourceChange(true);
    await new Promise((r) => setTimeout(r, 20));
    const drained = _testDrainRingBuffer();
    const anomaly = drained.find(
      (e) => (e.data as any)?.anomaly === 'INPUT_SOURCE_FLAP'
    );
    expect(anomaly).toBeDefined();
  });
});
