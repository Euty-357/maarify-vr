# HEADSET TEST GUIDE & PROTOCOL
_Primary Test Device: Meta Quest 3 (Quest 3S & Quest 2 supported)_
_Last Updated: 2026-11-08_
_Status: Pre-device instructions. All headset metrics marked NOT verified on headset until Tuesday test run._
> **Companion Backlog:** See [DEVICE_TEST_BACKLOG.md](file:///c:/maarify/docs/DEVICE_TEST_BACKLOG.md) for the active list of headset-only test cases (DT-001+).

## 1. Prerequisites & Host Machine Setup
1. **Developer Mode:** Enabled on Meta Quest 3 via the Meta Horizon companion app (Settings $\to$ Devices $\to$ Developer Mode).
2. **Android Platform Tools (adb):** Ensure `adb` is in your system PATH.
3. **USB-C Connection:** Connect Quest 3 to your Windows PC with a high-speed USB-C cable (or Link cable). Put on headset and tap **"Always allow USB debugging from this computer"**.
4. **Verify Connectivity:**
   ```powershell
   adb devices
   # Output should show: <device_serial>   device
   ```

---

## 2. Fast Development Loop (`adb reverse`)
Because the Quest Browser treats `http://localhost` as a secure origin, WebXR immersive sessions run without needing custom HTTPS certificates or tunnel latency.

1. **Start local Vite development server on PC:**
   ```powershell
   cd C:\maarify
   npm run dev
   # Vite serves on http://localhost:5173
   ```
2. **Forward port 5173 to the headset:**
   ```powershell
   adb reverse tcp:5173 tcp:5173
   ```
3. **Open Quest Browser inside the headset:**
   - In the URL bar, navigate to: `http://localhost:5173`
   - Tap the spatial **"Enter VR"** (or **"Enter MR"**) button.

---

## 3. Real-Time Performance Profiling on Quest 3
To monitor real Snapdragon XR2 Gen 2 GPU/CPU utilization, frame rate, and thermal headroom:

### Option A: OVR Metrics Tool (Recommended)
1. Download & install OVR Metrics Tool from Meta Developer Center:
   ```powershell
   adb install -r OVRMetricsTool.apk
   ```
2. Launch OVR Metrics Tool on the Quest, enable **"Persistent Overlay"**.
3. Real-time HUD displays:
   - Display Refresh Rate (72 / 90 / 120 Hz)
   - App Frame Rate & Dropped Frames
   - GPU & CPU Utilization percentage
   - Thermal Status & Foveation Level

### Option B: Real-time Command Line Profiler
```powershell
adb shell ovrgpuprofiler -t
# Or surface flinger frame latency:
adb shell dumpsys SurfaceFlinger --latency
```

---

## 4. Quest 3 Device Check Procedure
Run after any input or scene change. Record results in `DEVICE_TEST_BACKLOG.md`; never record "pass" without a device run.

1. **Build freshness:** `npm run quest`, reload, and with `?debug=1` confirm the panel's `BUILD` matches `http://localhost:5173/__build`.
2. **Input sources:** hold the controllers, then put them down and pinch. The panel must show `SRC` ctl/hand entries and `POSE 2/2`, and the rays must keep following after the switch.
3. **Portals and transitions:** enter each ready portal by walking within 1 m or by trigger. `RET` should read `hub-hit`. Return with B/Y and with the red ring.
4. **Grab and ray:** with `?grabhints=1`, point at a grabbable and press trigger. `RET` must read `ray-grab`; the object follows the ray and can be released into a socket.
5. **Locomotion:** the teleport arc must land inside the hub radius; snap turn must pivot on the head; optional smooth locomotion must vignette comfortably.
6. **Legibility and comfort:** read an anchor at 1 m and 2 m, then use a module for 10 minutes and note any discomfort.
7. **Performance:** run OVR Metrics during the heaviest module and record fps, frame time, dropped frames and thermal status.

Desktop and emulator results do not count for items 2, 5, 6 or 7.

---

## 5. Troubleshooting Common Issues
- **"WebXR not supported":** Ensure you are navigating to `http://localhost:5173` (not the local IP `192.168.x.x`, which requires HTTPS).
- **Controller models not appearing:** Ensure controllers are awake and paired before tapping "Enter VR".
- **Screen freezes upon sleep:** Quest Browser pauses the WebGL context when the proximity sensor sleeps. Unplugging and re-plugging or refreshing the tab recovers the context.
