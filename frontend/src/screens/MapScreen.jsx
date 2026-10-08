import React, { useState } from 'react';
import { api } from '../api';

export default function MapScreen({ onEmergencyReport, onToast }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [audioAlert, setAudioAlert] = useState(true);
  const [searchQuery, setSearchQuery] = useState('Koramangala 80ft Rd to Ring Rd');
  const [hazardDistance, setHazardDistance] = useState('75m');
  const [confirmedCount, setConfirmedCount] = useState(4);
  const [disputedCount, setDisputedCount] = useState(0);
  const [userVoted, setUserVoted] = useState(null);

  const handleVote = async (type) => {
    if (userVoted) {
      onToast(`Already voted ${userVoted} on this hazard.`);
      return;
    }
    setUserVoted(type);
    if (type === 'up') {
      setConfirmedCount(prev => prev + 1);
      onToast('Hazard verified! Sent +1 verification vote.');
      try {
        await api.submitFeedback('p1', 'up');
      } catch (e) {
        console.warn(e);
      }
    } else {
      setDisputedCount(prev => prev + 1);
      onToast('Dispute recorded. Sent downvote flag.');
      try {
        await api.submitFeedback('p1', 'down');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className="flex flex-col relative w-full pt-16 pb-28 min-h-screen animate-fadeIn">
      {/* Search & Tactical Toolbar */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center clay-inset rounded-full px-4 py-2.5 border border-white/80">
            <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2">search</span>
            <input
              className="bg-transparent border-0 outline-none w-full text-slate-800 text-xs font-medium placeholder:text-slate-400 tracking-wide"
              placeholder="Scan corridor, route, or GPS pin..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                aria-label="Clear Search"
                className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                type="button"
                onClick={() => setSearchQuery('')}
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
          <button
            aria-label="Recenter vehicle location"
            className="w-11 h-11 rounded-2xl clay-surface hover:clay-inset flex items-center justify-center text-teal-600 active:scale-95 transition-all shrink-0"
            id="recenterBtn"
            type="button"
            onClick={() => onToast('Location centered on current vehicle')}
          >
            <span className="material-symbols-outlined text-[22px]">my_location</span>
          </button>
        </div>

        {/* Filter Chips Scrollable Track (Candy Clay Pills) */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`filter-pill px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeFilter === 'all'
                ? 'clay-pill-active text-[#6B3400]'
                : 'clay-surface text-slate-600'
            }`}
          >
            All Hazards (24)
          </button>
          <button
            onClick={() => setActiveFilter('verified')}
            className={`filter-pill px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 ${
              activeFilter === 'verified'
                ? 'clay-pill-verified text-[#085238]'
                : 'clay-surface text-slate-600'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-700"></span>
            Verified (18)
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`filter-pill px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 ${
              activeFilter === 'critical'
                ? 'clay-pill-critical text-[#720909]'
                : 'clay-surface text-slate-600'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-red-800"></span>
            Critical Red (6)
          </button>
          <button
            onClick={() => setActiveFilter('speedbreakers')}
            className={`filter-pill px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 ${
              activeFilter === 'speedbreakers'
                ? 'clay-pill-amber text-white'
                : 'clay-surface text-slate-600'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            Speed-breakers (5)
          </button>
        </div>
      </div>

      {/* Tactical Map Canvas Wrapper (Bright Clay Cartography) */}
      <div className="relative w-full h-[520px] overflow-hidden my-1 bg-[#E4ECF4] border-y border-white">
        {/* Map Canvas Background */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-85 filter contrast-105 saturate-125"
          data-location="Bangalore Ring Road, India"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAT30NUjWU1Frt7aDikqSjMS_2HYia4QNlP1ebQ1eONBg9IxLGeDOD5HRQVJ782_0Esr7FCyjtelgrwjuWnRIpo8e4pE3cRI6gg0I_dVVj0GwzkHK3_5hcJZ0iXIBnt6iZMQqoF7ntaJHMgPqPZifJlKeWJjZDKCsiQ2ZM8zb2xPHvn3a_twSU0RAUUVPeabm05rleeh2XtI6P5-0S_4GjhIesGs3lf-BdDfg6ucyt5')"
          }}
        ></div>

        {/* Clay Radial Soft Vignette & Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="44" id="tacticalGrid" patternUnits="userSpaceOnUse" width="44">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#94a3b8" strokeOpacity="0.22" strokeWidth="0.75"></path>
            </pattern>
          </defs>
          <rect fill="url(#tacticalGrid)" height="100%" width="100%"></rect>
          {/* Projected Trajectory Path */}
          <path
            d="M 210 520 Q 200 380 225 240 T 170 80"
            fill="none"
            stroke="#0284c7"
            strokeDasharray="7,5"
            strokeOpacity="0.85"
            strokeWidth="3.5"
          ></path>
          {/* Proximity Hazard Ring Vector */}
          <circle
            className="animate-spin"
            cx="218"
            cy="272"
            fill="none"
            opacity="0.6"
            r="34"
            stroke="#f43f5e"
            strokeDasharray="4,4"
            strokeWidth="2"
            style={{ animationDuration: '9s', transformOrigin: '218px 272px' }}
          ></circle>
          <circle cx="218" cy="272" fill="none" opacity="0.3" r="54" stroke="#e11d48" strokeWidth="1.5"></circle>
        </svg>

        {/* FLOATING MAP CONTROLS (Right Rail) */}
        <div className="absolute right-3.5 top-4 flex flex-col gap-3 z-20">
          <button
            aria-label="Layer Switcher"
            className="w-11 h-11 rounded-2xl clay-card text-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            type="button"
            onClick={() => onToast('Layer switched to Satellite Telemetry')}
          >
            <span className="material-symbols-outlined text-[20px] text-amber-600">layers</span>
          </button>
          <button
            aria-label="Audio alert voice toggle"
            className={`w-11 h-11 rounded-2xl clay-card flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ${
              audioAlert ? 'text-sky-600' : 'text-slate-400'
            }`}
            onClick={() => {
              setAudioAlert(!audioAlert);
              onToast(audioAlert ? 'Voice Alerts Muted' : 'Voice Alerts Active');
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {audioAlert ? 'volume_up' : 'volume_off'}
            </span>
          </button>
          <button
            aria-label="Heatmap density view"
            className="w-11 h-11 rounded-2xl clay-card text-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            type="button"
            onClick={() => onToast('Pothole Density Heatmap toggled')}
          >
            <span className="material-symbols-outlined text-[20px]">radar</span>
          </button>
          <button
            aria-label="Instant hazard report pin"
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-[6px_6px_14px_#cbd5e1,-4px_-4px_10px_#ffffff,inset_2px_2px_3px_rgba(255,255,255,0.7)] border border-white flex items-center justify-center active:scale-95 hover:scale-105 transition-all mt-1"
            type="button"
            onClick={onEmergencyReport}
          >
            <span className="material-symbols-outlined text-[24px]">add_location_alt</span>
          </button>
        </div>

        {/* MAP MARKERS LAYER */}
        {/* Cluster Pin North */}
        <div className="absolute top-16 left-12 z-10 flex items-center gap-1.5 cursor-pointer">
          <div className="h-8 px-3 rounded-full clay-card text-slate-800 flex items-center gap-1 font-bold text-xs border border-white">
            <span className="material-symbols-outlined text-rose-500 text-[16px]">crisis_alert</span>
            <span>+8</span>
          </div>
        </div>

        {/* Cluster Pin East */}
        <div className="absolute top-36 right-16 z-10 flex items-center gap-1.5 cursor-pointer">
          <div className="h-8 px-3 rounded-full clay-card text-slate-800 flex items-center gap-1 font-bold text-xs border border-white">
            <span className="material-symbols-outlined text-amber-500 text-[16px]">stacks</span>
            <span>+4</span>
          </div>
        </div>

        {/* Verified Pothole MG Rd */}
        <div className="absolute top-44 left-16 z-10 flex flex-col items-center cursor-pointer group">
          <div className="px-2.5 py-1 mb-1.5 rounded-full clay-surface shadow-sm opacity-95 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-bold text-emerald-800 truncate max-w-[120px]">MG Rd • 5x Confirmed</p>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white clay-pin flex items-center justify-center relative border border-emerald-300">
            <span className="absolute inset-0 rounded-2xl bg-emerald-400/40 animate-ping"></span>
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
        </div>

        {/* Unmarked Speed-Breaker */}
        <div className="absolute top-28 left-48 z-10 flex flex-col items-center cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 clay-pin flex items-center justify-center rotate-45 border border-amber-200">
            <span className="material-symbols-outlined -rotate-45 text-[18px]">speed</span>
          </div>
        </div>

        {/* Target Critical Hazard Marker */}
        <div className="absolute top-[260px] left-[202px] z-10 flex flex-col items-center cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white clay-pin flex items-center justify-center relative border border-rose-300">
            <span className="absolute -inset-1 rounded-2xl bg-rose-500/30 animate-pulse"></span>
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] shadow-sm uppercase border border-rose-200">
            Ring Rd • 9cm
          </div>
        </div>

        {/* User Vehicle Current Position */}
        <div className="absolute bottom-16 left-[196px] z-10 flex flex-col items-center pointer-events-none">
          <div
            className="w-24 h-28 -mb-14 opacity-60 origin-bottom"
            style={{
              background:
                'radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.45) 0%, rgba(14, 165, 233, 0.0) 70%)',
              clipPath: 'polygon(15% 0%, 85% 0%, 50% 100%)'
            }}
          ></div>
          <div className="relative flex items-center justify-center">
            <span className="absolute w-12 h-12 rounded-full bg-sky-400/35 animate-ping" style={{ animationDuration: '2.2s' }}></span>
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white clay-pin flex items-center justify-center border border-white">
              <span className="material-symbols-outlined text-[16px]">navigation</span>
            </div>
          </div>
          <span className="mt-1.5 text-[10px] font-bold text-sky-800 clay-surface px-2 py-0.5 rounded-full border border-white">
            54 km/h
          </span>
        </div>

        {/* Live Status Pill Top Left */}
        <div className="absolute top-4 left-3 z-10 flex items-center gap-2 clay-card px-3 py-1.5 rounded-full border border-white/80">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-700 tracking-wide">RADAR 300M SWEEP</span>
        </div>
      </div>

      {/* APPROACHING HAZARD ALERT DOCK (Sliding Clay Card) */}
      <div className="px-4 -mt-10 z-30 mb-3 relative">
        <div className="clay-card rounded-3xl p-4 flex flex-col gap-3 overflow-hidden relative border border-white">
          {/* Top Row: Title, Severity & Distance */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white clay-pin flex items-center justify-center shrink-0 border border-rose-300">
                <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-800 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 uppercase tracking-wider">
                    CRITICAL RED
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 truncate">Depth ~9.2 cm</span>
                </div>
                <h2 className="text-base font-bold text-slate-800 truncate mt-0.5">
                  Severe Pothole Ahead
                </h2>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-2xl font-extrabold text-rose-600 leading-none">{hazardDistance}</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">~4.8 SECONDS</span>
            </div>
          </div>

          {/* Clay Progress Track */}
          <div className="w-full clay-inset rounded-full h-2.5 overflow-hidden p-0.5 border border-white/60">
            <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full transition-all duration-300 shadow-sm" style={{ width: '78%' }}></div>
          </div>

          {/* Middle Row: Verification Image Thumbnail & Specs */}
          <div className="grid grid-cols-12 gap-3 items-center clay-inset rounded-2xl p-2.5 border border-white/70">
            <div className="col-span-4 relative rounded-xl overflow-hidden h-16 bg-slate-200 border border-white/80 shadow-inner">
              <img
                alt="Pothole photo on asphalt road"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwBCPJD9q8EkhtEU-A_zSP-b9EP5gwJmYovxAhsLFmYfAyFbDDYGxUYY8RcEYnd_w-ST-p-mcOpdEX_8y1jZUeeL_CowJ9rgRWBH204vHJGOU6LyA6-XLrAT8UltxElmnQQP3oZBjtNiWBfYvhJBe8MQF8icfdiLhwPDM5QC6Snj6KdsisTiyEYxM_Vlsei1QwXl9ubgog1aX0IkHsvh9OOzHnOHxezR_By7LilAPG"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[9px] font-bold text-center text-white py-0.5">
                FIELD CAM
              </div>
            </div>

            <div className="col-span-8 flex flex-col justify-between h-full py-0.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>VELOCITY IMPACT</span>
                <span className="text-rose-600 font-bold">HIGH (G-Z &gt; 2.6)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>LANE POSITION</span>
                <span className="text-slate-800 font-medium">Right Wheel Track</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">how_to_vote</span>
                <span className="text-[11px] font-bold text-emerald-700">{confirmedCount} Confirmed</span>
                <span className="text-[11px] text-slate-400 font-medium">• {disputedCount} Disputed</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Big Clay Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              className="h-12 rounded-2xl clay-btn-confirm text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              type="button"
              onClick={() => handleVote('up')}
            >
              <span className="material-symbols-outlined text-[20px]">thumb_up</span>
              <span className="text-sm font-bold">Confirm</span>
            </button>
            <button
              className="h-12 rounded-2xl clay-btn-reject text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              type="button"
              onClick={() => handleVote('down')}
            >
              <span className="material-symbols-outlined text-[20px]">thumb_down</span>
              <span className="text-sm font-bold">Not There</span>
            </button>
          </div>
        </div>
      </div>

      {/* Route Hazards Summary */}
      <div className="px-4 pb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800">Upcoming on Route (2.4 km)</h3>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            AUTO-EVASION ON
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between p-3.5 rounded-2xl clay-card hover:scale-[1.01] transition-transform cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 clay-inset flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">speed</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Unmarked Speedbreaker</span>
                <span className="text-[11px] font-medium text-slate-500">Near 17th Main Junction</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-extrabold text-slate-700">240m</span>
              <span className="text-[10px] font-bold text-emerald-600">VERIFIED</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl clay-card hover:scale-[1.01] transition-transform cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 clay-inset flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">shield</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Slippery Metal Trench Plate</span>
                <span className="text-[11px] font-medium text-slate-500">Metro Pillar #412</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-extrabold text-slate-700">510m</span>
              <span className="text-[10px] font-bold text-amber-600">CAUTION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
