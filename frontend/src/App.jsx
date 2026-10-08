import React, { useState, useEffect } from 'react';
import { api } from './api';
import HudScreen from './screens/HudScreen';
import MapScreen from './screens/MapScreen';
import ReportScreen from './screens/ReportScreen';
import SensorScreen from './screens/SensorScreen';
import CivicScreen from './screens/CivicScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('hud'); // 'hud', 'map', 'report', 'sensor', 'civic'
  const [toastMessage, setToastMessage] = useState(null);
  const [nightFlashActive, setNightFlashActive] = useState(false);
  const [emergencyAlertActive, setEmergencyAlertActive] = useState(false);
  const [showUsbModal, setShowUsbModal] = useState(false);
  const [customHost, setCustomHost] = useState(api.getBaseUrl());
  const [networkInfo, setNetworkInfo] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    api.getNetworkInfo().then(info => {
      if (info) setNetworkInfo(info);
    });
  }, []);

  const handleFlashToggle = () => {
    const next = !nightFlashActive;
    setNightFlashActive(next);
    showToast(next ? 'Night Flash Warning Strobe Activated' : 'Night Flash Strobe Disabled');
  };

  const handleEmergencyTrigger = () => {
    setEmergencyAlertActive(true);
    showToast('EMERGENCY HAZARD BROADCAST SENT to nearby units');
    setTimeout(() => setEmergencyAlertActive(false), 4000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] text-[#243248] antialiased select-none font-['Poppins']">
      {/* Top Sticky Tactile Clay Header */}
      <header className="fixed top-0 w-full z-50 bg-[#EEF2F7]/95 backdrop-blur-xl pt-2.5 pb-1 shadow-[0_4px_16px_rgba(160,175,195,0.25)] border-b border-white/60">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Logo & Brand Tag */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 clay-card flex items-center justify-center p-1.5 shrink-0 shadow-sm border border-white">
              <span className="material-symbols-outlined text-white text-[22px] font-bold">
                minor_crash
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-extrabold tracking-tight text-[#1E293B] leading-none truncate">
                  RoadBump
                </span>
                <span className="text-[10px] font-bold text-[#FF6F61] px-2 py-0.5 rounded-full bg-white clay-pill tracking-wider uppercase shrink-0">
                  {activeTab.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                </span>
                <span className="text-[10px] font-semibold text-[#64748B] truncate tracking-wider font-mono">
                  100Hz • ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Flash Torch Toggle */}
            <button
              aria-label="Toggle Night Flash Mode"
              className={`w-10 h-10 flex items-center justify-center rounded-2xl clay-pill transition-all active:scale-95 ${
                nightFlashActive
                  ? 'bg-amber-400 text-amber-950 font-bold'
                  : 'bg-[#EEF2F7] text-[#64748B] hover:text-[#3B82F6]'
              }`}
              onClick={handleFlashToggle}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {nightFlashActive ? 'flash_on' : 'flash_off'}
              </span>
            </button>

            {/* Emergency Hazard Alert */}
            <button
              aria-label="Emergency Hazard Alert"
              className={`w-10 h-10 flex items-center justify-center rounded-2xl clay-pill relative active:scale-95 transition-all ${
                emergencyAlertActive
                  ? 'bg-red-500 text-white animate-bounce'
                  : 'bg-[#FFE4E4] text-[#EF4444]'
              }`}
              onClick={handleEmergencyTrigger}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
            </button>

            {/* Profile Avatar & Tethering Modal Trigger */}
            <button
              onClick={() => setShowUsbModal(true)}
              aria-label="Network & User Settings"
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#60A5FA] clay-pill flex items-center justify-center ml-0.5 shadow-sm text-white active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-white text-[19px]">cable</span>
            </button>
          </div>
        </div>
      </header>

      {/* Screen Container */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {activeTab === 'hud' && <HudScreen onNavigateMap={() => setActiveTab('map')} />}
        {activeTab === 'map' && (
          <MapScreen
            onEmergencyReport={() => setActiveTab('report')}
            onToast={showToast}
          />
        )}
        {activeTab === 'report' && <ReportScreen onToast={showToast} />}
        {activeTab === 'sensor' && <SensorScreen onToast={showToast} />}
        {activeTab === 'civic' && (
          <CivicScreen
            onToast={showToast}
            onOpenUsbModal={() => setShowUsbModal(true)}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-sm mx-auto animate-slideDown">
          <div className="clay-card rounded-2xl p-3.5 bg-white/95 backdrop-blur-md flex items-center gap-3 shadow-xl border border-white">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">info</span>
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Clay Navigation Bar (Exact Stitch Prototype Nav) */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#EEF2F7]/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(160,175,195,0.35)] border-t border-white/70">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {/* HUD */}
          <button
            onClick={() => setActiveTab('hud')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[58px] h-12 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'hud'
                ? 'bg-[#EEF2F7] clay-pill text-[#FF6F61] font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B] font-bold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">speed</span>
            <span className="text-[10px] tracking-tight">HUD</span>
          </button>

          {/* Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[58px] h-12 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'map'
                ? 'bg-[#EEF2F7] clay-pill text-[#FF6F61] font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B] font-bold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">explore</span>
            <span className="text-[10px] tracking-tight">Map</span>
          </button>

          {/* Report */}
          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[58px] h-12 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'report'
                ? 'bg-[#EEF2F7] clay-pill text-[#FF6F61] font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B] font-bold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            <span className="text-[10px] tracking-tight">Report</span>
          </button>

          {/* Sensor */}
          <button
            onClick={() => setActiveTab('sensor')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[58px] h-12 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'sensor'
                ? 'bg-[#EEF2F7] clay-pill text-[#FF6F61] font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B] font-bold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
            <span className="text-[10px] tracking-tight">Sensor</span>
          </button>

          {/* Civic */}
          <button
            onClick={() => setActiveTab('civic')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[58px] h-12 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'civic'
                ? 'bg-[#EEF2F7] clay-pill text-[#FF6F61] font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B] font-bold'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">policy</span>
            <span className="text-[10px] tracking-tight">Civic</span>
          </button>
        </div>
      </nav>

      {/* USB Tethering & ADB Bridge Modal */}
      {showUsbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="clay-card rounded-3xl p-6 bg-white w-full max-w-sm flex flex-col gap-4 shadow-2xl border border-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">cable</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">USB Tethering Bridge</h3>
                  <span className="text-[10px] font-medium text-slate-400">Android ADB Connectivity</span>
                </div>
              </div>
              <button
                onClick={() => setShowUsbModal(false)}
                className="w-8 h-8 rounded-full clay-card flex items-center justify-center text-slate-400 hover:text-slate-700"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="clay-inset p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">ADB Reverse 3000:</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">ADB Reverse 5000:</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
              {networkInfo && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500">Host Local IP:</span>
                  <span className="text-indigo-600 font-bold">{networkInfo.recommendedIp}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Backend API Endpoint
              </label>
              <input
                className="clay-inset-input rounded-xl px-3 py-2 text-xs font-mono text-slate-800 w-full"
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                className="clay-button-primary flex-1 py-2.5 rounded-xl text-xs font-bold"
                onClick={() => {
                  api.setCustomHost(customHost);
                  showToast('API Endpoint Updated!');
                  setShowUsbModal(false);
                }}
                type="button"
              >
                Save
              </button>
              <button
                className="clay-btn-neutral px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600"
                onClick={() => {
                  api.setCustomHost('');
                  setCustomHost(api.getBaseUrl());
                  showToast('Reset to default');
                }}
                type="button"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
