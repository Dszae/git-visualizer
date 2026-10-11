import React, { useState, useRef, useEffect } from 'react';

// Common command suggestions for autocomplete and quick-access
const COMMON_COMMANDS = [
  'git status',
  'git add .',
  'git commit -m "feat: new feature"',
  'git log --oneline',
  'git diff',
  'git branch feature',
  'git switch feature',
  'git switch -c feature/auth',
  'git merge feature',
  'git rebase main',
  'git stash',
  'git stash pop',
  'git stash list',
  'git restore --staged <file>',
  'git reset --soft HEAD~1',
  'git reset --mixed HEAD~1',
  'git reset --hard HEAD~1',
  'git revert HEAD',
  'git reflog',
  'git fetch',
  'git push',
  'git pull',
  'git tag v1.0.0'
];

/**
 * Converts terminal ANSI escape codes (\x1b[32m etc.) to clean React elements or HTML
 */
function renderAnsiText(text) {
  if (!text) return null;

  // Split by ANSI codes
  // oxlint-disable-next-line no-control-regex
  /* eslint-disable-next-line no-control-regex */
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentColor = '';

  return parts.map((part, idx) => {
    if (part.startsWith('\x1b[')) {
      if (part === '\x1b[0m') {
        currentColor = '';
      } else if (part === '\x1b[32m') {
        currentColor = 'text-emerald-400 font-semibold';
      } else if (part === '\x1b[31m') {
        currentColor = 'text-rose-400 font-semibold';
      } else if (part === '\x1b[33m') {
        currentColor = 'text-amber-400 font-semibold';
      } else if (part === '\x1b[36m') {
        currentColor = 'text-cyan-400 font-semibold';
      }
      return null;
    }
    return (
      <span key={idx} className={currentColor}>
        {part}
      </span>
    );
  }).filter(Boolean);
}

export default function Terminal({
  onRunCommand,
  activeBranch = 'main',
  isDetached = false,
  detachedHash = '',
  terminalLogs = [],
  onClearLogs,
  isDark = true,
  suggestedCommands = []
}) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);

  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Auto-scroll to latest output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Handle autocomplete matching
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.trim().length > 1) {
      const matches = COMMON_COMMANDS.filter(cmd => 
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

  const handleSuggestionClick = (cmd) => {
    setInputVal(cmd);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleQuickRun = (cmd) => {
    if (onRunCommand) onRunCommand(cmd);
  };

  const promptBranch = isDetached 
    ? `HEAD:${detachedHash.slice(0, 7)}` 
    : activeBranch;

  return (
    <section 
      aria-label="Interactive Git Command Terminal"
      className={`rounded-2xl border flex flex-col h-[400px] sm:h-[460px] overflow-hidden shadow-xl transition-colors duration-300 ${isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'}`}
    >
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          {/* Mac style dots */}
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm inline-block"></span>
          </div>
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            git-cli — interactive terminal
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              aria-label="Clear terminal output"
              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
            >
              Clear Output
            </button>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
            {promptBranch}
          </span>
        </div>
      </div>

      {/* Suggested Quick Command Chips */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono custom-scrollbar">
        <span className="text-slate-400 text-[10px] shrink-0 uppercase tracking-widest font-bold mr-1">Quick:</span>
        {(suggestedCommands.length > 0 ? suggestedCommands : ['git status', 'git add .', 'git commit -m "update"', 'git log --oneline', 'git branch feature', 'git switch feature', 'git merge feature']).map(cmd => (
          <button
            key={cmd}
            onClick={() => handleQuickRun(cmd)}
            className="px-2 py-0.5 rounded-md bg-slate-800/70 hover:bg-orange-500 hover:text-white text-slate-300 border border-slate-700/60 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div 
        tabIndex={0}
        aria-live="polite"
        aria-atomic="false"
        className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs text-slate-200 custom-scrollbar select-text focus:outline-none focus:ring-1 focus:ring-orange-500/50"
      >
        {terminalLogs.length === 0 ? (
          <div className="text-slate-400 py-6 text-center italic text-xs">
            <p>Git sandbox ready. Type any supported command below (e.g. <span className="text-orange-400">git status</span>) or click a quick command chip above.</p>
          </div>
        ) : (
          terminalLogs.map((log, idx) => (
            <div key={idx} className="space-y-1">
              {/* Command Prompt Line */}
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="text-emerald-400 font-bold">user@git-visualizer</span>
                <span className="text-slate-600">:</span>
                <span className="text-cyan-400 font-semibold">repo ({log.branch || promptBranch})</span>
                <span className="text-slate-300 font-bold">$</span>
                <span className="text-white font-bold">{log.command}</span>
              </div>

              {/* Output or Error */}
              {log.error ? (
                <div className="pl-4 border-l-2 border-rose-500 text-rose-400 whitespace-pre-wrap leading-relaxed py-1 bg-rose-500/10 rounded-r-lg">
                  {log.error}
                </div>
              ) : log.output ? (
                <div className="pl-4 border-l-2 border-orange-500/80 text-slate-300 whitespace-pre-wrap leading-relaxed py-1 bg-slate-900/40 rounded-r-lg">
                  {renderAnsiText(log.output)}
                </div>
              ) : null}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Autocomplete Hints Dropdown (if any) */}
      {suggestions.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 text-[11px] font-mono text-slate-400 animate-[fadeIn_0.1s_ease-out]">
          <span className="text-orange-400 font-bold">Tab to complete:</span>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleSuggestionClick(s)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Command Input Box */}
      <div className="p-3 bg-[#0d1322] border-t border-slate-800 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono shrink-0 select-none">
          <span className="text-emerald-400 font-bold hidden sm:inline">user@git</span>
          <span className="text-cyan-400 font-bold">({promptBranch})</span>
          <span className="text-orange-400 font-bold">$</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter git command (e.g. git status, git commit -m 'feat')..."
          aria-label="Git command input"
          className="flex-1 bg-slate-950/80 text-white font-mono text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-400"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          onClick={executeCurrentInput}
          aria-label="Run git command"
          disabled={!inputVal.trim()}
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-mono text-xs font-bold transition-all shadow-md shadow-orange-600/20 shrink-0 focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          Run
        </button>
      </div>
    </section>
  );
}
