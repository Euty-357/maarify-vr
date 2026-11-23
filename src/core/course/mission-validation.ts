/**
 * Mission validation — the shared rules behind the audit script and the unit tests.
 *
 * A mission is only valid when it has:
 * - a three-level hint ladder (highlight / clearer hint / show me)
 * - a success predicate with a numeric tolerance
 * - a debrief (feedback copy for success, near miss and wrong)
 * - per-tier outcomes that actually differ
 * - seated and reduced-motion variants
 */

import type { CourseTier, MissionDefinition } from '../types.js';

export interface MissionValidationProblem {
  missionId: string;
  problem: string;
}

const TIERS: CourseTier[] = ['foundation', 'advanced', 'expert'];

/** Validate one mission. Returns a list of human-readable problems. */
export function validateMission(mission: MissionDefinition): MissionValidationProblem[] {
  const problems: MissionValidationProblem[] = [];
  const add = (problem: string): void => {
    problems.push({ missionId: mission.id, problem });
  };

  if (!mission.id) add('missing id');
  if (!mission.title) add('missing title');
  if (!mission.objective) add('missing objective');

  // Hint ladder: exactly three levels.
  if (!Array.isArray(mission.hints) || mission.hints.length !== 3) {
    add(`hint ladder must have exactly 3 levels, found ${mission.hints?.length ?? 0}`);
  } else {
    mission.hints.forEach((hint, index) => {
      if (!hint || !hint.trim()) add(`hint level ${index + 1} is empty`);
    });
  }

  // Success predicate and tolerance.
  if (typeof mission.successPredicate !== 'function') add('missing success predicate');
  if (typeof mission.tolerance !== 'number' || !Number.isFinite(mission.tolerance)) {
    add('missing or invalid numeric tolerance');
  } else if (mission.tolerance < 0) {
    add('tolerance must not be negative');
  }

  // Debrief / feedback.
  if (!mission.feedback) {
    add('missing debrief feedback');
  } else {
    if (!mission.feedback.success?.trim()) add('missing success debrief');
    if (!mission.feedback.nearMiss?.trim()) add('missing near-miss debrief');
    if (!mission.feedback.wrong?.trim()) add('missing wrong-attempt debrief');
  }

  // Steps: at least one, each with a caption and a predicate.
  if (!mission.steps || mission.steps.length === 0) {
    add('has no steps');
  } else {
    mission.steps.forEach((step, index) => {
      if (!step.id) add(`step ${index + 1} has no id`);
      if (!step.caption?.trim()) add(`step ${index + 1} has no caption`);
      if (typeof step.completed !== 'function') add(`step ${index + 1} has no completion predicate`);
    });
  }

  // Per-tier outcomes must exist and must differ from each other.
  for (const tier of TIERS) {
    const text = mission.outcomes?.[tier];
    if (!text || !text.trim()) {
      add(`missing ${tier} outcome`);
    }
  }
  const texts = TIERS.map((tier) => mission.outcomes?.[tier]?.trim() ?? '');
  if (new Set(texts).size !== 3) {
    add('tier outcomes must all differ from each other');
  }

  // Scoring.
  if (typeof mission.xp !== 'number' || mission.xp <= 0) add('missing or invalid xp');
  if (!mission.sources || mission.sources.length === 0) {
    add('has no source ids — every learner-facing claim must be sourced');
  }

  // Accessibility variants.
  if (!mission.seatedVariant?.trim()) add('missing seated variant');
  if (!mission.reducedMotionVariant?.trim()) add('missing reduced-motion variant');

  return problems;
}

/** Validate a whole mission list. */
export function validateMissions(missions: MissionDefinition[]): MissionValidationProblem[] {
  const problems: MissionValidationProblem[] = [];
  const seen = new Set<string>();

  if (!missions || missions.length === 0) {
    return [{ missionId: '(module)', problem: 'no missions defined' }];
  }

  for (const mission of missions) {
    problems.push(...validateMission(mission));
    if (seen.has(mission.id)) {
      problems.push({ missionId: mission.id, problem: 'duplicate mission id' });
    }
    seen.add(mission.id);
  }

  return problems;
}