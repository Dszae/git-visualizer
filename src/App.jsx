import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/nav/Navbar.jsx';
import CommitGraph from './components/graph/CommitGraph.jsx';
import CommandConsole from './components/workspace/CommandConsole.jsx';
import SEOContent from './components/seo/SEOContent.jsx';
import {
  createDefaultRepo,
  executeCommand
} from './engine/gitEngine.js';
import {
  PRESET_SCENARIOS,
  deserializeStateFromUrl
} from './engine/scenarios.js';

// Lazy-load secondary tabs to optimize bundle size and accelerate initial paint
const LessonsView = lazy(() => import('./components/lessons/LessonsView.jsx'));
const UndoLabView = lazy(() => import('./components/undoLab/UndoLabView.jsx'));
const StageFlowchartView = lazy(() => import('./components/flowchart/StageFlowchartView.jsx'));
const CommandReferenceView = lazy(() => import('./components/reference/CommandReferenceView.jsx'));

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

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                See how Git works visually
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
          <Suspense fallback={
            <div className="py-20 text-center text-zinc-400 font-sans text-sm animate-pulse">
              Loading lessons...
            </div>
          }>
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
          </Suspense>
        )}

        {/* ================= TAB 3: SAFE UNDO LAB ================= */}
        {activeTab === 'undo-lab' && (
          <Suspense fallback={
            <div className="py-20 text-center text-zinc-400 font-sans text-sm animate-pulse">
              Loading Undo Lab...
            </div>
          }>
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
          </Suspense>
        )}

        {/* ================= TAB 4: ARCHITECTURE FLOWCHART ================= */}
        {activeTab === 'flowchart' && (
          <Suspense fallback={
            <div className="py-20 text-center text-zinc-400 font-sans text-sm animate-pulse">
              Loading flowchart...
            </div>
          }>
            <StageFlowchartView
              onRunCommand={handleRunCommand}
              isDark={isDark}
            />
          </Suspense>
        )}

        {/* ================= TAB 5: COMMAND REFERENCE ================= */}
        {activeTab === 'reference' && (
          <Suspense fallback={
            <div className="py-20 text-center text-zinc-400 font-sans text-sm animate-pulse">
              Loading reference...
            </div>
          }>
            <CommandReferenceView
              onRunCommand={handleRunCommand}
              isDark={isDark}
            />
          </Suspense>
        )}

        {/* Editorial SEO & Topics */}
        <SEOContent isDark={isDark} />
      </main>

      {/* Clean, Tasteful Footer */}
      <footer className={`py-8 border-t text-xs transition-colors duration-200 ${
        isDark ? 'border-zinc-800/80 text-zinc-500' : 'border-zinc-200 text-zinc-500'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Git Visualizer
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              An interactive visualizer to master branching, merging, rebasing, and commits.
            </p>
          </div>
          <div>
            <a
              href="https://www.dipeshsapkota7.com.np/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors"
            >
              Created by Dipesh Sapkota →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}