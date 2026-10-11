import React, { useState, useRef, useEffect } from 'react';
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
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 'sandbox', label: 'Interactive Sandbox' },
    { id: 'lessons', label: 'Guided Lessons' },
    { id: 'undo-lab', label: 'Undo Lab' },
    { id: 'flowchart', label: 'How Git Works' },
    { id: 'reference', label: 'Command Reference' }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setScenarioDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 ${
      isDark ? 'bg-zinc-950/90 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-sm" aria-hidden="true">
            {/* Git Branch SVG Icon */}
            <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              Git Visualizer
            </span>
            <span className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-none hidden sm:inline mt-0.5">
              Interactive Git Simulator & Learning Guide
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`h-10 px-3.5 sm:px-4 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800/90 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Preset Scenarios Dropdown (Desktop & Tablets) */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              id="scenarios-menu-button"
              aria-haspopup="true"
              aria-expanded={scenarioDropdownOpen}
              aria-label="Preset repository scenarios"
              onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
              className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>Scenarios</span>
              <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {scenarioDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Preset Scenarios
                </div>
                {PRESET_SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors block text-zinc-800 dark:text-zinc-200"
                  >
                    <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{s.title}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{s.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Sandbox Button (Desktop & Tablets) */}
          {onResetSession && (
            <button
              onClick={onResetSession}
              aria-label="Reset simulation to default state"
              title="Reset repository to default state"
              className="h-9 sm:h-10 px-3 rounded-lg text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 transition-colors hidden md:inline-flex items-center gap-1 shadow-2xs"
            >
              <span>↺</span> Reset
            </button>
          )}

          {/* Main Portfolio Backlink */}
          <a
            href="https://www.dipeshsapkota7.com.np/"
            target="_blank"
            rel="noopener noreferrer home author"
            title="Visit Dipesh Sapkota's main portfolio website"
            aria-label="Visit original website dipeshsapkota7.com.np"
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 transition-colors hidden sm:inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>dipeshsapkota7.com.np</span>
            <svg aria-hidden="true" className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share current scenario URL"
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={isDark}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center justify-center shadow-2xs"
          >
            {isDark ? (
              <svg aria-hidden="true" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span className="sr-only">{isDark ? "Switch to light theme" : "Switch to dark theme"}</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            id="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
      </div>

      {/* Share Toast Notification */}
      {shareSuccess && (
        <div className="fixed top-20 right-4 sm:right-6 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-sans text-xs font-semibold shadow-lg z-50 flex items-center gap-2 animate-[fadeIn_0.15s_ease-out]">
          <span className="text-emerald-500 font-bold">✓</span> Link copied to clipboard
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 text-sm max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Main Navigation Tabs */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 block mb-1">
              Navigation
            </span>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTab(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 rounded-lg font-medium transition-colors min-h-[44px] flex items-center ${
                  activeTab === t.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile Preset Scenarios List */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 block mb-1">
              Load Preset Scenario
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectScenario(s);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{s.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions (Reset & Share) */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 space-y-1">
            {onResetSession && (
              <button
                onClick={() => {
                  onResetSession();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-medium min-h-[44px] flex items-center gap-2"
              >
                <span>↺</span> Reset Sandbox to Default
              </button>
            )}
            <button
              onClick={() => {
                handleShare();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-medium min-h-[44px] flex items-center gap-2"
            >
              <span>🔗</span> Copy Shareable URL
            </button>
          </div>

          {/* Original Website Link in Mobile Drawer */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850">
            <a
              href="https://www.dipeshsapkota7.com.np/"
              target="_blank"
              rel="noopener noreferrer home author"
              className="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 min-h-[44px] flex items-center justify-between"
            >
              <span>Original Website: dipeshsapkota7.com.np</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
