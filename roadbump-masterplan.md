# Part 1: RoadBump — Pothole & Hazard Mapper (Master Plan)

**Project Name:** RoadBump  
**Target Event:** VistERA 2026 36-Hour Hackathon  
**Scoring Breakdown:** Working Prototype (30%), Technical Depth (25%), Real-life Relevance (20%), Vision & Innovation (15%), Future Focused (10%).

---

## 1. Executive Summary & Impact Analysis

- **The Core Problem:** Indian roads are riddled with potholes, speed-breakers, metal plates, and unmarked hazards. These cause accidents, vehicle damage, and deaths. Current solutions (Google Maps Waze reports) are manual — users tap a button, often inaccurately, with no verification, no severity scoring, and no predictive capability. Municipalities have no real-time hazard database.

- **Real-World Impact:** Pothole-related accidents in India are underreported. MoRTH data shows thousands of road accident deaths annually; poor road conditions are a documented contributing factor in urban and rural areas. A real-time, community-verified hazard map enables riders to avoid danger and municipalities to prioritize repairs.

- **The RoadBump Solution:** RoadBump is a vehicle-first road hazard detection system. When the phone is in a moving vehicle, the accelerometer-based auto-detection mode runs in the background, capturing impact signatures and automatically logging them as pins on a live map. Drivers and riders receive audible alerts and haptic feedback when new hazards are detected ahead. When the phone is on-foot (detected via motion state and GPS speed < 5 km/h), the app switches to pedestrian photo-reporting mode: a pedestrian walking next to a pothole opens the app, taps "Report Hazard", and takes a photo with their phone camera. The app captures the photo + GPS location + timestamp and instantly pins it on a live map. Nearby pedestrians and riders (within 500m) receive push notifications and see the pin on their map with the reporter's photo as evidence. The reporter gets feedback — other users confirm, reject, or add comments — and the pin's confidence score updates in real time. A municipal report generator produces formatted complaints with photos, GPS coordinates, and severity scores — turning crowd-sourced data into actionable civic intelligence.

- **Product Relevance:** 100% software-based, requiring zero new hardware. Works on any Android phone with an accelerometer and GPS. Integrates with any navigation app as a hazard overlay. Processes everything locally on-device — no audio, no privacy concern, no network dependency for core detection.

---

## 2. Technology Stack Overview

- **Language & UI:** **Kotlin** with **Jetpack Compose** (Material 3) for reactive, modern UI development.
- **Sensor Capture (Primary Vehicle Mode):** **Accelerometer** (100 Hz continuous stream) + **GPS** (location + speed at impact moment).
- **Pedestrian Photo Capture:** **CameraX** for manual hazard photo capture + **GPS** for location + **ExifInterface** for timestamp metadata.
- **Audio System:** **AudioTrack** for hazard alert tones + **TextToSpeech** for voice warnings + **Vibrator** for haptic feedback patterns.
- **Push Notifications:** **Firebase Cloud Messaging (FCM)** for real-time alerts to nearby drivers/riders and pedestrians.
- **Machine Learning:** **TensorFlow Lite (Task Library)** running a quantized (int8) classifier trained on impact signatures — 4 classes: pothole, speed-breaker, metal-plate, flat-road.
- **Background Execution:** Android **LifecycleService** with `foregroundServiceType="location"`.
- **Map & Visualization:** **Google Maps SDK** or **OpenStreetMap** with clustered, color-coded hazard pins.
- **Municipal Reporting:** Formatted complaint generator with PDF/email output — photos + GPS + severity + timestamp.
- **Community Verification:** User-confirmation pipeline — nearby users validate/reject pins, score updates dynamically.
- **Local Data & Analytics:** **Room SQLite** (with KSP) and Coroutines/Flow for asynchronous event logging.
- **Night Mode:** Screen overlay warnings for upcoming hazards within 200m — LED flash + vibration pattern.
- **Audio/Haptic Alerts:** Configurable alert tones, voice warnings, and vibration patterns based on hazard type and severity.

---

## 3. Comprehensive System Architecture & Workflow

### 3.1 Pedestrian Photo-Report Flow (Primary Mode)

