export type TravelMode = 'real-light-speed' | 'cinematic-warp';
export type TravelState = 'idle' | 'departing' | 'arriving';

export interface TravelDestination {
  id: string;
  position: { x: number; z: number };
  mode: TravelMode;
}

/** Compact, deterministic travel state machine used by spatial navigation props. */
export class TravelSystem {
  public state: TravelState = 'idle';
  private destination: TravelDestination | null = null;
  private elapsedSeconds = 0;

  public begin(destination: TravelDestination): boolean {
    if (this.state !== 'idle') return false;
    this.destination = destination;
    this.state = 'departing';
    this.elapsedSeconds = 0;
    return true;
  }

  public update(deltaSeconds: number): TravelDestination | null {
    if (this.state === 'idle' || !this.destination) return null;
    this.elapsedSeconds += deltaSeconds;
    // Comfort transition: short, user-initiated, fixed reference frame handled by caller.
    if (this.state === 'departing' && this.elapsedSeconds >= 0.45) {
      this.state = 'arriving';
      return this.destination;
    }
    if (this.state === 'arriving' && this.elapsedSeconds >= 0.9) {
      this.state = 'idle';
      this.destination = null;
      this.elapsedSeconds = 0;
    }
    return null;
  }
}
