import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DiegeticSpatialAnchor } from '../../../src/core/spatial-anchors/diegetic-anchor.js';
import { SpatialAnchorPrimitive } from '../../../src/core/input/primitives/anchor.js';

describe('Diegetic Spatial Anchor State Machine', () => {
  it('initializes in collapsed/resting state with a hidden tag and micro-sim', () => {
    const anchor = new DiegeticSpatialAnchor(
      'test-anchor',
      new THREE.Vector3(0, 1.2, -1.0),
      'Test Part',
      'Brief explanation for intuition.',
      {
        type: 'exploded-view',
        caption: 'Pull apart with two hands.',
      }
    );

    expect(anchor.isExpanded).toBe(false);
    expect(anchor.anchorId).toBe('test-anchor');
    expect(anchor.anchorLabel).toBe('Test Part');

    // Micro sim root should not be visible when resting
    const simRoot = anchor.getObjectByName('micro-sim-root-test-anchor');
    expect(simRoot).toBeDefined();
    expect(simRoot?.visible).toBe(false);
  });

  it('transitions from resting to expanded micro-simulation on toggle', () => {
    const anchor = new DiegeticSpatialAnchor(
      'test-anchor',
      new THREE.Vector3(0, 1.2, -1.0),
      'Test Part',
      'Brief explanation.',
      {
        type: 'exploded-view',
        caption: 'Pull apart.',
      }
    );

    anchor.toggleExpanded();
    expect(anchor.isExpanded).toBe(true);
    const simRoot = anchor.getObjectByName('micro-sim-root-test-anchor');
    expect(simRoot?.visible).toBe(true);

    // Toggle back to collapsed
    anchor.toggleExpanded();
    expect(anchor.isExpanded).toBe(false);
    expect(simRoot?.visible).toBe(false);
  });

  it('applies a depth tier to the simulation caption and scale', () => {
    const anchor = new DiegeticSpatialAnchor(
      'test-anchor',
      new THREE.Vector3(0, 1.2, -1.0),
      'Test Part',
      'Brief explanation.',
      {
        type: 'exploded-view',
        caption: 'Pull apart.',
      }
    );

    anchor.applyTier('expert', { type: 'cross-section-flux', caption: 'Slice the flux.' });

    expect(anchor.activeTier).toBe('expert');
    expect(anchor.getState().simulationType).toBe('cross-section-flux');
    expect(anchor.getState().simulationCaption).toBe('Slice the flux.');
  });

  it('propagates the depth tier to every registered anchor', () => {
    const container = new THREE.Group();
    const primitive = new SpatialAnchorPrimitive(container);
    primitive.registerAnchor({
      id: 'tiered-anchor',
      anchorPosition: new THREE.Vector3(0, 1, -1),
      label: 'Tiered',
      level1Note: 'Note.',
      level2Simulation: {
        foundation: { type: 'exploded-view', description: 'f', caption: 'Foundation caption' },
        advanced: { type: 'scrubbable-mechanism', description: 'a', caption: 'Advanced caption' },
        expert: { type: 'cross-section-flux', description: 'e', caption: 'Expert caption' },
      },
      sourceRefs: ['TEST'],
    });

    primitive.updateTier('advanced');
    const anchor = primitive.getAnchor('tiered-anchor');
    expect(anchor?.activeTier).toBe('advanced');
    expect(anchor?.getState().simulationCaption).toBe('Advanced caption');

    primitive.updateTier('expert');
    expect(anchor?.getState().simulationCaption).toBe('Expert caption');
  });

  it('renders collapsed by default with glowing ⓘ indicator and FrontSide materials (no mirrored text)', () => {
    const anchor = new DiegeticSpatialAnchor(
      'indicator-test',
      new THREE.Vector3(0, 1.2, -1.0),
      'Indicator Test',
      'Brief explanation.',
      { type: 'exploded-view', caption: 'Pull apart.' }
    );

    // Collapsed by default
    expect(anchor.isExpanded).toBe(false);

    const indicator = anchor.getObjectByName('anchor-indicator-indicator-test') as THREE.Mesh | undefined;
    // Information System V3: the floating "i" badge was replaced by engraved
    // brass placards. The badge and the leader line are DELETED, not merely
    // hidden, so they cannot leak a geometry, a material and a canvas texture
    // per anchor and cannot draw a leftover ray.
    expect(indicator).toBeUndefined();

    const leaderLine = anchor.children.find(
      (child) => child instanceof THREE.Line || child instanceof THREE.LineSegments,
    );
    expect(leaderLine).toBeUndefined();

    const tag = anchor.getObjectByName('anchor-tag-indicator-test') as THREE.Mesh;
    expect(tag).toBeDefined();
    expect(tag.visible).toBe(false);

    // The tag must use FrontSide material so text cannot be viewed mirrored from behind
    expect((tag.material as THREE.Material).side).toBe(THREE.FrontSide);
  });

  it('orients tag toward camera position when expanded', () => {
    const anchor = new DiegeticSpatialAnchor(
      'orient-test',
      new THREE.Vector3(0, 1.2, -1.0),
      'Orient Test',
      'Brief explanation.',
      { type: 'exploded-view', caption: 'Pull apart.' }
    );

    const cameraPos = new THREE.Vector3(0, 1.6, 0); // User standing at origin looking at z = -1.0
    anchor.toggleExpansion(cameraPos);
    expect(anchor.isExpanded).toBe(true);

    const tag = anchor.getObjectByName('anchor-tag-orient-test') as THREE.Mesh;
    expect(tag.visible).toBe(true);
    // Tag should be offset toward the camera (z > 0 relative to anchor)
    expect(tag.position.z).toBeGreaterThan(0);
  });
});

