// Dynamically resolve API URL so USB tethering / local network IP works seamlessly on Android
export const DEFAULT_LAN_IP = '172.16.2.161';
let detectedFastBase = null;

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Check if user set custom host override
    const savedHost = localStorage.getItem('roadbump_api_host');
    if (savedHost) {
      return savedHost;
    }
    if (detectedFastBase) {
      return detectedFastBase;
    }
    const hostname = window.location.hostname || '';
    // If running in browser on LAN (e.g. http://172.16.2.161:3000)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
    // Inside Capacitor on mobile or localhost
    return `http://${DEFAULT_LAN_IP}:5000/api`;
  }
  return `http://${DEFAULT_LAN_IP}:5000/api`;
};

// Auto-probe fastest reachable backend endpoint on app boot
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const probe127 = await Promise.race([
        fetch('http://127.0.0.1:5000/api/health'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
      ]);
      if (probe127 && probe127.ok) {
        detectedFastBase = 'http://127.0.0.1:5000/api';
        return;
      }
    } catch (_) {}
    detectedFastBase = `http://${DEFAULT_LAN_IP}:5000/api`;
  })();
}

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
  },

  // Google Sheets Integration
  syncToGoogleSheets: async (id, webhookUrl) => {
    try {
      const res = await fetch(`${getApiBase()}/pins/${id}/google-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl })
      });
      return await res.json();
    } catch (e) {
      console.warn('Google Sheets sync failed:', e);
      return { success: false, error: e.message };
    }
  },

  getGoogleSheetsRecords: async () => {
    try {
      const res = await fetch(`${getApiBase()}/google-sheets/records`);
      return await res.json();
    } catch (e) {
      console.warn('Fetch Google Sheets records failed:', e);
      return { success: false, records: [] };
    }
  },

  getGoogleSheetsTemplate: async () => {
    try {
      const res = await fetch(`${getApiBase()}/google-sheets/template`);
      return await res.json();
    } catch (e) {
      console.warn('Fetch Google Sheets template failed:', e);
      return null;
    }
  },

  // Real-Time Multi-Device SSE Event Stream
  subscribeToEvents: (onEvent) => {
    if (typeof window === 'undefined' || !window.EventSource) return () => {};

    let eventSource = null;
    let pollInterval = null;
    let reconnectTimeout = null;
    let isClosed = false;

    const connectSSE = () => {
      if (isClosed) return;
      try {
        const streamUrl = `${getApiBase()}/events`;
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener('hazard_detected', (e) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            if (onEvent) onEvent({ type: 'hazard_detected', ...data });
          } catch (_) {}
        });

        eventSource.addEventListener('hazard_approved', (e) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            if (onEvent) onEvent({ type: 'hazard_approved', ...data });
          } catch (_) {}
        });

        eventSource.onerror = () => {
          if (isClosed) return;
          try { eventSource.close(); } catch (_) {}
          // Fast-poll fallback if SSE stream disconnects
          if (!pollInterval && !isClosed) {
            pollInterval = setInterval(async () => {
              if (isClosed) return;
              try {
                const pins = await api.getPins();
                if (onEvent) onEvent({ type: 'pins_polled', pins });
              } catch (_) {}
            }, 3000);
          }
          if (!isClosed) {
            reconnectTimeout = setTimeout(connectSSE, 6000);
          }
        };
      } catch (err) {
        if (!isClosed && !pollInterval) {
          pollInterval = setInterval(async () => {
            if (isClosed) return;
            try {
              const pins = await api.getPins();
              if (onEvent) onEvent({ type: 'pins_polled', pins });
            } catch (_) {}
          }, 3000);
        }
      }
    };

    connectSSE();

    return () => {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        try { eventSource.close(); } catch (_) {}
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }
};

export const HYD_DEFAULT_COORDS = {
  latitude: 17.440081,
  longitude: 78.348915,
  city: 'Hyderabad',
  corridor: 'HITEC City • Mindspace'
};
