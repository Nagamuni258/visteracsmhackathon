# Part 1: RoadBump — Pothole & Hazard Mapper (Master Plan)

**Project Name:** RoadBump  
**Target Event:** VistERA 2026 36-Hour Hackathon  
**Scoring Breakdown:** Working Prototype (30%), Technical Depth (25%), Real-life Relevance (20%), Vision & Innovation (15%), Future Focused (10%).

---

## 1. Executive Summary & Impact Analysis

- **The Core Problem:** Indian roads are riddled with potholes, speed‑breakers, metal plates, and unmarked hazards. These cause accidents, vehicle damage, and deaths. Existing crowd‑sourced solutions (e.g., Waze) rely on manual taps, suffer from inaccurate locations, lack severity scoring, and provide no predictive capability. Municipalities lack a real‑time, verified hazard database.

- **Real‑World Impact:** MoRTH data shows thousands of road‑accident deaths annually, with poor road conditions a major factor. A real‑time, community‑verified hazard map can help riders avoid danger and give municipalities actionable data.

- **The RoadBump Solution:** A hybrid vehicle‑first auto‑detection system complemented by a pedestrian photo‑reporting mode. The app runs entirely on‑device, captures hazards via accelerometer or camera, tags them with GPS, pushes them to a live map, and allows community verification. Verified hazards can be exported as formatted municipal complaints.

---

## 2. Refined Pothole‑Watch Workflow (RoadBump)

### Goal & Constraints
- **Goal:** Build a functional 36‑hour prototype that detects potholes (and related hazards) using a smartphone, confirms them with the user, logs GPS, syncs to Firebase, displays on a live map, and enables CSV export.
- **Constraints:** 36‑hour hackathon, ₹80k prize pool, 5‑rubric scoring (innovation, impact, technical depth, completeness, vision).

### Core User Flow (MVP)
| Step | User Action | System Reaction |
|------|--------------|-----------------|
| **1. Scan** | Open the app, point the camera (or keep phone in vehicle). | Camera feed runs TF‑Lite model (~2 fps) classifying frames as *pothole* or *clear*.
| **2. Confirm** | Tap **Confirm** on thumbnail preview. | Detection stored locally, timestamped, GPS‑tagged.
| **3. Tag (opt.)** | Add severity rating (1‑3) or note. | Data attached to the detection.
| **4. Upload** | Press **Sync**. | All confirmed detections batch‑written to Firebase Firestore with timestamp & GPS.
| **5. Visualize** | Open Map view. | Google Maps shows clustered pins; tapping a pin opens the thumbnail.
| **6. Export** | Press **Export CSV**. | Generates CSV with lat, lng, timestamp, severity, note.

### Admin Notification & Approval Loop
1. **Instant Push:** As soon as a provisional pin is written, **Firebase Cloud Messaging (FCM)** pushes a notification to the **Admin phone** (or any device subscribed as admin). The notification includes the GPS coordinates, impact severity, and a small thumbnail if a photo was captured.
2. **Admin Review:** The admin opens the notification, sees a detail screen with the impact data and optional photo, then taps **Approve**.
3. **Approved Pin Broadcast:** The pin’s `status` changes to `approved`. All nearby **crossing users** (vehicles or pedestrians within ~500 m) receive a **real‑time alert** via FCM:
   - **Alarm:** A short audible tone (configurable per severity).
   - **Night‑Mode Flash:** If the device is in night mode (or the system time is after sunset), the screen flashes a low‑brightness, high‑contrast overlay for 2 seconds to draw attention without blinding the driver.
4. **Map Update:** The approved pin appears on the public map instantly for all users.
5. **Admin Panel Sync:** Simultaneously, a structured report (JSON/PDF) containing GPS, severity, timestamp, and optional photo URL is sent to the **admin dashboard** (a simple web endpoint) for municipal filing.

### Community Verification
- Any user can tap the pin and cast a **positive** (“There is a pothole”) or **negative** (“Not a pothole”) vote.
- **3 positive votes** → pin status becomes **Verified** (green check‑mark).
- **2 negative votes** → pin status becomes **Unverified** (orange border) and the admin is notified for manual review.
- Verified pins retain the alarm/flash behavior for future crossing users, reinforcing safety.

