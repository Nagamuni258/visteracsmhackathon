# Part 2: Antigravity Execution Guide & Technical Specifications

## Project Context
- IDE: Android Studio Hedgehog / Ladybug
- Agent Configuration: Google Antigravity in Review-Driven Mode
- Required model assets:
  - `impact_classifier.tflite` (quantized int8 version for 4-class hazard detection)
  - `impact_label_list.txt`
  - Place both in `app/src/main/assets/`
- Required audio resources:
  - Alert tones for each hazard type (pothole, speed-breaker, metal-plate)
  - Text-to-speech engine for voice warnings
- Impact Classifier predicts 4 road surface classes:
  1. Pothole (sharp spike + drop)
  2. Speed-breaker (gradual ramp-up/down)
  3. Metal-plate (sharp spike + sustained vibration)
  4. Flat-road (baseline vibration)

## Prompt 1: Project Skeleton & Library Setup (Fast Mode)

Read `ROADBUMP_MASTERPLAN.md`. Initialize a Kotlin Android project with:
- `minSdk = 24`
- `compileSdk = 34`

Add the following dependencies to `build.gradle.kts`:
- `org.tensorflow:tensorflow-lite-task-vision:0.4.4` (for impact classification)
- `androidx.room:room-runtime:2.6.1`
- `androidx.room:room-ktx:2.6.1` (with KSP)
- Jetpack Compose BOM and Material3
- `com.google.android.gms:play-services-maps:18.2.0`
- `com.google.maps.android:android-maps-utils:2.4.0` (for marker clustering)

