import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Global window unhandled rejection catcher to avoid silent white screen aborts
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('⚠️ [Safe Intercept] Unhandled promise rejection caught:', event.reason);
  });
  window.addEventListener('error', (event) => {
    console.warn('⚠️ [Safe Intercept] Global runtime error caught:', event.message);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
