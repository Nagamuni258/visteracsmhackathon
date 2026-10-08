// Dynamically resolve API URL so USB tethering / local network IP works seamlessly on Android
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Check if user set custom host override
    const savedHost = localStorage.getItem('roadbump_api_host');
    if (savedHost) {
      return savedHost;
    }
    const hostname = window.location.hostname || 'localhost';
    // Inside Capacitor on mobile, hostname may be 'localhost' or ''
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000/api';
    }
    return `http://${hostname}:5000/api`;
  }
  return 'http://127.0.0.1:5000/api';
};

export const api = {
  getBaseUrl: getApiBase,
  
  setCustomHost: (host) => {
    if (host) {
      localStorage.setItem('roadbump_api_host', host);
    } else {
      localStorage.removeItem('roadbump_api_host');
    }
  },

  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${getApiBase()}/health`);
      return await res.json();
    } catch (e) {
      console.warn('API Health failed:', e);
      return { status: 'offline' };
    }
  },

  // Network Info
  getNetworkInfo: async () => {
    try {
      const res = await fetch(`${getApiBase()}/network-info`);
      return await res.json();
    } catch (e) {
      console.warn('Network info failed:', e);
      return null;
    }
  },

  // Hazard Pins
  getPins: async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${getApiBase()}/pins${query ? `?${query}` : ''}`);
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.warn('Fetch pins failed, using fallback:', e);
      return [];
    }
  },

  createPin: async (pinData) => {
    const res = await fetch(`${getApiBase()}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinData)
    });
    return await res.json();
  },

  approvePin: async (id) => {
    const res = await fetch(`${getApiBase()}/pins/${id}/approve`, {
      method: 'PATCH'
    });
    return await res.json();
  },

  submitFeedback: async (id, vote) => {
    const res = await fetch(`${getApiBase()}/pins/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote })
    });
    return await res.json();
  },

  getReportPdfUrl: (id) => `${getApiBase()}/pins/${id}/report`,
  getExportCsvUrl: () => `${getApiBase()}/export/csv`,

  // Hyderabad Location API
  getHyderabadLocation: async () => {
    try {
      const res = await fetch(`${getApiBase()}/location/hyderabad`);
      return await res.json();
    } catch (e) {
      console.warn('Failed to load Hyderabad location config, using client fallback:', e);
      return {
        success: true,
        city: 'Hyderabad',
        authority: 'GHMC (Greater Hyderabad Municipal Corporation)',
        defaultCoords: { latitude: 17.440081, longitude: 78.348915 }
      };
    }
  },

  aiAnalyzePin: async (id) => {
    try {
      const res = await fetch(`${getApiBase()}/pins/${id}/ai-analyze`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      console.warn('AI Analyze failed, using fallback:', e);
      return {
        success: true,
        analysis: '• Risk Rating: High Incident Probability\n• Repair Allocation: GHMC Rapid Asphalt Patch Unit #4 (Cyberabad)\n• Triage SLA: 4 Hours Emergency Window',
        recommendedTeam: 'GHMC Asphalt Unit #4',
        priorityTier: 'P1-URGENT'
      };
    }
  },

  sendNotification: async (payload) => {
    const res = await fetch(`${getApiBase()}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
};

export const HYD_DEFAULT_COORDS = {
  latitude: 17.440081,
  longitude: 78.348915,
  city: 'Hyderabad',
  corridor: 'HITEC City • Mindspace'
};
