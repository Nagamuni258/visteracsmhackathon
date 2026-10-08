import React, { useState, useEffect, useRef } from 'react';

export default function SensorScreen({ onToast }) {
  const [threshold, setThreshold] = useState(2.0);
  const [rmsWindow, setRmsWindow] = useState(40);
  const [speedGate, setSpeedGate] = useState(5.0);
  const [nightFlash, setNightFlash] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [dcFilter, setDcFilter] = useState(true);

  const [currentRms, setCurrentRms] = useState('0.34g');
  const [peakRms, setPeakRms] = useState('2.85g');

  const canvasRef = useRef(null);
  const simTypeRef = useRef(null);
  const simStepRef = useRef(0);

  // Oscilloscope canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferSize = 80;
    const waveformData = new Array(bufferSize).fill(0.25);
    const zData = new Array(bufferSize).fill(0.2);
    let peak = 2.85;
    let animId;

    const renderLoop = () => {
      let nextRms = 0.28 + (Math.random() * 0.12);
      let nextZ = 0.22 + (Math.random() * 0.10);

      if (simTypeRef.current) {
        simStepRef.current += 1;
        const s = simStepRef.current;
        if (simTypeRef.current === 'pothole') {
          if (s <= 6) {
            nextRms = 2.65 + (Math.sin(s * 1.5) * 0.85);
            nextZ = 2.45 + (Math.cos(s * 1.2) * 0.7);
          } else {
            simTypeRef.current = null;
          }
        } else if (simTypeRef.current === 'rumble') {
          if (s <= 14) {
            nextRms = 1.35 + (Math.sin(s * 2.8) * 0.65);
            nextZ = Math.cos(s * 3.1) * 0.8;
          } else {
            simTypeRef.current = null;
          }
        } else if (simTypeRef.current === 'flat') {
          nextRms = 0.10 + (Math.random() * 0.04);
          nextZ = 0.08;
          if (s > 10) simTypeRef.current = null;
        }
      }

      waveformData.shift();
      waveformData.push(nextRms);
      zData.shift();
      zData.push(nextZ);

      if (nextRms > peak) {
        peak = nextRms;
      } else {
        peak = Math.max(0.35, peak * 0.99);
      }

      setCurrentRms(nextRms.toFixed(2) + 'g');
      setPeakRms(peak.toFixed(2) + 'g');

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const centerY = h * 0.78;

      // Draw Z trace (Sky Blue)
      ctx.beginPath();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < zData.length; i++) {
        const x = (i / (zData.length - 1)) * w;
        const val = zData[i];
        const y = centerY - (val * (h * 0.22));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw RMS trace (Warm Amber)
      ctx.beginPath();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < waveformData.length; i++) {
        const x = (i / (waveformData.length - 1)) * w;
        const val = waveformData[i];
        const y = centerY - (val * (h * 0.22));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dot at head
      const lastX = w - 4;
      const lastY = centerY - (nextRms * (h * 0.22));
      ctx.fillStyle = nextRms >= threshold ? '#EF4444' : '#FBBF24';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => cancelAnimationFrame(animId);
  }, [threshold]);

  const triggerSim = (type, label) => {
    simTypeRef.current = type;
    simStepRef.current = 0;
    onToast(`Simulating ${label} signal pattern`);
  };

  const handleSaveDsp = () => {
    onToast(`DSP Config Saved: Threshold ${threshold}g, Gate ${speedGate}km/h`);
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
          <span className="text-[10px] font-bold text-[#10B981] px-2.5 py-0.5 rounded-full bg-white clay-pill tracking-wider">
            RUNNING
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
                impact_v2.tflite
              </div>
              <p className="text-[10px] font-medium text-[#64748B] mt-0.5">Quantized INT8 • 4 Class</p>
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
                3-Pass / 50m
              </div>
              <p className="text-[10px] font-medium text-[#64748B] mt-0.5">Automated Quorum</p>
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
            onClick={() => triggerSim('pothole', 'Pothole (2.8G)')}
            type="button"
          >
            Pothole (2.8G)
          </button>
          <button
            className="flex-1 py-2 px-1 text-[11px] font-bold rounded-xl clay-button-secondary active:scale-95 transition-all text-center"
            onClick={() => triggerSim('rumble', 'Rumble Strip (1.2G)')}
            type="button"
          >
            Rumble Strip (1.2G)
          </button>
          <button
            className="flex-1 py-2 px-1 text-[11px] font-bold rounded-xl clay-button-secondary active:scale-95 transition-all text-center"
            onClick={() => triggerSim('flat', 'Flat Asphalt (0.1G)')}
            type="button"
          >
            Flat Asphalt (0.1G)
          </button>
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
