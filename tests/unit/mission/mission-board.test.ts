import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  MissionBoard,
  buildDrAmaniCaptionPanel,
  defaultMissionFor,
} from '../../../src/core/mission/mission-board.js';
import type { ChallengeDefinition, ModuleMission } from '../../../src/core/types.js';

const mission: ModuleMission = defaultMissionFor('Test Module');
const challenges: ChallengeDefinition[] = [
  { id: 'c1', title: 'First challenge', description: 'd', type: 'assembly', xpReward: 10, seatedCompatible: true },
  { id: 'c2', title: 'Second challenge', description: 'd', type: 'tune', xpReward: 20, seatedCompatible: true },
];

function makeBoard(): MissionBoard {
  return new MissionBoard(mission, challenges);
}

describe('MissionBoard positioning', () => {
  it('positions the board at y=1.2, z=-1.45 from module spawn', () => {
    const board = makeBoard();
    expect(board.position.x).toBe(0);
    expect(board.position.y).toBeCloseTo(1.2, 5);
    expect(board.position.z).toBeCloseTo(-1.45, 5);
  });
});

describe('MissionBoard.nextObjectiveGlow', () => {
  it('captures the target and its original emissive intensity', () => {
    const board = makeBoard();
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissiveIntensity: 0.3 }),
    );
    board.nextObjectiveGlow(target);
    // A mid-pulse update should drive the emissive intensity away from the original.
    board.update(0.2);
    const mat = target.material as THREE.MeshStandardMaterial;
    expect(mat.emissiveIntensity).not.toBe(0.3);
    expect(mat.emissiveIntensity).toBeGreaterThan(0);
  });

  it('restores the original emissive intensity after 1.2s and clears the glow target', () => {
    const board = makeBoard();
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissiveIntensity: 0.25 }),
    );
    board.nextObjectiveGlow(target);
    // Drive just past 1.2s total.
    board.update(1.21);
    const mat = target.material as THREE.MeshStandardMaterial;
    expect(mat.emissiveIntensity).toBeCloseTo(0.25, 5);
    // Further updates are a no-op (glow target cleared).
    const before = mat.emissiveIntensity;
    board.update(0.1);
    expect(mat.emissiveIntensity).toBe(before);
  });

  it('produces a pulse peak near the middle of each 0.4s pulse', () => {
    const board = makeBoard();
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissiveIntensity: 0 }),
    );
    board.nextObjectiveGlow(target);
    const mat = target.material as THREE.MeshStandardMaterial;
    // Halfway through the first pulse (0.2s): sin(0.5*PI) = 1 -> peak 0.8.
    board.update(0.2);
    expect(mat.emissiveIntensity).toBeCloseTo(0.8, 4);
    // End of first pulse (0.4s): sin(PI) = 0 -> back to ~0.
    board.update(0.2);
    expect(mat.emissiveIntensity).toBeCloseTo(0, 4);
  });

  it('does not throw when the target lacks a MeshStandardMaterial', () => {
    const board = makeBoard();
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    expect(() => board.nextObjectiveGlow(target)).not.toThrow();
    expect(() => board.update(0.2)).not.toThrow();
    // After 1.2s the basic material is untouched and glow clears without error.
    expect(() => board.update(1.21)).not.toThrow();
  });

  it('does not throw when the target is not a Mesh', () => {
    const board = makeBoard();
    expect(() => board.nextObjectiveGlow(new THREE.Object3D())).not.toThrow();
    expect(() => board.update(0.2)).not.toThrow();
  });
});

describe('MissionBoard.update', () => {
  it('is a no-op when no glow target has been set', () => {
    const board = makeBoard();
    expect(() => board.update(0.5)).not.toThrow();
  });
});

describe('buildDrAmaniCaptionPanel', () => {
  it('returns a blank panel positioned at y=1.65, z=1.5 in module-local space', () => {
    const panel = buildDrAmaniCaptionPanel();
    expect(panel.isMesh).toBe(true);
    expect(panel.userData.textPanel.text).toBe('');
    expect(panel.position.x).toBe(0);
    expect(panel.position.y).toBeCloseTo(1.65, 5);
    expect(panel.position.z).toBeCloseTo(1.5, 5);
  });
});