```text
[Pedestrian walks next to pothole]
   │
   ▼
[Open RoadBump App] ──► Tap "Report Hazard" button
   │
   ▼
[CameraX opens] ──► User frames pothole in camera viewfinder
   │
   ▼
[Take Photo] ──► User taps shutter → photo captured
   │                 Auto-stamp: GPS location + timestamp via ExifInterface
   │
   ▼
[Photo + GPS + Timestamp] ──► Upload to backend (FCM + REST)
   │
   ▼
[Backend Pin Creation] ──► Creates hazard pin on map
   │                          Stores: photo URL, GPS, timestamp, reporter ID, hazard type
   │                          Sends FCM push to nearby users (within 500m)
   │
   ▼
[Nearby Users Receive Alert] ──► Push notification: "New hazard reported 200m away"
   │                                  App opens to map with pin highlighted
   │                                  User views reporter's photo as evidence
   │
   ▼
[Feedback Loop] ──► Nearby users confirm / reject / comment on pin
   │                    3+ confirmations → pin verified (icon changes)
   │                    2+ rejections → pin flagged for review
   │                    Reporter sees feedback in-app
   │
   ▼
[Municipal Report] ──► Verified pin → formatted complaint with photo + GPS
   │                      Output: PDF / Email / Share intent
```

### 3.2 Vehicle Auto-Detection Flow (Secondary Mode)

```text
[Phone Accelerometer] ──► 100 Hz continuous g-force stream
   │
   ▼
[Impact Detection Gate] ──► RMS g-force threshold (> 2g sudden spike)
   │                          High-pass filter (> 10Hz) to cut low-frequency noise
   │                          (Below threshold? ──► Thread sleeps / Skip ML)
   │
   ▼ (Exceeds impact threshold)
[GPS + Speed Capture] ──► Location + velocity at exact impact moment
   │
   ▼
[TFLite Impact Classifier] ──► Processes 0.5s window of accelerometer data
   │                              Classes: pothole / speed-breaker / metal-plate / flat
   │                              2-of-3 consecutive window consensus for confirmed detection
   │
   ▼
[Severity Scoring Engine] ──► Depth estimate from g-force amplitude + impact duration
   │                            Severity: Minor / Moderate / Severe / Critical
   │                            (Scale calibrated against known pothole dimensions)
   │
   ▼
[Duplicate Filter] ──► Cluster nearby pins (within 50m), average severity, increment count
   │                     Same location already pinned? ──► Update existing pin (add report)
   │
   ▼
[Map Pin Rendering] ──► Google Maps / OpenStreetMap overlay
   │                      Color-coded: Green (minor) / Yellow (moderate) / Orange (severe) / Red (critical)
   │                      Cluster mode when > 5 pins in viewport
   │
   ▼
[Community Verification Layer] ──► Nearby users see pin → confirm / reject
   │                                  3+ confirmations → pin locked (verified)
   │                                  2+ rejections → pin flagged for review
   │
   ▼
[Municipal Report Generator] ──► Formatted complaint: GPS, severity, photo, timestamp
   │                               Output: PDF / Email / Share intent
   │                               Optional: auto-submit to municipal API (if available)
   │
   ▼
[Night Mode Warning System] ──► Upcoming hazards within 200m → screen flash + vibration
                              │                              Pattern: 2 short pulses for moderate
                              │                              Pattern: 3 short pulses for severe
   ▼
[Room SQLite Database] ──► Coroutine logs: ID, timestamp, class, severity, GPS, confirmation count
```

---

## 4. Edge Case Mitigation Matrix (Technical Depth)

