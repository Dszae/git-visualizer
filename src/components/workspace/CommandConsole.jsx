import React, { useState, useRef, useEffect } from 'react';
import { resolveFileConflict } from '../../engine/gitEngine.js';

const PRIMARY_COMMANDS = [
  'git status',
  'git add .',
  'git commit -m "update"',
  'git branch feature',
  'git switch feature',
  'git merge feature'
];

const SECONDARY_COMMANDS = [
  'git rebase main',
  'git stash',
  'git stash pop',
  'git reset --soft HEAD~1',
  'git reset --hard HEAD~1',
  'git revert HEAD',
  'git tag v1.0.0',
  'git log --oneline',
  'git diff',
  'git diff --staged'
];

const AUTOCOMPLETE_LIST = [...PRIMARY_COMMANDS, ...SECONDARY_COMMANDS];

function renderAnsiText(text) {
  if (!text) return null;
  // oxlint-disable-next-line no-control-regex
  /* eslint-disable-next-line no-control-regex */
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentColor = '';

  return parts.map((part, idx) => {
    if (part.startsWith('\x1b[')) {
      if (part === '\x1b[0m') currentColor = '';
      else if (part === '\x1b[32m') currentColor = 'text-emerald-400 font-medium';
      else if (part === '\x1b[31m') currentColor = 'text-rose-400 font-medium';
      else if (part === '\x1b[33m') currentColor = 'text-amber-400 font-medium';
      else if (part === '\x1b[36m') currentColor = 'text-cyan-400 font-medium';
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
  const [showMoreCommands, setShowMoreCommands] = useState(false);
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

  // Scroll to bottom of terminal output
  useEffect(() => {
    if (activeDetailTab === 'output') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeDetailTab]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.trim().length > 1) {
      const matches = AUTOCOMPLETE_LIST.filter(cmd =>
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

  const handleQuickRun = (cmd) => {
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
    <div className={`rounded-xl border transition-colors duration-200 ${
      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
    }`}>
      {/* 1. Main Command Input Bar */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 select-none hidden sm:flex shrink-0">
            <span className="text-zinc-500">git</span>
            <span className="text-zinc-600">({activeBranch})</span>
            <span className="text-orange-500 font-bold">$</span>
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter a git command (e.g. git commit, git branch, git status)..."
              aria-label="Git command input"
              className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700/80 text-white placeholder:text-zinc-500' 
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
              }`}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {/* Tab Autocomplete Inline Pill */}
            {suggestions.length > 0 && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span className="text-xs font-mono text-zinc-400 hidden md:inline">Tab to complete:</span>
                <span className="text-xs font-mono font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                  {suggestions[0]}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={executeCurrentInput}
            disabled={!inputVal.trim()}
            aria-label="Run command"
            className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white text-sm font-medium transition-colors shrink-0"
          >
            Run
          </button>
        </div>

        {/* 2. Primary Quick Commands & More Toggle */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium mr-1 text-xs">Suggested:</span>
          {PRIMARY_COMMANDS.map(cmd => (
            <button
              key={cmd}
              onClick={() => handleQuickRun(cmd)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:border-zinc-300'
              }`}
            >
              {cmd}
            </button>
          ))}

          <button
            onClick={() => setShowMoreCommands(!showMoreCommands)}
            aria-expanded={showMoreCommands}
            className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ml-1 font-medium"
          >
            {showMoreCommands ? 'Fewer commands ▴' : 'More commands ▾'}
          </button>
        </div>

        {/* Expandable Secondary Commands */}
        {showMoreCommands && (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-850 flex flex-wrap items-center gap-1.5 text-xs animate-[fadeIn_0.1s_ease-out]">
            {SECONDARY_COMMANDS.map(cmd => (
              <button
                key={cmd}
                onClick={() => handleQuickRun(cmd)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors ${
                  isDark 
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        {/* 3. Immediate Feedback Strip (Latest Status) */}
        {lastLog && (
          <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-zinc-100 dark:border-zinc-850">
            <div className="flex items-center gap-2 truncate">
              {lastLog.error ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium truncate">
                    {lastLog.error.split('\n')[0]}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-zinc-600 dark:text-zinc-300 truncate">
                    {latestExplanation?.summary || lastLog.output?.split('\n')[0] || `Executed ${lastLog.command}`}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium shrink-0 ml-2"
            >
              {detailsOpen ? 'Hide details ▴' : 'Show details ▾'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Expandable Details Drawer */}
      {detailsOpen && (
        <div className={`border-t transition-colors ${
          isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50/50'
        }`}>
          {/* Drawer Tabs */}
          <div className="px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between overflow-x-auto text-xs font-medium">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveDetailTab('output')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeDetailTab === 'output'
                    ? 'border-orange-500 text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                Output {terminalLogs.length > 0 && `(${terminalLogs.length})`}
              </button>

              <button
                onClick={() => setActiveDetailTab('files')}
                className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeDetailTab === 'files'
                    ? 'border-orange-500 text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <span>Files</span>
                {(workingFiles.length > 0 || indexFiles.length > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {workingFiles.length + indexFiles.length}
                  </span>
                )}
                {isConflict && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Conflict in progress"></span>
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab('branches')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeDetailTab === 'branches'
                    ? 'border-orange-500 text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                Branches & Stash {stashList.length > 0 && `(${stashList.length} stashed)`}
              </button>

              <button
                onClick={() => setActiveDetailTab('explanation')}
                className={`py-2.5 border-b-2 transition-colors ${
                  activeDetailTab === 'explanation'
                    ? 'border-orange-500 text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                Explanation
              </button>

              {historySteps.length > 1 && (
                <button
                  onClick={() => setActiveDetailTab('timeline')}
                  className={`py-2.5 border-b-2 transition-colors ${
                    activeDetailTab === 'timeline'
                      ? 'border-orange-500 text-zinc-900 dark:text-white font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  Timeline ({currentStepIndex + 1}/{historySteps.length})
                </button>
              )}
            </div>

            {activeDetailTab === 'output' && onClearLogs && terminalLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs py-1"
              >
                Clear output
              </button>
            )}
          </div>

          {/* Drawer Content */}
          <div className="p-4 max-h-64 overflow-y-auto text-xs">
            {/* TAB: TERMINAL OUTPUT */}
            {activeDetailTab === 'output' && (
              <div className="space-y-3 font-mono">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-400 italic">No output yet. Run a command above to see results.</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-zinc-400 text-xs flex items-center gap-2">
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">$</span>
                        <span className="text-zinc-800 dark:text-zinc-100 font-bold">{log.command}</span>
                      </div>
                      {log.error ? (
                        <div className="pl-3 border-l-2 border-rose-500 text-rose-500 dark:text-rose-400 whitespace-pre-wrap py-0.5">
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
              <div className="space-y-3 font-sans">
                {/* Conflict Banner */}
                {isConflict && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                        Merge conflict in progress
                      </span>
                      <button
                        onClick={() => onRunCommand && onRunCommand('git merge --abort')}
                        className="px-2 py-0.5 rounded text-xs bg-rose-600 text-white font-medium"
                      >
                        Abort merge
                      </button>
                    </div>
                    {state?.mergeState?.conflictedFiles?.map(f => (
                      <div key={f} className="p-2 rounded bg-white dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">{f}</span>
                        <div className="flex gap-1.5 text-xs">
                          <button
                            onClick={() => handleResolveConflict(f, 'head')}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            Keep HEAD
                          </button>
                          <button
                            onClick={() => handleResolveConflict(f, 'incoming')}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-600 hover:text-white transition-colors"
                          >
                            Accept incoming
                          </button>
                          <button
                            onClick={() => handleResolveConflict(f, 'both')}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white transition-colors"
                          >
                            Combine both
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Staged Files */}
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 mb-2">
                      Staged for commit ({indexFiles.length})
                    </h4>
                    {indexFiles.length === 0 ? (
                      <p className="text-zinc-400 italic text-xs">No files staged. Use <code className="font-mono">git add</code> to stage changes.</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {indexFiles.map(([fname, f]) => (
                          <div key={fname} className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400">{fname}</span>
                            <span className="text-zinc-400">{f.content?.length || 0} chars</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Working Directory */}
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 mb-2">
                      Working Directory ({workingFiles.length})
                    </h4>
                    {workingFiles.length === 0 ? (
                      <p className="text-zinc-400 italic text-xs">Working directory is clean.</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {workingFiles.map(([fname, f]) => (
                          <div key={fname} className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between">
                            <span className="text-zinc-800 dark:text-zinc-200">{fname}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                              f.status === 'modified' ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' :
                              f.status === 'untracked' ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                              f.status === 'staged' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' :
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                  {/* Local Branches */}
                  <div>
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Local Branches</h4>
                    <div className="space-y-1 font-mono">
                      {branchList.map(([name, hash]) => {
                        const isCurrent = state?.HEAD?.type === 'branch' && state?.HEAD?.name === name;
                        return (
                          <div key={name} className={`p-2 rounded border flex justify-between items-center ${
                            isCurrent 
                              ? 'border-orange-500/40 bg-orange-500/5 text-orange-600 dark:text-orange-400 font-bold' 
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                          }`}>
                            <span>{isCurrent ? '★ ' : ''}{name}</span>
                            <span className="text-zinc-400 text-xs">{hash ? hash.slice(0, 7) : 'empty'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stash */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Stash ({stashList.length})</h4>
                      {stashList.length > 0 && (
                        <button
                          onClick={() => onRunCommand && onRunCommand('git stash pop')}
                          className="text-xs text-orange-600 dark:text-orange-400 font-medium"
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
                          <div key={i} className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between">
                            <span className="text-zinc-800 dark:text-zinc-200">stash@&#123;{i}&#125;: {st.message}</span>
                            <span className="text-zinc-400">{st.branch}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EXPLANATION */}
            {activeDetailTab === 'explanation' && (
              <div className="space-y-2 font-sans text-xs">
                {latestExplanation ? (
                  <>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {latestExplanation.summary}
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {latestExplanation.details}
                    </p>

                    {latestExplanation.changes?.length > 0 && (
                      <div className="pt-2">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Changes made:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                          {latestExplanation.changes.map((c, i) => (
                            <li key={i}>{c.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-zinc-400 italic">Run any Git command to see its conceptual explanation.</p>
                )}
              </div>
            )}

            {/* TAB: HISTORY TIMELINE */}
            {activeDetailTab === 'timeline' && historySteps.length > 1 && (
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Step {currentStepIndex + 1} of {historySteps.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <button
                      onClick={() => onGoToStep(currentStepIndex - 1)}
                      disabled={currentStepIndex === 0}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-3 py-1 rounded bg-orange-600 text-white font-medium hover:bg-orange-500"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => onGoToStep(currentStepIndex + 1)}
                      disabled={currentStepIndex === historySteps.length - 1}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Next
                    </button>
                    {onResetSession && (
                      <button
                        onClick={onResetSession}
                        className="px-2.5 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-2"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto py-1 font-mono text-xs">
                  {historySteps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => onGoToStep(idx)}
                      className={`px-2 py-1 rounded border text-xs whitespace-nowrap transition-colors ${
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
        </div>
      )}
    </div>
  );
}

