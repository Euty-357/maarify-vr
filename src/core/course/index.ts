/**
 * Course system public API.
 *
 * - CourseEventBus / courseEventBus — the single channel through which the
 *   shared interaction primitives and the pointer pipeline report learner actions.
 * - MissionRunner — the locked/available/active/done state machine with the
 *   three-level hint ladder and scoring.
 * - validateMissions — structural validation used by the audit script and tests.
 */

export { CourseEventBus, courseEventBus } from './event-bus.js';
export {
  MissionRunner,
  HINT_TIMINGS,
  NO_HINT_BONUS,
  ACCURACY_BONUS,
  type MissionState,
  type MissionScore,
  type MissionScoreSink,
  type MissionRunnerOptions,
  type HintLevel,
} from './mission-runner.js';
export { validateMissions, validateMission, type MissionValidationProblem } from './mission-validation.js';
export { CourseController, type CourseControllerOptions } from './course-controller.js';