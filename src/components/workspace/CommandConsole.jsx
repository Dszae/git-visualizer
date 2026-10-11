import React, { useState, useRef, useEffect } from 'react';
import { resolveFileConflict } from '../../engine/gitEngine.js';

const BEGINNER_ACTIONS = [
  { label: 'Stage all files', cmd: 'git add .', desc: 'Prepares modified files in the Staging Area' },
  { label: 'Record commit', cmd: 'git commit -m "feat: new update"', desc: 'Saves a permanent snapshot and advances branch' },
  { label: 'Create branch', cmd: 'git branch feature', desc: 'Creates a new branch pointer at current commit' },
  { label: 'Switch branch', cmd: 'git switch feature', desc: 'Moves HEAD to point to the feature branch' },
  { label: 'Merge branch', cmd: 'git merge feature', desc: 'Combines feature branch commits into current branch' },
  { label: 'Check status', cmd: 'git status', desc: 'Shows modified, staged, and untracked files' },
];

const ADVANCED_ACTIONS = [
  { label: 'Rebase on main', cmd: 'git rebase main', desc: 'Replays current commits on top of main branch' },
  { label: 'Stash changes', cmd: 'git stash', desc: 'Shelves uncommitted changes temporarily' },
  { label: 'Restore stash', cmd: 'git stash pop', desc: 'Restores the most recently stashed changes' },
  { label: 'Soft reset', cmd: 'git reset --soft HEAD~1', desc: 'Undoes last commit, keeping changes staged' },
  { label: 'Hard reset', cmd: 'git reset --hard HEAD~1', desc: 'Discards last commit and uncommitted changes' },
  { label: 'Revert commit', cmd: 'git revert HEAD', desc: 'Creates an inverse commit without rewriting history' },
  { label: 'Create tag', cmd: 'git tag v1.0.0', desc: 'Creates a named release pointer' },
  { label: 'Log oneline', cmd: 'git log --oneline', desc: 'Shows commit history in single-line format' },
  { label: 'Inspect diff', cmd: 'git diff', desc: 'Shows unstaged differences in working tree' },
  { label: 'Diff staged', cmd: 'git diff --staged', desc: 'Shows differences ready for commit' }
];

const ALL_COMMANDS = [
  ...BEGINNER_ACTIONS.map(a => a.cmd),
  ...ADVANCED_ACTIONS.map(a => a.cmd)
];

function renderAnsiText(text) {
  if (!text) return null;
  // oxlint-disable-next-line no-control-regex
  /* eslint-disable-next-line no-control-regex */
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentColor = '';

  return parts.map((part, idx) => {
    if (part.startsWith('\x1b[')) {
      if (part === '\x1b[0m') currentColor = '';
      else if (part === '\x1b[32m') currentColor = 'text-emerald-500 font-semibold';
      else if (part === '\x1b[31m') currentColor = 'text-rose-500 font-semibold';
      else if (part === '\x1b[33m') currentColor = 'text-amber-500 font-semibold';
      else if (part === '\x1b[36m') currentColor = 'text-cyan-500 font-semibold';
      return null;
    }
    return (
      <span key={idx} className={currentColor}>
        {part}
      </span>
    );
  }).filter(Boolean);
}

