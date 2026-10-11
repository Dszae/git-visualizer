import React, { useState, useRef, useEffect } from 'react';
import { PRESET_SCENARIOS } from '../../engine/scenarios.js';

export default function Navbar({
  activeTab,
  onSelectTab,
  currentState: _currentState,
  onLoadScenario,
  onResetSession,
  isDark,
  onToggleTheme
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleSelectScenario = (scenario) => {
    onLoadScenario(scenario.generate());
    setScenarioDropdownOpen(false);
  };

  const handleBrandClick = () => {
    onSelectTab('sandbox');
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 ${
      isDark ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Internal Clickable Brand: Navigates to Git Visualizer Sandbox */}
        <button
          type="button"
          onClick={handleBrandClick}
          aria-label="Git Visualizer Home (Sandbox)"
          className="flex items-center gap-3 shrink-0 text-left cursor-pointer group focus:outline-none"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105" aria-hidden="true">
            {/* Git Branch SVG Icon */}
            <svg className="w-5.5 h-5.5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              Git Visualizer
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-none hidden sm:inline mt-0.5">
              Interactive Git Simulator
            </span>
          </div>
        </button>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800 font-semibold shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Scenarios Dropdown (Desktop & Tablets) */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              id="scenarios-menu-button"
              aria-haspopup="true"
              aria-expanded={scenarioDropdownOpen}
              aria-label="Preset repository scenarios"
              onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
              className="h-10 px-3.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Scenarios</span>
              <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {scenarioDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Preset Scenarios
                </div>
                {PRESET_SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors block text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{s.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{s.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Sandbox Button (Desktop) */}
          {onResetSession && (
            <button
              onClick={onResetSession}
              aria-label="Reset simulation to default state"
              title="Reset repository to default state"
              className="h-10 px-3.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 transition-colors hidden md:inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <svg aria-hidden="true" className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
          )}

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={isDark}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
          >
            {isDark ? (
              <svg aria-hidden="true" className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-4.5 h-4.5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="lg:hidden h-10 w-10 sm:h-11 sm:w-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <svg aria-hidden="true" className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto shadow-lg">
          {/* Main Navigation Tabs */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3 block mb-2">
              Navigation
            </span>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTab(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors min-h-[48px] flex items-center cursor-pointer text-base ${
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
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 space-y-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3 block mb-1">
              Load Preset Scenario
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectScenario(s);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{s.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action: Reset Sandbox */}
          {onResetSession && (
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850">
              <button
                onClick={() => {
                  onResetSession();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-base text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium min-h-[48px] flex items-center gap-2.5 cursor-pointer border border-zinc-200 dark:border-zinc-800"
              >
                <svg aria-hidden="true" className="w-4.5 h-4.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset Sandbox to Default</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
