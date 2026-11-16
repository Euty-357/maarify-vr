/**
 * Shared Stakeholder Cause-and-Effect Simulation Engine
 *
 * Used by Climate & Environment (Mau Forest / Naivasha watershed) and
 * Urban Development & Planning modules to model non-linear community,
 * economic, and ecological dependencies in WebXR.
 *
 * Visibly labelled in UI: "Simplified model — not engineering grade"
 */

export interface Stakeholder {
  id: string;
  name: string;
  category: 'community' | 'economy' | 'ecosystem' | 'governance';
  wellbeing: number; // 0 to 100
  baseWellbeing: number;
  dependsOn: string[]; // IDs of resources or stakeholders
  description: string;
}

export interface SimResource {
  id: string;
  name: string;
  quantity: number; // 0 to 100
  baseQuantity: number;
  regenerationRate: number; // units per second
  capacity: number; // max 100
  description: string;
}

export interface SimActionEffect {
  targetId: string;
  delta: number;
}

export interface SimAction {
  id: string;
  name: string;
  description: string;
  applied: boolean;
  effects: SimActionEffect[];
}

export interface SimGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface SimulationSnapshot {
  timestamp: number;
  stakeholders: Record<string, number>;
  resources: Record<string, number>;
  overallHealth: number; // 0 to 100
}

export class StakeholderSimulation {
  private stakeholders: Map<string, Stakeholder> = new Map();
  private resources: Map<string, SimResource> = new Map();
  private actions: Map<string, SimAction> = new Map();
  private edges: SimGraphEdge[] = [];
  private history: SimulationSnapshot[] = [];

  constructor() {}

  public addStakeholder(stakeholder: Stakeholder): this {
    this.stakeholders.set(stakeholder.id, {
      ...stakeholder,
      wellbeing: Math.max(0, Math.min(100, stakeholder.wellbeing)),
      baseWellbeing: stakeholder.wellbeing,
    });
    return this;
  }

  public addResource(resource: SimResource): this {
    this.resources.set(resource.id, {
      ...resource,
      quantity: Math.max(0, Math.min(resource.capacity, resource.quantity)),
      baseQuantity: resource.quantity,
    });
    return this;
  }

  public addAction(action: SimAction): this {
    this.actions.set(action.id, { ...action, applied: false });
    return this;
  }

  public addDependency(sourceId: string, targetId: string, weight: number = 0.5): this {
    this.edges.push({ source: sourceId, target: targetId, weight });
    return this;
  }

  public getStakeholder(id: string): Stakeholder | undefined {
    return this.stakeholders.get(id);
  }

  public getAllStakeholders(): Stakeholder[] {
    return Array.from(this.stakeholders.values());
  }

  public getResource(id: string): SimResource | undefined {
    return this.resources.get(id);
  }

  public getAllResources(): SimResource[] {
    return Array.from(this.resources.values());
  }

  public getAllActions(): SimAction[] {
    return Array.from(this.actions.values());
  }

  public getEdges(): SimGraphEdge[] {
    return [...this.edges];
  }

  /**
   * Apply or toggle a policy or intervention action.
   * Modifies targets and propagates ripple effects through the dependency graph.
   */
  public toggleAction(actionId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    const multiplier = action.applied ? -1 : 1;
    action.applied = !action.applied;

    // Apply direct effects
    for (const effect of action.effects) {
      const resource = this.resources.get(effect.targetId);
      if (resource) {
        resource.quantity = Math.max(0, Math.min(resource.capacity, resource.quantity + effect.delta * multiplier));
      }

      const stakeholder = this.stakeholders.get(effect.targetId);
      if (stakeholder) {
        stakeholder.wellbeing = Math.max(0, Math.min(100, stakeholder.wellbeing + effect.delta * multiplier));
      }
    }

    // Propagate secondary ripple effects through dependencies
    this.propagateRippleEffects();
    this.recordSnapshot();
    return action.applied;
  }

  /**
   * Propagate ripple effects from resource levels to dependent stakeholders.
   */
  private propagateRippleEffects(): void {
    // Each stakeholder's wellbeing adjusts based on the health of resources and nodes it depends on
    for (const stakeholder of this.stakeholders.values()) {
      let dependencyScore = 0;
      let count = 0;

      for (const depId of stakeholder.dependsOn) {
        const resource = this.resources.get(depId);
        if (resource) {
          dependencyScore += resource.quantity / resource.capacity;
          count++;
        }
        const otherStakeholder = this.stakeholders.get(depId);
        if (otherStakeholder) {
          dependencyScore += otherStakeholder.wellbeing / 100;
          count++;
        }
      }

      if (count > 0) {
        const avgDepHealth = dependencyScore / count;
        // Blend intrinsic base wellbeing (40%) with dependency health (60%)
        const targetWellbeing = stakeholder.baseWellbeing * 0.4 + avgDepHealth * 100 * 0.6;
        // Move towards target smoothly
        stakeholder.wellbeing = Math.round(Math.max(0, Math.min(100, targetWellbeing)));
      }
    }
  }

  /**
   * Advance simulation time (e.g. natural regeneration or continuous decay).
   */
  public update(deltaSeconds: number): void {
    let changed = false;
    for (const res of this.resources.values()) {
      if (res.regenerationRate !== 0) {
        const oldVal = res.quantity;
        res.quantity = Math.max(0, Math.min(res.capacity, res.quantity + res.regenerationRate * deltaSeconds));
        if (Math.abs(res.quantity - oldVal) > 0.01) {
          changed = true;
        }
      }
    }

    if (changed) {
      this.propagateRippleEffects();
    }
  }

  public getOverallHealth(): number {
    let sum = 0;
    let count = 0;

    for (const s of this.stakeholders.values()) {
      sum += s.wellbeing;
      count++;
    }
    for (const r of this.resources.values()) {
      sum += (r.quantity / r.capacity) * 100;
      count++;
    }

    return count > 0 ? Math.round(sum / count) : 100;
  }

  private recordSnapshot(): void {
    const sMap: Record<string, number> = {};
    for (const [id, s] of this.stakeholders) {
      sMap[id] = s.wellbeing;
    }
    const rMap: Record<string, number> = {};
    for (const [id, r] of this.resources) {
      rMap[id] = r.quantity;
    }

    this.history.push({
      timestamp: Date.now(),
      stakeholders: sMap,
      resources: rMap,
      overallHealth: this.getOverallHealth(),
    });
  }

  public reset(): void {
    for (const s of this.stakeholders.values()) {
      s.wellbeing = s.baseWellbeing;
    }
    for (const r of this.resources.values()) {
      r.quantity = r.baseQuantity;
    }
    for (const a of this.actions.values()) {
      a.applied = false;
    }
    this.history = [];
    this.recordSnapshot();
  }
}
