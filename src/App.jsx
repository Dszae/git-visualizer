import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/nav/Navbar.jsx';
import CommitGraph from './components/graph/CommitGraph.jsx';
import CommandConsole from './components/workspace/CommandConsole.jsx';
import SEOContent from './components/seo/SEOContent.jsx';
import LessonsView from './components/lessons/LessonsView.jsx';
import UndoLabView from './components/undoLab/UndoLabView.jsx';
import StageFlowchartView from './components/flowchart/StageFlowchartView.jsx';
import CommandReferenceView from './components/reference/CommandReferenceView.jsx';
import {
  createDefaultRepo,
  executeCommand
} from './engine/gitEngine.js';
import {
  PRESET_SCENARIOS,
  deserializeStateFromUrl
} from './engine/scenarios.js';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('git_visualizer_theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (['sandbox', 'lessons', 'undo-lab', 'flowchart', 'reference'].includes(tabParam)) {
        return tabParam;
      }
    } catch {}
    return 'sandbox';
  });

  // Initialize repo state from URL parameter if present, otherwise default rich repo
  const [initialRepo] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const stateParam = urlParams.get('state');
      if (stateParam) {
        const decoded = deserializeStateFromUrl(stateParam);
        if (decoded) return decoded;
      }
      const scenarioParam = urlParams.get('scenario');
      if (scenarioParam) {
        const found = PRESET_SCENARIOS.find(s => s.id === scenarioParam);
        if (found) return found.generate();
      }
    } catch (err) {
      console.warn('Error reading URL parameters:', err);
    }
    return createDefaultRepo();
  });

  const [currentState, setCurrentState] = useState(initialRepo);
  const [historySteps, setHistorySteps] = useState([
    {
      state: initialRepo,
      command: 'Initial State',
      explanation: null
    }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [terminalLogs, setTerminalLogs] = useState([
    {
      command: 'git status',
      branch: initialRepo.HEAD.name,
      output: `On branch ${initialRepo.HEAD.name}\nYour branch is ahead of 'origin/main' by 1 commit.\n\nChanges not staged for commit:\n  modified: index.js\n\nUntracked files:\n  utils.js`,
      error: null
    }
  ]);

  const [latestExplanation, setLatestExplanation] = useState({
    command: 'git status',
    success: true,
    summary: 'Repository initialized with 3 sample commits',
    details: 'You are on branch "main". The working directory has modified index.js and untracked utils.js ready for you to stage and commit.',
    changes: [],
    unchanged: ['All commits and branch pointers preserved'],
    resultingState: 'Active on branch "main"',
    nextSuggestions: ['git add .', 'git commit -m "feat: updates"', 'git log --oneline']
  });

  // Save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('git_visualizer_theme', isDark ? 'dark' : 'light');
    } catch {}
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Update query params when tab changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeTab === 'sandbox') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', activeTab);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [activeTab]);

  /**
   * Execute git command deterministically
   */
  const handleRunCommand = useCallback((cmdString) => {
    if (!cmdString || !cmdString.trim()) return;
    const trimmed = cmdString.trim();

    // Special command: clear
    if (trimmed.toLowerCase() === 'clear') {
      setTerminalLogs([]);
      return;
    }

    const { nextState, output, error, explanation } = executeCommand(currentState, trimmed);

    // Append to logs
    setTerminalLogs(prev => [
      ...prev,
      {
        command: trimmed,
        branch: currentState.HEAD.type === 'detached' ? currentState.HEAD.name.slice(0, 7) : currentState.HEAD.name,
        output,
        error
      }
    ]);

    if (explanation) {
      setLatestExplanation(explanation);
    }

    if (!error) {
      setCurrentState(nextState);

      // Append state to history timeline
      setHistorySteps(prev => {
        const sliced = prev.slice(0, currentStepIndex + 1);
        return [
          ...sliced,
          {
            state: nextState,
            command: trimmed,
            explanation
          }
        ];
      });
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentState, currentStepIndex]);

  const handleGoToStep = (index) => {
    if (index >= 0 && index < historySteps.length) {
      setCurrentStepIndex(index);
      const target = historySteps[index];
      setCurrentState(target.state);
      if (target.explanation) {
        setLatestExplanation(target.explanation);
      }
    }
  };

  const handleLoadState = (newState) => {
    setCurrentState(newState);
    setHistorySteps([
      {
        state: newState,
        command: 'State Loaded',
        explanation: null
      }
    ]);
    setCurrentStepIndex(0);
    setTerminalLogs([
      {
        command: 'git status',
        branch: newState.HEAD.type === 'detached' ? newState.HEAD.name.slice(0, 7) : newState.HEAD.name,
        output: `Loaded scenario. Repository active on branch ${newState.HEAD.name || 'main'}.`,
        error: null
      }
    ]);
  };

  const handleResetSession = () => {
    const fresh = createDefaultRepo();
    handleLoadState(fresh);
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentState={currentState}
        onLoadScenario={handleLoadState}
        onResetSession={handleResetSession}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* ================= TAB 1: SANDBOX ================= */}
        {activeTab === 'sandbox' && (
          <div className="space-y-5">
            {/* Clear Orientation Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                See how Git works visually
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                Type a command or pick an action below to watch commits, branches, and pointers update in real time.
              </p>
            </div>

            {/* The Visualizer: Commit Graph takes center stage */}
            <CommitGraph 
              state={currentState} 
              isDark={isDark} 
            />

            {/* The Unified Command Console */}
            <CommandConsole
              state={currentState}
              onStateChange={setCurrentState}
              onRunCommand={handleRunCommand}
              terminalLogs={terminalLogs}
              onClearLogs={() => setTerminalLogs([])}
              latestExplanation={latestExplanation}
              historySteps={historySteps}
              currentStepIndex={currentStepIndex}
              onGoToStep={handleGoToStep}
              onResetSession={handleResetSession}
              isDark={isDark}
            />
          </div>
        )}

        {/* ================= TAB 2: GUIDED LESSONS ================= */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <LessonsView
              currentState={currentState}
              onLoadState={handleLoadState}
              onRunCommand={handleRunCommand}
              isDark={isDark}
            />
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Live State Preview
              </h3>
              <CommitGraph state={currentState} isDark={isDark} />
            </div>
          </div>
        )}

        {/* ================= TAB 3: SAFE UNDO LAB ================= */}
        {activeTab === 'undo-lab' && (
          <div className="space-y-6">
            <UndoLabView
              onRunCommand={handleRunCommand}
              isDark={isDark}
            />
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Live Commit Graph
              </h3>
              <CommitGraph state={currentState} isDark={isDark} />
            </div>
          </div>
        )}

        {/* ================= TAB 4: ARCHITECTURE FLOWCHART ================= */}
        {activeTab === 'flowchart' && (
          <StageFlowchartView
            onRunCommand={handleRunCommand}
            isDark={isDark}
          />
        )}

        {/* ================= TAB 5: COMMAND REFERENCE ================= */}
        {activeTab === 'reference' && (
          <CommandReferenceView
            onRunCommand={handleRunCommand}
            isDark={isDark}
          />
        )}

        {/* Editorial SEO & Topics */}
        <SEOContent isDark={isDark} />
      </main>

      {/* Clean, Tasteful Footer with Sitelink Backlinks */}
      <footer className={`py-10 border-t text-xs transition-colors duration-200 ${
        isDark ? 'border-zinc-800/80 text-zinc-500 bg-zinc-950/80' : 'border-zinc-200 text-zinc-500 bg-white'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
            {/* Project Identity */}
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" aria-hidden="true"></span>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Git Visualizer
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                An interactive Git learning platform with a live commit graph, deterministic CLI simulator, safe undo lab, and architecture flowchart.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1" aria-label="Dipesh Sapkota links">
                {/* Original Website Link with Globe Icon */}
                <a
                  href="https://www.dipeshsapkota7.com.np/"
                  target="_blank"
                  rel="noopener noreferrer home author"
                  aria-label="Visit Dipesh Sapkota's official website"
                  title="Dipesh Sapkota's official website"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium inline-flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
                  </svg>
                  <span className="sr-only">Official website</span>
                </a>

                {/* GitHub Profile with GitHub Octocat Icon */}
                <a
                  href="https://github.com/Dszae"
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label="Visit Dipesh Sapkota on GitHub"
                  title="Dipesh Sapkota on GitHub"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium inline-flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 fill-current text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                  </svg>
                  <span className="sr-only">GitHub profile</span>
                </a>

                <a
                  href="https://instagram.com/dsz.ae"
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label="Visit Dipesh Sapkota on Instagram"
                  title="Dipesh Sapkota on Instagram"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium inline-flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 fill-current text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 2A3.5 3.5 0 004 7.5v9A3.5 3.5 0 007.5 20h9a3.5 3.5 0 003.5-3.5v-9A3.5 3.5 0 0016.5 4h-9zm9.75 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"></path>
                  </svg>
                  <span className="sr-only">Instagram profile</span>
                </a>

                <a
                  href="https://facebook.com/dsz.ae"
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label="Visit Dipesh Sapkota on Facebook"
                  title="Dipesh Sapkota on Facebook"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium inline-flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 fill-current text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 21v-8h2.75l.5-3h-3.25V8.05c0-.87.28-1.55 1.6-1.55h1.8V3.82A24.2 24.2 0 0014.77 3c-2.63 0-4.27 1.6-4.27 4.4V10H7.75v3h2.75v8h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook profile</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <p>© {new Date().getFullYear()} Git Visualizer. Created by Dipesh Sapkota.</p>
            <p>Designed for engineers, students, and educators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}