---
name: Pothole‑Watch
description: Prototype for crowd‑sourced pothole detection in 36 hours
metadata:
  type: project
  updated: 2026-10-07
---

# Pothole‑Watch – 36‑hour Prototype

## 1. Goal & Constraints
- **Goal**: Quick prototyping of a mobile app that detects potholes via camera, lets users confirm, attaches GPS, and syncs data to a Firebase Firestore collection.  The app will display the collected data on a live map and provide a CSV export.
- **Constraints**: 36‑hour time window, ₹80k prize pool, 5‑rubric scoring.  Must be a functional end‑to‑end flow, no heavy backend or multi‑user authentication.

## 2. User Flow (MVP)
| Step | User action | System reaction |
|------|-------------|-----------------|
| **Scan** | Open app & point camera | On‑device TF‑Lite model runs at ~2 fps, classifying frames as *pothole* or *clear* |
| **Confirm** | Tap *Confirm* on thumbnail | Detection stored locally in SQLite; thumbnail preview shown |
| **Tag** (opt.) | Add severity (1‑3) & note | Data attached in local DB |
| **Upload** | Tap *Sync* | All confirmed detections are batch‑written to Firestore, logged with timestamp & GPS |
| **Visualize** | View map view | React‑native‑maps shows pins clustered by proximity; clicking pin opens thumbnail |
| **Export** | Press *Export CSV* | Generates CSV with lat, lng, timestamp, severity, note |

## 3. Technical Stack
- **Frontend**: React Native (Expo) – shared Android & iOS, hot‑reload.
- **Catalytic Layer**: TensorFlow‑Lite model (MobileNet‑V2 fine‑tuned on ~500 pothole images).  Exported with ONNX/TFLite.
- **GPS**: `expo-location` to capture lat/lng; guardian permission prompt.
- **Backend**: Firebase Firestore (free tier).  Write via `writeBatch` to avoid per‑write limits.
- **Map**: `react-native-maps` (Google Maps) + `react-native-maps-super-cluster` for pin clustering.
- **Export**: `js‑csv‑writer` to build CSV string and `expo-sharing` to share.

## 4. MVP Scope (What we build in 36 h)
- Camera + ML inference (thumbnail preview).  No real‑time bounding‑box, just highlight when detection confidence > 0.8.
- Confirmation UI.
- GPS tagging.
- Firestore sync (un-privileged writing).  No user auth.
- Map view with clustered pins.
- CSV export button.

## 5. Rubric Alignment
- **Innovation** – on‑device ML + crowdsourced GIS.
- **Impact** – solves a common municipal issue; data can be handed to local municipalities.
- **Technical depth** – mobile inference, GPS fusion, real‑time sensor data.
- **Completeness** – full end‑to‑end flow for a demo.
- **Presentation** – clean UI, live map demo, exportable CSV.

## 6. Risks & Mitigations
- **Poor detection** → use a simple image‑preprocessing fallback (edge detection) if ML confidence falls below 0.4.
- **Firestore write limits** → batch writes, throttle to ≤ 10 writes/sec.
- **Permission friction** → request both permissions on first launch, explain why.
- **Firebase free tier key** – use Expo's demo key; replace quickly when moving to production.

## 7. Next Steps Timeline (≈ 26 h, 10 h buffer)
1. **UI mockups** – 2 h.  Sketch Scan, Confirm, Map, Export screens.
2. **Data prep** – 3 h.  Download pothole dataset (e.g., Kaggle), augment, convert to TFLite.
3. **Expo scaffold** – 2 h.  Basic navigation, permission handlers.
4. **ML inference** – 5 h.  Load model, hook into camera frames, confidence logic.
5. **GPS + Firestore sync** – 4 h.  Write batch logic, offline queue.
6. **Map view + CSV** – 4 h.  Pin clustering, CSV generation + share.
7. **Testing + polish** – 6 h.  Edge cases, crash‑recovery, UI tweaks.

## 8. Deliverables
- **Code** – Git repo with staged commits.  All files committed under `src/`.
- **Demo** – Run on Android emulator or physical device; showcase full flow.
- **Presentation** – 4‑slide deck covering problem, solution, impact, demo, future work.

## 9. Documentation
- Document the architecture and tech stack in `docs/PotholeWatch.md`.
- Commit changes: `git commit -m "Add Pothole‑Watch prototype – Co-Authored-By: Claude Code <noreply@anthropic.com>"`.

---
**Next** – Create a `README.md` with setup instructions and a `docs/` folder for the architecture diagram.  Then we’ll generate an Antigravity prompt for rapid development.
