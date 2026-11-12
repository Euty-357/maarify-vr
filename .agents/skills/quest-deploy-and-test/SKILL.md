---
name: quest-deploy-and-test
description: >
  Deploying to Meta Quest 3 and Quest 3S via adb reverse, MQDH,
  Developer Mode setup, and running the Quest 3/3S device checks.
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

## Quest 3 / 3S Device Check
See `docs/HEADSET_TEST.md` for the current list. In short:
1. [ ] Portal entry by walking within 1 m and by trigger; `RET hub-hit`.
2. [ ] Grab at distance (`RET ray-grab`) and release into a socket.
3. [ ] Teleport lands inside the hub radius; snap turn pivots on the head.
4. [ ] Controllers↔hands switching keeps `POSE 2/2` and rays live.
5. [ ] Text legible at 1 m and 2 m on Quest 3S as well as Quest 3.
6. [ ] OVR Metrics records frame time, dropped frames and thermal state.
7. [ ] Record which refresh rates `supportedFrameRates` exposes on each device.
8. [ ] No Quest 3-only MR feature is required for any lesson.
