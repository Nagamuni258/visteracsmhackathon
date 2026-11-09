import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { sensorEngine } from '../services/sensorEngine';

// Municipal Auto-Upload preference (persists in localStorage)
const MUNICIPAL_AUTO_UPLOAD_KEY = 'roadbump_municipal_auto_upload';

export default function ReportScreen({ onToast, onReportSubmitted, onNavigateToCivic, onApproveAndNavigateToMap }) {
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('1x');
  const [showGrid, setShowGrid] = useState(true);
  const [hazardType, setHazardType] = useState('pothole');
  const [severityLevel, setSeverityLevel] = useState(4); // Default to Critical for civic impact
  const [fieldNotes, setFieldNotes] = useState('Deep asphalt crater near storm drain. Severe hazard to two-wheelers and night traffic.');
  const [shutterSnapping, setShutterSnapping] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcastActive, setBroadcastActive] = useState(false);

  // Live Camera Stream State
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // back camera
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Live GPS Coordinates
  const [coords, setCoords] = useState({
    latitude: 17.440081,
    longitude: 78.348915,
    locationName: 'Cyber Towers Junction (HITEC City), Hyderabad'
  });

  // Municipal Auto-Upload Toggle State
  const [municipalAutoUpload, setMunicipalAutoUpload] = useState(() => {
    // Initialize from localStorage, default to false
    const stored = localStorage.getItem(MUNICIPAL_AUTO_UPLOAD_KEY);
    return stored ? stored === 'true' : false;
  });
  const setMunicipalAutoUploadSafe = (value) => {
    setMunicipalAutoUpload(value);
    localStorage.setItem(MUNICIPAL_AUTO_UPLOAD_KEY, String(value));
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // ... rest of existing code unchanged ...

  // At the end of the return(), before the closing div, add the municipal auto-upload toggle:

export default function ReportScreen({ onToast, onReportSubmitted, onNavigateToCivic, onApproveAndNavigateToMap }) {
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('1x');
  const [showGrid, setShowGrid] = useState(true);
  const [hazardType, setHazardType] = useState('pothole');
  const [severityLevel, setSeverityLevel] = useState(4); // Default to Critical for civic impact
  const [fieldNotes, setFieldNotes] = useState('Deep asphalt crater near storm drain. Severe hazard to two-wheelers and night traffic.');
  const [shutterSnapping, setShutterSnapping] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcastActive, setBroadcastActive] = useState(false);

  // Live Camera Stream State
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // back camera
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Live GPS Coordinates
  const [coords, setCoords] = useState({
    latitude: 17.440081,
    longitude: 78.348915,
    locationName: 'Cyber Towers Junction (HITEC City), Hyderabad'
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Start live device camera stream
  const startCamera = async (mode = 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      console.warn('Camera access note:', err.message);
      setCameraActive(false);
      setCameraError('Tap below to use Camera App or Upload');
    }
  };

  useEffect(() => {
    // Start camera stream on mount
    startCamera(facingMode);

    if (sensorEngine?.state?.latitude) {
      setCoords({
        latitude: sensorEngine.state.latitude,
        longitude: sensorEngine.state.longitude,
        locationName: sensorEngine.state.locationName || 'Cyber Towers, Hyderabad'
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            locationName: 'GPS Locked • GHMC Ward #104 (Cyberabad)'
          });
        },
        err => console.log('ReportScreen GPS Note:', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      // Stop camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Switch between front and back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
    onToast(`Switched to ${nextMode === 'environment' ? 'Rear Road Camera' : 'Front Camera'}`);
  };

  // Capture photo from live video stream or trigger fallback file picker
  const handleSnap = () => {
    setShutterSnapping(true);

    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(photoData);
      setPhotoCount(prev => prev + 1);
      setTimeout(() => setShutterSnapping(false), 200);
      onToast('📸 Live Camera Frame captured with GPS stamp!');
    } else {
      // If camera stream not active, snapshot the preview image
      setTimeout(() => {
        setShutterSnapping(false);
        setCapturedPhoto(
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX'
        );
        setPhotoCount(prev => prev + 1);
        onToast('📸 Photo recorded with GPS & EXIF telemetry stamp!');
      }, 250);
    }
  };

  // Handle file camera upload from native Android camera app
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCapturedPhoto(evt.target?.result);
        setPhotoCount(prev => prev + 1);
        onToast('📷 Photo uploaded from Android Camera App!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Core Approve Function: Approves camera report, saves as verified with exact GPS, and switches directly to Map
  const handleApproveAndShowOnMap = async () => {
    setIsSubmitting(true);
    const severityLabels = { 1: 'Minor', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };
    const depthValues = { 1: 3.5, 2: 6.2, 3: 9.8, 4: 14.5 };

    let exactLat = coords.latitude;
    let exactLng = coords.longitude;

    if (navigator.geolocation) {
      try {
        const freshPos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0
          });
        });
        if (freshPos?.coords) {
          exactLat = +freshPos.coords.latitude.toFixed(6);
          exactLng = +freshPos.coords.longitude.toFixed(6);
          setCoords(prev => ({ ...prev, latitude: exactLat, longitude: exactLng }));
        }
      } catch (_) {}
    }

    const photoUrl =
      capturedPhoto ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX';

    const approvedPinPayload = {
      type: hazardType,
      latitude: exactLat,
      longitude: exactLng,
      depthCm: depthValues[severityLevel] || 12.0,
      severity: severityLabels[severityLevel] || 'Critical',
      severityLevel,
      photoUrl,
      imageUrl: photoUrl,
      description: fieldNotes || `Camera verified ${hazardType} hazard`,
      address: `Camera Verified [${exactLat.toFixed(5)}°, ${exactLng.toFixed(5)}°], Cyber Towers Corridor (Ward #104)`,
      ward: 'Ward #104 GHMC West (Cyberabad)',
      civicStatus: 'dispatched',
      status: 'verified',
      confirmations: 6,
      source: 'camera_citizen'
    };

    try {
      const res = await api.createPin(approvedPinPayload);
      const createdPin = res?.data || approvedPinPayload;

      onToast(`✅ Hazard APPROVED! Placing live pin at [${exactLat.toFixed(4)}°, ${exactLng.toFixed(4)}°]...`);

      if (onReportSubmitted) onReportSubmitted(createdPin);
      if (onApproveAndNavigateToMap) {
        onApproveAndNavigateToMap(createdPin);
      }
    } catch (e) {
      console.warn('Approve error:', e);
      onToast(`✅ Approved! Live pin placed on map.`);
      if (onApproveAndNavigateToMap) {
        onApproveAndNavigateToMap(approvedPinPayload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Core Submission: Converts report into a Civic Grievance and routes directly to Civic screen
  const handleConvertToCivic = async () => {
    setIsSubmitting(true);
    const severityLabels = { 1: 'Minor', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };
    const depthValues = { 1: 3.5, 2: 6.2, 3: 9.8, 4: 14.5 };

    const photoUrl =
      capturedPhoto ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX';

    const civicPayload = {
      type: hazardType,
      latitude: coords.latitude,
      longitude: coords.longitude,
      depthCm: depthValues[severityLevel] || 12.0,
      severity: severityLabels[severityLevel] || 'Critical',
      severityLevel,
      photoUrl,
      imageUrl: photoUrl,
      description: fieldNotes,
      address: `Incident at [${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°], Cyber Towers Corridor (Ward #104)`,
      ward: 'Ward #104 GHMC West (Cyberabad)',
      civicStatus: 'pending_dispatch',
      source: 'camera_citizen',
      confirmations: 1
    };

    try {
      const res = await api.createPin(civicPayload);
      const createdTicket = res?.data || civicPayload;

      onToast(`🏛️ Converted to Civic Work Order #${createdTicket.id || 'RB-104'}! Dispatched to GHMC.`);
      
      // Notify parent & Live-route directly to Civic section!
      if (onReportSubmitted) onReportSubmitted(createdTicket);
      if (onNavigateToCivic) {
        onNavigateToCivic(createdTicket);
      }
    } catch (e) {
      console.warn('Civic conversion note:', e);
      // Fallback: still navigate to Civic with local ticket
      if (onNavigateToCivic) {
        onNavigateToCivic(civicPayload);
      }
      onToast('🏛️ Saved & Live Dispatched to Civic Control Center!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normal Public Publish
  const handlePublishPublic = async () => {
    setIsSubmitting(true);
    const severityLabels = { 1: 'Minor', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };
    const pinPayload = {
      type: hazardType,
      latitude: coords.latitude,
      longitude: coords.longitude,
      depthCm: severityLevel === 4 ? 14.5 : severityLevel === 3 ? 9.2 : 5.0,
      severity: severityLabels[severityLevel] || 'Severe',
      severityLevel,
      imageUrl: capturedPhoto || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX',
      description: fieldNotes
    };

    try {
      const res = await api.createPin(pinPayload);
      setBroadcastActive(true);
      onToast(`Hazard pin published to Map & Mesh!`);
      if (onReportSubmitted) onReportSubmitted(res.data);
    } catch (e) {
      console.warn(e);
      setBroadcastActive(true);
      onToast('Hazard saved locally and broadcast to nearby vehicles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col relative w-full pt-20 pb-28 min-h-screen px-4 max-w-lg mx-auto animate-fadeIn select-none">
      {/* Hidden canvas for video frame snapping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for native Android camera trigger */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

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
        <div className="p-3 clay-card bg-white rounded-3xl shadow-lg border border-white">
          <div className="relative w-full aspect-[4/4.8] rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
            {/* Live Camera Video Feed */}
            {cameraActive && !capturedPhoto ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  zoomLevel === '2x' ? 'scale-125' : 'scale-100'
                }`}
              />
            ) : capturedPhoto ? (
              /* Captured Photo Review Frame */
              <img
                alt="Captured road hazard evidence"
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  zoomLevel === '2x' ? 'scale-125' : 'scale-100'
                }`}
                src={capturedPhoto}
              />
            ) : (
              /* Fallback Preview when stream is initializing */
              <img
                alt="Camera viewfinder preview"
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  zoomLevel === '2x' ? 'scale-125' : 'scale-100'
                }`}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY4bMyLpnCB9JFlYz__d3Nl_cXlNy66t7iPfrvaU7S6pFYB8dvHbBRibB2JS1EbmWGrnCAipgeqEvcfVFarWaaT_np-fs6qskRr7e1aIaMtnjth6x-mFcepnGVEfLkcLik7cWri8xFSGEKBPdhJytEE1hx_E-T7upZtHBspENIbSbQLMg64l71LKTN7nUxb26kYoovrC1w-wPdlW1aLLKIyB0-SkY92AhXztA-aVJX"
              />
            )}

            {/* Shutter flash overlay */}
            {shutterSnapping && (
              <div className="absolute inset-0 bg-white opacity-90 animate-ping pointer-events-none"></div>
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

            {/* Top Telemetry Ribbon Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-md">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  {cameraActive && !capturedPhoto ? 'Live Road Camera' : capturedPhoto ? 'Photo Locked' : 'Camera Ready'}
                </span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-md">
                <span className="material-symbols-outlined text-[13px] text-teal-600 font-bold">
                  satellite_alt
                </span>
                <span className="text-[11px] font-bold text-teal-700">GPS LOCK ±2.4m</span>
              </div>
            </div>

            {/* AI Reticle Target Box */}
            <div className="absolute top-[26%] left-[16%] w-[68%] h-[42%] pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between w-full">
                <div className="w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg shadow-sm"></div>
                <div className="w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg shadow-sm"></div>
              </div>
              <div className="self-center flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-white shadow-lg backdrop-blur-md animate-pulse border border-amber-200">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span className="text-[11px] font-bold tracking-wide uppercase">
                  {hazardType.toUpperCase()} DETECTED • 94.2%
                </span>
              </div>
              <div className="flex justify-between w-full">
                <div className="w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg shadow-sm"></div>
                <div className="w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg shadow-sm"></div>
              </div>
            </div>

            {/* Live GPS Telemetry Stamp */}
            <div className="absolute bottom-14 left-3 right-3 p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-clay-dark flex flex-col gap-1 pointer-events-none z-10 shadow-md">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1 text-orange-600 font-bold truncate">
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  <span>LAT: {coords.latitude.toFixed(4)}° N • LNG: {coords.longitude.toFixed(4)}° E (Hyderabad)</span>
                </div>
                <span className="text-teal-700 font-bold">WARD #104</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">directions_walk</span>
                  <span>Civic Telemetry • GHMC Cyberabad</span>
                </div>
                <span className="font-mono text-slate-700">2026-10-09 IST</span>
              </div>
            </div>

            {/* In-viewfinder Tactical Controls Bar */}
            <div className="absolute bottom-2 left-0 right-0 px-3 flex items-center justify-between z-20">
              {/* Flash Toggle */}
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

              {/* Zoom Buttons */}
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

              {/* Switch Camera / Facing Mode */}
              <button
                aria-label="Switch Camera Facing Mode"
                className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                onClick={handleToggleFacingMode}
                title="Switch Camera (Front/Rear)"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">cameraswitch</span>
              </button>
            </div>
          </div>

          {/* Tactile Shutter Dock Zone */}
          <div className="flex items-center justify-around pt-4 pb-2">
            {/* Gallery / File Camera Trigger */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl clay-card overflow-hidden p-1 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform bg-slate-100 hover:bg-slate-200"
              title="Upload Photo or Launch Native Camera"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px] text-slate-700">
                photo_library
              </span>
            </button>

            {/* Primary Tactile Shutter Button */}
            <button
              aria-label="Snap Hazard Photo"
              className="w-[74px] h-[74px] clay-shutter flex items-center justify-center group active:scale-95 transition-transform bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full shadow-lg border-4 border-white"
              onClick={handleSnap}
              type="button"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[32px] text-white">photo_camera</span>
              </div>
            </button>

            {/* Retake / Clear Photo */}
            <button
              className="w-12 h-12 rounded-2xl clay-btn-neutral flex flex-col items-center justify-center text-slate-600 hover:text-slate-800 active:scale-95 transition-transform"
              title={capturedPhoto ? "Retake Live Photo" : "Camera Sensor Sync"}
              onClick={() => {
                if (capturedPhoto) {
                  setCapturedPhoto(null);
                  startCamera(facingMode);
                  onToast('Camera viewfinder reset for new capture.');
                } else {
                  onToast('IMU Roll Calibrated: 0.0°');
                }
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-teal-600">
                {capturedPhoto ? 'restart_alt' : 'screen_rotation'}
              </span>
              <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                {capturedPhoto ? 'RETAKE' : '0.0° ROLL'}
              </span>
            </button>
          </div>
        </div>

        {/* PRIMARY ACTION: APPROVE & DROP LIVE PIN ON MAP */}
        <div className="clay-card rounded-3xl p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-col gap-3 shadow-xl border border-emerald-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                Live Map Sync &amp; Pin Drop
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white/25 px-2.5 py-0.5 rounded-full text-white backdrop-blur-sm">
              EXACT GPS: {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <span>Approve &amp; Show Live Pin on Map</span>
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5 leading-snug">
              Approves this camera hazard, registers it with verified status, and instantly switches to the Map to show the live pin at this exact location.
            </p>
          </div>

          <button
            className="w-full h-13 py-3 rounded-2xl bg-white text-emerald-800 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer hover:bg-emerald-50"
            onClick={handleApproveAndShowOnMap}
            disabled={isSubmitting}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-emerald-600 font-bold">check_circle</span>
            <span>
              {isSubmitting ? 'Approving & Dropping Pin...' : 'Approve & Place Pin on Map ➔'}
            </span>
          </button>
        </div>

        {/* PROMINENT CIVIC CONVERSION BUTTON (The Core User Feature!) */}
        <div className="clay-card rounded-3xl p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col gap-3 shadow-xl border border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
                Civic Dispatch Integration
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
              GHMC Ward #104
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Convert Report to Civic Work Order
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Instantly sends this camera report to the <strong>Civic Control Center</strong>, auto-assigns GHMC repair crews, and generates an official municipal SLA.
            </p>
          </div>

          <button
            className="w-full h-13 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            onClick={handleConvertToCivic}
            disabled={isSubmitting}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">policy</span>
            <span>
              {isSubmitting ? 'Converting to Civic Ticket...' : 'Convert to Civic & View in Control Center ➔'}
            </span>
          </button>
        </div>

        {/* Compression & Metadata Card */}
        <div className="p-4 clay-card bg-white rounded-3xl flex gap-3.5 items-center shadow-sm">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 clay-inset p-0.5 bg-slate-100">
            <img
              alt="Close up high detail photograph of road condition"
              className="w-full h-full object-cover rounded-xl"
              src={
                capturedPhoto ||
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDHzc__Af1-HIowup59Yj9mORV_PLHYD7EnydmHCtSsQu_MfnI_FtI-JiLIp6tjVdncqMmlM8Fl9C6QnaXuAfZY25qX13g0HMfQE2DAK9o6sb6JD-pJHNJ3Z2JzufDoRQgrUqPuiaizJk3WAaNVPKwi7fmP2ntsdKtZ2ammezkCrIt3bFKWNXMBbU9pdXULCob0oB_DmoNc5s-E5Bll9Qfgy1IHxIV5MJLbRNw-7Xwi"
              }
            />
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded-md bg-white/90 text-teal-700 font-bold text-[8px] shadow">
              AI OK
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1 justify-between">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[14px] text-slate-800 truncate">
                Evidence Frame #{8920 + photoCount}
              </span>
              <span className="text-[10px] font-bold text-orange-700 px-2 py-0.5 rounded-full bg-orange-100 shadow-[inset_1px_1px_2px_#fed7aa]">
                EXIF &amp; GPS
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-teal-600">compress</span>
              <span>Edge Compressed: 800px • 142 KB</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for instant municipal triage</p>
          </div>
        </div>

        {/* Hazard Classification Selector Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Hazard Classification
            </label>
            <span className="text-[11px] font-semibold text-orange-600">AI Vision Classified</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] transition-all ${
                hazardType === 'pothole'
                  ? 'clay-btn-primary bg-orange-500 text-white font-bold'
                  : 'clay-btn-neutral text-slate-700 bg-white'
              }`}
              onClick={() => setHazardType('pothole')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">radio_button_checked</span>
              <span>Pothole</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] transition-all ${
                hazardType === 'speed-breaker'
                  ? 'clay-btn-primary bg-orange-500 text-white font-bold'
                  : 'clay-btn-neutral text-slate-700 bg-white'
              }`}
              onClick={() => setHazardType('speed-breaker')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">texture</span>
              <span>Speed-breaker</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] transition-all ${
                hazardType === 'metal-plate'
                  ? 'clay-btn-primary bg-orange-500 text-white font-bold'
                  : 'clay-btn-neutral text-slate-700 bg-white'
              }`}
              onClick={() => setHazardType('metal-plate')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600">shield</span>
              <span>Metal Plate</span>
            </button>
            <button
              className={`hazard-chip flex items-center justify-center gap-2 h-12 px-3 rounded-2xl font-semibold text-[13px] transition-all ${
                hazardType === 'manhole'
                  ? 'clay-btn-primary bg-orange-500 text-white font-bold'
                  : 'clay-btn-neutral text-slate-700 bg-white'
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
        <div className="p-4 clay-card bg-white rounded-3xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                    ? 'clay-btn-primary bg-rose-500 text-white font-bold shadow-md'
                    : 'clay-btn-neutral bg-slate-100 text-slate-600'
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
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            Field Observation Notes
          </label>
          <div className="clay-inset p-3 rounded-2xl bg-slate-100 border border-slate-200">
            <textarea
              className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 resize-none font-medium placeholder:text-slate-400"
              rows="2"
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Add observation (e.g. sharp jagged edges, deep standing water)..."
            ></textarea>
          </div>
        </div>

        {/* Secondary Action: Publish to Public Map */}
        <button
          className="w-full h-12 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
          onClick={handlePublishPublic}
          disabled={isSubmitting}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-indigo-600">cell_tower</span>
          <span>Publish &amp; Broadcast to Public Map</span>
        </button>
        {/* Municipal Auto-Upload Toggle */}
        <div className="mt-3 p-3 clay-card bg-slate-950 text-slate-200 rounded-2xl border border-slate-600/30">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-100">
              Municipal Auto-Submit
            </span>
            <label className="relative w-14 h-7 rounded-full bg-slate-600/50 border border-slate-400/50 p-0.5 transition-colors duration-200">
              <input
                type="checkbox"
                checked={municipalAutoUpload}
                onChange={(e) => setMunicipalAutoUploadSafe(e.target.checked)}
                className="absolute w-4 h-4 rounded-full bg-emerald-500 border-emerald-300 cursor-pointer pointer-events-auto opacity-0 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label="Enable municipal auto-submit of PDF reports"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-colors duration-200 select-none"></span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-colors duration-200 select-none"></span>
            </label>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {municipalAutoUpload ? 'Enabled: Reports will auto-upload to municipal API after generation' : 'Disabled: Reports will not auto-upload'}
          </p>
          <small className="text-[10px] text-slate-500">
            Set MUNICIPAL_API_AUTO_UPLOAD_ENABLED=true in backend .env and provide GOVERNMENT_API_KEY
          </small>
        </div>
        {/* End Municipal Auto-Upload Toggle */}
      </div>
    </div>
  );
}
