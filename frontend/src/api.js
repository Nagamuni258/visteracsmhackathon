// Dynamically resolve API URL so USB tethering / local network IP works seamlessly on Android
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Check if user set custom host override
    const savedHost = localStorage.getItem('roadbump_api_host');
    if (savedHost) {
      return savedHost;
    }
    const hostname = window.location.hostname || 'localhost';
    // Port 5000 is always the backend server port
    return `${window.location.protocol}//${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
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

  sendNotification: async (payload) => {
    const res = await fetch(`${getApiBase()}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
};