### Technical Stack (fast prototyping)
- **Frontend:** React Native (Expo) – works on Android & iOS, hot‑reload.
- **ML Model:** MobileNet‑V2 fine‑tuned on ~500 pothole images, exported as TensorFlow‑Lite (~1 MB).
- **Location:** `expo-location` for GPS.
- **Backend:** Firebase Firestore (free tier) + optional Firebase Functions.
- **Map UI:** `react-native-maps` with clustering.
- **Export:** `js‑csv‑writer` + `expo-sharing`.

### MVP Scope (what we’ll deliver in 36 h)
- Camera + on‑device inference with thumbnail preview.
- User confirmation UI.
- GPS tagging.
- Firestore sync (no auth).
- Live map with clustered pins.
- CSV export.
- Admin push notification, approval UI, and real‑time alert/flash for nearby users.
- Photo capture optional, auto‑stamped and sent to admin panel.

### Rubric Alignment (5‑rubric)
| Rubric | How we score |
|--------|--------------|
| **Innovation** | On‑device ML + crowd‑sourced GIS + admin‑driven real‑time alert/flash for crossing users. |
| **Impact** | Directly addresses a massive Indian road‑safety problem; data can be handed to municipalities. |
| **Technical Depth** | Mobile inference, sensor‑fusion, real‑time map updates, admin push workflow, night‑mode safety overlay. |
| **Completeness** | End‑to‑end flow from detection to export, ready for demo. |
| **Presentation** | Clean UI, live map demo, admin approval, alarm/flash alerts, CSV export as tangible deliverable. |

### Risks & Mitigations
- **Insufficient training data** → use public pothole datasets (Kaggle) and augment; fallback to edge‑detect heuristic if confidence < 0.4.
- **Firestore write limits** → batch writes, throttle to ≤ 10 writes/sec.
- **Permission friction** → request camera & location on first launch with clear rationale.
- **Map API key** → use Expo demo key now; replace with production key later.
- **Alert fatigue** → configurable alert intensity and a quiet‑hours window (10 PM‑5 AM) where only vibration (no flash) is used.

### Next‑Step Timeline (≈ 26 h, 10 h buffer)
1. **UI mockups** – 2 h.
2. **Training data prep** – 3 h.
3. **Expo project scaffold** – 2 h.
4. **ML inference integration** – 5 h.
5. **GPS + Firestore sync** – 4 h.
6. **Admin notification & approval UI** – 4 h.
7. **Map view, alert/flash implementation & CSV export** – 4 h.
8. **Testing & polish** – 6 h.

---

## 3. Technology Stack Overview

- **Language & UI:** Kotlin with Jetpack Compose (Material 3) for Android implementation.
- **Sensor Capture (Vehicle Mode):** Accelerometer (100 Hz) + GPS speed.
- **Pedestrian Photo Capture:** CameraX + GPS + ExifInterface.
- **Audio System:** AudioTrack + TextToSpeech + Vibrator.
- **Push Notifications:** Firebase Cloud Messaging.
- **Machine Learning:** TensorFlow Lite (Task Library) with quantized int8 classifier for four classes (pothole, speed‑breaker, metal‑plate, flat‑road).
- **Background Execution:** Android LifecycleService with `foregroundServiceType="location"`.
- **Map & Visualization:** Google Maps SDK or OpenStreetMap with clustered pins.
- **Municipal Reporting:** PDF/email generator with photo, GPS, severity.
- **Community Verification:** Validation pipeline – nearby users confirm/reject pins, score updates.
- **Local Data & Analytics:** Room SQLite + Coroutines/Flow.
- **Night Mode:** Screen overlay warnings, configurable alerts.

---

## 4. Comprehensive System Architecture & Workflow

### 4.1 Pedestrian Photo‑Report Flow (Primary Mode)
```
[Pedestrian walks next to pothole]
   │
   ▼
[Open RoadBump] → Tap "Report Hazard"
   │
   ▼
[CameraX opens] → Frame pothole → Take photo
   │
   ▼
[Auto‑stamp GPS + timestamp via Exif]
   │
   ▼
[Upload to backend (Firestore + Storage)] → Create pin
   │
   ▼
[FCM push to nearby users (≤ 500 m)] → Notification
   │
   ▼
[Nearby users view pin, see photo]
   │
   ▼
[Feedback Loop] – Confirm / Reject / Comment
   │
   ▼
[Verified pin → Municipal report (PDF/Email)]
```

