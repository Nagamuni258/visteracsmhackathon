# PotholeWatch

Pothole‑Watch is a 36‑hour prototype to quickly detect and report road potholes using on‑device camera analysis, GPS logging, and cloud syncing.  The project is organized for instant demo and easy extension.

## Directory layout
```
.
├─ src
│   ├─ components
│   │   ├─ CameraScreen.tsx
│   │   ├─ ConfirmScreen.tsx
│   │   ├─ MapScreen.tsx
│   │   └─ ExportScreen.tsx
│   ├─ models
│   │   └─ pothole.tflite
│   ├─ utils
│   │   ├─ firebase.ts
│   │   ├─ location.ts
│   │   └─ csv.ts
│   └─ App.tsx
├─ docs
│   └─ PotholeWatch.md
├─ package.json
└─ README.md
```

## Setup
```bash
# Clone the repo
git clone <repo‑url>
cd <repo‑dir>

# Install dependencies
npm install

# Start dev server
npm start
```

## Build / Deploy
You can build a standalone Android or iOS package via Expo:
```bash
expo build:android
expo build:ios
```

## How it works
1. **CameraScreen** – uses `expo-camera` and `@tensorflow/tfjs-react-native` to run the TFLite model on each frame.  When confidence > 0.8 a thumbnail preview pops up.
2. **ConfirmScreen** – the user confirms or dismisses the detection; on confirm we store `{lat, lng, timestamp, imageUri, confidence}` locally using `@react-native-community/async-storage`.
3. **MapScreen** – shows a `react-native-maps` map with pins for each confirmed detection.  Pins cluster when close together.
4. **ExportScreen** – builds a CSV string via `js‑csv‑writer` and opens the device share sheet with `expo-sharing`.
5. **Firebase sync** – when pressing *Sync* all pending detections are written to a Firestore collection with `writeBatch()`.  Offline writes are queued and retried automatically.

## Prerequisites
- Node >= 20
- Expo CLI (`npm i -g expo-cli`)
- Firebase project with Firestore enabled and a service‑account or auth‑mediated access.
- Google Maps API key (for `react-native-maps`).  Insert into `src/utils/firebase.ts`.

## Licensing
This is for a hackathon demo; feel free to use, modify, or fork.
