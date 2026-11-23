/**
 * Course event bus.
 *
 * The single channel through which the shared interaction primitives and the
 * pointer pipeline report what the learner did. Mission code never reads raw XR
 * input — it subscribes here.
 *
 * Events are plain data ({ type, target, value, meta }) so mission predicates
 * stay pure and unit-testable without a WebGL context or an XR session.
 */

import type { CourseEvent, CourseEventType } from '../types.js';

export type CourseEventListener = (event: CourseEvent) => void;

/** A tiny synchronous pub/sub used to decouple modules from the core input layer. */
export class CourseEventBus {
  private readonly listeners: CourseEventListener[] = [];

  /** Subscribe to every event. Returns an unsubscribe function. */
  public subscribe(listener: CourseEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  /** Publish an event to every subscriber. Never throws into the caller. */
  public publish(event: CourseEvent): void {
    for (const listener of this.listeners.slice()) {
      try {
        listener(event);
      } catch {
        // A broken subscriber must never break the interaction that caused it.
      }
    }
  }

  /** Convenience helper for a typed event with a target and optional value. */
  public emit(type: CourseEventType, target?: string, value?: number, meta?: Record<string, unknown>): void {
    const event: CourseEvent = { type };
    if (target !== undefined) event.target = target;
    if (value !== undefined) event.value = value;
    if (meta !== undefined) event.meta = meta;
    this.publish(event);
  }

  /** Remove every subscriber (used when a module unloads). */
  public clear(): void {
    this.listeners.length = 0;
  }

  /** Number of active subscribers — used by tests and leak checks. */
  public get listenerCount(): number {
    return this.listeners.length;
  }
}

/** Process-wide bus. Modules publish through this; the runner subscribes. */
export const courseEventBus = new CourseEventBus();