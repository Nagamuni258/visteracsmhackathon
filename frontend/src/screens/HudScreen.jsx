import React, { useState, useEffect } from 'react';
import { sensorEngine } from '../services/sensorEngine';

export default function HudScreen({ onNavigateMap }) {
  const [eta, setEta] = useState(4);
  const [gForce, setGForce] = useState(0.34);
  const [peakG, setPeakG] = useState(2.85);
  const [speed, setSpeed] = useState(42);
  const [flashArmed, setFlashArmed] = useState(true);
  const [hardwareLive, setHardwareLive] = useState(false);

  useEffect(() => {
    sensorEngine.init();
    const unsubscribe = sensorEngine.subscribe((engineState) => {
      setGForce(+(engineState.currentRms.toFixed(2)));
      setPeakG(+(engineState.peakRms.toFixed(2)));
      setSpeed(Math.round(engineState.speed));
      setHardwareLive(engineState.hardwareAvailable);
    });

    const etaTimer = setInterval(() => {
      setEta(prev => (prev > 1 ? prev - 1 : 6));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(etaTimer);
    };
  }, []);

  // Compute arc angle for SVG dial (from 24,120 to 216,120)
  // Max gForce 4.0G
  const ratio = Math.min(1, Math.max(0, gForce / 3.0));
  const angle = Math.PI - ratio * Math.PI;
  const radius = 96;
  const cx = 120;
  const cy = 120;
  const pointerX = cx + radius * Math.cos(angle);
  const pointerY = cy - radius * Math.sin(angle);

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 px-4 gap-4 max-w-md mx-auto animate-fadeIn">
      {/* Subheader Tactile Status Pill */}
      <div className="clay-surface rounded-2xl px-4 py-2.5 flex items-center justify-between border border-white/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-clay-blue animate-pulse shrink-0"></div>
          <span className="text-[11px] font-bold text-clay-dark tracking-wide uppercase truncate">
            VEHICLE MODE ENGAGED
          </span>
          <span className="text-clay-subtle text-xs">•</span>
          <span className="text-[11px] font-medium text-clay-subtle tracking-wide truncate">
            BACKGROUND RUNNING
          </span>
        </div>
        <div className="flex items-center gap-1.5 clay-surface-sunken px-2.5 py-1 rounded-full shrink-0">
          <span className="material-symbols-outlined text-[14px] text-clay-teal font-bold">
            satellite_alt
          </span>
          <span className="text-[11px] font-bold text-clay-teal font-mono">GPS LOCK</span>
        </div>
      </div>

      {/* Proximity Radar Intercept Clay Card */}
      <div className="clay-surface rounded-[28px] p-5 relative overflow-hidden border border-white/70 flex flex-col gap-3">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-clay-coral/10 blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-clay-coralSoft flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-clay-coral text-[20px] animate-bounce">
                warning
              </span>
            </div>
            <span className="text-[12px] font-bold text-clay-coral tracking-wider uppercase">
              PROXIMITY RADAR INTERCEPT
            </span>
          </div>
          <div className="clay-pill-coral text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold font-mono">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>ETA {eta}s</span>
          </div>
        </div>

        <div className="flex flex-col z-10">
          <h3 className="text-lg font-bold text-clay-dark tracking-tight leading-tight">
            Approaching Hazard in 180m
          </h3>
          <p className="text-xs font-medium text-clay-subtle mt-1">
            Verified Pothole (Grade-3) • Inner Left Lane
          </p>
        </div>

        {/* Tactile Inset Progress Bar */}
        <div className="w-full clay-surface-sunken h-3.5 rounded-full p-0.5 flex items-center relative overflow-hidden">
          <div
            className="h-full clay-pill-coral rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(20, (6 - eta) * 16.6)}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-clay-subtle pt-0.5">
          <span className="font-mono text-[11px] tracking-wider text-clay-dark/70">180M RANGE</span>
          <button
            onClick={() => setFlashArmed(!flashArmed)}
            className="flex items-center gap-1.5 text-clay-blue hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">
              {flashArmed ? 'nightlight' : 'nightlight_off'}
            </span>
            <span className="text-[11px] font-semibold">
              {flashArmed ? 'Flash Beam Armed' : 'Flash Disarmed'}
            </span>
          </button>
        </div>
      </div>

      {/* 3-Axis Accelerometry / Z-Peak Telemetry Clay Card */}
      <div className="clay-surface rounded-[28px] p-5 flex flex-col gap-4 border border-white/70 relative">
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
              <span className="material-symbols-outlined text-[16px] text-clay-blue">speed</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-extrabold text-clay-dark font-mono">{speed}</span>
              <span className="text-xs font-bold text-clay-subtle">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-clay-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-teal"></span>
              <span className="text-[10px] font-medium">&gt;5.0 km/h Gate Active</span>
            </div>
          </div>

          <div className="clay-surface-sunken p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-clay-subtle">
              <span className="text-[10px] font-bold tracking-wider uppercase">VIBE SEVERITY</span>
              <span className="material-symbols-outlined text-[16px] text-clay-amber">vibration</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-extrabold text-clay-amber font-mono">MODERATE</span>
            </div>
            <div className="flex items-center gap-1.5 text-clay-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-amber"></span>
              <span className="text-[10px] font-medium font-mono">DSP Window 40ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Auto-Flagged Incidents */}
      <div className="clay-surface rounded-[28px] p-5 flex flex-col gap-3 border border-white/70">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-clay-subtle tracking-wider uppercase">
            RECENT FLAGGED TILES
          </span>
          <button
            onClick={onNavigateMap}
            className="text-[11px] font-bold text-clay-blue hover:underline flex items-center gap-1"
          >
            <span>View Map</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-3 clay-surface-sunken rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl clay-pill-coral flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-clay-dark truncate">
                80ft Road • Crater
              </span>
              <span className="text-[10px] text-clay-subtle truncate">
                Peak 2.85G • Speed 42km/h • 2m ago
              </span>
            </div>
          </div>
          <span className="clay-pill-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            FLAGGED
          </span>
        </div>

        <div className="flex items-center justify-between p-3 clay-surface-sunken rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl clay-pill-amber flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[18px]">texture</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-clay-dark truncate">
                Sony World Jn • Speed Breaker
              </span>
              <span className="text-[10px] text-clay-subtle truncate">
                Peak 1.12G • Speed 24km/h • 6m ago
              </span>
            </div>
          </div>
          <span className="clay-pill-amber text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            SURFACED
          </span>
        </div>
      </div>
    </div>
  );
}
