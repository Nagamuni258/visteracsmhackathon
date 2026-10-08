---
number: 5555
subject: "Pothole‑Watch: 36‑hour crowd‑sourced pothole detector"
---

**Description** – Quickly prototype on‑device camera detection of potholes, GPS tagging, Firestore sync, live map view, and CSV export.  Aimed for the VistERA 2026 hackathon (36 hrs, ₹80k, 5‑rubric scoring).

**Plan** –
1. Create Expo app scaffold.
2. Add `expo-camera`, `expo-location`, `@tensorflow/tfjs-react-native` and TF‑Lite model.
3. Build `CameraScreen` with inference loop.
4. Build `ConfirmScreen` and local store.
5. Build `MapScreen` using `react-native-maps` with clustering.
6. Build `ExportScreen` with CSV and sharing.
7. Hook up Firestore writes.
8. Test on emulator / device.
9. Prepare demo slides.
10. Commit with integration message.

**Resources** –
- Tiburri, P. et al., *TinyML on mobile and embedded devices*, 2022.
- Expo SDK docs: https://docs.expo.dev/
- Firebase Firestore docs: https://firebase.google.com/docs/firestore

**Notes** – The workflow prioritizes quick demonstrability; optional features (severity rating, offline queue, auth) are omitted for brevity.
