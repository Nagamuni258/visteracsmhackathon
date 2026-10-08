---
name: PotholeWatch-PROCEDURE
description: Step‑by‑step guide for building the Pothole‑Watch prototype in 36 h
metadata:
  type: guide
  updated: 2026-10-07
---

## 1. Project bootstrap
1. `expo init pothole-watch` – choose blank (TypeScript).
2. `cd pothole-watch`
3. Add dependencies:
   ```bash
   expo install expo-camera expo-location expo-permissions
   npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
   npm i react-native-maps react-native-maps-super-cluster
   npm i js-csv-writer expo-sharing @react-native-community/async-storage
   ```
4. Place pre‑trained `pothole.tflite` in `src/models`.

## 2. Camera & inference
- In `CameraScreen.tsx` set up `Camera` component.
- Load TFLite with `tf.tidy()`.
- Run inference every 500 ms (2 fps).  If `confidence > 0.8` show a thumbnail preview.
- Pass result to `ConfirmScreen` via navigation params.

## 3. Confirmation & local storage
- `ConfirmScreen` shows thumbnail and **Confirm / Dismiss**.
- On Confirm, push detection object `{lat, lng, ts, confidence, imgUri}` to local `AsyncStorage`.
- Keep an array `pendingDetections` in `AsyncStorage` (JSON string).

## 4. Sync to Firestore
- In `MapScreen`, add **Sync** button.
- When pressed, retrieve `pendingDetections`, batch‑write to `pothole_collections` collection.
- On success, clear local array.

## 5. Map view
- Use `MapView` with clustering logic from `react-native-maps-super-cluster`.
- Each marker's `data` includes severity & timestamp.
- Marker callout shows thumbnail.

## 6. CSV export
- `ExportScreen` builds CSV via `js-csv-writer`.
- Create local file, then open share sheet with `expo-sharing`.

## 7. Firestore config
- Create `src/utils/firebase.ts`:
  ```ts
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_ID',
    appId: 'YOUR_APP_ID',
  };
  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);
  ```

## 8. Testing
- Run on Android emulator: `expo start --android`.
- Verify camera preview, detection overlay, GPS permission, sync, map, export.

## 9. Final polish
- Add light/dark themes via `react-native-paper`.
- Add simple onboarding text.
- Ensure all UI text is i18n‑ready.

## 10. Commit & doc
- Commit all work.
- Add final README.
- Run `npm run lint`.
- Tag commit: `git tag -a v1.0 -m "Pothole‑Watch v1.0 – Co‑Authored‑By: Claude Code <noreply@anthropic.com>"`.

---
**TL;DR** – Scaffold Expo, set up camera, inference, local store, Firestore sync, map, CSV export.  Test on device, polish UI, commit.  Nice demo for 36‑hour hackathon. 
