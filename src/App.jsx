import React, { useState, useEffect } from 'react';

const STAGES = [
  { id: 1, name: 'Stash', desc: 'Saved Uncommitted', color: 'text-fuchsia-500 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-300 dark:border-fuchsia-500/30', glow: 'shadow-fuchsia-500/20', accent: 'bg-fuchsia-500' },
  { id: 2, name: 'Workspace', desc: 'Working Directory', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-300 dark:border-orange-500/30', glow: 'shadow-orange-500/20', accent: 'bg-orange-500' },
  { id: 3, name: 'Staging', desc: 'Index / Next Commit', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-300 dark:border-emerald-500/30', glow: 'shadow-emerald-500/20', accent: 'bg-emerald-500' },
  { id: 4, name: 'Local Repo', desc: 'Local History (HEAD)', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-300 dark:border-cyan-500/30', glow: 'shadow-cyan-500/20', accent: 'bg-cyan-500' },
  { id: 5, name: 'Remote Repo', desc: 'GitHub / GitLab', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-300 dark:border-indigo-500/30', glow: 'shadow-indigo-500/20', accent: 'bg-indigo-500' }
];

const COMMANDS = [
  { id: 'status', cmd: 'git status', start: 2, end: 2, desc: 'Show the working tree status.', category: 'INSPECT' },
  { id: 'diff', cmd: 'git diff', start: 2, end: 3, desc: 'Show changes between commits, commit and working tree, etc.', category: 'INSPECT', bidirectional: true },
  { id: 'diff-staged', cmd: 'git diff --staged', start: 3, end: 4, desc: 'Show changes between the index and your last commit.', category: 'INSPECT', bidirectional: true },
  { id: 'log', cmd: 'git log', start: 4, end: 4, desc: 'Show commit logs.', category: 'INSPECT' },
  
  { id: 'add', cmd: 'git add <file>', start: 2, end: 3, desc: 'Add file contents to the index (Staging).', category: 'STAGE' },
  { id: 'add-u', cmd: 'git add -u', start: 2, end: 3, desc: 'Update tracked files in the index.', category: 'STAGE' },
  { id: 'rm', cmd: 'git rm', start: 2, end: 3, desc: 'Remove files from the working tree and from the index.', category: 'STAGE' },
  { id: 'mv', cmd: 'git mv', start: 2, end: 3, desc: 'Move or rename a file, a directory, or a symlink.', category: 'STAGE' },
  
  { id: 'commit', cmd: 'git commit', start: 3, end: 4, desc: 'Record changes to the repository.', category: 'COMMIT' },
  { id: 'commit-a', cmd: 'git commit -a', start: 2, end: 4, desc: 'Automatically stage modified/deleted files and commit.', category: 'COMMIT' },
  
  { id: 'restore', cmd: 'git restore', start: 3, end: 2, desc: 'Restore working tree files from the index.', category: 'UNDO' },
  { id: 'reset', cmd: 'git reset', start: 4, end: 3, desc: 'Reset current HEAD to the specified state, un-staging files.', category: 'UNDO' },
  { id: 'reset-hard', cmd: 'git reset --hard', start: 4, end: 2, desc: 'Reset index and working tree to match HEAD.', category: 'UNDO' },
  { id: 'revert', cmd: 'git revert', start: 4, end: 2, desc: 'Create a new commit that undoes changes from a previous commit.', category: 'UNDO' },
  
  { id: 'switch', cmd: 'git switch', start: 4, end: 2, desc: 'Switch branches, updating the working tree.', category: 'BRANCH' },
  { id: 'merge', cmd: 'git merge', start: 4, end: 2, desc: 'Join two or more development histories together.', category: 'BRANCH' },
  { id: 'rebase', cmd: 'git rebase', start: 4, end: 2, desc: 'Reapply commits on top of another base tip.', category: 'BRANCH' },
  
  { id: 'fetch', cmd: 'git fetch', start: 5, end: 4, desc: 'Download objects and refs from another repository.', category: 'SYNC' },
  { id: 'pull', cmd: 'git pull', start: 5, end: 2, desc: 'Fetch from and integrate with another repository or a local branch.', category: 'SYNC' },
  { id: 'push', cmd: 'git push', start: 4, end: 5, desc: 'Update remote refs along with associated objects.', category: 'SYNC' },
  { id: 'clone', cmd: 'git clone', start: 5, end: 2, desc: 'Clone a repository into a new directory.', category: 'SYNC' },
  
  { id: 'stash', cmd: 'git stash', start: 2, end: 1, desc: 'Stash the changes in a dirty working directory away.', category: 'STASH' },
  { id: 'stash-pop', cmd: 'git stash pop', start: 1, end: 2, desc: 'Remove a single stashed state from the stash list and apply it.', category: 'STASH' },
  { id: 'stash-apply', cmd: 'git stash apply', start: 1, end: 2, desc: 'Apply a single stashed state without removing it from the list.', category: 'STASH' },
];

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [hoveredCmd, setHoveredCmd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTerminalCmd, setActiveTerminalCmd] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState('');

  const categories = [...new Set(COMMANDS.map(c => c.category))];

  const handleCopy = (cmdStr) => {
    navigator.clipboard.writeText(cmdStr.replace('<file>', '.'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateTerminal = (cmd) => {
    setTerminalOutput('');
    setActiveTerminalCmd(cmd);
    
    const fullText = `Executing ${cmd.category} operation...\n> ${cmd.desc}\n\n[Process Completed Successfully]`;
    let i = 0;
    const typingInterval = setInterval(() => {
      setTerminalOutput(prev => prev + fullText.charAt(i));
      i++;
      if (i >= fullText.length) clearInterval(typingInterval);
    }, 15);
  };

  const handleCommandClick = (cmd) => {
    handleCopy(cmd.cmd);
    simulateTerminal(cmd);
  };

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.cmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const theme = {
    bg: isDark ? 'bg-slate-950' : 'bg-slate-50',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    panelBg: isDark ? 'bg-slate-900' : 'bg-white',
    panelBorder: isDark ? 'border-slate-800' : 'border-slate-300',
    mutedText: isDark ? 'text-slate-400' : 'text-slate-500',
    hoverLine: isDark ? 'bg-orange-500' : 'bg-orange-600',
    defaultLine: isDark ? 'bg-slate-700' : 'bg-slate-300',
    inputBg: isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900',
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 flex flex-col selection:bg-orange-500/30 ${theme.bg} ${theme.text}`}>
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header Panel */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme.panelBorder} ${isDark ? 'bg-slate-950/80' : 'bg-white/90'} px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black transform transition-transform hover:rotate-12 shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-none">Git Visualize</h1>
            <p className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-widest font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'} mt-0.5 sm:mt-1`}>Pro Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`relative hidden md:flex items-center ${theme.mutedText}`}>
            <svg className="w-4 h-4 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search commands..." 
              className={`pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono w-48 lg:w-64 ${theme.inputBg}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 shadow-sm'}`}
          >
            {isDark ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Mobile Search Bar */}
      <div className={`md:hidden px-4 py-3 border-b ${theme.panelBorder} ${theme.panelBg}`}>
        <div className={`relative flex items-center ${theme.mutedText}`}>
          <svg className="w-4 h-4 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search commands..." 
            className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono ${theme.inputBg}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile Swipe Indicator */}
      <div className="md:hidden flex items-center justify-center gap-2 text-orange-500 font-mono text-[10px] font-bold uppercase tracking-widest mt-4 mb-2 animate-pulse">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        Swipe to explore workflow
      </div>

      {/* Main Visualizer Area (Horizontally Scrollable) */}
      <main className="flex-1 p-4 sm:p-8 overflow-x-auto relative z-10 w-full flex justify-start md:justify-center items-start custom-scrollbar">
        <div className={`relative flex w-[900px] md:w-[1100px] shrink-0 rounded-2xl md:rounded-[2.5rem] border shadow-2xl p-6 md:p-10 overflow-hidden backdrop-blur-md ${theme.panelBg} ${theme.panelBorder}`}>
          
          {/* Background Stage Columns */}
          <div className="absolute inset-y-10 left-12 md:left-20 right-6 md:right-10 grid grid-cols-5 gap-3 md:gap-6 pointer-events-none opacity-40 dark:opacity-20">
            {STAGES.map(stage => (
              <div key={stage.id} className={`rounded-2xl md:rounded-3xl ${stage.bg} ${stage.border} border-2 h-full transition-colors shadow-inner`}></div>
            ))}
          </div>

          {/* Vertical Category Labels */}
          <div className="w-8 md:w-12 flex flex-col justify-start pt-24 md:pt-32 gap-10 md:gap-16 relative z-10 shrink-0">
            {categories.map((cat, i) => (
              <div key={i} className="relative h-28 md:h-32 flex items-center justify-center">
                <span className={`transform -rotate-90 whitespace-nowrap font-mono text-[8px] md:text-[10px] font-bold tracking-[0.2em] ${theme.mutedText} uppercase opacity-80`}>
                  {cat}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Content */}
          <div className="flex-1 relative z-20">
            
            {/* Stage Headers */}
            <div className="grid grid-cols-5 gap-3 md:gap-6 mb-8 md:mb-12">
              {STAGES.map(stage => (
                <div key={stage.id} className="text-center group cursor-default">
                  <div className={`inline-block px-2 md:px-4 py-1.5 rounded-full border mb-1 md:mb-2 backdrop-blur-sm ${isDark ? 'bg-slate-900/50' : 'bg-white/80'} ${stage.border} ${stage.color} font-black text-[10px] md:text-sm tracking-wide shadow-lg ${stage.glow}`}>
                    {stage.name}
                  </div>
                  <p className={`text-[8px] md:text-[10px] uppercase font-bold tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ${theme.mutedText}`}>{stage.desc}</p>
                </div>
              ))}
            </div>

            {/* Commands Flow Grid */}
            <div className="grid grid-cols-5 gap-y-6 md:gap-y-7 gap-x-3 md:gap-x-6 relative mt-4 md:mt-8 pb-8 md:pb-12">
              {filteredCommands.map((cmd) => {
                const isHovered = hoveredCmd === cmd.id;
                const isFaded = hoveredCmd !== null && hoveredCmd !== cmd.id;
                
                const colStart = Math.min(cmd.start, cmd.end);
                const colSpan = Math.abs(cmd.start - cmd.end) + 1;
                const isLtr = cmd.start < cmd.end;
                const isSameCol = cmd.start === cmd.end;
                
                const targetStage = STAGES.find(s => s.id === cmd.end);
                
                const lineColor = isHovered ? (isDark ? targetStage.accent : theme.hoverLine) : theme.defaultLine;
                const textColor = isHovered ? 'text-white scale-105 z-30 shadow-2xl' : `${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'}`;
                const bgPill = isHovered ? (isDark ? targetStage.accent : theme.hoverLine) : `${isDark ? 'bg-slate-950 border-slate-700 shadow-sm' : 'bg-white border-slate-300 shadow-sm'}`;

                return (
                  <div 
                    key={cmd.id}
                    onMouseEnter={() => setHoveredCmd(cmd.id)}
                    onMouseLeave={() => setHoveredCmd(null)}
                    onClick={() => handleCommandClick(cmd)}
                    style={{ gridColumn: `${colStart} / span ${colSpan}` }}
                    className={`relative flex items-center justify-center group cursor-pointer transition-all duration-300 h-8 ${isFaded ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}
                  >
                    {/* The Line & Arrow */}
                    {!isSameCol && (
                      <div className={`absolute inset-x-6 md:inset-x-12 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-colors duration-300 overflow-hidden ${lineColor}`}>
                        
                        {/* Glowing Data Flow Animation (Visible on hover) */}
                        {isHovered && (
                          <div className={`absolute top-0 w-24 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-90 ${isLtr ? 'animate-data-ltr' : 'animate-data-rtl'}`}></div>
                        )}

                        {/* Dot at Start */}
                        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-300 ${lineColor} ${isLtr ? '-left-1' : '-right-1'}`}></div>
                        
                        {/* Arrow Head at End */}
                        <svg className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isHovered ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : (isDark ? 'text-slate-600' : 'text-slate-400')} ${isLtr ? '-right-2' : '-left-2 rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                        
                        {/* Bi-directional arrow if needed */}
                        {cmd.bidirectional && (
                          <svg className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isHovered ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : (isDark ? 'text-slate-600' : 'text-slate-400')} ${isLtr ? '-left-2 rotate-180' : '-right-2'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Same column indicator (e.g. status, log) */}
                    {isSameCol && (
                      <div className={`absolute w-3 h-3 rounded-full border-2 transition-colors duration-300 ${isHovered ? `border-white ${targetStage.accent} shadow-[0_0_15px_rgba(255,255,255,0.5)]` : (isDark ? 'border-slate-600 bg-transparent' : 'border-slate-400 bg-white')}`}></div>
                    )}

                    {/* The Command Pill */}
                    <div className={`relative px-3 md:px-5 py-1.5 md:py-2 rounded-xl border text-[10px] md:text-xs font-mono font-bold whitespace-nowrap transition-all duration-300 z-10 ${bgPill} ${textColor} ${isHovered ? targetStage.glow : ''}`}>
                      <span className={`${isHovered ? 'opacity-100 text-white' : 'opacity-50'} transition-opacity mr-1`}>$</span>
                      {cmd.cmd}
                      
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 md:mb-4 w-48 md:w-64 p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-[60] pointer-events-none animate-[fadeIn_0.2s_ease-out]">
                          <p className="text-slate-200 text-[10px] md:text-xs font-sans font-normal leading-relaxed whitespace-normal text-center mb-2 md:mb-3">{cmd.desc}</p>
                          <div className="w-full h-px bg-slate-800 mb-2 md:mb-3"></div>
                          <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-orange-400 text-center flex items-center justify-center gap-1.5">
                            <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            Click to execute locally
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Terminal Dock (Mac Style) */}
      <div className={`border-t transition-all duration-500 ease-in-out relative z-30 ${theme.panelBorder} ${isDark ? 'bg-[#05060a]' : 'bg-slate-100'} ${activeTerminalCmd ? 'h-56 md:h-64' : 'h-14 md:h-16'}`}>
        <div className="max-w-4xl mx-auto p-3 md:p-4 flex flex-col h-full">
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-2 md:mr-4">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/90 shadow-inner"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/90 shadow-inner"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500/90 shadow-inner"></div>
              </div>
              <svg className={`hidden sm:block w-4 h-4 ${theme.mutedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className={`text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest ${theme.mutedText}`}>git-cli ~ zsh</span>
            </div>
            {activeTerminalCmd && (
              <button onClick={() => setActiveTerminalCmd(null)} className={`text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest ${theme.mutedText} hover:text-red-400 transition-colors px-2 py-1 md:px-3 md:py-1 rounded bg-slate-500/10`}>Kill Process</button>
            )}
          </div>
          
          {activeTerminalCmd ? (
            <div className="flex-1 mt-1 md:mt-2 rounded-xl bg-[#090b10] border border-slate-800 shadow-inner p-3 md:p-5 font-mono text-xs md:text-sm overflow-y-auto custom-scrollbar">
              <div className="text-slate-500 mb-2 truncate">dipesh@dev visualizer % <span className="text-slate-100 font-bold">{activeTerminalCmd.cmd.replace('<file>', '.')}</span></div>
              <div className="text-cyan-400 mb-3 whitespace-pre-wrap leading-relaxed border-l-2 border-orange-500 pl-3 md:pl-4 ml-1 bg-slate-900/30 py-2 md:py-3 rounded-r-lg">
                {terminalOutput}
                <span className="inline-block w-1.5 h-3 md:w-2 md:h-4 bg-slate-400 ml-1 animate-[pulse_1s_step-end_infinite] align-middle"></span>
              </div>
              {terminalOutput.includes('[Process Completed Successfully]') && (
                <div className="mt-3 md:mt-4 text-[10px] md:text-xs font-bold text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.5s_ease-out]">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Command ready to paste.
                </div>
              )}
            </div>
          ) : (
            <div className={`mt-auto text-[9px] md:text-[11px] font-mono font-bold ${theme.mutedText} text-center pb-1 opacity-70`}>Click a command bubble to execute.</div>
          )}
        </div>
      </div>

      {/* Copy Toast Notification */}
      <div className={`fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs md:text-sm shadow-2xl shadow-emerald-500/20 flex items-center gap-3 transition-all duration-500 z-[100] border border-emerald-400 ${copied ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div>
          <p className="font-black tracking-wide">Command Copied!</p>
          <p className="text-[8px] md:text-[10px] font-mono font-normal opacity-90 uppercase tracking-widest mt-0.5">Ready to paste</p>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className={`py-6 md:py-8 relative z-10 border-t ${theme.panelBorder} ${theme.panelBg}`}>
        <div className="flex flex-col items-center justify-center gap-2">
          <p className={`text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${theme.mutedText}`}>
            Architected & Engineered By
          </p>
          <a href="https://github.com/dszae" target="_blank" rel="noreferrer" className={`group flex items-center gap-2 text-xs md:text-sm font-black transition-colors ${isDark ? 'text-white hover:text-orange-400' : 'text-slate-900 hover:text-orange-600'}`}>
            <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            Dipesh Sapkota
          </a>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}