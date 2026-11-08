/**
 * WebXR Gamepad Haptics Helper.
 * Invokes native voice-coil / resonant actuators on Touch Plus / Touch Pro controllers.
 */
export function triggerHapticPulse(
  inputSource: XRInputSource | undefined,
  intensity = 0.5,
  durationMs = 25
): boolean {
  if (!inputSource || !inputSource.gamepad) return false;

  const actuators = (inputSource.gamepad as any).hapticActuators;
  if (actuators && actuators.length > 0) {
    try {
      actuators[0].pulse(intensity, durationMs).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

