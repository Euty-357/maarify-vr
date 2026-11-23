/**
 * Unified Pointer Pipeline — per-hand state machine for the Maarify WebXR app.
 *
 * Design decisions:
 * - ONE pipeline instance used by both the hub and every module.
 * - Raycast only against explicitly registered interactables (via registerInteractable).
 * - Sort candidates by distance; closest wins.
 * - Hover exits with a small hysteresis window (EXIT_HYSTERESIS_SEC) so the
 *   ray does not chatter when the user's aim grazes the edge of a target.
 * - The drawn ray and the tested ray are the SAME line (no visual/logical split).
 * - Panels use their actual PlaneGeometry quad size — no oversized colliders.
 * - No aim-assist cone, no nearest-target magnetism.
 * - Per-hand ownership: each hand is an independent state machine.
 *
 * Relationship to `src/core/input/ray-hit.ts` (the shared hit rule):
 * - `ray-hit.ts` is the SINGLE pure rule for "may this hit stop the beam?".
 *   It knows about the visibility rule and about which userData primitives make
 *   an object interactive.
 * - This pipeline is the per-hand STATE MACHINE on top of that rule: hover
 *   enter/exit with hysteresis, press/drag/release transitions, and which
 *   primitive a press activates.
 * - The two are deliberately not merged: `ray-hit.ts` must stay pure and
 *   dependency-free so it can be unit-tested without a scene, while this class
 *   owns mutable per-hand state.
 * - This pipeline is currently not wired into main.ts (main.ts resolves hover
 *   and press itself through the shared primitives). It is kept because it is
 *   the intended home for per-hand hover state, and it now shares the same
 *   visibility rule. See docs/DECISIONS.md D-018.
 *
 * NOT verified on headset.
 */

import * as THREE from 'three';
import type { SpatialGrabPrimitive } from './primitives/grab.js';
import type { SpatialLeverPrimitive } from './primitives/lever.js';
import type { SpatialSliderPrimitive } from './primitives/slider.js';
import type { SpatialRotatorPrimitive } from './primitives/rotator.js';
import { isHiddenInHierarchy } from './ray-hit.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PointerHandState = 'idle' | 'hovering' | 'pressing' | 'dragging' | 'released';

/** Seconds of hysteresis before hover exits after the ray leaves the target. */
const EXIT_HYSTERESIS_SEC = 0.08;

interface HandState {
  state: PointerHandState;
  hoverTarget: THREE.Object3D | null;
  /** Performance.now() when the ray last hit the current hover target. */
  lastHitTime: number;
  /** Active grab for this hand (if any). */
  activeGrab: SpatialGrabPrimitive | null;
  /** Active lever for this hand (if any). */
  activeLever: SpatialLeverPrimitive | null;
  /** World position of the ray end-point (hit or max-range). */
  rayEndpoint: THREE.Vector3;
  /** True after ray misses — counts toward hysteresis. */
  exitTimerStarted: boolean;
  exitTimerElapsed: number;
}

function makeHandState(): HandState {
  return {
    state: 'idle',
    hoverTarget: null,
    lastHitTime: 0,
    activeGrab: null,
    activeLever: null,
    rayEndpoint: new THREE.Vector3(),
    exitTimerStarted: false,
    exitTimerElapsed: 0,
  };
}

// ---------------------------------------------------------------------------
// PointerPipeline
// ---------------------------------------------------------------------------

export class PointerPipeline {
  private interactables = new Set<THREE.Object3D>();
  private hitProxies = new Map<THREE.Object3D, THREE.Object3D>(); // interactable → proxy mesh

  private hands: { left: HandState; right: HandState } = {
    left: makeHandState(),
    right: makeHandState(),
  };

  private raycaster = new THREE.Raycaster();
  /** Maximum ray test distance (metres). */
  public maxDistance = 4.5;

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Register an object as interactable. The pipeline will only raycast against
   * registered objects, keeping the hit list tight and predictable.
   *
   * @param obj        The scene object (or its hit proxy).
   * @param hitProxy   Optional invisible mesh whose geometry defines the hit area.
   *                   If omitted, `obj` itself is tested. For panels, pass the
   *                   actual PlaneGeometry quad so the hit area matches visuals.
   */
  public registerInteractable(obj: THREE.Object3D, hitProxy?: THREE.Mesh): void {
    this.interactables.add(obj);
    if (hitProxy) this.hitProxies.set(obj, hitProxy);
  }

