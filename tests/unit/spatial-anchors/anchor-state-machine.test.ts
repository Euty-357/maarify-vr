import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DiegeticSpatialAnchor } from '../../../src/core/spatial-anchors/diegetic-anchor.js';
import { SpatialAnchorPrimitive } from '../../../src/core/input/primitives/anchor.js';

describe('Diegetic Spatial Anchor State Machine', () => {
  it('initializes in collapsed/resting state with leader line and tag', () => {
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
});

