export interface UserProgressState {
  completedModules: string[];
  totalXp: number;
  earnedBadges: string[];
  selectedDepthTier: 'foundation' | 'advanced' | 'expert';
}

export interface SwappableStorage {
  getProgress(): UserProgressState;
  saveProgress(state: UserProgressState): void;
  awardXp(amount: number): number;
  unlockBadge(badgeId: string): boolean;
  completeModule(moduleId: string): void;
}

export class InMemoryProgressStore implements SwappableStorage {
  private state: UserProgressState = {
    completedModules: [],
    totalXp: 0,
    earnedBadges: [],
    selectedDepthTier: 'foundation',
  };

  getProgress(): UserProgressState {
    return { ...this.state };
  }

  saveProgress(state: UserProgressState): void {
    this.state = { ...state };
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
}

