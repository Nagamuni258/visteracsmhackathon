import React from 'react';

/**
 * RoadBump Bulletproof Error Boundary
 * Prevents any unhandled exception or render glitch from blanking out the screen.
 * Provides instant 1-tap self-healing recovery.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 [RoadBump ErrorBoundary caught exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Reset path or dispatch reset event if needed
    try {
      window.dispatchEvent(new CustomEvent('roadbump:recover'));
    } catch (_) {}
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unexpected application glitch';

      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#EEF2F7] px-5 py-8 text-[#1E293B] font-['Poppins'] select-none">
          {/* Tactile Clay Warning Card */}
          <div className="w-full max-w-sm rounded-[32px] p-6 bg-[#EEF2F7] shadow-[12px_12px_24px_rgba(160,175,195,0.4),-12px_-12px_24px_rgba(255,255,255,0.9)] border border-white flex flex-col items-center text-center gap-4 animate-fadeIn">
            
            {/* Animated Beacon Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6),4px_6px_14px_rgba(249,115,22,0.35)] border border-white">
              <span className="material-symbols-outlined text-white text-[32px] font-bold">
                healing
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-widest text-[#FF6F61] uppercase">
                AUTOMATIC SAFEGUARD ACTIVE
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-[#1E293B]">
                RoadBump Shield Active
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                A temporary rendering glitch was intercepted to protect your live sensor session. No telemetry data was lost.
              </p>
            </div>

            {/* Error snippet pill */}
            <div className="w-full bg-white/70 rounded-2xl p-3 border border-white/80 shadow-[inset_2px_2px_6px_rgba(160,175,195,0.3)] text-left">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-amber-700">
                <span className="material-symbols-outlined text-[14px]">bug_report</span>
                <span>Self-Diagnostics:</span>
              </div>
              <div className="text-[11px] font-mono text-slate-700 break-words leading-tight">
                {errorMsg}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col w-full gap-2.5 mt-2">
              <button
                onClick={this.handleRecover}
                type="button"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm shadow-[0_6px_18px_rgba(249,115,22,0.35)] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Restore Live Screen</span>
              </button>

              <button
                onClick={this.handleReload}
                type="button"
                className="w-full py-2.5 px-4 rounded-2xl bg-white text-[#64748B] hover:text-[#1E293B] font-bold text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
