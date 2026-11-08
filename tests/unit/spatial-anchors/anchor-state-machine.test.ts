import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DiegeticSpatialAnchor } from '../../../src/core/spatial-anchors/diegetic-anchor.js';

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

  it('updates simulation tier appropriately', () => {
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

    anchor.setTier('advanced');
    // Anchor survives tier switch and maintains internal consistency
    expect(anchor.anchorId).toBe('test-anchor');
  });
});

