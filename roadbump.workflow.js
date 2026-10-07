export const meta = {
  name: 'roadbump-development',
  description: 'Orchestrate the development of RoadBump pothole detection system across 5 phases',
  phases: [
    { title: 'Project Setup & Sensor Capture' },
    { title: 'ML Classification & Severity Scoring' },
    { title: 'Foreground Service & Community Verification' },
    { title: 'Municipal Reporting, Night Mode & Audio/Haptic Alerts' },
    { title: 'Database Logging & Analytics UI' }
  ]
};

const PHASES = [
  {
    key: 'setup',
    prompt: 'Set up Kotlin Android project with minSdk=24, compileSdk=34. Add dependencies for TensorFlow Lite, Room, Jetpack Compose, Google Maps. Create empty packages: service, sensor, ml, logic, data, ui, utils. Configure AndroidManifest.xml with required permissions: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION, POST_NOTIFICATIONS, VIBRATE, INTERNET, ACCESS_NETWORK_STATE.'
  },
  {
    key: 'sensors',
    prompt: 'Create sensor/RoadImpactSensor.kt for accelerometer and GPS capture. Configure 100Hz accelerometer with high-pass filter (>10Hz), RMS g-force calculation, impact detection threshold (>2.0g spike). Only process when GPS speed > 5km/h. Create coroutine to read buffer, detect impacts, capture timestamp/location/speed/0.5s window data. Render live debug overlay showing RMS g-force, impact count, last classification.'
  },
  {
    key: 'ml',
    prompt: 'Create ml/ImpactClassifier.kt and logic/SeverityScorer.kt. For ImpactClassifier: pass 0.5s window (50 samples) to TFLite ImageClassifier treating waveform as 1D image. Input: 1x50x1 float buffer normalized [-1,1]. Output: 4-class probability [pothole, speed-breaker, metal-plate, flat]. Require 2-of-3 window consensus. For SeverityScorer: calculate base score from g-force amplitude, normalize by sqrt(speed), factor in impact duration, map to Minor/Moderate/Severe/Critical. Calibrate using test dataset.'
  },
  {
    key: 'service',
    prompt: 'Create service/HazardDetectionService.kt extending LifecycleService. Move RoadImpactSensor, ImpactClassifier, SeverityScorer into service. Declare foregroundServiceType="location". Create ongoing notification channel "road_alerts" with Stop PendingIntent. Create logic/HazardMapper.kt: on confirmed hazard, save GPS+location+speed, classify type, score severity, check for existing pins within 50m (update or create), enter 3s cooldown. Create data/HazardRepository.kt for Room operations. Create ui/HazardMapFragment.kt for Google Maps visualization with clustered, color-coded pins. Create logic/HazardVerificationLayer.kt: nearby users (within 100m, same direction) can confirm/reject pins. 3+ confirmations = verified, 2+ rejections = flagged. Create utils/MunicipalReportGenerator.kt: generate formatted complaint PDF/email/share with timestamp, location, hazard type, severity, report count, speed. Create audio/AudioAlertManager.kt: configure AudioTrack for hazard alert tones, TextToSpeech for voice warnings, Vibrator for haptic feedback patterns based on hazard type and severity. Create optional camera/CameraPhotoCapture.kt: use CameraX to capture verification photos on hazard detection (manual trigger or auto-capture).'
  },
  {
    key: 'database',
    prompt: 'Create data/HazardDatabase.kt defining Room entity HazardEvent with fields: id, timestamp, hazardClass, severityLevel, severityScore, gForcePeak, impactDurationMs, latitude, longitude, speedKmh, reportCount (default 1), isVerified (default false), confirmationCount (default 0), rejectionCount (default 0). Create DAO with methods: insertHazardEvent(), getRecentHazards(limit), getHazardById(id), updateVerification(id, isVerified), incrementReportCount(id), clearAllHazards(). Create Room database singleton exposing DAO. Inject DAO into HazardDetectionService to record each confirmed hazard. Create ui/HazardAnalyticsFragment.kt in Jetpack Compose: LazyColumn showing hazard rows with timestamp, class, severity, confirmation count, distance. Add filters by type/severity/verification. Include Clear All button. Show summary stats: total hazards, verified %, avg severity score.'
  }
];

const results = await pipeline(
  PHASES,
  (phase) => agent(phase.prompt, { label: `phase:${phase.key}`, phase: phase.title }),
  (phaseResults) => {
    // Combine all phase results
    return {
      setup: phaseResults[0],
      sensors: phaseResults[1],
      ml: phaseResults[2],
      service: phaseResults[3],
      database: phaseResults[4]
    };
  }
);

return { results };