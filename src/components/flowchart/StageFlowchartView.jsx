import React, { useState } from 'react';

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

export default function StageFlowchartView({ onRunCommand, isDark = true }) {
  const [hoveredCmd, setHoveredCmd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const categories = [...new Set(COMMANDS.map(c => c.category))];

  const handleCommandClick = (cmd) => {
    const runnable = cmd.cmd.replace('<file>', '.');
    if (onRunCommand) {
      onRunCommand(runnable);
      setToastMessage(`Executed "${runnable}" in Sandbox!`);
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.cmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🗺️ Git 5-Stage Architecture Flowchart</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hover over any command to trace its directional data movement across Stash, Workspace, Index, Local Repo, and Remote Repo. Click to execute directly in the simulator!
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter flowchart commands..."
            className="px-4 py-2 pl-9 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 w-56 sm:w-64 placeholder:text-slate-500"
          />
          <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Main Visualizer Area (Horizontally Scrollable) */}
      <div className="overflow-x-auto custom-scrollbar flex justify-center py-4">
        <div className={`relative flex w-[940px] md:w-[1100px] shrink-0 rounded-3xl border shadow-2xl p-6 md:p-10 overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'}`}>
          
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
                <span className="transform -rotate-90 whitespace-nowrap font-mono text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase opacity-80">
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
                  <p className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400">{stage.desc}</p>
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
                const lineColor = isHovered ? (isDark ? targetStage.accent : 'bg-orange-500') : (isDark ? 'bg-slate-700' : 'bg-slate-300');
                const textColor = isHovered ? 'text-white scale-105 z-30 shadow-2xl' : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black');
                const bgPill = isHovered ? (isDark ? targetStage.accent : 'bg-orange-500 text-white') : (isDark ? 'bg-slate-950 border-slate-700 shadow-sm' : 'bg-white border-slate-300 shadow-sm');

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
                        {/* Glowing Data Flow Animation */}
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

                    {/* Same column indicator */}
                    {isSameCol && (
                      <div className={`absolute w-3 h-3 rounded-full border-2 transition-colors duration-300 ${isHovered ? `border-white ${targetStage.accent} shadow-[0_0_15px_rgba(255,255,255,0.5)]` : (isDark ? 'border-slate-600 bg-transparent' : 'border-slate-400 bg-white')}`}></div>
                    )}

                    {/* Command Pill */}
                    <div className={`relative px-3 md:px-5 py-1.5 md:py-2 rounded-xl border text-[10px] md:text-xs font-mono font-bold whitespace-nowrap transition-all duration-300 z-10 ${bgPill} ${textColor} ${isHovered ? targetStage.glow : ''}`}>
                      <span className={`${isHovered ? 'opacity-100 text-white' : 'opacity-50'} transition-opacity mr-1`}>$</span>
                      {cmd.cmd}
                      
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 md:mb-4 w-52 md:w-64 p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-[60] pointer-events-none animate-[fadeIn_0.15s_ease-out]">
                          <p className="text-slate-200 text-[10px] md:text-xs font-sans font-normal leading-relaxed whitespace-normal text-center mb-2">{cmd.desc}</p>
                          <div className="w-full h-px bg-slate-800 mb-2"></div>
                          <div className="text-[9px] font-mono uppercase tracking-widest text-orange-400 text-center flex items-center justify-center gap-1.5 font-bold">
                            Click to run in Sandbox
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-mono text-xs font-bold shadow-xl animate-[fadeIn_0.2s_ease-out] z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

