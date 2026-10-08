---
name: PotholeWatch-Workflow
description: User workflow for deploying and demoing the Pothole‑Watch prototype
---

## 1. Setup (30 min)
1. Clone the repo and navigate to the project root.
2. Run `npm install` to pull all dependencies.
3. Add your Firebase config to `src/utils/firebase.ts`.
4. Obtain a Google Maps API key and paste into `expo.config.js`.

## 2. Run locally (15 min)
- `expo start` – choose a simulator or connect a real mobile device.
- Grant camera and location permissions.
- Scan a road segment.
- Confirm a detection.
- View the Map screen and sync data.
- Export a CSV and check the file.

## 3. Final Test (10 min)
- Verify offline sync works (disable Wi‑Fi, scan, sync, re‑enable Wi‑Fi).
- Confirm map clustering when multiple detections nearby.
- Test CSV share on both Android and iOS.

## 4. Presenting the Demo (5 min)
1. Show the camera scanning interface.
2. Demonstrate a quick detection confirmation.
3. Hit **Sync** – watch the Firestore update.
4. Switch to Map view – see clustered pins.
5. Export CSV – open shared file.
6. Summarize how the data can be handed to local municipal bodies.

---
**Result** – A functional, end‑to‑end prototype that can be demo’d in a few minutes.