### 4.2 Vehicle Auto‑Detection Flow (Secondary Mode)
```
[Phone in moving vehicle (speed > 5 km/h)]
   │
   ▼
[Accelerometer 100 Hz] → High‑pass filter (>10 Hz)
   │
   ▼
[RMS g‑force] – impact if > 2 g
   │
   ▼
[Capture 0.5 s window + GPS]
   │
   ▼
[TFLite classifier] → Class (pothole / speed‑breaker / metal‑plate / flat)
   │
   ▼
[Severity scoring] (amplitude + speed normalization)
   │
   ▼
[Duplicate filter (≤ 50 m)] – update existing pin or create new
   │
   ▼
[Map pin rendering] – color‑coded severity
   │
   ▼
[Alert] – audio tone, voice warning, vibration pattern
   │
   ▼
[FCM push to nearby users] – distance & ETA
   │
   ▼
[Admin Notification & Approval]
   │   1. Admin receives push with pin data & optional photo.
   │   2. Admin opens dashboard, taps **Approve**.
   │   3. Pin becomes `approved` and is broadcast.
   ▼
[Crossing Users Alert]
   │   - Devices within ~500 m receive a **real‑time alarm**.
   │   - If night mode active, screen flashes a low‑brightness overlay for 2 seconds.
   ▼
[Community verification] – 3+ confirmations → verified; 2+ rejections → unverified.
   ▼
[Municipal report generator] – PDF/email with GPS, severity, photo (if any).
```

---

## 5. Edge‑Case Mitigation Matrix (Technical Depth)
| Edge Case / Risk | Root Cause | Fix |
|---|---|---|
| **Pedestrian photo accuracy** | Wrong location / blurry image | Auto‑stamp GPS & timestamp, require ≥ 10 m accuracy, preview before submit |
| **Reporter spam** | Fake reports | OTP phone auth, rate‑limit 5 reports/hr, perceptual‑hash duplicate detection |
| **Notification delay** | Network latency | Immediate FCM push, in‑app Firestore listener for real‑time map updates |
| **Photo bandwidth** | Large images | Compress to 800 px width before upload, auto‑delete local cache after 24 h |
| **Offline mode** | No network | Local SQLite cache, auto‑sync on reconnection, map tile caching |
| **Pin type confusion** | Pedestrian vs vehicle pins | Different icons (person vs car), separate data models |
| **False positives (braking, turning)** | Normal driving spikes | Stage‑1 gate (g‑force > 2 g) + speed > 5 km/h + waveform pattern consensus |
| **Battery drain** | Continuous sensor stream | Stage‑1 gate, sleep at 1 Hz when idle, low‑power mode while charging |
| **Night‑mode distraction** | Screen flash | Adaptive brightness, vibration‑only option, quiet‑hours toggle |
| **Severity calibration** | Speed variance | Normalize severity by speed (divide by √speed) |
| **Safety disclaimer** | Over‑reliance | UI label "unverified – use with caution", no navigation guarantees |

---

## 6. Critical Metrics to Measure & Pitch Validation
- Pedestrian photo GPS accuracy (> 10 m) – target > 95%
- Notification delivery (≤ 5 s) – target > 90%
- Feedback loop speed (first confirmation) – target < 60 s
- Photo upload success – target > 98%
- Spam report rate – target < 5%
- Detection accuracy (4‑class) – precision > 85%, recall > 80%
- Severity correlation (R²) – target > 0.7
- False‑positive rate – < 5/10 km city, < 2/10 km highway
- Detection latency – < 500 ms
- Battery drain – < 5%/hr with detection ON
- Community verification rate – > 60% pins verified within 24 h
- Duplicate filter efficiency – > 80% merge rate in dense areas

---

## 7. Final Submission Checklist
- **Working APK & Codebase** – clean Git repo with tags.
- **Documentation** – comprehensive README with architecture diagram (sections above).
- **Backup Demo Video** – screen capture of both pedestrian & vehicle modes, admin approval, and alert/flash behavior.
- **Pitch Deck** – problem, solution, technical depth, metrics, demo, roadmap.
- **Test Data Assets** – impact clips for each class.
- **Safety Disclaimer** – clear notice in app and presentation.
- **Municipal Integration Demo** – formatted complaint generation.

---

*Prepared for VistERA 2026 Hackathon | Team RoadBump*