import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/nav/Navbar.jsx';
import CommitGraph from './components/graph/CommitGraph.jsx';
import Terminal from './components/terminal/Terminal.jsx';
import RepoInspector from './components/inspector/RepoInspector.jsx';
import ExplanationPanel from './components/explanation/ExplanationPanel.jsx';
import TimelineControls from './components/timeline/TimelineControls.jsx';
import LessonsView from './components/lessons/LessonsView.jsx';
import UndoLabView from './components/undoLab/UndoLabView.jsx';
import StageFlowchartView from './components/flowchart/StageFlowchartView.jsx';
import CommandReferenceView from './components/reference/CommandReferenceView.jsx';
import SEOContent from './components/seo/SEOContent.jsx';
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
      output: `On branch ${initialRepo.HEAD.name}\nYour branch is ahead of 'origin/main' by 1 commit.\n  (use "git push" to publish your local commits)\n\nChanges not staged for commit:\n  modified: index.js\n\nUntracked files:\n  utils.js`,
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

  // Command execution pipeline
  const handleRunCommand = useCallback((cmdString) => {
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    // Execute through deterministic Git engine
    const result = executeCommand(currentState, trimmed);
    const activeBranchName = currentState.HEAD.type === 'detached' 
      ? currentState.HEAD.name.slice(0, 7) 
      : currentState.HEAD.name;

    // Append to terminal logs
    setTerminalLogs(prev => [
      ...prev,
      {
        command: trimmed,
        branch: activeBranchName,
        output: result.output,
        error: result.error
      }
    ]);

    if (result.explanation) {
      setLatestExplanation(result.explanation);
    }

    // Advance state and timeline if state changed or command succeeded
    if (!result.error) {
      setCurrentState(result.state);
      setHistorySteps(prev => [
        ...prev.slice(0, currentStepIndex + 1),
        {
          state: result.state,
          command: trimmed,
          explanation: result.explanation
        }
      ]);
      setCurrentStepIndex(prev => prev + 1);
    }

    // If currently on another tab and command was executed from quick chip, take user to sandbox
    if (activeTab !== 'sandbox' && activeTab !== 'flowchart') {
      setActiveTab('sandbox');
    }
  }, [currentState, currentStepIndex, activeTab]);

  // Step travel
  const handleGoToStep = (index) => {
    if (index >= 0 && index < historySteps.length) {
      setCurrentStepIndex(index);
      setCurrentState(historySteps[index].state);
      if (historySteps[index].explanation) {
        setLatestExplanation(historySteps[index].explanation);
      }
    }
  };

  // Load new scenario / lesson initial state
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
    <div className={`min-h-screen font-sans flex flex-col selection:bg-orange-500/30 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Subtle Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '36px 36px' }}
      />

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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        
        {/* ================= TAB 1: INTERACTIVE SANDBOX ================= */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            
            {/* Dominant Interactive Commit Graph */}
            <CommitGraph 
              state={currentState} 
              isDark={isDark} 
            />

            {/* Timeline Controls (Step scrubber & Play/Pause) */}
            <TimelineControls
              historySteps={historySteps}
              currentStepIndex={currentStepIndex}
              onGoToStep={handleGoToStep}
              onResetSession={handleResetSession}
              isDark={isDark}
            />

            {/* Split Lower Workspace: Terminal CLI (Left) & Repo Inspector (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Command Terminal */}
              <div className="lg:col-span-7">
                <Terminal
                  onRunCommand={handleRunCommand}
                  activeBranch={currentState.HEAD.name}
                  isDetached={currentState.HEAD.type === 'detached'}
                  detachedHash={currentState.HEAD.name}
                  terminalLogs={terminalLogs}
                  onClearLogs={() => setTerminalLogs([])}
                  isDark={isDark}
                  suggestedCommands={latestExplanation?.nextSuggestions || []}
                />
              </div>

              {/* Right Column: Repository State Inspector */}
              <div className="lg:col-span-5">
                <RepoInspector
                  state={currentState}
                  onStateChange={setCurrentState}
                  onRunCommand={handleRunCommand}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* Before-and-After Explanation Panel */}
            <ExplanationPanel
              explanation={latestExplanation}
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
            {/* Mini preview graph below lessons */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
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
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
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

        {/* Educational SEO & Topic Articles (Crawlable) */}
        <SEOContent isDark={isDark} />
      </main>

      {/* Footer Branding - Preserved & Upgraded */}
      <footer className={`py-8 border-t text-center text-xs font-mono transition-colors duration-300 relative z-20 ${isDark ? 'bg-slate-950/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold">
            Architected & Engineered By
          </p>
          <a
            href="https://www.dipeshsapkota7.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-2 text-sm font-black transition-colors underline decoration-orange-500/40 underline-offset-4 ${isDark ? 'text-white hover:text-orange-400' : 'text-slate-900 hover:text-orange-600'}`}
          >
            <svg className="w-4 h-4 text-orange-500 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            Dipesh Sapkota
          </a>
          <p className="text-[10px] text-slate-400 mt-1">
            Git Visualizer is an open interactive learning platform for mastering Git internals, branching, rebasing, and safe undos.
          </p>
        </div>
      </footer>
    </div>
  );
}