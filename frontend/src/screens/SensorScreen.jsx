import React, { useState, useEffect, useRef } from 'react';
import { sensorEngine } from '../services/sensorEngine';

export default function SensorScreen({ onToast }) {
  const [threshold, setThreshold] = useState(sensorEngine.config.thresholdG);
  const [rmsWindow, setRmsWindow] = useState(sensorEngine.config.minWindowMs);
  const [speedGate, setSpeedGate] = useState(sensorEngine.config.speedGateKmH);
  const [nightFlash, setNightFlash] = useState(sensorEngine.config.nightFlash);
  const [quietHours, setQuietHours] = useState(sensorEngine.config.quietHours);
  const [dcFilter, setDcFilter] = useState(true);

  const [currentRms, setCurrentRms] = useState('0.28g');
  const [peakRms, setPeakRms] = useState('0.35g');
  const [hardwareLive, setHardwareLive] = useState(false);
  const [lastClassification, setLastClassification] = useState(null);

  const canvasRef = useRef(null);

  // Subscribe to real hardware sensorEngine
  useEffect(() => {
    sensorEngine.init();

    const unsubscribe = sensorEngine.subscribe((engineState) => {
      setCurrentRms(`${engineState.currentRms.toFixed(2)}g`);
      setPeakRms(`${engineState.peakRms.toFixed(2)}g`);
      setHardwareLive(engineState.hardwareAvailable);
      if (engineState.lastClassification) {
        setLastClassification(engineState.lastClassification);
      }
    });

    const onAutoHazard = (e) => {
      onToast(`🚨 Auto-Detected ${e.detail.type.toUpperCase()} (${e.detail.severity})! Registered to MongoDB`);
      setLastClassification({
        type: e.detail.type,
        confidence: 0.94,
        severity: e.detail.severity,
        peakG: e.detail.peakG
      });
    };
    window.addEventListener('roadbump:autoHazardDetected', onAutoHazard);

    return () => {
      unsubscribe();
      window.removeEventListener('roadbump:autoHazardDetected', onAutoHazard);
    };
  }, [onToast]);

  // Oscilloscope canvas animation loop reading from sensorEngine waveform buffer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animId;

    const renderLoop = () => {
      const buffer = sensorEngine.waveformBuffer;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const centerY = h * 0.72;

      // Draw Filtered Z Waveform (Sky Blue)
      ctx.beginPath();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < buffer.length; i++) {
        const x = (i / (buffer.length - 1)) * w;
        const val = buffer[i];
        const y = centerY - (val * (h * 0.22));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw RMS Energy Envelope (Warm Amber)
      const rms = sensorEngine.state.currentRms;
      ctx.beginPath();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < buffer.length; i++) {
        const x = (i / (buffer.length - 1)) * w;
        const val = Math.abs(buffer[i]) * 0.9;
        const y = centerY - (val * (h * 0.22));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dot at head
      const lastX = w - 4;
      const lastVal = buffer[buffer.length - 1] || 0;
      const lastY = centerY - (lastVal * (h * 0.22));
      ctx.fillStyle = rms >= threshold ? '#EF4444' : '#FBBF24';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => cancelAnimationFrame(animId);
  }, [threshold]);

  const triggerSim = (type, label) => {
    sensorEngine.simulatePattern(type);
    onToast(`Fed ${label} pattern into 100Hz ML Classifier`);
  };

  const handleSaveDsp = () => {
    sensorEngine.config.thresholdG = threshold;
    sensorEngine.config.minWindowMs = rmsWindow;
    sensorEngine.config.speedGateKmH = speedGate;
    sensorEngine.config.nightFlash = nightFlash;
    sensorEngine.config.quietHours = quietHours;
    onToast(`DSP Config Applied: Threshold ${threshold.toFixed(2)}g, Gate ${speedGate.toFixed(1)}km/h`);
  };

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 min-h-screen px-4 gap-5 animate-fadeIn">
      {/* Header Breadcrumb & Subhead */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#FF6F61] text-[18px]">tune</span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#FF6F61]">
              DIAGNOSTICS &amp; TELEMETRY
            </span>
          </div>
          <h1 className="text-[22px] text-[#1E293B] font-extrabold tracking-tight mt-0.5">
            Sensor &amp; Model Calibration
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#E6F4EA] px-3 py-1.5 rounded-full clay-pill shrink-0">
          <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="text-[10px] text-[#065F46] font-bold tracking-wider">DSP SYNCED</span>
        </div>
      </div>

      {/* SECTION 1: Active Sensor Pipeline Status */}
      <div className="clay-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3B82F6] text-[20px]">
              precision_manufacturing
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Active Sensor Pipeline Status
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full clay-pill tracking-wider ${
            hardwareLive ? 'text-[#10B981] bg-emerald-50' : 'text-[#3B82F6] bg-blue-50'
          }`}>
            {hardwareLive ? 'HARDWARE IMU LIVE' : '100Hz DSP ENGINE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Accel Metric Well */}
          <div className="clay-card-sm p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                IMU SAMPLING
              </span>
              <span className="material-symbols-outlined text-[#3B82F6] text-[16px]">sensors</span>
            </div>
            <div className="mt-1.5">
              <div className="text-[22px] font-extrabold text-[#1E293B] leading-tight">
                100 <span className="text-[#3B82F6] text-[13px] font-semibold">Hz</span>
              </div>
              <p className="text-[10px] font-medium text-[#64748B] mt-0.5">High-pass Filter &gt;10 Hz</p>
            </div>
          </div>

          {/* Speed Gate Metric Well */}
          <div className="clay-card-sm p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                SPEED GATE
              </span>
              <span className="material-symbols-outlined text-[#FF6F61] text-[16px]">speed</span>
            </div>
            <div className="mt-1.5">
              <div className="text-[22px] font-extrabold text-[#FF6F61] leading-tight">
                38.4 <span className="text-[#64748B] text-[13px] font-medium">km/h</span>
              </div>
              <p className="text-[10px] font-medium text-[#10B981] mt-0.5">
                Active (&gt;{speedGate} km/h Gate)
              </p>
            </div>
          </div>

          {/* Edge Inference Well */}
          <div className="clay-card-sm p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                EDGE INFERENCE
              </span>
              <span className="material-symbols-outlined text-[#F59E0B] text-[16px]">memory</span>
            </div>
            <div className="mt-1.5">
              <div className="text-[14px] font-bold text-[#1E293B] truncate tracking-tight">
                {lastClassification ? `${lastClassification.type.toUpperCase()}` : 'impact_v2.tflite'}
              </div>
              <p className="text-[10px] font-medium text-[#10B981] mt-0.5">
                {lastClassification ? `${(lastClassification.confidence * 100).toFixed(0)}% Conf • ${lastClassification.severity}` : 'Quantized INT8 • 4 Class'}
              </p>
            </div>
          </div>

          {/* Consensus Logic Well */}
          <div className="clay-card-sm p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                VOTING RULE
              </span>
              <span className="material-symbols-outlined text-[#8B5CF6] text-[16px]">how_to_reg</span>
            </div>
            <div className="mt-1.5">
              <div className="text-[14px] font-bold text-[#1E293B] truncate tracking-tight">
                2-of-3 Consensus
              </div>
              <p className="text-[10px] font-medium text-[#64748B] mt-0.5">Window Quorum Lock</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Real-time Oscilloscope & Threshold Trigger */}
      <div className="clay-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF6F61] text-[20px]">show_chart</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Real-Time Vibration Waveform (100Hz)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#64748B]">
              RMS: <strong className="text-[#1E293B]">{currentRms}</strong>
            </span>
            <span className="text-[11px] font-mono text-[#FF6F61]">
              Peak: <strong className="text-[#EF4444]">{peakRms}</strong>
            </span>
          </div>
        </div>

        {/* Live Canvas Oscilloscope */}
        <div className="clay-inset p-2.5 rounded-2xl relative overflow-hidden bg-[#E2E8F0]">
          <canvas ref={canvasRef} className="w-full h-32 rounded-xl block"></canvas>
          <div className="absolute top-2 left-3 flex items-center gap-2 text-[9px] font-mono text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span> Z-Axis
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FBBF24]"></span> RMS Energy
            </span>
          </div>
          <div className="absolute bottom-2 right-3 text-[9px] font-mono font-bold text-[#EF4444] bg-white/70 px-2 py-0.5 rounded-md">
            Cutoff Line: {threshold.toFixed(2)}g
          </div>
        </div>

        {/* Simulation Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            className="flex-1 py-2 px-1 text-[11px] font-bold rounded-xl clay-button-secondary active:scale-95 transition-all text-center"
            onClick={() => {
              sensorEngine.playAlertTone('pothole', 4);
              triggerSim('pothole', 'Pothole (2.8G)');
            }}
            type="button"
          >
            Pothole (2.8G)
          </button>
          <button
            className="flex-1 py-2 px-1 text-[11px] font-bold rounded-xl clay-button-secondary active:scale-95 transition-all text-center"
            onClick={() => {
              sensorEngine.playAlertTone('speed-breaker', 2);
              triggerSim('speed-breaker', 'Rumble Strip (1.2G)');
            }}
            type="button"
          >
            Rumble Strip (1.2G)
          </button>
          <button
            className="flex-1 py-2 px-1 text-[11px] font-bold rounded-xl clay-button-secondary active:scale-95 transition-all text-center"
            onClick={() => triggerSim('flat-road', 'Flat Asphalt (0.1G)')}
            type="button"
          >
            Flat Asphalt (0.1G)
          </button>
        </div>

        {/* Edge Chime Audio & Haptics Direct Test */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">volume_up</span>
              Synthesized Audio &amp; Haptic Alerts
            </span>
            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              Web Audio 100% On-Device
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="py-2 px-1 text-[10px] font-bold rounded-xl bg-red-50 text-red-700 border border-red-200/60 active:scale-95 transition-all flex items-center justify-center gap-1"
              onClick={() => {
                sensorEngine.playAlertTone('pothole', 4);
                onToast('🔊 Playing Pothole Warning (880Hz -> 360Hz) + Haptics');
              }}
              type="button"
            >
              <span>🚨 Pothole</span>
            </button>
            <button
              className="py-2 px-1 text-[10px] font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 active:scale-95 transition-all flex items-center justify-center gap-1"
              onClick={() => {
                sensorEngine.playAlertTone('speed-breaker', 2);
                onToast('🔊 Playing Speed-Breaker Dual Chime (520Hz + 660Hz)');
              }}
              type="button"
            >
              <span>🔔 Bump Chime</span>
            </button>
            <button
              className="py-2 px-1 text-[10px] font-bold rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 active:scale-95 transition-all flex items-center justify-center gap-1"
              onClick={() => {
                sensorEngine.playAlertTone('metal-plate', 3);
                onToast('🔊 Playing Metal Plate Sawtooth Buzz (420Hz)');
              }}
              type="button"
            >
              <span>⚡ Plate Buzz</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Tactile Calibration Controls */}
      <div className="clay-card p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Detection Parameters
          </span>
          <span className="text-[10px] font-bold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded-full clay-pill">
            Auto-Adaptive
          </span>
        </div>

        {/* Slider 1: Z-Threshold */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-[#1E293B]">Z-Peak Trigger Threshold</span>
            <span className="font-mono text-[#FF6F61] font-bold">{threshold.toFixed(2)} g</span>
          </div>
          <input
            className="clay-slider w-full cursor-pointer"
            max="4.5"
            min="0.5"
            step="0.05"
            type="range"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-[#64748B] font-medium">
            <span>0.50g (Sensitive)</span>
            <span>4.50g (Severe Only)</span>
          </div>
        </div>

        {/* Slider 2: Min RMS Window */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-[#1E293B]">Min RMS Spike Window</span>
            <span className="font-mono text-[#3B82F6] font-bold">{rmsWindow} ms</span>
          </div>
          <input
            className="clay-slider clay-slider-blue w-full cursor-pointer"
            max="120"
            min="10"
            step="5"
            type="range"
            value={rmsWindow}
            onChange={(e) => setRmsWindow(parseInt(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-[#64748B] font-medium">
            <span>10ms (Instantaneous)</span>
            <span>120ms (Sustained)</span>
          </div>
        </div>

        {/* Slider 3: Speed Gate Cutoff */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-[#1E293B]">Speed Gate Cutoff</span>
            <span className="font-mono text-[#10B981] font-bold">{speedGate.toFixed(1)} km/h</span>
          </div>
          <input
            className="clay-slider w-full cursor-pointer"
            max="30"
            min="0"
            step="1"
            type="range"
            value={speedGate}
            onChange={(e) => setSpeedGate(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-[#64748B] font-medium">
            <span>0 km/h (Always On)</span>
            <span>30 km/h (Highway)</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: Edge Mode Toggles */}
      <div className="clay-card p-4 flex flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          Operational Policies
        </span>

        <label className="flex items-center justify-between cursor-pointer py-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1E293B]">Night Flash Warning Strobe</span>
            <span className="text-[10px] text-[#64748B]">
              Pulse phone LED flash when severe crater detected
            </span>
          </div>
          <input
            checked={nightFlash}
            className="clay-checkbox"
            type="checkbox"
            onChange={(e) => setNightFlash(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer py-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1E293B]">Quiet Hours Mode</span>
            <span className="text-[10px] text-[#64748B]">
              Mute chimes between 22:00 and 06:00 (vibrate only)
            </span>
          </div>
          <input
            checked={quietHours}
            className="clay-checkbox"
            type="checkbox"
            onChange={(e) => setQuietHours(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer py-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1E293B]">High-Pass DC Gravity Reject</span>
            <span className="text-[10px] text-[#64748B]">
              Compensate for phone tilt/mounting angle drift
            </span>
          </div>
          <input
            checked={dcFilter}
            className="clay-checkbox"
            type="checkbox"
            onChange={(e) => setDcFilter(e.target.checked)}
          />
        </label>
      </div>

      {/* Action Button: Save Configuration */}
      <button
        className="clay-button-primary w-full h-14 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        onClick={handleSaveDsp}
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">save</span>
        <span>Save &amp; Push DSP Configuration</span>
      </button>
    </div>
  );
}