In `AndroidManifest.xml`, declare the required permissions:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`
- `POST_NOTIFICATIONS`
- `VIBRATE`
- `INTERNET`
- `ACCESS_NETWORK_STATE`

Set up the following empty packages:
- `service`
- `sensor`
- `ml`
- - `logic`
- `data`
- `ui`
- `utils`

Do not write business logic yet.

---

## Prompt 2: Robust Accelerometer & GPS Capture (Planning Mode)

Read `ROADBUMP_MASTERPLAN.md`. Create `sensor/RoadImpactSensor.kt`.

Configure accelerometer capture specifically for impact detection:
- Sample rate: `100 Hz` (matches human perception of road impacts)
- Sensor type: `TYPE_ACCELEROMETER`
- Report mode: `CONTINUOUS`

Critical requirements:
- High-pass filter (> 10 Hz) to remove low-frequency noise (vehicle tilt, gravity)
- RMS g-force calculation over 50ms windows
- Impact detection threshold: > 2.0 g sudden spike (calibratable)
- Only process when GPS speed > 5 km/h (to filter passenger/stationary false positives)

Create a coroutine to:
- Read accelerometer buffer at 100 Hz
- Apply high-pass filter
- Calculate RMS g-force
- Detect impact events (threshold crossing)
- For each impact, capture:
  - Precise timestamp (System.nanoTime())
  - GPS location + speed
  - 0.5s window of accelerometer data (centered on impact)
- Render live debug overlay in `MainActivity` showing:
  - Current RMS g-force
  - Impact count
  - Last impact classification
  - Battery impact estimate

---

## Prompt 3: Impact Classification ML Integration & Severity Scoring (Planning Mode)

Read `ROADBUMP_MASTERPLAN.md`. Create:
- `ml/ImpactClassifier.kt`
- `logic/SeverityScorer.kt`

### ImpactClassifier
If impact detected, pass 0.5s window (50 samples at 100Hz) to TFLite `ImageClassifier` (treating accelerometer waveform as 1D "image").

Implementation notes:
- Use TensorFlow Lite Task Library Vision API for clean inference
- Input: 1x50x1 float buffer (normalized to [-1,1])
- Output: 4-class probability array [pothole, speed-breaker, metal-plate, flat]
- Require 2-of-3 consecutive window consensus for confirmed detection
- Emit state updates: `ImpactEvent(timestamp, location, speed, rawClass, confidence)`

### SeverityScorer
For confirmed impacts, calculate severity score:
- Base score: g-force amplitude (peak - baseline)
- Speed normalization: divide by sqrt(speed) to account for velocity effect
- Duration factor: impact duration (ms) from threshold crossing to return
- Final score: weighted combination → mapped to Minor/Moderate/Severe/Critical
- Calibration: map scores to real-world pothole depth using test dataset

Emit: `HazardEvent(timestamp, location, speed, hazardClass, severityScore, severityLevel)`

---

## Prompt 4: The Foreground Service & Community Verification System (Planning Mode)

Read `ROADBUMP_MASTERPLAN.md`. Create `service/HazardDetectionService.kt` extending `LifecycleService`.

Requirements:
- Move `RoadImpactSensor`, `ImpactClassifier`, `SeverityScorer` into this service.
- Declare `foregroundServiceType="location"`.
- Create ongoing notification with channel name `road_alerts`.
- Add `PendingIntent` "Stop" action.

Create:
- `logic/HazardMapper.kt` with core mapping logic
- `data/HazardRepository.kt` for Room database operations
- `ui/HazardMapFragment.kt` for Google Maps visualization

### HazardMapper behavior on confirmed hazard
1. Save current GPS location + speed
2. Classify hazard type (pothole/speed-breaker/metal-plate/flat)
3. Score severity (Minor/Moderate/Severe/Critical)
4. Check for existing pins within 50m radius:
   - If exists: update severity (average), increment report count
   - If not: create new pin with report count = 1
5. Enter cooldown state (3 seconds) where new impacts are ignored at same location
6. Emit `HazardEvent` to UI and database

### CommunityVerificationLayer
- Nearby users (within 100m) see pin → can confirm/reject
- Confirmation requires: user moving in same direction (GPS heading diff < 45°)
- 3+ confirmations → pin locked (verified, icon changes)
- 2+ rejections → pin flagged for review (orange border)
- After 7 days: unverified pins fade from map unless re-verified

### MunicipalReportGenerator
On long-press of a verified pin:
- Generate formatted complaint:
  ```
  ROADBUMP HAZARD REPORT
  Timestamp: [ISO 8601]
  Location: [lat, lng]
  Hazard Type: [pothole/speed-breaker/metal-plate]
  Severity: [Minor/Moderate/Severe/Critical]
  Report Count: [X]
  Speed at Detection: [XX] km/h
  ```
- Output options: Share as PDF, Email, SMS, or Copy to Clipboard
- Include thumbnail map snippet (optional)

---

## Prompt 5: Room Database Logging & Analytics UI (Fast Mode)

Read `ROADBUMP_MASTERPLAN.md`. Create `data/HazardDatabase.kt`.

Define a Room entity named `HazardEvent` with:
- `id: Long` (auto-generated primary key)
- `timestamp: Long` (epoch ms)
- `hazardClass: String` (pothole/speed-breaker/metal-plate/flat)
- `severityLevel: String` (Minor/Moderate/Severe/Critical)
- `severityScore: Float`
- `gForcePeak: Float`
- `impactDurationMs: Long`
- `latitude: Double`
- `longitude: Double`
- `speedKmh: Float`
- `reportCount: Int` (default 1)
- `isVerified: Boolean` (default false)
- `confirmationCount: Int` (default 0)
- `rejectionCount: Int` (default 0)

Create a DAO with methods to:
- `insertHazardEvent()`
- `getRecentHazards(limit: Int): Flow<List<HazardEvent>>`
- `getHazardById(id: Long): Flow<HazardEvent?>`
- `updateVerification(id: Long, isVerified: Boolean)`
- `incrementReportCount(id: Long)`
- `clearAllHazards(): Int`

Create a Room database singleton that exposes the DAO.

Inject the DAO into `HazardDetectionService` and record each confirmed hazard.

Create `ui/HazardAnalyticsFragment.kt` in Jetpack Compose:
- Use `LazyColumn`
- Show one log row per hazard with:
  - timestamp (formatted)
  - hazard class
  - severity level
  - confirmation count
  - distance from current location
- Include filters: by hazard type, severity, verification status
- Include `Clear All` button that calls `clearAllHazards()` and refreshes automatically
- Show summary stats: total hazards, verified %, avg severity score

Use `collectAsStateWithLifecycle` (or equivalent) to observe the database `Flow` and render the analytics view.

---

## Summary
This plan implements a complete Android road hazard detection and mapping system using accelerometer/GPS sensing and ML classification, with:
- high-frequency accelerometer capture
- impact detection gating
- ML classification of hazard type
- severity scoring with speed normalization
- duplicate filtering and clustering
- community verification system
- municipal report generation
- night mode warnings
- persistence and analytics UI