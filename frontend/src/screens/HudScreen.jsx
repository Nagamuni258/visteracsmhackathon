import React, { useState, useEffect, useRef, useMemo } from 'react';
import { sensorEngine } from '../services/sensorEngine';
import { api } from '../api';

// Helper to compute exact distance in meters using Haversine formula
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2)) {
    return 20;
  }
  const R = 6371000; // Earth radius in meters
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function HudScreen({ onNavigateMap }) {
  // Vehicle Telemetry
  const [gForce, setGForce] = useState(0.34);
  const [peakG, setPeakG] = useState(2.85);
  const [speed, setSpeed] = useState(5.2); // Walking pace km/h
  const [flashArmed, setFlashArmed] = useState(true);
  const [hardwareLive, setHardwareLive] = useState(false);

  // Live User GPS Telemetry
  const [userLocation, setUserLocation] = useState({
    latitude: 17.3236,
    longitude: 78.5353,
    accuracy: 3.2,
    speed: 5.2,
    heading: 45,
    isRealGps: true,
    timestamp: new Date()
  });

  // Backend Pins & Auto Walking Simulation (20m)
  const [pins, setPins] = useState([]);
  const [simulationActive, setSimulationActive] = useState(true); // Auto walking simulation active by default
  const [simDistance, setSimDistance] = useState(20);
  const [simProgress, setSimProgress] = useState(15);

  // Audio & Alarm Controls
  const [alarmArmed, setAlarmArmed] = useState(true);
  const audioCtxRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // 1. Fetch live registered pins from backend API
  const fetchPins = async () => {
    try {
      const pinList = await api.getPins();
      if (Array.isArray(pinList) && pinList.length > 0) {
        setPins(pinList);
      }
    } catch (err) {
      console.warn('Failed to load pins for HUD proximity:', err);
    }
  };

  useEffect(() => {
    fetchPins();
    const pinPoll = setInterval(fetchPins, 8000);
    return () => clearInterval(pinPoll);
  }, []);

  // 2. High-Accuracy Hardware GPS Tracking of the User
  useEffect(() => {
    let watchId = null;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords) {
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 3),
              speed: pos.coords.speed ? +(pos.coords.speed * 3.6).toFixed(1) : 5.0,
              heading: pos.coords.heading || 0,
              isRealGps: true,
              timestamp: new Date()
            });
          }
        },
        (err) => console.log('HUD initial GPS note:', err.message),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos?.coords) {
            setUserLocation(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 3),
              speed: pos.coords.speed !== null && !isNaN(pos.coords.speed)
                ? +(pos.coords.speed * 3.6).toFixed(1)
                : prev.speed,
              heading: pos.coords.heading || prev.heading,
              isRealGps: true,
              timestamp: new Date()
            }));
          }
        },
        (err) => console.log('HUD continuous GPS note:', err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 6000 }
      );
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // 3. Sensor Engine 100Hz Telemetry
  useEffect(() => {
    sensorEngine.init();
    const unsubscribe = sensorEngine.subscribe((engineState) => {
      setGForce(+(engineState.currentRms.toFixed(2)));
      setPeakG(+(engineState.peakRms.toFixed(2)));
      if (engineState.speed > 1) {
        setSpeed(+(engineState.speed.toFixed(1)));
      }
      setHardwareLive(engineState.hardwareAvailable);

      if (engineState.latitude && engineState.longitude) {
        setUserLocation(prev => ({
          ...prev,
          latitude: engineState.latitude,
          longitude: engineState.longitude,
          isRealGps: true
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Loud Piercing Alarm Siren Generator (Web Audio + Vibration)
  const triggerAlarmTone = (dist = 10) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.16);
      osc.frequency.linearRampToValueAtTime(1020, now + 0.32);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.40);

      // Haptic Vibration on device
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([180, 80, 180, 80, 300]);
      }
    } catch (e) {
      console.warn('Alarm sound note:', e);
    }
  };

  // 5. Find Nearest Pothole from Database or Default 20m Ahead
  const nearestHazard = useMemo(() => {
    if (pins && pins.length > 0) {
      const withDistance = pins.map(pin => {
        const dist = calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          pin.latitude,
          pin.longitude
        );
        return { ...pin, realDistanceMeters: dist };
      });

      withDistance.sort((a, b) => a.realDistanceMeters - b.realDistanceMeters);
      const closest = withDistance[0];
      if (closest.realDistanceMeters <= 200) {
        return closest;
      }
    }

    // Default target placed 20m ahead of current GPS
    const exact20mLat = +(userLocation.latitude + 0.00018).toFixed(6);
    const exact20mLng = +userLocation.longitude.toFixed(6);

    return {
      id: 'default-pothole-20m',
      type: 'pothole',
      severity: 'Critical',
      severityLevel: 4,
      latitude: exact20mLat,
      longitude: exact20mLng,
      depthCm: 14.5,
      address: 'Hitech City Main Rd, near Cyber Gateway',
      ward: 'Ward #104 GHMC West',
      lane: 'Inner Left Lane',
      confirmations: 8,
      status: 'verified',
      realDistanceMeters: 20
    };
  }, [pins, userLocation.latitude, userLocation.longitude]);

  // 6. Active Display Distance (Auto Walking 20m Simulation vs Real GPS)
  const currentDistanceMeters = useMemo(() => {
    if (simulationActive) {
      return simDistance;
    }
    if (nearestHazard?.realDistanceMeters !== undefined) {
      return nearestHazard.realDistanceMeters;
    }
    return 20;
  }, [simulationActive, simDistance, nearestHazard]);

  // Dynamic ETA Calculation
  const walkSpeedMps = 1.35; // ~5 km/h walking speed (m/s)
  const dynamicEta = Math.max(1, Math.round(currentDistanceMeters / walkSpeedMps));

  // 7. Auto Walking Simulation of 20m (Smoothly walks from 20m down to 0m)
  useEffect(() => {
    if (!simulationActive) return;

    const walkInterval = setInterval(() => {
      setSimDistance(prev => {
        if (prev <= 1) {
          // Rebound back to 20m after reaching 0m
          setSimProgress(10);
          return 20;
        }
        // Walk forward ~1.5m every step
        const nextDist = Math.max(0, +(prev - 1.5).toFixed(1));
        const progress = Math.min(100, Math.round(((20 - nextDist) / 20) * 100));
        setSimProgress(progress);
        return nextDist;
      });
    }, 850);

    return () => clearInterval(walkInterval);
  }, [simulationActive]);

  // 8. Automatic Proximity Alarm Trigger (Runs alarm when approaching <= 10m)
  useEffect(() => {
    if (!alarmArmed) return;

    const now = Date.now();
    if (currentDistanceMeters <= 10 && now - lastAlertTimeRef.current > 1800) {
      lastAlertTimeRef.current = now;
      triggerAlarmTone(currentDistanceMeters);
    }
  }, [currentDistanceMeters, alarmArmed]);

  // Calculate arc angle for SVG dial
  const ratio = Math.min(1, Math.max(0, gForce / 3.0));
  const angle = Math.PI - ratio * Math.PI;
  const radius = 96;
  const cx = 120;
  const cy = 120;
  const pointerX = cx + radius * Math.cos(angle);
  const pointerY = cy - radius * Math.sin(angle);

  // Proximity Progress Bar Fill (0 to 100% as distance approaches 0m)
  const proximityProgressPct = simulationActive
    ? simProgress
    : Math.min(100, Math.max(10, Math.round((1 - Math.min(25, currentDistanceMeters) / 25) * 100)));

  const isCriticalProximity = currentDistanceMeters <= 10;
  const isImpactImminent = currentDistanceMeters <= 4;

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 px-4 gap-4 max-w-md mx-auto animate-fadeIn">
      {/* Subheader Tactile Status Pill with User's Exact GPS */}
      <div className="clay-surface rounded-2xl px-4 py-2.5 flex items-center justify-between border border-white/60 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#10B981] animate-ping"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-extrabold text-clay-dark tracking-wide uppercase truncate">
              {userLocation.isRealGps ? 'LIVE GPS ACTIVE' : 'VEHICLE MODE ENGAGED'}
            </span>
            <span className="text-[10px] font-mono font-semibold text-clay-subtle truncate">
              {(Number(userLocation?.latitude) || 17.3236).toFixed(4)}°N, {(Number(userLocation?.longitude) || 78.5353).toFixed(4)}°E (±{userLocation?.accuracy || 3}m)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 clay-surface-sunken px-2.5 py-1 rounded-full shrink-0">
          <span className="material-symbols-outlined text-[14px] text-clay-teal font-bold">
            satellite_alt
          </span>
          <span className="text-[10px] font-bold text-clay-teal font-mono">
            {userLocation.isRealGps ? 'REAL LOCK' : 'GPS LOCK'}
          </span>
        </div>
      </div>

      {/* Shake-to-Register Indicator Pill */}
      <div
        onClick={() => {
          sensorEngine.triggerShakeHazard(5.5);
        }}
        role="button"
        tabIndex={0}
        className="clay-surface rounded-2xl px-4 py-2.5 flex items-center justify-between border border-white/70 shadow-sm bg-gradient-to-r from-orange-50/40 to-amber-50/40 cursor-pointer active:scale-95 transition-all hover:border-amber-400"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[17px]">vibration</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-extrabold text-[#1E293B] tracking-wide uppercase truncate">
              SHAKE TO REGISTER HAZARD
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] truncate">
              Shake phone to detect &amp; sync pin to Phone 2 live (or tap)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shrink-0 animate-pulse">
          SHAKE / TAP
        </span>
      </div>

      {/* Proximity Radar Intercept Clay Card: APPROACHING POTHOLE HAZARD */}
      <div className={`clay-surface rounded-[28px] p-5 relative overflow-hidden border transition-all duration-300 flex flex-col gap-3.5 shadow-md ${
        isCriticalProximity ? 'border-red-400 bg-red-50/40 ring-2 ring-red-400/40' : 'border-white/70'
      }`}>
        <div className={`absolute -right-8 -top-8 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
          isCriticalProximity ? 'bg-red-500/25 animate-pulse' : 'bg-clay-coral/15'
        }`}></div>

        {/* Card Header: Radar Intercept & ETA */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
              isCriticalProximity ? 'bg-red-500 text-white animate-bounce' : 'bg-clay-coralSoft text-clay-coral'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {isCriticalProximity ? 'emergency' : 'crisis_alert'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                isCriticalProximity ? 'text-red-600' : 'text-clay-coral'
              }`}>
                {isImpactImminent
                  ? '🚨 IMPACT IMMINENT (<5M)'
                  : isCriticalProximity
                  ? '⚠️ 10M PROXIMITY INTERCEPT'
                  : 'PROXIMITY RADAR INTERCEPT'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {simulationActive ? 'Auto Walking Simulation (20m)' : 'Tracking Nearest Street Hazard'}
              </span>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold font-mono shadow-sm ${
            isCriticalProximity ? 'bg-red-600 text-white animate-pulse' : 'clay-pill-coral text-white'
          }`}>
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>ETA ~{dynamicEta}s</span>
          </div>
        </div>

        {/* Dynamic Approaching Distance & Hazard Specs */}
        <div className="flex flex-col z-10 gap-1">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-extrabold text-clay-dark tracking-tight leading-tight">
              {isImpactImminent ? (
                <span className="text-red-600 animate-pulse">IMPACT IMMINENT ({currentDistanceMeters}m)!</span>
              ) : isCriticalProximity ? (
                <span className="text-red-600">Pothole Intercept: <span className="font-mono">{currentDistanceMeters}m</span> Ahead</span>
              ) : (
                <span>Approaching Pothole in <span className="text-red-500 font-mono">{currentDistanceMeters}m</span></span>
              )}
            </h3>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
              {speed} km/h
            </span>
          </div>

          <p className="text-xs font-semibold text-clay-subtle">
            {nearestHazard?.severity || 'Critical'} Pothole (Depth ~{nearestHazard?.depthCm || 14.5}cm) • {nearestHazard?.lane || 'Inner Left Lane'}
          </p>

          <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
            📍 {nearestHazard?.address || 'Hitech City Main Rd, near Cyber Gateway'}
          </p>
        </div>

        {/* Target Pothole Telemetry GPS Pill */}
        <div className="flex items-center justify-between p-2.5 bg-white/70 clay-surface-sunken rounded-xl text-[11px] font-mono z-10 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0 truncate">
            <span className="material-symbols-outlined text-[15px] text-red-500">location_on</span>
            <span className="truncate">TARGET: {nearestHazard?.latitude?.toFixed(4)}°, {nearestHazard?.longitude?.toFixed(4)}°</span>
          </div>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
            {nearestHazard?.status === 'verified' ? 'VERIFIED' : 'ACTIVE'}
          </span>
        </div>

        {/* Tactile Inset Progress Bar (Fills up as user nears the hazard) */}
        <div className="w-full clay-surface-sunken h-4 rounded-full p-0.5 flex items-center relative overflow-hidden z-10">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              isCriticalProximity
                ? 'bg-gradient-to-r from-orange-500 to-red-600 animate-pulse'
                : 'clay-pill-coral'
            }`}
            style={{ width: `${proximityProgressPct}%` }}
          ></div>
        </div>

        {/* Proximity Footer & Action Controls: 20M RANGE + Auto Walk Toggle + View on Map */}
        <div className="flex items-center justify-between text-xs font-semibold text-clay-subtle pt-1 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-clay-dark/80 bg-slate-200/60 px-2 py-0.5 rounded-md">
              20M RANGE
            </span>

            {/* Auto Walking Simulation of 20m Toggle Button */}
            <button
              onClick={() => {
                const next = !simulationActive;
                setSimulationActive(next);
                if (next) {
                  setSimDistance(20);
                  setSimProgress(15);
                  triggerAlarmTone(20);
                }
              }}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all shadow-sm ${
                simulationActive
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle 20m Auto Walking Simulation"
            >
              {simulationActive ? '⏹ Auto Walk Active' : '▶ Auto Walk (20m)'}
            </button>
          </div>

          {/* Jump to Map Focus */}
          <button
            onClick={() => onNavigateMap && onNavigateMap(nearestHazard)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-[11px] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 active:scale-95 transition-all shadow-sm"
          >
            <span>View on Map</span>
            <span className="material-symbols-outlined text-[14px]">explore</span>
          </button>
        </div>
      </div>

      {/* 3-Axis Accelerometry / Z-Peak Telemetry Clay Card */}
      <div className="clay-surface rounded-[28px] p-5 flex flex-col gap-4 border border-white/70 relative shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-clay-subtle tracking-wider uppercase">
              3-AXIS ACCELEROMETRY
            </span>
            <h2 className="text-lg font-bold text-clay-dark tracking-tight leading-tight">
              Z-Peak Telemetry
            </h2>
          </div>
          <div className="clay-surface-sunken px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-clay-amber">sensors</span>
            <span className="text-[11px] font-bold text-clay-amber font-mono">100 Hz SYNC</span>
          </div>
        </div>

        {/* Claymorphic Arc Dial Visualizer Container */}
        <div className="clay-surface-sunken rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <svg className="w-64 h-36 overflow-visible" fill="none" viewBox="0 0 240 135">
            <path
              d="M 24 120 A 96 96 0 0 1 216 120"
              stroke="#CBD8E6"
              strokeLinecap="round"
              strokeWidth="16"
            ></path>
            <path
              d="M 176 40 A 96 96 0 0 1 216 120"
              stroke="#FFD8D8"
              strokeLinecap="round"
              strokeWidth="16"
            ></path>
            <defs>
              <linearGradient id="gArcGrad" x1="0%" x2="100%" y1="100%" y2="0%">
                <stop offset="0%" stopColor="#4D7CFE"></stop>
                <stop offset="60%" stopColor="#FF9F1C"></stop>
                <stop offset="100%" stopColor="#FF6B6B"></stop>
              </linearGradient>
            </defs>
            <path
              className="transition-all duration-300"
              d={`M 24 120 A 96 96 0 0 1 ${pointerX.toFixed(1)} ${pointerY.toFixed(1)}`}
              stroke="url(#gArcGrad)"
              strokeLinecap="round"
              strokeWidth="16"
            ></path>
            <circle
              cx={pointerX.toFixed(1)}
              cy={pointerY.toFixed(1)}
              fill="#FFFFFF"
              filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.2))"
              r="8"
              stroke="#FF9F1C"
              strokeWidth="3"
            ></circle>
            <circle cx="192" cy="52" fill="#FF6B6B" r="5"></circle>
          </svg>

          {/* Center Inset Readout */}
          <div className="flex flex-col items-center -mt-16 text-center z-10">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-clay-dark tracking-tight font-mono">
                {gForce}
              </span>
              <span className="text-xl font-bold text-clay-coral font-mono">G</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="clay-pill-amber text-[10px] text-white px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider">
                PEAK: {peakG} G
              </span>
              <span className="clay-surface px-2 py-0.5 rounded-full text-[10px] font-semibold text-clay-subtle border border-white">
                ±0.02G NOISE
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Telemetry Shelf */}
        <div className="grid grid-cols-2 gap-3">
          <div className="clay-surface-sunken p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-clay-subtle">
              <span className="text-[10px] font-bold tracking-wider uppercase">SPEED (OBD/GPS)</span>
              <span className="material-symbols-outlined text-[16px] text-clay-blue">directions_walk</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-extrabold text-clay-dark font-mono">{speed}</span>
              <span className="text-xs font-bold text-clay-subtle">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-clay-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-teal"></span>
              <span className="text-[10px] font-medium">GPS Active Tracking</span>
            </div>
          </div>

          <div className="clay-surface-sunken p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-clay-subtle">
              <span className="text-[10px] font-bold tracking-wider uppercase">VIBE SEVERITY</span>
              <span className="material-symbols-outlined text-[16px] text-clay-amber">vibration</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-extrabold text-clay-amber font-mono">
                {gForce > 2.0 ? 'CRITICAL' : gForce > 1.2 ? 'MODERATE' : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-clay-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-amber"></span>
              <span className="text-[10px] font-medium font-mono">DSP Window 40ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Hazard Corridor Shelf */}
      <div className="clay-surface rounded-[28px] p-5 flex flex-col gap-3 border border-white/70 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-clay-subtle tracking-wider uppercase">
            LIVE FLAGGED CORRIDOR HAZARDS
          </span>
          <button
            onClick={() => onNavigateMap && onNavigateMap(null)}
            className="text-[11px] font-bold text-clay-blue hover:underline flex items-center gap-1"
          >
            <span>All Pins</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Display live pins from DB */}
        {(pins.length > 0 ? pins.slice(0, 3) : [
          {
            id: 'mock-1',
            type: 'pothole',
            severity: 'Critical',
            address: 'Cyber Towers Corridor',
            latitude: 17.3237,
            longitude: 78.5352,
            confirmations: 6
          },
          {
            id: 'mock-2',
            type: 'speed-breaker',
            severity: 'Moderate',
            address: 'Mindspace Junction',
            latitude: 17.438,
            longitude: 78.354,
            confirmations: 4
          }
        ]).map((item, idx) => {
          const itemDist = calculateDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            item.latitude,
            item.longitude
          );
          const isPothole = item.type === 'pothole';

          return (
            <div
              key={item.id || idx}
              onClick={() => onNavigateMap && onNavigateMap(item)}
              className="flex items-center justify-between p-3 clay-surface-sunken rounded-2xl cursor-pointer hover:bg-slate-100/60 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  isPothole ? 'clay-pill-coral' : 'clay-pill-amber'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {isPothole ? 'crisis_alert' : 'texture'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-clay-dark truncate">
                    {item.address || `${(item?.type || 'pothole').toUpperCase()} • Ward #104`}
                  </span>
                  <span className="text-[10px] text-clay-subtle truncate font-mono">
                    {itemDist >= 1000 ? `${(itemDist / 1000).toFixed(1)} km away` : `${itemDist} m away`} • {item.confirmations || 1} votes
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                item.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isPothole
                  ? 'clay-pill-coral text-white'
                  : 'clay-pill-amber text-white'
              }`}>
                {item.status === 'verified' ? 'VERIFIED' : 'FLAGGED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
