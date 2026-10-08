import React, { useState } from 'react';
import { api } from '../api';

export default function CivicScreen({ onToast, onOpenUsbModal }) {
  const [dispatcherNote, setDispatcherNote] = useState('Prioritize before evening peak metro shuttle (17:30)');
  const [priorityCardDismissed, setPriorityCardDismissed] = useState(false);
  const [approvedList, setApprovedList] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleApprove = async () => {
    onToast('Approved! Pushing FCM vector broadcast (500m radius)...');
    try {
      await api.approvePin('p1');
      setApprovedList(prev => [...prev, 'p1']);
      setPriorityCardDismissed(true);
      onToast('Work Order dispatched to BBMP Team #2 (Quick Asphalt).');
    } catch (e) {
      console.warn(e);
      setPriorityCardDismissed(true);
      onToast('Approved locally and queued for FCM push.');
    }
  };

  const handleDismiss = () => {
    setPriorityCardDismissed(true);
    onToast('Incident marked for manual review.');
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    const pdfUrl = api.getReportPdfUrl('p1');
    window.open(pdfUrl, '_blank');
    onToast('Opening Municipal Work Order PDF...');
    setTimeout(() => setDownloadingPdf(false), 1200);
  };

  const handleDownloadCsv = () => {
    const csvUrl = api.getExportCsvUrl();
    window.open(csvUrl, '_blank');
    onToast('Exporting Master Hazard CSV...');
  };

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 min-h-screen px-4 gap-5 animate-fadeIn">
      {/* Status & Ward Context Card */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-3.5 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="clay-badge px-2.5 py-1 rounded-full bg-[#EEF2F7] flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
              FCM Dispatch Live
            </span>
          </div>

          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full clay-badge">
            Zone 04 • BBMP East
          </span>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Ward #112 Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            East Bengaluru Civic Operations • Admin Dispatch
          </p>
        </div>

        {/* Quick Filter Stat Pills */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-rose-500">18</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Active Hazards</span>
          </div>
          <div className="clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center bg-rose-50">
            <span className="text-xl font-extrabold text-rose-600">
              {priorityCardDismissed ? 2 : 3}
            </span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Need Review</span>
          </div>
          <div className="clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-indigo-600">4</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Crews Deployed</span>
          </div>
        </div>
      </div>

      {/* Priority Alert: Pending Approvals Queue */}
      {!priorityCardDismissed && (
        <div className="clay-card rounded-3xl p-5 flex flex-col gap-4 bg-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white clay-badge">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span className="text-[10px] font-bold tracking-wide uppercase">
                AWAITING DISPATCH
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-indigo-500">schedule</span>
              4m ago
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                Indiranagar 100ft Road
              </h2>
              <span className="clay-badge text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Grade 3/4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Severe asphalt crater • Longitudinal displacement
            </p>
          </div>

          {/* Telemetry Strip & AI Pill */}
          <div className="clay-subcard rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-rose-600">
                <span className="material-symbols-outlined text-[18px]">vibration</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">Spike RMS</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">2.62 g</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Sensor Node</span>
              <span className="text-xs font-bold text-slate-800">#A82-Rover</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> 91.8%
              </span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">AI Confidence</span>
            </div>
          </div>

          {/* Visual Evidence Thumbnail */}
          <div className="flex gap-3 items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 clay-card">
              <img
                alt="High angle close-up photo of a deep asphalt road pothole"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7LHxInHS3iu-oW0xudl5FhzSyZQdFDEK7KZFykoFPiBNBA6LAdR_nfsSOOibA8UNnMdRDeO72L67n61nS_OKsdzXpBHuMyHlmQh3uXLBtcCXg_GSYJkkKOwHuDvEMD21U4EDMjOIqVHulJlOpwKRt2CwEywqQ9yKpo0PSwz_Y0gMCCUr2KN7riEHAmxjjhm6Ks2U2bfHLlRl-6BL2eP_JEoChr4YX-Zn2Wc2l29zn"
              />
              <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/75 text-white px-1 py-0.5 rounded-md">
                EXIF: OK
              </span>
            </div>
            <div className="flex flex-col justify-between h-24 py-0.5 flex-1 min-w-0">
              <div>
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-indigo-500">my_location</span>
                  <span className="truncate">12.9716° N, 77.5946° E</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-1">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>3 Positive / 0 Negative Flags</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
                <span className="material-symbols-outlined text-[15px] text-rose-500">engineering</span>
                <span className="text-[10px] font-bold text-slate-700 truncate">Team #2: Quick Asphalt</span>
              </div>
            </div>
          </div>

          {/* Admin Note Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Dispatcher Dispatch Note
            </label>
            <input
              className="clay-inset-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full"
              type="text"
              value={dispatcherNote}
              onChange={(e) => setDispatcherNote(e.target.value)}
            />
          </div>

          {/* Direct Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              className="clay-btn-primary flex-1 py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
              onClick={handleApprove}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cell_tower</span>
              <span className="text-xs font-bold">Approve &amp; Push FCM (500m)</span>
            </button>
            <button
              className="w-12 h-12 rounded-2xl clay-card flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
              onClick={handleDismiss}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Verification & Community Consensus Moderation */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
            </div>
            <h2 className="text-sm font-bold text-slate-800">Consensus Moderation</h2>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full clay-badge">
            Auto-Quorum
          </span>
        </div>

        {/* Item 1 */}
        <div className="clay-subcard rounded-2xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-slate-800 truncate">
                Old Airport Rd • Manhole Step
              </h3>
              <span className="text-[10px] text-slate-500">Near HAL Gate 2 • Citizen Voted</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              3/3 Threshold Met
            </span>
          </div>
          <div className="w-full clay-inset rounded-full h-2 overflow-hidden p-0.5">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Item 2 */}
        <div className="clay-subcard rounded-2xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-slate-800 truncate">
                80ft Road • Corroded Trench
              </h3>
              <span className="text-[10px] text-slate-500">Near 6th Block • Auto-Sensor Hit</span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              2/3 In Progress
            </span>
          </div>
          <div className="w-full clay-inset rounded-full h-2 overflow-hidden p-0.5">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>
      </div>

      {/* Reports & Exports Card */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-3.5 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">
              description
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Work Order &amp; Data Exports
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">PDFKit &amp; CSV</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-2xl clay-btn-neutral text-slate-800 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            type="button"
          >
            <span className="material-symbols-outlined text-rose-600 text-[18px]">picture_as_pdf</span>
            <span>Work Order PDF</span>
          </button>

          <button
            className="h-12 rounded-2xl clay-btn-neutral text-slate-800 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all"
            onClick={handleDownloadCsv}
            type="button"
          >
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">table_chart</span>
            <span>Master CSV</span>
          </button>
        </div>

        {/* USB Tethering Shortcut */}
        <button
          className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center gap-2 text-xs font-semibold hover:bg-slate-200 transition-colors"
          onClick={onOpenUsbModal}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px] text-teal-600">cable</span>
          <span>USB Tethering &amp; ADB Bridge Settings</span>
        </button>
      </div>
    </div>
  );
}
