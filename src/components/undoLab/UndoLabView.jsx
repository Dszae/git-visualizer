import React, { useState } from 'react';

const UNDO_METHODS = [
  {
    id: 'git-restore',
    name: 'git restore <file>',
    type: 'Working Tree Undo',
    safety: 'Caution',
    safetyColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    description: 'Discards unstaged modifications in the working directory, restoring file to match index/HEAD.',
    workingTree: '❌ Discards unstaged edits permanently',
    index: '🔒 Unchanged',
    headBranch: '🔒 Unchanged',
    history: '🔒 Preserved (no new commit)',
    warning: 'Destructive for unstaged edits! Any edits you made in the working tree that were never staged will be lost forever.',
    sandboxCmd: 'git restore index.js'
  },
  {
    id: 'git-restore-staged',
    name: 'git restore --staged <file>',
    type: 'Unstage from Index',
    safety: 'Safe',
    safetyColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Unstages a file from the Index back to the working directory without losing any edits.',
    workingTree: '🔒 Preserves your edits in working directory',
    index: '✓ Clears staged version back to HEAD',
    headBranch: '🔒 Unchanged',
    history: '🔒 Preserved',
    warning: null,
    sandboxCmd: 'git restore --staged index.js'
  },
  {
    id: 'git-reset-soft',
    name: 'git reset --soft HEAD~1',
    type: 'Undo Commit (Keep Staged)',
    safety: 'Safe',
    safetyColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Moves branch pointer back by 1 commit. Leaves all changes staged in the Index ready to re-commit.',
    workingTree: '🔒 Completely preserved',
    index: '✓ Changes remain staged in index',
    headBranch: '✓ Moves back to HEAD~1',
    history: 'Rewrites branch tip (reflog keeps old hash)',
    warning: 'Safe locally. If the commit was already pushed to a shared remote, rewriting the branch tip can cause sync issues for teammates.',
    sandboxCmd: 'git reset --soft HEAD~1'
  },
  {
    id: 'git-reset-mixed',
    name: 'git reset [--mixed] HEAD~1',
    type: 'Undo Commit (Keep Unstaged)',
    safety: 'Safe',
    safetyColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Moves branch pointer back and un-stages files from Index. All changes are kept as unstaged files in your working directory.',
    workingTree: '🔒 Preserved as unstaged files',
    index: '✓ Reset to match HEAD~1',
    headBranch: '✓ Moves back to HEAD~1',
    history: 'Rewrites branch tip',
    warning: 'Your changes are not lost; they are sitting unstaged in your working directory.',
    sandboxCmd: 'git reset HEAD~1'
  },
  {
    id: 'git-reset-hard',
    name: 'git reset --hard HEAD~1',
    type: 'Nuclear Reset',
    safety: 'Destructive',
    safetyColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    description: 'Moves branch pointer back AND forcibly overwrites both Index and Working Directory to match HEAD~1.',
    workingTree: '🚨 DISCARDED PERMANENTLY',
    index: '🚨 DISCARDED PERMANENTLY',
    headBranch: '✓ Moves back to HEAD~1',
    history: 'Rewrites branch tip',
    warning: '⚠️ HIGH RISK: All uncommitted modifications in your working directory and staging area will be permanently destroyed without recovery! Committed work can only be recovered via reflog.',
    sandboxCmd: 'git reset --hard HEAD~1'
  },
  {
    id: 'git-revert',
    name: 'git revert <commit>',
    type: 'Safe Public History Undo',
    safety: 'Safest',
    safetyColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    description: 'Creates a brand-new commit that inverts the changes of the target commit. Does not delete or rewrite past history.',
    workingTree: '✓ Updated with inverse diff',
    index: '✓ Committed cleanly',
    headBranch: '✓ Advances forward to new revert commit',
    history: '🔒 FULLY PRESERVED (adds new commit)',
    warning: 'The recommended way to undo work on shared/team branches because it does not alter past commit hashes.',
    sandboxCmd: 'git revert HEAD'
  },
  {
    id: 'git-reflog',
    name: 'git reflog & recovery',
    type: 'Emergency Recovery Net',
    safety: 'Safe',
    safetyColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Logs every HEAD position visited. Allows recovering "lost" commits after accidental reset or branch deletion.',
    workingTree: '🔒 Read-only inspection',
    index: '🔒 Unchanged',
    headBranch: '🔒 Unchanged',
    history: 'Reveals all previous commit hashes',
    warning: 'Reflog entries are local only and expire after 90 days by default.',
    sandboxCmd: 'git reflog'
  }
];

export default function UndoLabView({ onRunCommand, isDark = true }) {
  const [selectedMethod, setSelectedMethod] = useState(UNDO_METHODS[2]); // default to reset --soft

  return (
    <div className={`p-4 sm:p-6 max-w-6xl mx-auto space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <span>🛡️ Safe Undo & Recovery Laboratory</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Git provides multiple ways to undo changes. Understanding exactly which areas of your repository are affected (Working Tree, Index, or History) prevents catastrophic data loss.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 custom-scrollbar">
        <table className="w-full text-left text-xs font-mono border-collapse" aria-label="Git Undo operations comparison table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[11px]">
              <th className="py-3 px-4 font-bold">Command</th>
              <th className="py-3 px-3 font-bold">Safety</th>
              <th className="py-3 px-3 font-bold">Working Directory</th>
              <th className="py-3 px-3 font-bold">Index (Staging)</th>
              <th className="py-3 px-3 font-bold">HEAD / Branch</th>
              <th className="py-3 px-3 font-bold">Commit History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {UNDO_METHODS.map((method) => {
              const isSelected = selectedMethod.id === method.id;
              return (
                <tr 
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-orange-500/10' : 'hover:bg-slate-800/40'}`}
                >
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {method.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${method.safetyColor}`}>
                      {method.safety}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] whitespace-nowrap">{method.workingTree}</td>
                  <td className="py-3 px-3 text-[11px] whitespace-nowrap">{method.index}</td>
                  <td className="py-3 px-3 text-[11px] whitespace-nowrap">{method.headBranch}</td>
                  <td className="py-3 px-3 text-[11px] whitespace-nowrap">{method.history}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Method Deep-Dive Panel */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${selectedMethod.safetyColor}`}>
              {selectedMethod.safety}
            </span>
            <h3 className="text-lg font-bold text-white font-mono">{selectedMethod.name}</h3>
          </div>

          {onRunCommand && (
            <button
              onClick={() => onRunCommand(selectedMethod.sandboxCmd)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <span>▶</span> Run in Sandbox: <code className="text-orange-200">{selectedMethod.sandboxCmd}</code>
            </button>
          )}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-sans">{selectedMethod.description}</p>

        {/* Warning Banner if Destructive or Caution */}
        {selectedMethod.warning && (
          <div className={`p-4 rounded-xl border text-xs leading-relaxed font-sans ${selectedMethod.safety === 'Destructive' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
            <p className="font-bold flex items-center gap-1.5 text-sm mb-1">
              <span>{selectedMethod.safety === 'Destructive' ? '🚨' : '⚠️'}</span> Safety Warning
            </p>
            <p>{selectedMethod.warning}</p>
          </div>
        )}

        {/* 3 Pillars Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-orange-400 font-bold block mb-1 uppercase text-[10px] tracking-wider">Working Directory</span>
            <span className="text-slate-300">{selectedMethod.workingTree}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1 uppercase text-[10px] tracking-wider">Staging Area (Index)</span>
            <span className="text-slate-300">{selectedMethod.index}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1 uppercase text-[10px] tracking-wider">HEAD & History</span>
            <span className="text-slate-300">{selectedMethod.history}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

