**Prompt for a 6‑7 slide PowerPoint deck (RoadBump – Pothole & Hazard Mapper)**  

---

**Slide 1 – Title & Hook**  
- Title: **RoadBump – Real‑time, Community‑Verified Road‑Hazard Mapper**  
- Sub‑title: VistERA 2026 36‑Hour Hackathon  
- Visual: Icon of a smartphone with accelerometer/waves overlay on a road silhouette.  
- Tagline: *“Detect. Verify. Protect.”*  

**Slide 2 – The Problem (30 s)**  
- Bullet points (≈3):  
  1. Indian roads cause thousands of accidents yearly; potholes, speed‑breakers & metal plates are major contributors (MoRTH data).  
  2. Current crowd‑sourced apps rely on manual taps → inaccurate location, no severity, no verification.  
  3. Municipalities lack real‑time, verified hazard data → delayed repairs, higher risk.  
- Visual: Split image – left: damaged vehicle/pothole; right: outdated manual report form.  

**Slide 3 – Solution Overview (45 s)**  
- Diagram (center‑out flow):  
  1. **Phone (Accelerometer + GPS + Camera)** → on‑device detection → **Provisional Pin** (Firestore).  
  2. **FCM Push** → **Admin Phone** (notification + detail view).  
  3. **Admin Approves** → Pin becomes **Approved** → broadcast to **Nearby Users** (alarm / night‑flash).  
  4. **Community Verification** (thumbs‑up/down) → **Verified** (≥3 ↑) or **Unverified** (≥2 ↓).  
  5. **Municipal Report** (PDF/Email) generated from verified pin.  
- Visual: Simple flow‑chart with icons (phone, bell, map, thumbs, document).  

**Slide 4 – Core Features (45 s)**  
- Two‑column list (icons + short text):  
  **Vehicle‑First Auto‑Detection**  
  - 100 Hz accelerometer + speed > 5 km/h gate → high‑pass filter → RMS > 2 g → waveform shape check → 2‑of‑3 TF‑Lite consensus → severity scoring → duplicate/cluster filter.  
  **Pedestrian Photo‑Report**  
  - CameraX → photo + GPS/timestamp (Exif) → upload → pin → FCM → confirm/reject → verified → municipal PDF/email.  
  **Admin & Nearby‑User Alerts**  
  - Instant FCM notification to admin (impact g‑force, speed, severity, thumbnail).  
  - Admin taps **Approve** → pin status = approved.  
  - Nearby crossing devices receive **audible alarm + vibration**; in night‑mode → low‑brightness screen flash (2 s).  
  **Community Verification**  
  - 3 positive votes → **Verified** (green check).  
  - 2 negative votes → **Unverified** (orange border, admin re‑review).  
  **Additional**  
  - Optional photo capture (auto‑stamped, sent to admin panel).  
  - Offline‑first: local Room cache, batch writes, map‑tile caching.  
  - Battery‑optimized: Stage‑1 gate, sleep at 1 Hz when idle → < 5 %/hr drain.  

**Slide 5 – Demo Flow (Live Presentation)**  
- Numbered steps (as you would narrate):  
  1. **Reporter phone** shaken in a vehicle → impact detected → thumbnail preview → **Confirm**.  
  2. **Admin phone** receives FCM notification → opens detail → taps **Approve**.  
  3. **Nearby crossing phones** get **alarm** (day) or **screen flash + vibration** (night).  
  4. **Community users** see pin on map → cast **thumbs‑up/down**.  
  5. After **3 ↑** → pin turns **Verified** (green check); after **2 ↓** → **Unverified** (orange border).  
  6. **Export** CSV or **PDF** report from admin panel.  
- Visual: Timeline strip with icons for each step (shake, bell, flash, thumbs, document).  

**Slide 6 – Impact Metrics & Why This Wins (30 s)**  
- Bullet targets (rubric‑aligned):  
  - GPS accuracy > 95 % (pin location).  
  - Notification delivery ≤ 5 s (FCM).  
  - Feedback loop ≤ 60 s (first confirmation).  
  - Photo upload success > 98 %.  
  - Detection precision > 85 % / recall > 80 % (4‑class TF‑Lite).  
  - Severity‑depth correlation R² > 0.7.  
  - False‑positive rate < 5/10 km city, < 2/10 km highway.  
  - Battery drain < 5 %/hr with detection ON.  
  - Community verification rate > 60 % verified within 24 h.  
- Visual: Radar‑chart or bar‑graph showing each metric vs. target.  

**Slide 7 (Optional) – Timeline & Call‑to‑Action**  
- 36‑hour development breakdown (UI mockups 2 h, data prep 3 h, Expo scaffold 2 h, ML integration 5 h, GPS + Firestore sync 4 h, admin notification/approval 4 h, map/alert/flash + CSV 4 h, testing + polish 6 h → ~10 h buffer).  
- Closing: QR code / GitHub link, thank‑you, invitation to test the demo.  

---  
*Use this prompt with your slide‑creation skill (e.g., `/design-is` or an artifact‑generating tool) to produce a clean 6‑7 slide PowerPoint that covers every feature of RoadBump.*