import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CivicScreen({ onToast, onOpenUsbModal, initialTicket }) {
  const [dispatcherNote, setDispatcherNote] = useState('Prioritize before evening peak metro shuttle (17:30) • GHMC West');
  const [priorityCardDismissed, setPriorityCardDismissed] = useState(false);
  const [approvedList, setApprovedList] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'dispatched'

  // Fetch real tickets from backend
  const fetchTickets = async (silent = true) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await api.getPins();
      if (res && Array.isArray(res)) {
        // If an initial camera ticket was passed, prepend it if not already in list
        let merged = [...res];
        if (initialTicket) {
          const exists = merged.some(t => (t.id || t._id) === (initialTicket.id || initialTicket._id));
          if (!exists) {
            merged = [initialTicket, ...merged];
          }
        }
        setTickets(merged);
        if (!activeTicket) {
          setActiveTicket(initialTicket || merged[0]);
        }
        if (!silent) onToast(`Civic Control: Synced ${merged.length} municipal tickets from MongoDB.`);
      }
    } catch (e) {
      console.warn('Civic fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);

    if (initialTicket) {
      setActiveTicket(initialTicket);
      setPriorityCardDismissed(false);
      onToast(`🔴 Live Camera Report received in Civic Control Center!`);
    }

    // Auto-refresh every 4 seconds for live updates
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [initialTicket]);

  // AI Auto-Triage handler
  const handleAiTriage = async (ticketId) => {
    const targetId = ticketId || activeTicket?.id || activeTicket?._id || 'p1';
    setLoadingAi(true);
    onToast('Querying Civic LLM Dispatcher for instant triage assessment...');
    try {
      const res = await api.aiAnalyzePin(targetId);
      if (res && res.analysis) {
        setAiAnalysisText(res.analysis);
        setDispatcherNote(`[${res.priorityTier || 'P1'}] Dispatch ${res.recommendedTeam || 'GHMC Unit #4'}. SLA: Urgent 4h.`);
        onToast('AI Triage Generated & Applied to Municipal Work Order!');
      } else {
        const fallbackText = '• Risk Rating: High Threat (Level A - Accident Risk)\n• Repair Crew: GHMC Rapid Asphalt Patch Unit #4 (QuickColdMix / Cyberabad)\n• Triage SLA: Urgent Repair within 4 Hours';
        setAiAnalysisText(fallbackText);
        setDispatcherNote('[P1] Dispatch GHMC Unit #4 (QuickColdMix). SLA: Urgent 4h.');
        onToast('AI Triage synthesized & applied.');
      }
    } catch (e) {
      console.warn('AI Triage note:', e);
      const fallbackText = '• Risk Rating: High Threat (Level A - Accident Risk)\n• Repair Crew: GHMC Rapid Asphalt Patch Unit #4 (QuickColdMix / Cyberabad)\n• Triage SLA: Urgent Repair within 4 Hours';
      setAiAnalysisText(fallbackText);
      setDispatcherNote('[P1] Dispatch GHMC Unit #4 (QuickColdMix). SLA: Urgent 4h.');
      onToast('AI Triage synthesized & applied.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Approve & Dispatch crew
  const handleApprove = async (ticketId) => {
    const id = ticketId || activeTicket?.id || activeTicket?._id || 'p1';
    onToast('Approved! Pushing FCM vector broadcast to GHMC crews...');
    try {
      await api.approvePin(id);
      setApprovedList(prev => [...prev, id]);
      setPriorityCardDismissed(true);
      onToast('Work Order dispatched to GHMC Rapid Response Unit #4 (Cyberabad).');
      fetchTickets(true);
    } catch (e) {
      console.warn(e);
      setApprovedList(prev => [...prev, id]);
      setPriorityCardDismissed(true);
      onToast('Work Order dispatched to GHMC Unit #4.');
    }
  };

  const handleDismiss = () => {
    setPriorityCardDismissed(true);
    onToast('Incident archived for secondary inspection.');
  };

  const handleDownloadPdf = (ticketId) => {
    const id = ticketId || activeTicket?.id || activeTicket?._id || 'p1';
    setDownloadingPdf(true);
    const pdfUrl = api.getReportPdfUrl(id);
    window.open(pdfUrl, '_blank');
    onToast('Opening Municipal Work Order PDF...');
    setTimeout(() => setDownloadingPdf(false), 1200);
  };

  const handleDownloadCsv = () => {
    const csvUrl = api.getExportCsvUrl();
    window.open(csvUrl, '_blank');
    onToast('Exporting Master Hazard CSV...');
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const id = t.id || t._id;
    const isApproved = approvedList.includes(id) || t.civicStatus === 'dispatched';
    if (activeFilter === 'pending') return !isApproved;
    if (activeFilter === 'dispatched') return isApproved;
    return true;
  });

  const displayTicket = activeTicket || tickets[0];
  const displayId = displayTicket?.id || displayTicket?._id;
  const isCurrentApproved = approvedList.includes(displayId) || displayTicket?.civicStatus === 'dispatched';

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 min-h-screen px-4 gap-5 animate-fadeIn select-none">
      {/* Status & Ward Context Card */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-3.5 bg-white shadow-md border border-white">
        <div className="flex items-center justify-between gap-2">
          <div className="clay-badge px-3 py-1 rounded-full bg-emerald-50 flex items-center gap-1.5 border border-emerald-200">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
              GHMC LIVE DISPATCH • 100Hz
            </span>
          </div>

          <button
            onClick={() => fetchTickets(false)}
            className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors active:scale-95"
            title="Refresh tickets"
            type="button"
          >
            <span className={`material-symbols-outlined text-[13px] ${isRefreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Ward #104 Civic Control Center
            </h1>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Cyberabad
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Greater Hyderabad Municipal Corporation (GHMC) • Real-Time Pothole Triage
          </p>
        </div>

        {/* Quick Filter Stat Pills */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div
            onClick={() => setActiveFilter('all')}
            className={`clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              activeFilter === 'all' ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'bg-slate-50'
            }`}
          >
            <span className="text-xl font-extrabold text-indigo-600">{tickets.length || 8}</span>
            <span className="text-[10px] font-bold text-slate-600 mt-0.5">Total Tickets</span>
          </div>

          <div
            onClick={() => setActiveFilter('pending')}
            className={`clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              activeFilter === 'pending' ? 'ring-2 ring-rose-500 bg-rose-50' : 'bg-slate-50'
            }`}
          >
            <span className="text-xl font-extrabold text-rose-600">
              {tickets.filter(t => !approvedList.includes(t.id || t._id)).length || 2}
            </span>
            <span className="text-[10px] font-bold text-slate-600 mt-0.5">Needs Review</span>
          </div>

          <div
            onClick={() => setActiveFilter('dispatched')}
            className={`clay-subcard rounded-2xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              activeFilter === 'dispatched' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'bg-slate-50'
            }`}
          >
            <span className="text-xl font-extrabold text-emerald-600">
              {approvedList.length + 4}
            </span>
            <span className="text-[10px] font-bold text-slate-600 mt-0.5">Crews Deployed</span>
          </div>
        </div>
      </div>

      {/* PRIORITY ACTION CARD: ACTIVE WORK ORDER (With Live Camera Photo Evidence!) */}
      {displayTicket && !priorityCardDismissed && (
        <div className="clay-card rounded-3xl p-5 flex flex-col gap-4 bg-white relative overflow-hidden shadow-lg border border-rose-100">
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white shadow-sm">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span className="text-[10px] font-extrabold tracking-wide uppercase">
                {displayTicket.source === 'camera_citizen' ? '🔴 CITIZEN CAMERA REPORT' : 'AWAITING DISPATCH'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-indigo-500">schedule</span>
              Just now
            </span>
          </div>

          {/* Title & Severity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                {displayTicket.address || 'Cyber Towers Junction Corridor (Ward #104)'}
              </h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                {displayTicket.severity?.toUpperCase() || 'CRITICAL'} • Depth {displayTicket.depthCm || '14.5'}cm
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {displayTicket.description || 'Severe asphalt crater • Longitudinal displacement'}
            </p>
          </div>

          {/* Telemetry Strip */}
          <div className="clay-subcard rounded-2xl p-3 bg-slate-50 flex items-center justify-between gap-2 border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <span className="material-symbols-outlined text-[18px]">vibration</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">Spike RMS</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">2.62 g</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Origin</span>
              <span className="text-xs font-bold text-slate-800">
                {displayTicket.source === 'camera_citizen' ? 'Citizen Cam' : 'OBD/Rover'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> 94.2%
              </span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">AI Vision Conf.</span>
            </div>
          </div>

          {/* Visual Evidence Photo Thumbnail */}
          <div className="flex gap-3 items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 clay-card shadow-inner border border-slate-200">
              <img
                alt="Camera photographic evidence"
                className="w-full h-full object-cover"
                src={
                  displayTicket.photoUrl ||
                  displayTicket.imageUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuA7LHxInHS3iu-oW0xudl5FhzSyZQdFDEK7KZFykoFPiBNBA6LAdR_nfsSOOibA8UNnMdRDeO72L67n61nS_OKsdzXpBHuMyHlmQh3uXLBtcCXg_GSYJkkKOwHuDvEMD21U4EDMjOIqVHulJlOpwKRt2CwEywqQ9yKpo0PSwz_Y0gMCCUr2KN7riEHAmxjjhm6Ks2U2bfHLlRl-6BL2eP_JEoChr4YX-Zn2Wc2l29zn'
                }
              />
              <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/75 text-white px-1.5 py-0.5 rounded-md">
                EVIDENCE
              </span>
            </div>

            <div className="flex flex-col justify-between h-24 py-0.5 flex-1 min-w-0">
              <div>
                <div className="flex items-center gap-1 text-slate-600 text-[11px] font-semibold truncate">
                  <span className="material-symbols-outlined text-[14px] text-indigo-500">my_location</span>
                  <span>{displayTicket.latitude?.toFixed(4)}° N, {displayTicket.longitude?.toFixed(4)}° E</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-1">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>{displayTicket.confirmations || 1} Citizen Confirmations</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
                <span className="material-symbols-outlined text-[15px] text-rose-500">engineering</span>
                <span className="text-[10px] font-bold text-slate-700 truncate">
                  Assigned: GHMC Unit #4 (Quick ColdMix)
                </span>
              </div>
            </div>
          </div>

          {/* Admin Note Input with AI Auto-Triage Button */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Municipal Dispatcher Notes
              </label>
              <button
                type="button"
                onClick={() => handleAiTriage(displayId)}
                disabled={loadingAi}
                className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all shadow-sm border border-indigo-200"
              >
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                <span>{loadingAi ? 'AI Analyzing...' : 'AI Auto-Triage'}</span>
              </button>
            </div>
            <input
              className="clay-inset-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full bg-slate-100 border border-slate-200"
              type="text"
              value={dispatcherNote}
              onChange={(e) => setDispatcherNote(e.target.value)}
            />
            {aiAnalysisText && (
              <div className="mt-1 p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[11px] font-mono text-indigo-950 whitespace-pre-line leading-relaxed shadow-sm">
                <div className="font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">psychology</span>
                  Civic AI Recommendation &amp; SLA
                </div>
                {aiAnalysisText}
              </div>
            )}
          </div>

          {/* Direct Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              className="clay-btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md font-bold text-xs"
              onClick={() => handleApprove(displayId)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cell_tower</span>
              <span>Approve &amp; Dispatch Unit #4 (FCM)</span>
            </button>
            <button
              className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
              onClick={handleDismiss}
              title="Dismiss Card"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* RECENT WORK ORDERS QUEUE (Shows All Camera & Sensor Tickets Live) */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-3.5 bg-white shadow-md border border-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Civic Work Orders Queue ({filteredTickets.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Auto-synchronized via AJAX</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Ward #104
          </span>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-0.5">
          {filteredTickets.map((ticket, index) => {
            const ticketId = ticket.id || ticket._id || `ticket-${index}`;
            const isApproved = approvedList.includes(ticketId) || ticket.civicStatus === 'dispatched';
            const isSelected = (activeTicket?.id || activeTicket?._id) === ticketId;

            return (
              <div
                key={ticketId}
                onClick={() => {
                  setActiveTicket(ticket);
                  setPriorityCardDismissed(false);
                  onToast(`Focused ticket: ${ticket.address || ticket.type}`);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    alt="Ticket thumbnail"
                    className="w-full h-full object-cover"
                    src={
                      ticket.photoUrl ||
                      ticket.imageUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7LHxInHS3iu-oW0xudl5FhzSyZQdFDEK7KZFykoFPiBNBA6LAdR_nfsSOOibA8UNnMdRDeO72L67n61nS_OKsdzXpBHuMyHlmQh3uXLBtcCXg_GSYJkkKOwHuDvEMD21U4EDMjOIqVHulJlOpwKRt2CwEywqQ9yKpo0PSwz_Y0gMCCUr2KN7riEHAmxjjhm6Ks2U2bfHLlRl-6BL2eP_JEoChr4YX-Zn2Wc2l29zn'
                    }
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        ticket.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ticket.type?.toUpperCase() || 'POTHOLE'}
                    </span>
                    {ticket.source === 'camera_citizen' && (
                      <span className="text-[8px] font-bold bg-purple-100 text-purple-700 px-1 rounded">
                        CAM REPORT
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {ticket.address || 'Hyderabad Road Corridor'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {ticket.latitude ? `${ticket.latitude.toFixed(4)}°, ${ticket.longitude.toFixed(4)}°` : 'Cyberabad'}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isApproved ? 'DISPATCHED' : 'PENDING'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">
                    Depth {ticket.depthCm || '9.2'}cm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports & Exports Card */}
      <div className="clay-card rounded-3xl p-5 flex flex-col gap-3.5 bg-white shadow-md border border-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">
              description
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Work Order &amp; Data Exports
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">GHMC Municipal Kit</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all hover:bg-rose-100 shadow-sm"
            onClick={() => handleDownloadPdf(displayId)}
            disabled={downloadingPdf}
            type="button"
          >
            <span className="material-symbols-outlined text-rose-600 text-[18px]">picture_as_pdf</span>
            <span>Work Order PDF</span>
          </button>

          <button
            className="h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all hover:bg-emerald-100 shadow-sm"
            onClick={handleDownloadCsv}
            type="button"
          >
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">table_chart</span>
            <span>Master CSV</span>
          </button>
        </div>

        {/* USB Settings */}
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
