export interface UserProgressState {
  completedModules: string[];
  totalXp: number;
  earnedBadges: string[];
  selectedDepthTier: 'foundation' | 'advanced' | 'expert';
  /** Completed course mission ids, in completion order. */
  completedMissions: string[];
  /** Per-mission best score (xp awarded). Used by the capstone summary. */
  missionScores: Record<string, number>;
}

export interface SwappableStorage {
  getProgress(): UserProgressState;
  saveProgress(state: UserProgressState): void;
  awardXp(amount: number): number;
  unlockBadge(badgeId: string): boolean;
  completeModule(moduleId: string): void;
}

/**
 * The single scoring sink used by the course system.
 *
 * `InMemoryProgressStore` is the ONLY place XP, badges, completed missions and
 * the capstone score are recorded. The course runner computes a score and this
 * interface forwards it, so there is no second copy of the bookkeeping.
 * See docs/DECISIONS.md D-019.
 */
export interface CourseScoreSink {
  awardXp(amount: number): void;
  unlockBadge?(badgeId: string): void;
  completeMission?(missionId: string, xp: number): void;
}

export class InMemoryProgressStore implements SwappableStorage, CourseScoreSink {
  private state: UserProgressState = {
    completedModules: [],
    totalXp: 0,
    earnedBadges: [],
    selectedDepthTier: 'foundation',
    completedMissions: [],
    missionScores: {},
  };

  getProgress(): UserProgressState {
    return {
      ...this.state,
      completedMissions: [...this.state.completedMissions],
      missionScores: { ...this.state.missionScores },
    };
  }

  saveProgress(state: UserProgressState): void {
    this.state = {
      ...state,
      completedMissions: [...(state.completedMissions ?? [])],
      missionScores: { ...(state.missionScores ?? {}) },
    };
  }

  awardXp(amount: number): number {
    this.state.totalXp += amount;
    return this.state.totalXp;
  }

  unlockBadge(badgeId: string): boolean {
    if (!this.state.earnedBadges.includes(badgeId)) {
      this.state.earnedBadges.push(badgeId);
      return true;
    }
    return false;
  }

  completeModule(moduleId: string): void {
    if (!this.state.completedModules.includes(moduleId)) {
      this.state.completedModules.push(moduleId);
    }
  }

  setDepthTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    this.state.selectedDepthTier = tier;
  }

  /** Record a completed course mission and its best score. */
  completeMission(missionId: string, xp: number): void {
    if (!this.state.completedMissions.includes(missionId)) {
      this.state.completedMissions.push(missionId);
    }
    const previous = this.state.missionScores[missionId] ?? 0;
    if (xp > previous) {
      this.state.missionScores[missionId] = xp;
    }
  }

  /** Whether a course mission has been completed. */
  isMissionComplete(missionId: string): boolean {
    return this.state.completedMissions.includes(missionId);
  }

  /** Best score for a course mission (0 when never completed). */
  getMissionScore(missionId: string): number {
    return this.state.missionScores[missionId] ?? 0;
  }

  /** Total score across every completed course mission. */
  getCapstoneScore(): number {
    return Object.values(this.state.missionScores).reduce((sum, xp) => sum + xp, 0);
  }
}