  public unregisterInteractable(obj: THREE.Object3D): void {
    this.interactables.delete(obj);
    this.hitProxies.delete(obj);
    // Release any hand that was hovering this object
    for (const hand of ['left', 'right'] as const) {
      if (this.hands[hand].hoverTarget === obj) {
        this._forceRelease(hand);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------------

  /**
   * Call once per frame per hand with the current ray origin and direction
   * (already in world space, composed with the camera rig).
   *
   * @param hand       Which hand.
   * @param origin     World-space ray origin.
   * @param direction  World-space ray direction (normalised).
   * @param scene      The active Three.js scene (used to resolve world matrices).
   * @param deltaTime  Seconds since last frame (for hysteresis timer). Pass 0 on first call.
   */
  public updateRay(
    hand: 'left' | 'right',
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    _scene?: THREE.Scene,
    deltaTime = 0
  ): void {
    const state = this.hands[hand];
    // Update active grab follow per frame
    if (state.activeGrab?.isGrabbed) {
      state.activeGrab.update(origin, new THREE.Quaternion());
    }

    // Build the candidate list from registered interactables
    const candidates: THREE.Object3D[] = [];
    for (const obj of this.interactables) {
      const proxy = this.hitProxies.get(obj);
      candidates.push(proxy ?? obj);
    }

    // Raycast
    this.raycaster.set(origin, direction.clone().normalize());
    this.raycaster.far = this.maxDistance;
    const hits = this.raycaster.intersectObjects(candidates, true);

    // Map hits back from proxies to their logical interactables.
    // The same visibility rule as the rest of the app applies: an invisible
    // object (or an object under an invisible ancestor) never stops the beam,
    // because THREE.Raycaster reports intersections for hidden objects.
    const visibleHits = hits.filter((h) => !isHiddenInHierarchy(h.object));
    const resolvedHit = visibleHits.length > 0 ? visibleHits[0] : null;
    let hitObject: THREE.Object3D | null = null;
    if (resolvedHit) {
      // Walk up to find the registered object
      hitObject = this._resolveHit(resolvedHit.object);
    }

    // Update ray endpoint (for drawn ray = tested ray contract)
    if (resolvedHit) {
      state.rayEndpoint.copy(resolvedHit.point);
    } else {
      state.rayEndpoint.copy(origin).addScaledVector(direction, this.maxDistance);
    }

    // ── State machine ──────────────────────────────────────────────────────

    if (hitObject !== null) {
      // Ray hits something
      state.exitTimerStarted = false;
      state.exitTimerElapsed = 0;

      if (state.hoverTarget !== hitObject) {
        // Target changed
        state.hoverTarget = hitObject;
        state.lastHitTime = performance.now();
        if (state.state === 'idle') {
          state.state = 'hovering';
        }
      } else {
        // Same target — stay hovering
        if (state.state === 'idle') state.state = 'hovering';
      }
    } else {
      // Ray misses
      if (state.state === 'hovering') {
        // Start or continue hysteresis countdown
        if (!state.exitTimerStarted) {
          state.exitTimerStarted = true;
          state.exitTimerElapsed = 0;
        }
        state.exitTimerElapsed += deltaTime;
        if (state.exitTimerElapsed >= EXIT_HYSTERESIS_SEC) {
          state.hoverTarget = null;
          state.state = 'idle';
          state.exitTimerStarted = false;
          state.exitTimerElapsed = 0;
        }
      } else if (state.state === 'idle') {
        state.hoverTarget = null;
      }
      // pressing / dragging: keep state until explicit release
    }
  }

  // ---------------------------------------------------------------------------
  // Select / Release
  // ---------------------------------------------------------------------------

  /**
   * Call when the hand fires a select event (trigger press / pinch).
   * Returns the reason code (what was activated).
   */
  public onSelect(hand: 'left' | 'right', inputSource: XRInputSource | undefined): string {
    const state = this.hands[hand];
    const target = state.hoverTarget;
    if (!target) return 'no-hover';

    // Try grab
    const grab = this._findPrimitive(target, 'grabPrimitive') as SpatialGrabPrimitive | null;
    if (grab && !grab.isGrabbed) {
      // For ray-based grab, use the ray endpoint as the grab start position
      const interactorPos = state.rayEndpoint.clone();
      if (grab.tryGrab(interactorPos, new THREE.Quaternion(), inputSource)) {
        state.activeGrab = grab;
        state.state = 'pressing';
        return 'grab';
      }
    }

    // Try lever
    const lever = this._findPrimitive(target, 'leverPrimitive') as SpatialLeverPrimitive | null;
    if (lever) {
      lever.updateFromGrab(state.rayEndpoint.clone(), inputSource);
      state.activeLever = lever;
      state.state = 'pressing';
      return 'lever';
    }

    // Try slider
    const slider = this._findPrimitive(target, 'sliderPrimitive') as SpatialSliderPrimitive | null;
    if (slider) {
      slider.updateDrag(state.rayEndpoint.clone(), inputSource);
      state.state = 'pressing';
      return 'slider';
    }

    // Try rotator
    const rotator = this._findPrimitive(target, 'rotatorPrimitive') as SpatialRotatorPrimitive | null;
    if (rotator) {
      rotator.addDeltaDeg(15);
      state.state = 'pressing';
      return 'rotator';
    }

    // Try activate
    const activate = this._findPrimitive(target, 'activate');
    if (typeof activate === 'function') {
      (activate as () => void)();
      state.state = 'pressing';
      return 'activate';
    }

    state.state = 'pressing';
    return 'press-no-primitive';
  }

  /**
   * Call when the hand fires a release event (trigger release / pinch end).
   */
  public onRelease(hand: 'left' | 'right', inputSource: XRInputSource | undefined): void {
    const state = this.hands[hand];
    if (state.activeGrab) {
      state.activeGrab.release(inputSource);
      state.activeGrab = null;
    }
    state.activeLever = null;
    state.state = state.hoverTarget ? 'hovering' : 'idle';
  }

  // ---------------------------------------------------------------------------
  // Accessors (for main.ts and tests)
  // ---------------------------------------------------------------------------

  public getHandState(hand: 'left' | 'right'): PointerHandState {
    return this.hands[hand].state;
  }

  public getHoverTarget(hand: 'left' | 'right'): THREE.Object3D | null {
    return this.hands[hand].hoverTarget;
  }

  /**
   * Returns the world-space point where the tested ray ended (hit or max range).
   * This is the SAME point that should be used to draw the visual ray end.
   */
  public getRayEndpoint(hand: 'left' | 'right'): THREE.Vector3 | null {
    return this.hands[hand].rayEndpoint.clone();
  }

  public getActiveGrab(hand: 'left' | 'right'): SpatialGrabPrimitive | null {
    return this.hands[hand].activeGrab;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  public dispose(): void {
    this.interactables.clear();
    this.hitProxies.clear();
    this._forceRelease('left');
    this._forceRelease('right');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Walk up the object hierarchy to find the registered interactable. */
  private _resolveHit(hitObj: THREE.Object3D): THREE.Object3D | null {
    // Check if this object is a proxy for a registered interactable
    for (const [interactable, proxy] of this.hitProxies) {
      if (this._isDescendantOrSelf(hitObj, proxy)) return interactable;
    }
    // Check if hitObj itself (or an ancestor) is registered
    let candidate: THREE.Object3D | null = hitObj;
    while (candidate) {
      if (this.interactables.has(candidate)) return candidate;
      candidate = candidate.parent;
    }
    return null;
  }

  private _isDescendantOrSelf(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
    let candidate: THREE.Object3D | null = obj;
    while (candidate) {
      if (candidate === ancestor) return true;
      candidate = candidate.parent;
    }
    return false;
  }

  /**
   * Walk up the hierarchy to find a userData primitive key.
   * Mirrors `findUserDataPrimitive` in main.ts.
   */
  private _findPrimitive(obj: THREE.Object3D, key: string): unknown {
    let candidate: THREE.Object3D | null = obj;
    while (candidate) {
      if (candidate.userData[key]) return candidate.userData[key];
      candidate = candidate.parent;
    }
    return null;
  }

  private _forceRelease(hand: 'left' | 'right'): void {
    const state = this.hands[hand];
    if (state.activeGrab?.isGrabbed) state.activeGrab.release();
    state.activeGrab = null;
    state.activeLever = null;
    state.hoverTarget = null;
    state.state = 'idle';
    state.exitTimerStarted = false;
    state.exitTimerElapsed = 0;
  }
}
