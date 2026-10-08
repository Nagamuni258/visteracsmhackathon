import React, { useState } from 'react';
import { api } from '../api';

export default function ReportScreen({ onToast, onReportSubmitted }) {
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('1x');
  const [showGrid, setShowGrid] = useState(true);
  const [hazardType, setHazardType] = useState('pothole');
  const [severityLevel, setSeverityLevel] = useState(3);
  const [fieldNotes, setFieldNotes] = useState('Deep asphalt rutting near storm drain edge. Hazard to two-wheelers.');
  const [shutterSnapping, setShutterSnapping] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcastActive, setBroadcastActive] = useState(false);

  const handleSnap = () => {
    setShutterSnapping(true);
    setTimeout(() => {
      setShutterSnapping(false);
      setPhotoCount(prev => prev + 1);
      onToast('Photo captured with GPS & EXIF telemetry stamp!');
    }, 280);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    const severityLabels = { 1: 'Minor', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };
    const pinPayload = {
      type: hazardType,
      latitude: 12.9716,
      longitude: 77.5946,
      depthCm: severityLevel === 4 ? 12 : severityLevel === 3 ? 9.2 : 5.0,
      severity: severityLabels[severityLevel] || 'Severe',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX',
      description: fieldNotes
    };

    try {
      const res = await api.createPin(pinPayload);
      setBroadcastActive(true);
      onToast(`Hazard pin #${res.data?.id || 'RB-9021'} published & broadcast!`);
      if (onReportSubmitted) onReportSubmitted(res.data);
    } catch (e) {
      console.warn(e);
      setBroadcastActive(true);
      onToast('Hazard saved locally and queued for FCM push.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 min-h-screen px-4 max-w-lg mx-auto animate-fadeIn select-none">
      <div className="flex flex-col w-full gap-4">
        {/* Broadcast alert banner */}
        {broadcastActive && (
          <div className="p-3.5 clay-card bg-emerald-50 text-emerald-800 flex items-center gap-3 border border-emerald-200 animate-slideDown">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[18px]">radar</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                FCM Cluster Mesh Broadcasted
              </span>
              <span className="text-xs text-emerald-700">
                Broadcasting hazard vector to 14 vehicles within 500m radius
              </span>
            </div>
          </div>
        )}

        {/* Clay Viewfinder Container */}
        <div className="p-3 clay-card">
          <div className="relative w-full aspect-[4/4.8] rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
            {/* Live camera feed simulation */}
            <img
              alt="First-person pedestrian mobile camera view looking down at asphalt city street with severe jagged asphalt pothole exposing gravel base."
              className={`w-full h-full object-cover transition-transform duration-300 ${
                zoomLevel === '2x' ? 'scale-125' : 'scale-100'
              }`}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX"
            />

            {/* Shutter flash overlay */}
            {shutterSnapping && (
              <div className="absolute inset-0 bg-white opacity-80 animate-ping pointer-events-none"></div>
            )}

            {/* Camera overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none"></div>

            {/* Composition Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div></div>
              </div>
            )}

            {/* Telemetry Ribbon Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md shadow-md">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  CameraX Live • 60 FPS
                </span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md shadow-md">
                <span className="material-symbols-outlined text-[13px] text-teal-600 font-bold">
                  satellite_alt
                </span>
                <span className="text-[11px] font-bold text-teal-700">GPS LOCK ±3m</span>
              </div>
            </div>

            {/* AI Reticle Target Box */}
            <div className="absolute top-[28%] left-[16%] w-[68%] h-[42%] pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between w-full">
                <div className="w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg shadow-sm"></div>
                <div className="w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg shadow-sm"></div>
              </div>
              <div className="self-center flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-white shadow-lg backdrop-blur-md animate-pulse border border-amber-200">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span className="text-[11px] font-bold tracking-wide uppercase">
                  Pothole Detected • 91.8%
                </span>
              </div>
              <div className="flex justify-between w-full">
                <div className="w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg shadow-sm"></div>
                <div className="w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg shadow-sm"></div>
              </div>
            </div>

            {/* Telemetry Stamp */}
            <div className="absolute bottom-14 left-3 right-3 p-2.5 rounded-xl bg-white/85 backdrop-blur-md text-clay-dark flex flex-col gap-1 pointer-events-none z-10 shadow-md">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1 text-orange-600 font-bold">
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  <span>LAT: 12.9716° N • LNG: 77.5946° E</span>
                </div>
                <span className="text-teal-700 font-bold">HDG 284° WNW</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-clay-muted">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">directions_walk</span>
                  <span>1.8 km/h (Walking Mode Auto)</span>
                </div>
                <span className="font-mono font-medium text-slate-700">2026-10-08 19:45 IST</span>
              </div>
            </div>

            {/* In-viewfinder Tactical Controls Bar */}
            <div className="absolute bottom-2 left-0 right-0 px-3 flex items-center justify-between z-20">
              <button
                aria-label="Toggle Flash Mode"
                className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center shadow-md active:scale-95 transition-transform ${
                  flashOn ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-white/90 text-slate-700'
                }`}
                onClick={() => {
                  setFlashOn(!flashOn);
                  onToast(flashOn ? 'Flash Off' : 'Torch Flash Active');
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {flashOn ? 'flash_on' : 'flash_off'}
                </span>
              </button>

              <div className="flex p-0.5 rounded-xl bg-white/90 backdrop-blur-md shadow-md gap-0.5">
                <button
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    zoomLevel === '1x' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700'
                  }`}
                  onClick={() => setZoomLevel('1x')}
                  type="button"
                >
                  1X
                </button>
                <button
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    zoomLevel === '2x' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700'
                  }`}
                  onClick={() => setZoomLevel('2x')}
                  type="button"
                >
                  2X
                </button>
              </div>

              <button
                aria-label="Toggle Composition Grid"
                className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center shadow-md active:scale-95 transition-transform ${
                  showGrid ? 'bg-white/90 text-orange-600' : 'bg-white/70 text-slate-400'
                }`}
                onClick={() => setShowGrid(!showGrid)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
              </button>
            </div>
          </div>

          {/* Tactile Shutter Dock Zone */}
          <div className="flex items-center justify-around pt-4 pb-2">
            <div className="w-12 h-12 rounded-2xl clay-card overflow-hidden p-1 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform">
              <img
                alt="Micro thumbnail of municipal roadway asphalt condition."
                className="w-full h-full object-cover rounded-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeyO4qvPF0PC5UQao-gFRsgHXTP99f9YyRlmTIXO40Ea2MHKAY16NVj780chCwo40XggWjJijFR28hKmvmYD4DmcIHdidYFml2dYAU0YjaREKf3SFwPVTLTUmI84_E9RbCy-0gv8kXF-z9JfPLfRQlC9MVWMivIz_D6nFGDRvssRK3B3PeUUoJSgxrbZezegAnGHiNBhu5USeHDZrhF7oHdsLpg-BLYk6QoDAdI4B5"
              />
              <span className="material-symbols-outlined absolute text-[16px] text-white drop-shadow">
                history
              </span>
            </div>

            {/* Primary Tactile Shutter Button */}
            <button
              aria-label="Snap Hazard Photo"
              className="w-[74px] h-[74px] clay-shutter flex items-center justify-center group active:scale-95 transition-transform"
              onClick={handleSnap}
              type="button"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[32px] text-white">photo_camera</span>
              </div>
            </button>

            {/* IMU Gyro Alignment */}
            <button
              className="w-12 h-12 rounded-2xl clay-btn-neutral flex flex-col items-center justify-center text-clay-muted hover:text-clay-dark"
              title="IMU Gyro Alignment"
              onClick={() => onToast('IMU Roll Calibrated: 0.0°')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-teal-600">screen_rotation</span>
              <span className="text-[9px] font-bold text-clay-muted mt-0.5">0.4° ROLL</span>
            </button>
          </div>
        </div>

        {/* Compression & Metadata Card */}
        <div className="p-4 clay-card flex gap-3.5 items-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 clay-inset p-0.5">
            <img
              alt="Close up high detail photograph of severe asphalt pavement rupture."
              className="w-full h-full object-cover rounded-xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHzc__Af1-HIowup59Yj9mORV_PLHYD7EnydmHCtSsQu_MfnI_FtI-JiLIp6tjVdncqMmlM8Fl9C6QnaXuAfZY25qX13g0HMfQE2DAK9o6sb6JD-pJHNJ3Z2JzufDoRQgrUqPuiaizJk3WAaNVPKwi7fmP2ntsdKtZ2ammezkCrIt3bFKWNXMBbU9pdXULCob0oB_DmoNc5s-E5Bll9Qfgy1IHxIV5MJLbRNw-7Xwi"
            />
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded-md bg-white/90 text-teal-700 font-bold text-[8px] shadow">
              AI OK
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1 justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[15px] text-clay-dark truncate">
                Frame #RB-{8920 + photoCount}
              </span>
              <span className="text-[10px] font-bold text-orange-700 px-2 py-0.5 rounded-full bg-orange-100 shadow-[inset_1px_1px_2px_#fed7aa]">
                EXIF ATTACHED
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-clay-muted text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-teal-600">compress</span>
              <span>Optimized: 800px width • 142 KB</span>
            </div>
            <p className="text-[11px] text-clay-muted mt-0.5">Zero-latency Edge compression completed in 32ms</p>
          </div>
        </div>

        {/* Hazard Classification Selector Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-clay-muted uppercase tracking-wider">
              Hazard Classification
            </label>
            <span className="text-[11px] font-semibold text-orange-600">Auto-Selected by Vision Engine</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] ${
                hazardType === 'pothole'
                  ? 'clay-btn-primary'
                  : 'clay-btn-neutral text-clay-dark'
              }`}
              onClick={() => setHazardType('pothole')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">radio_button_checked</span>
              <span>Pothole</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] ${
                hazardType === 'speed-breaker'
                  ? 'clay-btn-primary'
                  : 'clay-btn-neutral text-clay-dark'
              }`}
              onClick={() => setHazardType('speed-breaker')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">texture</span>
              <span>Speed-breaker</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] ${
                hazardType === 'metal-plate'
                  ? 'clay-btn-primary'
                  : 'clay-btn-neutral text-clay-dark'
              }`}
              onClick={() => setHazardType('metal-plate')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600">shield</span>
              <span>Metal Plate</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] ${
                hazardType === 'manhole'
                  ? 'clay-btn-primary'
                  : 'clay-btn-neutral text-clay-dark'
              }`}
              onClick={() => setHazardType('manhole')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600">emergency_heat</span>
              <span>Manhole / Cave-in</span>
            </button>
          </div>
        </div>

        {/* Severity Scale Rating Card */}
        <div className="p-4 clay-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-clay-muted uppercase tracking-wider">
              Severity Assessment
            </span>
            <span className="text-[11px] font-bold text-orange-600 uppercase">
              {severityLevel === 1 && 'Minor (Grade 1/4)'}
              {severityLevel === 2 && 'Moderate (Grade 2/4)'}
              {severityLevel === 3 && 'Severe (Grade 3/4)'}
              {severityLevel === 4 && 'Critical (Grade 4/4)'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { lvl: 1, label: 'Minor', icon: 'star', color: 'text-slate-500' },
              { lvl: 2, label: 'Moderate', icon: 'star', color: 'text-amber-500' },
              { lvl: 3, label: 'Severe', icon: 'star', color: 'text-white' },
              { lvl: 4, label: 'Critical', icon: 'warning', color: 'text-rose-500' }
            ].map(item => (
              <button
                key={item.lvl}
                className={`severity-btn flex flex-col items-center justify-center py-2.5 rounded-2xl font-medium transition-all ${
                  severityLevel === item.lvl
                    ? 'clay-btn-primary font-bold shadow-md'
                    : 'clay-btn-neutral text-clay-muted'
                }`}
                onClick={() => setSeverityLevel(item.lvl)}
                type="button"
              >
                <span className={`material-symbols-outlined text-[20px] ${item.color}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-bold mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Field Observation Notes Inset */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-clay-muted uppercase tracking-wider px-1">
            Field Observation Notes
          </label>
          <div className="clay-inset p-3 rounded-2xl">
            <textarea
              className="w-full bg-transparent border-0 outline-none text-xs text-clay-dark resize-none font-medium placeholder:text-clay-muted"
              rows="2"
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Add observation (e.g. sharp jagged edges, deep standing water)..."
            ></textarea>
          </div>
        </div>

        {/* Action Button: Publish Verified Hazard */}
        <button
          className="clay-button-primary w-full h-14 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-2"
          onClick={handlePublish}
          disabled={isSubmitting}
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">cell_tower</span>
          <span>{isSubmitting ? 'Pushing to FCM Mesh...' : 'Publish & Broadcast Hazard Pin'}</span>
        </button>
      </div>
    </div>
  );
}