| Edge Case / Risk | Root Cause | Architectural Fix & Technology Used |
| --- | --- | --- |
| **Pedestrian Photo Accuracy** | User takes photo of wrong location or blurry image | Auto-stamp GPS + timestamp via ExifInterface. Show GPS accuracy before allowing upload (> 10m). Show photo preview before submit. Reject if GPS accuracy too low. |
| **Reporter Identity & Spam** | Fake reports, duplicate photos, spam pins | Require user authentication (phone number OTP). Rate limit: max 5 reports per hour per user. Auto-detect duplicate photos (perceptual hash). Report count visible on pin. |
| **Nearby User Notification Delay** | Pedestrian reports pothole, next user 500m away doesn't get alert in time | FCM push notification sent immediately on pin creation. In-app map updates in real time via WebSocket/Firestore. Alert includes distance + ETA. |
| **Photo Storage & Bandwidth** | Large photos drain storage and data | Compress photos to 800px width before upload. Auto-delete local cache after 24h. Store photos in cloud storage (Firebase Storage), not locally. |
| **Offline Pedestrian Mode** | Pedestrian in rural area with no network | Local SQLite cache stores report locally. GPS + photo captured offline. Auto-sync when network returns. Map tiles cached offline for pre-downloaded regions. |
| **Pedestrian vs Vehicle Pin Confusion** | Pedestrian photo pin and vehicle impact pin look the same | Different pin icons: pedestrian = person icon, vehicle = car icon. Different color coding. Different data model (photo vs accelerometer). |
| **Passenger vs Driver False Reports** | Passenger phone detects impact → wrong location pinned | Motion state detection: accelerometer pattern + GPS speed → only report when phone is in a moving vehicle (speed > 5 km/h). Passenger mode: detect stationary or inconsistent motion → suppress reporting. |
| **Speed-Breaker vs Pothole Misclassification** | Both produce g-force spikes, similar amplitude | Use the g-force *pattern*, not just amplitude. Speed-breakers produce smooth ramp-up/ramp-down (gradual). Potholes produce sharp spike + drop (abrupt). TFLite classifier trained on waveform shape differences. 2-of-3 frame consensus required. |
| **False Positives (Braking, Turning, Curb Hit)** | Normal driving produces g-force spikes | Require: impact + GPS speed > 5 km/h + consistent waveform pattern (2-of-3). Add a minimum duration filter: pothole impacts last 50-150ms; braking lasts 500ms+. Discard events outside the impact window. |
| **Duplicate Pins (10 people hit same pothole)** | Each detection creates a new pin | Cluster pins within 50m radius. Average severity, increment report count. Show "12 reports" on pin. Only create new pin if > 50m from existing. |
| **Battery Drain (100Hz Accelerometer)** | Continuous sensor stream drains battery | Stage-1 gate: only process when g-force exceeds threshold. Sleep at 1 Hz when stationary. Batch uploads every 5 min. Low-power mode when phone is charging/parked. |
| **Phone Orientation Variability** | Phone in pocket vs dashboard vs holder changes accelerometer axes | Calibrate on startup: detect flat vs tilted orientation. Normalize accelerometer vectors to world coordinates (gravity-compensated). Auto-detect mounting via motion pattern. |
| **No Municipal API** | No government system accepts pothole reports via API | Generate formatted PDF/email complaint with all data. User manually sends to municipal email. Store municipal contact list per city. "Share" intent for WhatsApp/SMS. |
| **Community Verification Spam** | False confirmations inflate pin score | Require minimum 50m distance for verification (can't verify your own pin). Time-window: verification only valid within 24h of pin creation. After 7 days, pins auto-fade from map unless re-verified. |
| **Network Unavailability (Rural Roads)** | No internet → can't pin map or submit reports | Local SQLite cache. Pins stored locally. Sync when network returns. Map tiles cached offline (pre-download region). Core detection works 100% offline. |
| **Night Mode False Alerts** | Screen flash distracts driver at night | Adaptive brightness: flash only if screen brightness < 20%. Vibration-only mode option. "Quiet hours" toggle (10 PM - 5 AM) → vibration only, no screen flash. |
| **Impact Magnitude Calibration** | Same pothole feels different at 40 km/h vs 20 km/h | Severity score normalizes for vehicle speed. Higher speed = higher expected g-force for same pothole. If measured g-force < expected for speed → severity downgraded. |
| **Lateral Offset Uncertainty** | Phone cannot sense left/right position of hazard relative to vehicle lane | Community verification as primary safeguard: only pins with 3+ confirmations from same-lane drivers gain high confidence. Safety-first default: treat any verified impact as potential hazard with UI messaging: "Hazard detected. May be in adjacent lane. Reduce speed if unsure." Future enhancement: camera-based lateral localization via lane marking detection. |
| **Pedestrian Photo Accuracy** | User takes photo of wrong location or blurry image | Auto-stamp GPS + timestamp via ExifInterface. Show GPS accuracy before allowing upload (> 10m). Show photo preview before submit. Reject if GPS accuracy too low. |
| **Reporter Identity & Spam** | Fake reports, duplicate photos, spam pins | Require user authentication (phone number OTP). Rate limit: max 5 reports per hour per user. Auto-detect duplicate photos (perceptual hash). Report count visible on pin. |
| **Nearby User Notification Delay** | Pedestrian reports pothole, next user 500m away doesn't get alert in time | FCM push notification sent immediately on pin creation. In-app map updates in real time via WebSocket/Firestore. Alert includes distance + ETA. |
| **Photo Storage & Bandwidth** | Large photos drain storage and data | Compress photos to 800px width before upload. Auto-delete local cache after 24h. Store photos in cloud storage (Firebase Storage), not locally. |
| **Offline Pedestrian Mode** | Pedestrian in rural area with no network | Local SQLite cache stores report locally. GPS + photo captured offline. Auto-sync when network returns. Map tiles cached offline for pre-downloaded regions. |
| **Pedestrian vs Vehicle Pin Confusion** | Pedestrian photo pin and vehicle impact pin look the same | Different pin icons: pedestrian = person icon, vehicle = car icon. Different color coding. Different data model (photo vs accelerometer). |
| **Safety Disclaimer** | Wrong hazard label → driver swerves → accident | All pins labeled "unverified" until 3 confirmations. UI shows "caution, not guarantee." Pitch: "RoadBump is an assistive awareness tool, not a navigation guarantee." |

---

## 5. Critical Metrics to Measure & Pitch Validation

To secure top marks in Technical Depth and Real-life Relevance, collect and present these metrics during the hackathon pitch:

- **Pedestrian Photo Upload Accuracy:** Percentage of pedestrian reports with correct GPS location (> 10m accuracy) — target > 95%.
- **Notification Delivery Rate:** Percentage of nearby users (within 500m) who receive FCM alert within 5 seconds of pin creation — target > 90%.
- **Feedback Loop Speed:** Time from pedestrian photo upload to first community confirmation — target < 60 seconds.
- **Photo Upload Success Rate:** Percentage of photo uploads that complete without error — target > 98%.
- **Spam Report Rate:** Percentage of pins flagged as spam/duplicate — target < 5%.
- **Detection Accuracy:** Classify 4 hazard types correctly — target > 85% precision, > 80% recall on test dataset (pre-recorded impact clips played through speaker). Log this in Room database.
- **Severity Correlation:** Measure if severity score correlates with actual pothole depth (test with known potholes — measure with ruler, compare to score). Target: R² > 0.7.
- **False Positive Rate:** Count false triggers per 10 km driven — target < 5 per km in city driving, < 2 per km on highway.
- **Detection Latency:** Time from impact to pin appearing on map — target under 500 ms.
- **Battery Drain:** Measure battery drop per hour with detection ON vs OFF — target < 5%/hr with Stage-1 gate.
- **Community Verification Rate:** Percentage of pins verified by community within 24h — target > 60%.
- **Duplicate Filter Efficiency:** Count of duplicate reports merged vs unique pins — target > 80% merge rate in dense areas.
- **Night Mode Alert Accuracy:** False alert rate at night — target < 2 per 10 km.
- **Offline Capability:** Percentage of core features working without network — target 100% for detection, 90% for map (cached tiles).
- **Pedestrian Photo Accuracy:** Percentage of pedestrian reports with correct GPS location (> 10m accuracy) — target > 95%.
- **Notification Delivery Rate:** Percentage of nearby users (within 500m) who receive FCM alert within 5 seconds of pin creation — target > 90%.
- **Feedback Loop Speed:** Time from pedestrian photo upload to first community confirmation — target < 60 seconds.
- **Photo Upload Success Rate:** Percentage of photo uploads that complete without error — target > 98%.
- **Spam Report Rate:** Percentage of pins flagged as spam/duplicate — target < 5%.

---

## 6. Final Submission Checklist

Ensure this complete submission pack is ready for VistERA judges before the 36-hour deadline:

- **Working APK & Codebase:** A clean Git repository containing tagged commits and the installable APK.
- **Documentation:** A comprehensive README file that includes the system architecture diagram (section 3 above).
- **Backup Demo Video:** A pre-recorded screen capture showing the phone detecting impacts, classifying hazards, and pinning them on the live map — acting as insurance if the live demo fails in a noisy hackathon hall.
- **The Pitch Deck:** Slides covering the problem statement (MoRTH data), solution architecture, technical depth (ML classifier + multi-sensor fusion), community verification model, metrics/database results, privacy guarantees (all on-device), and future roadmap.
- **Test Data Assets:** Pre-recorded impact clips for 4 hazard types + test dataset with ground-truth labels for accuracy measurement.
- **Safety Disclaimer:** Clear disclaimer in app and presentation: "RoadBump is an assistive awareness tool, not a navigation guarantee. Always follow traffic rules and road conditions."
- **Municipal Integration Demo:** Show a formatted complaint generated from a detected hazard — email/PDF/Share intent. Even without a real API, this proves the civic-value pipeline.
