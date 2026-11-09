# RoadBump Feature Gap Analysis
## Master Plan vs. Current Implementation

---

### ✅ IMPLEMENTED (Working)

| Feature | Status | Location |
|---------|--------|----------|
| **Web Dashboard (React/Vite)** | ✅ Complete | `frontend/src/` |
| **HUD Screen (Live telemetry, camera preview)** | ✅ Complete | `frontend/src/screens/HudScreen.jsx` |
| **Map Screen (Leaflet + Google Maps tiles)** | ✅ Complete | `frontend/src/screens/MapScreen.jsx` |
| **Report Screen (Camera capture, hazard classification)** | ✅ Complete | `frontend/src/screens/ReportScreen.jsx` |
| **Sensor Screen (100Hz accelerometer visualization)** | ✅ Complete | `frontend/src/screens/SensorScreen.jsx` |
| **Civic Control Center (Admin approval, AI triage)** | ✅ Complete | `frontend/src/screens/CivicScreen.jsx` |
| **Backend API (Express + MongoDB + SSE)** | ✅ Complete | `backend/index.js` |
| **PDF Report Generation** | ✅ Complete | `backend/index.js` (lines 629-736) |
| **Google Sheets Sync** | ✅ Complete | `backend/services/googleSheetsService.js` |
| **Municipal Auto-Upload (NEW)** | ✅ Complete | `backend/index.js` (lines 734-785) |
| **Multi-Device Real-Time Sync (SSE)** | ✅ Complete | `backend/index.js` + `frontend/src/api.js` |
| **Community Verification (Upvote/Downvote)** | ✅ Complete | `MapScreen.jsx` + `api.js` |
| **AI Triage (FreeLLMAPI integration)** | ✅ Complete | `backend/index.js` (lines 973-1029) |
| **CSV Export** | ✅ Complete | `backend/index.js` (lines 739-766) |
| **USB Tethering / ADB Bridge Config** | ✅ Complete | `App.jsx` modal |
| **Network Info / IP Detection** | ✅ Complete | `backend/index.js` (lines 1036-1063) |

---

### ⚠️ PARTIALLY IMPLEMENTED (Needs Completion)

| Feature | Status | Missing Parts |
|---------|--------|---------------|
| **Vehicle Auto-Detection Mode** | 🟡 Partial | `sensorEngine.js` exists but: No 4-class TFLite classifier, No speed-gated background service, No duplicate filter (50m clustering), No consensus logic (2-of-3 windows) |
| **Night Mode Screen Flash** | 🟡 Partial | Toggle exists in `App.jsx` but no automatic hazard-proximity screen flash overlay (200m radius) |
| **Community Verification Auto-Status** | 🟡 Partial | Voting works but no auto-transition: 3+ upvotes → verified, 2+ downvotes → flagged |
| **Offline Capability** | 🟡 Partial | Web app caches nothing; no IndexedDB/Service Worker for offline map tiles or report queue |
| **Municipal API Config** | 🟡 Partial | Backend has env vars but frontend has no settings screen to configure GOVERNMENT_API_URL/KEY |
| **Firebase/FCM Notifications** | 🟡 Partial | `backend/index.js` has Firebase Admin init but no topics, no push to nearby users (500m), no crossing-user alerts |

---

### ❌ NOT IMPLEMENTED (Critical Gaps for Master Plan)

| Feature | Master Plan Requirement | Current State |
|---------|------------------------|---------------|
| **Android Native App (Kotlin/Jetpack Compose)** | Primary deliverable for VistERA | Only React web app exists (`frontend/`) |
| **TensorFlow Lite 4-Class Classifier** | Core ML: pothole/speed-breaker/metal-plate/flat-road | Not integrated; `sensorEngine.js` only does threshold detection |
| **100Hz Accelerometer Background Service** | `HazardDetectionService` with `foregroundServiceType="location"` | Web `sensorEngine.js` only works in foreground tab |
| **Room SQLite Local Database** | Offline-first storage | Only MongoDB + in-memory fallback |
| **Firebase Firestore + FCM** | Real-time sync + push notifications | Custom SSE + MongoDB only |
| **CameraX + Exif GPS Stamping** | Pedestrian photo-reporting | Web `getUserMedia` + manual GPS (no Exif) |
| **Perceptual Hash Duplicate Detection** | Spam prevention | Not implemented |
| **OTP Phone Authentication** | Reporter spam prevention | No auth system at all |
| **Quiet Hours (10PM-5AM)** | Night mode adaptive alerts | No time-based alert suppression |
| **Screen Brightness Adaptive Flash** | Only flash if brightness < 20% | No ambient light sensor integration |
| **Directional Verification (heading < 45°)** | Prevents opposite-lane interference | Not implemented |
| **7-Day Pin Expiration** | Unverified pins fade | Backend has cron but frontend doesn't show faded state |
| **Google Maps SDK / OSM Native** | Mobile map rendering | Leaflet web only |
| **AudioTrack + TextToSpeech Alerts** | Voice: "Pothole ahead, 50 meters" | `sensorEngine.playAlertTone` only does beep |
| **Haptic Vibration Patterns by Severity** | 4 patterns: Minor/Moderate/Severe/Critical | Not implemented |
| **Working APK Build** | `minSdk 24`, installable APK | No Android project structure |

---

### 🎯 PRIORITY ORDER FOR HACKATHON COMPLETION

Based on VistERA scoring (Working Prototype 30%, Technical Depth 25%, Real-life Relevance 20%, Vision 15%, Future 10%):

#### **P0 - Must Have for Working Prototype**
1. **Android Native App Scaffold** - Kotlin + Jetpack Compose + CameraX + TFLite
2. **Vehicle Detection Background Service** - 100Hz accelerometer + GPS + TFLite classification
3. **Firebase Firestore + FCM Integration** - Replace custom SSE/MongoDB for real-time
4. **Offline Room Database + Sync Queue** - Works with screen off
5. **APK Build & Install** - Runnable on device

#### **P1 - Technical Depth Boosters**
6. **TFLite 4-Class Model Integration** - Quantized int8 classifier
7. **Perceptual Hash + Rate Limiting** - Anti-spam
8. **Directional Verification + 3-Vote Auto-Verify** - Community trust
8. **Voice (TTS) + Haptic Alerts** - AudioTrack + Vibrator patterns
9. **Adaptive Night Mode Flash** - Brightness sensor + quiet hours

#### **P2 - Vision & Innovation**
10. **Admin Dashboard Web View** - Separate from mobile app
11. **Municipal API Auto-Submit** - ✅ DONE (backend + frontend toggle)
12. **CSV/PDF Export with Photos** - ✅ DONE

---

### 📋 RECOMMENDED NEXT STEPS

**Immediate (Next Session):**
1. Create Android project structure (`frontend/android/`) with Kotlin + Compose
2. Integrate TFLite model + CameraX + Accelerometer Service
3. Add Firebase config (Firestore + FCM)
4. Build Room database + sync queue
5. Generate signed APK for demo

**This analysis shows the web dashboard is 90% feature-complete for a web app, but the hackathon requires an Android native app. The web app serves as an excellent admin/monitoring dashboard and prototype, but the winning deliverable must be the Android APK.**