export default function CommandConsole({
  state,
  onStateChange,
  onRunCommand,
  terminalLogs = [],
  onClearLogs,
  latestExplanation,
  historySteps = [],
  currentStepIndex = 0,
  onGoToStep,
  onResetSession,
  isDark = true
}) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState('output'); // 'output' | 'files' | 'branches' | 'explanation' | 'timeline'
  const [isPlaying, setIsPlaying] = useState(false);

  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Playback timer for timeline
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < historySteps.length - 1) {
          onGoToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, historySteps.length, onGoToStep]);

  // Auto scroll output
  useEffect(() => {
    if (activeDetailTab === 'output') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeDetailTab]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.trim().length > 1) {
      const matches = ALL_COMMANDS.filter(cmd =>
        cmd.toLowerCase().startsWith(val.toLowerCase()) && cmd !== val
      ).slice(0, 3);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCurrentInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setInputVal(history[history.length - 1 - nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputVal(history[history.length - 1 - nextIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Tab') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setInputVal(suggestions[0]);
        setSuggestions([]);
      }
    }
  };

  const executeCurrentInput = () => {
    const cmd = inputVal.trim();
    if (!cmd) return;

    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');
    setSuggestions([]);

    if (onRunCommand) {
      onRunCommand(cmd);
    }
  };

  const handleRunPreset = (cmd) => {
    if (onRunCommand) onRunCommand(cmd);
  };

  const handleResolveConflict = (filename, choice) => {
    if (!onStateChange) return;
    const newState = resolveFileConflict(state, filename, choice);
    onStateChange(newState);
  };

  // State derivations
  const workingFiles = Object.entries(state?.workingDir?.files || {});
  const indexFiles = Object.entries(state?.index?.files || {});
  const branchList = Object.entries(state?.branches || {});
  const stashList = state?.stash || [];
  const isConflict = state?.mergeState?.inProgress;
  const activeBranch = state?.HEAD?.type === 'detached' 
    ? `detached (${state.HEAD.name.slice(0, 7)})` 
    : state?.HEAD?.name || 'main';

  const lastLog = terminalLogs.length > 0 ? terminalLogs[terminalLogs.length - 1] : null;

  return (
    <div className={`rounded-2xl border transition-colors duration-200 shadow-sm ${
      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
    }`}>
      {/* 1. Header with clear command input */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Terminal Input Bar */}
        <div>
          <label htmlFor="git-command-input" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Git Command Input
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1 flex items-stretch rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500 transition-all">
              <div className="px-3 py-2.5 sm:py-3 bg-zinc-100/90 dark:bg-zinc-800/80 border-r border-zinc-200 dark:border-zinc-750 flex items-center gap-1.5 font-mono text-xs select-none shrink-0">
                <span className="text-zinc-500 font-bold hidden xs:inline">git</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold max-w-[100px] sm:max-w-[150px] truncate">({activeBranch})</span>
                <span className="text-zinc-400 font-bold">$</span>
              </div>
              <input
                id="git-command-input"
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="git commit, branch, switch..."
                aria-label="Git command input"
                className="w-full px-3 py-2.5 sm:py-3 text-base sm:text-sm font-mono bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            <button
              onClick={executeCurrentInput}
              disabled={!inputVal.trim()}
              aria-label="Execute entered git command"
              className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-orange-600 text-white text-sm font-semibold transition-all shrink-0 shadow-xs flex items-center justify-center min-h-[44px]"
            >
              Run Command
            </button>
          </div>

          {/* Touch-Friendly Autocomplete Suggestions Pills */}
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 text-xs">
              <span className="text-zinc-400 text-[11px] font-sans">Tap to use:</span>
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInputVal(s);
                    setSuggestions([]);
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 border border-orange-500/20 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Common Action Buttons (Friendly for Beginners) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              One-Click Actions
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
            >
              {showAdvanced ? 'Show Fewer Actions ▴' : 'Show Advanced Commands (Rebase, Stash, Reset) ▾'}
            </button>
          </div>

          {/* Primary Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BEGINNER_ACTIONS.map(action => (
              <button
                key={action.cmd}
                onClick={() => handleRunPreset(action.cmd)}
                title={action.desc}
                className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                  isDark
                    ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200'
                    : 'bg-zinc-50/80 border-zinc-200 hover:border-zinc-300 hover:bg-white text-zinc-800 shadow-2xs'
                }`}
              >
                <span className="text-xs font-semibold block text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {action.label}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 truncate block mt-1">
                  {action.cmd}
                </span>
              </button>
            ))}
          </div>

          {/* Advanced Actions Grid (Expandable) */}
          {showAdvanced && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-850 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 animate-[fadeIn_0.15s_ease-out]">
              {ADVANCED_ACTIONS.map(action => (
                <button
                  key={action.cmd}
                  onClick={() => handleRunPreset(action.cmd)}
                  title={action.desc}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isDark
                      ? 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 text-zinc-300'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <span className="text-xs font-medium block text-zinc-900 dark:text-zinc-100">
                    {action.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 truncate block mt-0.5">
                    {action.cmd}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Educational Outcome Banner (Instant Feedback & Learning) */}
        {latestExplanation && (
          <div className={`p-4 rounded-xl border text-xs transition-colors ${
            lastLog?.error
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-zinc-800 dark:text-zinc-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${lastLog?.error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {latestExplanation.summary}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {latestExplanation.nextSuggestions?.length > 0 && (
                  <span className="text-[11px] text-zinc-500">Next suggested:</span>
                )}
                {latestExplanation.nextSuggestions?.slice(0, 2).map(s => (
                  <button
                    key={s}
                    onClick={() => handleRunPreset(s)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed font-sans mt-1">
              {latestExplanation.details}
            </p>
          </div>
        )}
      </div>

      {/* 4. Detailed Inspection Drawer */}
      <div className={`border-t transition-colors ${
        isDark ? 'border-zinc-800 bg-zinc-950/70' : 'border-zinc-200 bg-zinc-50/60'
      }`}>
        {/* Drawer Tabs Bar */}
        <div className="px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between overflow-x-auto text-xs font-medium">
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setActiveDetailTab('output'); setDetailsOpen(true); }}
              className={`py-3 border-b-2 transition-colors ${
                detailsOpen && activeDetailTab === 'output'
                  ? 'border-orange-600 text-zinc-900 dark:text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Terminal Logs {terminalLogs.length > 0 && `(${terminalLogs.length})`}
            </button>

            <button
              onClick={() => { setActiveDetailTab('files'); setDetailsOpen(true); }}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                detailsOpen && activeDetailTab === 'files'
                  ? 'border-orange-600 text-zinc-900 dark:text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>Files & Staging</span>
              {(workingFiles.length > 0 || indexFiles.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {workingFiles.length + indexFiles.length}
                </span>
              )}
              {isConflict && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Merge conflict active" />
              )}
            </button>

            <button
              onClick={() => { setActiveDetailTab('branches'); setDetailsOpen(true); }}
              className={`py-3 border-b-2 transition-colors ${
                detailsOpen && activeDetailTab === 'branches'
                  ? 'border-orange-600 text-zinc-900 dark:text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Branches ({branchList.length}) {stashList.length > 0 && `· ${stashList.length} stashed`}
            </button>

            {historySteps.length > 1 && (
              <button
                onClick={() => { setActiveDetailTab('timeline'); setDetailsOpen(true); }}
                className={`py-3 border-b-2 transition-colors ${
                  detailsOpen && activeDetailTab === 'timeline'
                    ? 'border-orange-600 text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                History ({currentStepIndex + 1}/{historySteps.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeDetailTab === 'output' && onClearLogs && terminalLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs py-1 transition-colors"
              >
                Clear output
              </button>
            )}
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium py-1 transition-colors"
            >
              {detailsOpen ? 'Hide drawer ▴' : 'Show drawer ▾'}
            </button>
          </div>
        </div>

        {/* Drawer Contents */}
        {detailsOpen && (
          <div className="p-4 sm:p-6 max-h-72 overflow-y-auto text-xs">
            {/* TAB: TERMINAL OUTPUT */}
            {activeDetailTab === 'output' && (
              <div className="space-y-3 font-mono">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-400 italic">No commands run yet.</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-zinc-400 text-xs flex items-center gap-2">
                        <span className="text-orange-600 dark:text-orange-400 font-bold">$</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">{log.command}</span>
                      </div>
                      {log.error ? (
                        <div className="pl-3 border-l-2 border-rose-500 text-rose-600 dark:text-rose-400 whitespace-pre-wrap py-0.5">
                          {log.error}
                        </div>
                      ) : log.output ? (
                        <div className="pl-3 border-l-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap py-0.5 leading-relaxed">
                          {renderAnsiText(log.output)}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            )}

            {/* TAB: WORKING FILES & STAGING */}
            {activeDetailTab === 'files' && (
              <div className="space-y-4 font-sans">
                {/* Conflict Banner */}
                {isConflict && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-rose-700 dark:text-rose-400">
                        Merge conflict detected!
                      </span>
                      <button
                        onClick={() => onRunCommand && onRunCommand('git merge --abort')}
                        className="px-3 py-1 rounded-lg text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
                      >
                        Abort Merge
                      </button>
                    </div>
                    <p className="text-xs text-rose-700/90 dark:text-rose-300/90">
                      Both branches modified the same files. Choose which version to keep, then run <code>git add .</code> and <code>git commit</code>.
                    </p>
                    {state?.mergeState?.conflictedFiles?.map(f => (
                      <div key={f} className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{f}</span>
                        <div className="flex gap-1.5 text-xs">
                          <button
                            onClick={() => handleResolveConflict(f, 'head')}
                            className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            Keep HEAD (Current)
                          </button>
                          <button
                            onClick={() => handleResolveConflict(f, 'incoming')}
                            className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-600 hover:text-white transition-colors"
                          >
                            Accept Incoming
                          </button>
                          <button
                            onClick={() => handleResolveConflict(f, 'both')}
                            className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white transition-colors"
                          >
                            Combine Both
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Staged Files (Index) */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                      <span>Staging Area / Index ({indexFiles.length})</span>
                      <span className="text-[11px] text-zinc-400 font-normal">Ready for next commit</span>
                    </h4>
                    {indexFiles.length === 0 ? (
                      <p className="text-zinc-400 italic text-xs">No files staged. Use <code>git add &lt;file&gt;</code> to stage files.</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {indexFiles.map(([fname, f]) => (
                          <div key={fname} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fname}</span>
                            <span className="text-zinc-400">{f.content?.length || 0} chars</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Working Directory */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                      <span>Working Directory ({workingFiles.length})</span>
                      <span className="text-[11px] text-zinc-400 font-normal">Files on simulated disk</span>
                    </h4>
                    {workingFiles.length === 0 ? (
                      <p className="text-zinc-400 italic text-xs">Working tree is clean.</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {workingFiles.map(([fname, f]) => (
                          <div key={fname} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
                            <span className="text-zinc-900 dark:text-zinc-100">{fname}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              f.status === 'modified' ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10' :
                              f.status === 'untracked' ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10' :
                              f.status === 'staged' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' :
                              'text-zinc-400'
                            }`}>
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BRANCHES & STASH */}
            {activeDetailTab === 'branches' && (
              <div className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local Branches */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">Local Branches</h4>
                    <div className="space-y-1 font-mono">
                      {branchList.map(([name, hash]) => {
                        const isCurrent = state?.HEAD?.type === 'branch' && state?.HEAD?.name === name;
                        return (
                          <div key={name} className={`p-2.5 rounded-lg border flex justify-between items-center ${
                            isCurrent 
                              ? 'border-orange-500/40 bg-orange-500/5 text-orange-600 dark:text-orange-400 font-bold' 
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {isCurrent && <span className="text-orange-500 font-bold">★ (current)</span>}
                              <span>{name}</span>
                            </div>
                            <span className="text-zinc-400 text-xs">{hash ? hash.slice(0, 7) : 'empty'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stash */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">Stash Stack ({stashList.length})</h4>
                      {stashList.length > 0 && (
                        <button
                          onClick={() => onRunCommand && onRunCommand('git stash pop')}
                          className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                        >
                          Pop latest
                        </button>
                      )}
                    </div>
                    {stashList.length === 0 ? (
                      <p className="text-zinc-400 italic text-xs">No stashes saved.</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {stashList.map((st, i) => (
                          <div key={i} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between">
                            <span className="text-zinc-900 dark:text-zinc-100">stash@&#123;{i}&#125;: {st.message}</span>
                            <span className="text-zinc-400">{st.branch}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeDetailTab === 'timeline' && historySteps.length > 1 && (
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Step {currentStepIndex + 1} of {historySteps.length}
                  </span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <button
                      onClick={() => onGoToStep(currentStepIndex - 1)}
                      disabled={currentStepIndex === 0}
                      className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-3.5 py-1 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-500 transition-colors"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => onGoToStep(currentStepIndex + 1)}
                      disabled={currentStepIndex === historySteps.length - 1}
                      className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Next
                    </button>
                    {onResetSession && (
                      <button
                        onClick={onResetSession}
                        className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-2"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto py-1 font-mono text-xs">
                  {historySteps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => onGoToStep(idx)}
                      className={`px-2.5 py-1 rounded-md border text-xs whitespace-nowrap transition-colors ${
                        idx === currentStepIndex
                          ? 'bg-orange-600 text-white border-orange-600 font-semibold'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {idx}: {step.command}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
