import React, { useState } from 'react';

const STAGES = [
  { id: 1, name: 'Stash', desc: 'Saved Uncommitted', color: 'text-fuchsia-700 dark:text-fuchsia-300', bg: 'bg-fuchsia-500/5', border: 'border-fuchsia-200 dark:border-fuchsia-500/20', accent: 'bg-fuchsia-600' },
  { id: 2, name: 'Workspace', desc: 'Working Directory', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500/5', border: 'border-orange-200 dark:border-orange-500/20', accent: 'bg-orange-600' },
  { id: 3, name: 'Staging', desc: 'Index / Next Commit', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/5', border: 'border-emerald-200 dark:border-emerald-500/20', accent: 'bg-emerald-600' },
  { id: 4, name: 'Local Repo', desc: 'Local History (HEAD)', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-500/5', border: 'border-cyan-200 dark:border-cyan-500/20', accent: 'bg-cyan-600' },
  { id: 5, name: 'Remote Repo', desc: 'GitHub / GitLab', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-500/5', border: 'border-indigo-200 dark:border-indigo-500/20', accent: 'bg-indigo-600' }
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

  const filteredCommands = COMMANDS.filter(c => 
    c.cmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCommandClick = (cmd) => {
    if (onRunCommand) {
      let runStr = cmd.cmd;
      if (runStr.includes('<file>')) runStr = 'git add .';
      onRunCommand(runStr);
      setToastMessage(`Executed: ${runStr}`);
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            How Git Works
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Directional data flow across Stash, Workspace, Staging Area, Local Repository, and Remote.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter commands..."
            aria-label="Filter flowchart commands"
            className={`px-3 py-2 sm:py-1.5 pl-8 rounded-lg text-base sm:text-xs font-mono border transition-all w-full sm:w-52 min-h-[40px] sm:min-h-0 ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500' 
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
          <svg className="w-3.5 h-3.5 absolute left-2.5 top-3 sm:top-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="space-y-2">
        <div className="sm:hidden text-[11px] text-zinc-400 font-sans flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1">
            <span>Swipe horizontally across all 5 Git stages (Stash / Workspace / Staging / Local / Remote)</span>
            <svg aria-hidden="true" className="w-3 h-3 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
        <div className="overflow-x-auto flex justify-start sm:justify-center py-2 no-scrollbar">
          <div className={`relative flex w-[900px] md:w-[1000px] shrink-0 rounded-xl border p-6 md:p-8 overflow-hidden ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
          
          {/* Background Columns */}
          <div className="absolute inset-y-8 left-14 right-8 grid grid-cols-5 gap-3 pointer-events-none opacity-40">
            {STAGES.map(stage => (
              <div key={stage.id} className={`rounded-lg ${stage.bg} ${stage.border} border h-full`}></div>
            ))}
          </div>

          {/* Vertical Category Labels */}
          <div className="w-8 flex flex-col justify-start pt-24 gap-12 relative z-10 shrink-0">
            {categories.map((cat, i) => (
              <div key={i} className="relative h-24 flex items-center justify-center">
                <span className="transform -rotate-90 whitespace-nowrap font-mono text-[10px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  {cat}
                </span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 relative z-20">
            {/* Stage Headers */}
            <div className="grid grid-cols-5 gap-3 mb-8">
              {STAGES.map(stage => (
                <div key={stage.id} className="text-center cursor-default">
                  <div className={`inline-block px-3 py-1 rounded-md border mb-1 bg-white dark:bg-zinc-900 ${stage.border} ${stage.color} font-bold text-xs tracking-wide`}>
                    {stage.name}
                  </div>
                  <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">{stage.desc}</p>
                </div>
              ))}
            </div>

            {/* Commands Flow Grid */}
            <div className="grid grid-cols-5 gap-y-5 gap-x-3 relative mt-4 pb-6">
              {filteredCommands.map((cmd) => {
                const isHovered = hoveredCmd === cmd.id;
                const isFaded = hoveredCmd !== null && hoveredCmd !== cmd.id;
                
                const colStart = Math.min(cmd.start, cmd.end);
                const colSpan = Math.abs(cmd.start - cmd.end) + 1;
                const isLtr = cmd.start < cmd.end;
                const isSameCol = cmd.start === cmd.end;
                
                const targetStage = STAGES.find(s => s.id === cmd.end);
                const lineColor = isHovered ? (isDark ? targetStage.accent : 'bg-orange-600') : (isDark ? 'bg-zinc-800' : 'bg-zinc-300');
                const textColor = isHovered 
                  ? 'text-white' 
                  : (isDark ? 'text-zinc-200 hover:text-white' : 'text-zinc-800 hover:text-black');
                const bgPill = isHovered 
                  ? (isDark ? targetStage.accent : 'bg-orange-600 text-white') 
                  : (isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300');

                return (
                  <div 
                    key={cmd.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Run ${cmd.cmd}: ${cmd.desc}`}
                    onMouseEnter={() => setHoveredCmd(cmd.id)}
                    onMouseLeave={() => setHoveredCmd(null)}
                    onFocus={() => setHoveredCmd(cmd.id)}
                    onBlur={() => setHoveredCmd(null)}
                    onClick={() => handleCommandClick(cmd)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCommandClick(cmd);
                      }
                    }}
                    style={{ gridColumn: `${colStart} / span ${colSpan}` }}
                    className={`relative flex items-center justify-center group cursor-pointer transition-all duration-200 h-8 rounded-lg focus:outline-none ${isFaded ? 'opacity-20' : 'opacity-100'}`}
                  >
                    {/* The Line & Arrow */}
                    {!isSameCol && (
                      <div className="absolute inset-x-0 h-0.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className={`w-full h-full transition-colors duration-200 ${lineColor}`}></div>
                        
                        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-200 ${lineColor} ${isLtr ? '-left-1' : '-right-1'}`}></div>
                        
                        <svg aria-hidden="true" className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${isHovered ? 'text-white' : (isDark ? 'text-zinc-600' : 'text-zinc-400')} ${isLtr ? '-right-1.5' : '-left-1.5 rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                        
                        {cmd.bidirectional && (
                          <svg aria-hidden="true" className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${isHovered ? 'text-white' : (isDark ? 'text-zinc-600' : 'text-zinc-400')} ${isLtr ? '-left-1.5 rotate-180' : '-right-1.5'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Command Pill */}
                    <div className={`relative px-3 py-1 rounded-md border text-xs font-mono font-medium whitespace-nowrap transition-colors z-10 ${bgPill} ${textColor}`}>
                      <span className="opacity-70 mr-1">$</span>
                      {cmd.cmd}
                      
                      {/* Tooltip on Hover/Focus */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl z-50 pointer-events-none text-zinc-900 dark:text-zinc-100">
                          <p className="text-xs font-sans leading-relaxed text-center mb-1.5 text-zinc-700 dark:text-zinc-300">{cmd.desc}</p>
                          <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400 text-center font-medium">
                            Click or Enter to run
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
    </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-xs font-medium shadow-md z-50 animate-[fadeIn_0.15s_ease-out]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
