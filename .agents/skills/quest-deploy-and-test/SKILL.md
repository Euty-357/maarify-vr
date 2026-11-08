---
name: quest-deploy-and-test
description: >
  Deploying to Meta Quest 3, 3S, and Quest 2 via adb reverse, MQDH,
  Developer Mode setup, and running the Hub Device Smoke-Test procedure.
  Load when preparing for headset testing or writing deployment docs.
---

# Quest Deploy and Test Skill (Meta Quest 3 Focus)

## Prerequisites
1. **Developer Mode:** Enable in Meta Horizon smartphone app (Settings $\to$ Devices $\to$ Developer Mode).
2. **Connection:** High-speed USB-C cable to PC; allow USB debugging on headset prompt.
3. **Verify Connection:**
   ```powershell
   adb devices
   ```

## Fast Local Development (`adb reverse`)
Vite dev server runs on HTTP localhost. Quest Browser permits WebXR on `http://localhost`:
```powershell
# 1. Start PC Vite server
npm run dev

# 2. Reverse port forward to Quest 3
adb reverse tcp:5173 tcp:5173

# 3. Inside Quest 3 Browser, navigate to:
http://localhost:5173
```

## OVR Metrics Tool & On-Device Profiling
- **FPS & Frame Latency Overlay:**
  Install OVR Metrics Tool APK from Meta Developer portal. Enable persistent HUD overlay to observe frame rate (72/90/120 Hz) and GPU/CPU utilization in real time.
- **Command Line Profiler:**
  ```powershell
  adb shell ovrgpuprofiler -t
  ```

## Tuesday Headset Smoke-Test Checklist
Located at the **Hub Device Smoke-Test Zone**:
1. [ ] Direct index finger poke triggers chime and haptic detent.
2. [ ] Touch Plus controller grip grab and release calibration cube cleanly.
3. [ ] Teleport and 30° snap-turn operate smoothly without stutter.
4. [ ] Smooth locomotion triggers peripheral radial vignette; zero nausea.
5. [ ] Spatial audio HRTF pans cleanly as tester walks 360° around beacon.
6. [ ] Color passthrough MR toggle functions with transparent background (Quest 3).
7. [ ] Target frame rate switches cleanly between 72Hz, 90Hz, and 120Hz.
8. [ ] Spatial anchor tags legible at 1.0 m, 1.5 m, and 2.0 m distances.
