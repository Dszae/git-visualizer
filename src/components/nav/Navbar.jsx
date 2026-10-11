import React, { useState } from 'react';
import { PRESET_SCENARIOS, serializeStateToUrl } from '../../engine/scenarios.js';

export default function Navbar({
  activeTab,
  onSelectTab,
  currentState,
  onLoadScenario,
  onResetSession,
  isDark,
  onToggleTheme
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);

  const tabs = [
    { id: 'sandbox', label: 'Interactive Sandbox', icon: '⚡' },
    { id: 'lessons', label: 'Guided Lessons', icon: '🎓' },
    { id: 'undo-lab', label: 'Safe Undo Lab', icon: '🛡️' },
    { id: 'flowchart', label: 'Stage Flowchart', icon: '🗺️' },
    { id: 'reference', label: 'Command Reference', icon: '📚' }
  ];

  const handleShare = () => {
    const encoded = serializeStateToUrl(currentState);
    if (!encoded) return;

    const url = new URL(window.location.href);
    url.searchParams.set('state', encoded);
    navigator.clipboard.writeText(url.toString());

    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const handleSelectScenario = (scenario) => {
    onLoadScenario(scenario.generate());
    setScenarioDropdownOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-slate-950/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20 transform transition-transform hover:rotate-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>Git Visualizer</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 hidden sm:block">
              Interactive Git Simulator & Learning Platform
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono" aria-label="Main Navigation">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeTab === t.id ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Scenarios Dropdown */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
            >
              <span>Scenarios</span>
              <span className="text-[10px] opacity-70">▼</span>
            </button>

            {scenarioDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 space-y-1 text-xs font-sans animate-[fadeIn_0.15s_ease-out]">
                <p className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Preset Scenarios
                </p>
                {PRESET_SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-colors block text-slate-200"
                  >
                    <p className="font-bold text-white text-xs">{s.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{s.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share Scenario Button */}
          <button
            onClick={handleShare}
            aria-label="Share current scenario URL"
            className="px-3 py-1.5 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Reset Sandbox Button */}
          {onResetSession && (
            <button
              onClick={onResetSession}
              aria-label="Reset simulation to default state"
              title="Reset repository to default initial state"
              className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all focus-visible:ring-2 focus-visible:ring-orange-500 hidden sm:flex items-center gap-1"
            >
              <span>↺</span> Reset
            </button>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {isDark ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile navigation menu"
            className="md:hidden p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareSuccess && (
        <div className="fixed top-20 right-6 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-xl animate-[fadeIn_0.2s_ease-out] z-50 flex items-center gap-2">
          <span>✓</span> Link copied to clipboard!
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2 text-xs font-mono animate-[fadeIn_0.2s_ease-out]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => {
                onSelectTab(t.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 ${activeTab === t.id ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-900'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <span className="text-[10px] text-slate-400">Scenarios:</span>
            <div className="flex flex-wrap gap-1">
              {PRESET_SCENARIOS.slice(0, 3).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectScenario(s);
                    setMobileMenuOpen(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
