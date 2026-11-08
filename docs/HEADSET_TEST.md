# HEADSET TEST GUIDE & PROTOCOL
_Primary Test Device: Meta Quest 3 (Quest 3S & Quest 2 supported)_
_Last Updated: 2026-11-08_
_Status: Pre-device instructions. All headset metrics marked NOT verified on headset until Tuesday test run._

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

## 4. Tuesday Headset Smoke-Test Procedure (Hub Smoke-Test Plinth)
When testing Milestone M0 & M1 on Tuesday, immediately enter the **Hub Device Smoke-Test Zone** to validate the 8 hardware capabilities:

1. **Direct Touch & Poking:** Poke the virtual chime sphere with your physical index finger (hand tracking). Confirm audio ping and visual pushback.
2. **Controller Grabbing & Magnetic Detents:** Grab the test calibration block with Touch Plus grip trigger; translate and rotate in mid-air; release to test inertia.
3. **Controller Haptics:** Trigger grab, tap, and limit stops; confirm distinct haptic pulses on Touch Plus controllers.
4. **Locomotion & Vignette:** Teleport across the test room; execute snap-turns (30°); test smooth locomotion and verify peripheral radial vignette activates cleanly without nausea.
5. **Spatial Audio Attenuation:** Walk in a complete circle around the spatial sound beacon; verify binaural HRTF panning (sound shifts cleanly from left to right ear and falls off as $1/r$).
6. **Color Passthrough Toggle (Quest 3 MR):** Press the MR toggle on the spatial console. Confirm real-world environment appears in full color with transparent canvas background.
7. **Frame-Rate Selection:** Toggle between 72Hz, 80Hz, 90Hz, and 120Hz; confirm display switches cleanly and fixed-timestep physics remain deterministic.
8. **Text Legibility at 1–2 Meters:** Stand at the 1.0 m and 2.0 m floor distance marks; verify diegetic spatial tags are razor-sharp with no foveation blur.

---

## 5. Troubleshooting Common Issues
- **"WebXR not supported":** Ensure you are navigating to `http://localhost:5173` (not the local IP `192.168.x.x`, which requires HTTPS).
- **Controller models not appearing:** Ensure controllers are awake and paired before tapping "Enter VR".
- **Screen freezes upon sleep:** Quest Browser pauses the WebGL context when the proximity sensor sleeps. Unplugging and re-plugging or refreshing the tab recovers the context.
