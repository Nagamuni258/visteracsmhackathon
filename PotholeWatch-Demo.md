# Pothole‑Watch – Live Demo Script for Presentation

## Overview
The demo showcases three roles working together in real‑time:
1. **Field Reporter** – a phone that records vehicle motion, detects a high‑g‑force impact, tags it with GPS, and sends a provisional pin.
2. **Admin** – a separate phone (or tablet) that receives an instant notification, reviews the pin (and optional photo), approves it, and pushes the verified pin to the public map and the admin panel.
3. **Community Users** – other phones that see the pin on the map, can confirm or reject the hazard, and contribute feedback. After enough positive feedback the pin becomes **Verified**; after enough negative feedback it becomes **Unverified**.

The flow runs completely on‑device for detection, with **Firebase Firestore** providing real‑time sync and **Firebase Cloud Messaging (FCM)** delivering the admin notification.

---

## Step‑by‑Step Demo Script

### 1️⃣ Field Reporter – Impact Capture
1. Open the **Pothole‑Watch** app on a phone mounted in a vehicle.
2. The app continuously samples the accelerometer at **100 Hz**.
3. When a sudden spike **> 2 g** is observed, the app:
   - Captures a **0.5 s window** of accelerometer data.
   - Records the **GPS location** and **speed** at impact.
   - Runs the **TensorFlow‑Lite** classifier to confirm the event is a *pothole* (vs speed‑breaker, metal‑plate, flat).
4. If the classifier confidence is **≥ 0.8**, a **thumbnail preview** appears with a **“Confirm?”** button.
5. The reporter taps **Confirm** (or dismisses). The confirmed event is stored locally and immediately **sent to Firestore** as a provisional pin:
   ```json
   {
     "type": "pothole",
     "lat": 12.9716,
     "lng": 77.5946,
     "timestamp": 1730214800000,
     "gForce": 2.3,
     "severity": "Moderate",
     "status": "pending",
     "reporterId": "device‑A"
   }
   ```
6. If the reporter also takes a **photo** (optional mode), the photo is compressed, GPS‑stamped, uploaded to **Firebase Storage**, and its URL is attached to the pin.

---

### 2️⃣ Admin Phone – Real‑Time Notification & Approval
1. The **Admin** device is logged into the same Firebase project and has **FCM** enabled.
2. As soon as the provisional pin is written, the admin receives a push notification:
   > **"New pothole reported near 12.97 N, 77.59 E – 200 m ahead"**
3. Opening the notification launches the **Admin Dashboard** (a simple screen in the app) that shows:
   - Map centered on the new pin.
   - Impact details (g‑force, speed, severity).
   - Photo thumbnail (if present).
4. The admin taps **Approve**.
   - The pin’s `status` field is updated to **"approved"** and the pin appears on the **public map** for all users.
   - Simultaneously, a **structured report** is generated and sent to the **admin panel** (a web endpoint). The payload includes GPS, severity, timestamp, and photo URL.
5. The admin can also **Add a comment** (e.g., “Road crew scheduled”) which is stored under the pin’s `adminNote` field.

---

### 3️⃣ Community Users – Map View & Verification
1. Any other user opens the **Pothole‑Watch** app and sees the approved pin on the live map (colored orange for *moderate* severity).
2. Tapping the pin opens a detail pane with:
   - Photo (if provided).
   - Current feedback counts.
   - Two buttons: **"There is a pothole"** (positive) and **"Not a pothole"** (negative).
3. Users can cast their vote. Each vote is written to Firestore as a sub‑collection `feedback`:
   ```json
   { "userId": "device‑C", "type": "positive" }
   ```
4. The app aggregates feedback in real‑time:
   - **3 positive votes** → pin’s `status` changes to **"verified"** (green check‑mark appears).
   - **2 negative votes** → pin’s `status` changes to **"unverified"** (orange border, admin alerted for review).
5. Once verified, the pin can be exported as part of the **municipal report** (PDF/Email) directly from the map screen.

---

## Visual Flow Diagram (textual representation)
```
[Reporter Phone] -- (g‑force + GPS) --> [Firestore provisional pin]
[Firestore] -- (FCM) --> [Admin Phone Notification]
[Admin Phone] -- (Approve) --> [Firestore update status=approved]
[Firestore] -- (real‑time listener) --> [All Users’ Maps]
[User Phone] -- (positive/negative feedback) --> [Firestore feedback sub‑collection]
[Firestore] -- (aggregate) --> [Pin status = verified/unverified]
[Verified Pin] -- (Export) --> [Admin Panel / PDF Report]
```

---

## Key Points to Highlight in the Presentation
- **Zero‑latency sync:** The admin receives the impact notification within **< 5 seconds** after the spike.
- **On‑device detection:** All g‑force analysis and ML inference run locally – no privacy‑invasive cloud processing.
- **Community verification loop:** Crowdsourced confirmation quickly validates hazards (3 positive votes → verified) while guarding against false reports (2 negative → unverified).
- **Photo workflow:** Optional image capture is automatically GPS‑stamped and sent to the admin panel for visual verification.
- **Scalable backend:** Using **Firebase Firestore** and **FCM** means the system works for dozens of concurrent users without extra server code.
- **Admin panel integration:** A single HTTP call (or Firestore‑triggered Cloud Function) produces a ready‑to‑send municipal complaint, fulfilling the real‑world impact requirement of the hackathon rubric.

---

## Demo Checklist (for the live presentation)
| Item | Done? |
|------|------|
| Field phone mounted, accelerometer sampling visible | ☐ |
| Impact spike generated (e.g., bump a curb) | ☐ |
| Admin receives push notification within 5 s | ☐ |
| Admin opens pin, reviews photo, taps **Approve** | ☐ |
| Pin appears on public map for other phones | ☐ |
| Two community phones cast feedback (2 positive, 1 negative) | ☐ |
| Pin status updates to **Verified** (green check) | ☐ |
| Export button generates PDF with GPS + photo | ☐ |
| Admin panel receives structured report (show webhook log) | ☐ |

---

**This script can be copied into a slide deck or spoken during the demo** to guide judges through each interaction, demonstrating both the technical depth (sensor‑fusion, on‑device ML, real‑time sync) and the social impact (crowd‑verified pothole mapping).