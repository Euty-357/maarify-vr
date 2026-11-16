/**
 * Failing tests for the unified pointer pipeline.
 * Written BEFORE the implementation (test-first rule).
 *
 * Tests assert the PointerPipeline state machine contracts.
 * These will pass once pointer-pipeline.ts is implemented.
 *
 * verified by unit test (Vitest)
 * NOT verified on headset
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PointerPipeline } from '../../../src/core/input/pointer-pipeline.js';
import { SpatialGrabPrimitive } from '../../../src/core/input/primitives/grab.js';

// ─── helpers ──────────────────────────────────────────────────────────────

function makeInteractableBox(position: THREE.Vector3, size = 0.1): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshBasicMaterial()
  );
  mesh.position.copy(position);
  mesh.name = `interactable-${Math.random().toFixed(4)}`;
  mesh.updateMatrixWorld(true);
  return mesh;
}

function makeGrabbable(position: THREE.Vector3): { mesh: THREE.Mesh; grab: SpatialGrabPrimitive } {
  const mesh = makeInteractableBox(position);
  const grab = new SpatialGrabPrimitive(mesh, {});
  return { mesh, grab };
}

function makePanelQuad(position: THREE.Vector3, width = 0.4, height = 0.3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial()
  );
  mesh.position.copy(position);
  mesh.name = 'panel-quad';
  mesh.userData.isPanel = true;
  mesh.updateMatrixWorld(true);
  return mesh;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PointerPipeline – initial state', () => {
  let pipeline: PointerPipeline;

  beforeEach(() => {
    pipeline = new PointerPipeline();
  });

  it('starts with no hover target for either hand', () => {
    expect(pipeline.getHoverTarget('left')).toBeNull();
    expect(pipeline.getHoverTarget('right')).toBeNull();
  });

  it('starts with both hands in idle state', () => {
    expect(pipeline.getHandState('left')).toBe('idle');
    expect(pipeline.getHandState('right')).toBe('idle');
  });
});

describe('PointerPipeline – registerInteractable', () => {
  let pipeline: PointerPipeline;
  let scene: THREE.Scene;

  beforeEach(() => {
    pipeline = new PointerPipeline();
    scene = new THREE.Scene();
  });

  it('registers an interactable without throwing', () => {
    const mesh = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(mesh);
    expect(() => pipeline.registerInteractable(mesh)).not.toThrow();
  });

  it('unregisters an interactable without throwing', () => {
    const mesh = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(mesh);
    pipeline.registerInteractable(mesh);
    expect(() => pipeline.unregisterInteractable(mesh)).not.toThrow();
  });
});

describe('PointerPipeline – ray hover transitions', () => {
  let pipeline: PointerPipeline;
  let scene: THREE.Scene;

  beforeEach(() => {
    pipeline = new PointerPipeline();
    scene = new THREE.Scene();
  });

  it('enters hovering state when ray hits a registered interactable', () => {
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(target);
    pipeline.registerInteractable(target);

    // Ray from origin pointing -Z, hitting the object at (0,1,-1)
    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    pipeline.updateRay('right', origin, direction, scene);

    expect(pipeline.getHandState('right')).toBe('hovering');
    expect(pipeline.getHoverTarget('right')).toBe(target);
  });

  it('stays idle when ray misses all registered interactables', () => {
    const target = makeInteractableBox(new THREE.Vector3(5, 0, 0)); // far to the side
    scene.add(target);
    pipeline.registerInteractable(target);

    // Ray pointing -Z, misses object at x=5
    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    pipeline.updateRay('right', origin, direction, scene);

    expect(pipeline.getHandState('right')).toBe('idle');
    expect(pipeline.getHoverTarget('right')).toBeNull();
  });

  it('applies hysteresis — stays hovering for EXIT_HYSTERESIS window after ray leaves', () => {
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(target);
    pipeline.registerInteractable(target);

    // Enter hover
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), scene);
    expect(pipeline.getHandState('right')).toBe('hovering');

    // Ray now misses — but hysteresis window has NOT elapsed
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), scene, 0.01);
    // Should still be hovering during hysteresis
    expect(pipeline.getHandState('right')).toBe('hovering');
  });

  it('exits hovering to idle after hysteresis window expires', () => {
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(target);
    pipeline.registerInteractable(target);

    // Enter hover
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), scene);
    expect(pipeline.getHandState('right')).toBe('hovering');

    // Ray misses; advance time beyond hysteresis (0.08s default)
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), scene, 0.1);
    expect(pipeline.getHandState('right')).toBe('idle');
    expect(pipeline.getHoverTarget('right')).toBeNull();
  });
});

describe('PointerPipeline – grab', () => {
  let pipeline: PointerPipeline;
  let scene: THREE.Scene;

  beforeEach(() => {
    pipeline = new PointerPipeline();
    scene = new THREE.Scene();
  });

  it('grab only starts on the specifically hovered target', () => {
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -0.8));
    target.userData.grabPrimitive = new SpatialGrabPrimitive(target, {});
    const otherObj = makeInteractableBox(new THREE.Vector3(2, 1, -0.8));
    otherObj.userData.grabPrimitive = new SpatialGrabPrimitive(otherObj, {});
    scene.add(target);
    scene.add(otherObj);
    pipeline.registerInteractable(target);
    pipeline.registerInteractable(otherObj);

    // Ray hits `target` only
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), scene);
    expect(pipeline.getHoverTarget('right')).toBe(target);

    // Select: grab should start on `target` not `otherObj`
    pipeline.onSelect('right', undefined);
    expect(pipeline.getHandState('right')).toBe('pressing');
    expect((otherObj.userData.grabPrimitive as SpatialGrabPrimitive).isGrabbed).toBe(false);
  });

  it('release is clean — isGrabbed becomes false', () => {
    const { mesh, grab } = makeGrabbable(new THREE.Vector3(0, 1, -0.8));
    scene.add(mesh);
    pipeline.registerInteractable(mesh);

    // Hover then grab
    pipeline.updateRay('right', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), scene);
    pipeline.onSelect('right', undefined);
    expect(pipeline.getHandState('right')).toBe('pressing');

    // Release
    pipeline.onRelease('right', undefined);
    expect(grab.isGrabbed).toBe(false);
    expect(pipeline.getHandState('right')).not.toBe('pressing');
    expect(pipeline.getHandState('right')).not.toBe('dragging');
  });
});

describe('PointerPipeline – panel capture', () => {
  let pipeline: PointerPipeline;
  let scene: THREE.Scene;

  beforeEach(() => {
    pipeline = new PointerPipeline();
    scene = new THREE.Scene();
  });

  it('panel captures pointer only when ray intersects the actual quad', () => {
    // Panel at (0, 1, -1), facing +Z (toward origin)
    const panel = makePanelQuad(new THREE.Vector3(0, 1, -1));
    panel.lookAt(new THREE.Vector3(0, 1, 0));
    panel.updateMatrixWorld(true);
    scene.add(panel);
    pipeline.registerInteractable(panel);

    // Ray hits the panel directly
    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    pipeline.updateRay('right', origin, direction, scene);
    expect(pipeline.getHoverTarget('right')).toBe(panel);
  });

  it('panel does NOT capture when ray misses the quad by more than half-width', () => {
    const panel = makePanelQuad(new THREE.Vector3(0, 1, -1), 0.4, 0.3);
    panel.lookAt(new THREE.Vector3(0, 1, 0));
    panel.updateMatrixWorld(true);
    scene.add(panel);
    pipeline.registerInteractable(panel);

    // Ray offset by 0.3m to the right — misses 0.4m-wide panel (half = 0.2m)
    const origin = new THREE.Vector3(0.3, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    pipeline.updateRay('right', origin, direction, scene);
    expect(pipeline.getHoverTarget('right')).toBeNull();
  });
});

describe('PointerPipeline – drawn ray matches tested ray', () => {
  it('getRayEndpoint returns the same point the raycaster tested', () => {
    const pipeline = new PointerPipeline();
    const scene = new THREE.Scene();
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -1.5));
    scene.add(target);
    pipeline.registerInteractable(target);

    const origin = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    pipeline.updateRay('right', origin, direction, scene);

    const endpoint = pipeline.getRayEndpoint('right');
    // Endpoint should be near the hit object (within 0.2m tolerance)
    expect(endpoint).not.toBeNull();
    if (endpoint) {
      const dist = endpoint.distanceTo(new THREE.Vector3(0, 1, -1.5));
      expect(dist).toBeLessThan(0.2);
    }
  });
});

describe('PointerPipeline – dispose', () => {
  it('disposes without throwing', () => {
    const pipeline = new PointerPipeline();
    const scene = new THREE.Scene();
    const target = makeInteractableBox(new THREE.Vector3(0, 1, -1));
    scene.add(target);
    pipeline.registerInteractable(target);
    expect(() => pipeline.dispose()).not.toThrow();
  });
});
