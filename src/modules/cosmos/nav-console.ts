/**
 * Navigation destination types and pure formatting helpers for educational travel.
 * Validates: Requirements 22.1, 59.1, 59.2
 */

export interface NavigationDestination {
  id: string;
  name: string;
  position: { x: number; z: number };
  mode: 'cinematic-warp' | 'real-light-speed';
  lightTravelTimeYears: number;
  lightTravelTimeLabel: string;
}

/** Formats the diegetic button label on the navigation console (Req 22.1). */
export function formatConsoleLabel(dest: NavigationDestination): string {
  const modeLabel = dest.mode === 'cinematic-warp' ? 'Cinematic Warp' : 'Real Light-Speed';
  return `${dest.name}\n${modeLabel}\n${dest.lightTravelTimeLabel}`;
}

/**
 * Formats the pre-warp educational readout for real light-speed mode (Req 59.1, 59.2).
 */
export function formatRealSpeedReadout(dest: NavigationDestination): string {
  return `At the speed of light: ${dest.lightTravelTimeLabel} to ${dest.name}\nReal speed shown for educational honesty.`;
}
