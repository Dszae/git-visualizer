import React, { useState } from 'react';

const UNDO_METHODS = [
  {
    id: 'git-restore',
    name: 'git restore <file>',
    type: 'Working Tree Undo',
    safety: 'Caution',
    safetyBadge: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Discards unstaged modifications in the working directory, restoring the file to match the index/HEAD.',
    workingTree: 'Discards unstaged edits',
    index: 'Unchanged',
    headBranch: 'Unchanged',
    history: 'Preserved (no new commit)',
    warning: 'Destructive for unstaged edits! Edits made in the working tree that were never staged will be lost permanently.',
    sandboxCmd: 'git restore index.js'
  },
  {
    id: 'git-restore-staged',
    name: 'git restore --staged <file>',
    type: 'Unstage from Index',
    safety: 'Safe',
    safetyBadge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Unstages a file from the Index back to the working directory without losing any edits.',
    workingTree: 'Preserves your edits in working directory',
    index: 'Clears staged version back to HEAD',
    headBranch: 'Unchanged',
    history: 'Preserved',
    warning: null,
    sandboxCmd: 'git restore --staged index.js'
  },
  {
    id: 'git-reset-soft',
    name: 'git reset --soft HEAD~1',
    type: 'Undo Commit (Keep Staged)',
    safety: 'Safe',
    safetyBadge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Moves branch pointer back by 1 commit. Leaves all changes staged in the Index ready to re-commit.',
    workingTree: 'Completely preserved',
    index: 'Changes remain staged in index',
    headBranch: 'Moves back to HEAD~1',
    history: 'Rewrites branch tip (reflog keeps old hash)',
    warning: 'Safe locally. If the commit was already pushed to a shared remote, rewriting the branch tip can cause sync issues for teammates.',
    sandboxCmd: 'git reset --soft HEAD~1'
  },
  {
    id: 'git-reset-mixed',
    name: 'git reset [--mixed] HEAD~1',
    type: 'Undo Commit (Keep Unstaged)',
    safety: 'Safe',
    safetyBadge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Moves branch pointer back and un-stages files from Index. All changes are kept as unstaged files in your working directory.',
    workingTree: 'Preserved as unstaged files',
    index: 'Reset to match HEAD~1',
    headBranch: 'Moves back to HEAD~1',
    history: 'Rewrites branch tip',
    warning: 'Your changes are not lost; they are kept unstaged in your working directory.',
    sandboxCmd: 'git reset HEAD~1'
  },
  {
    id: 'git-reset-hard',
    name: 'git reset --hard HEAD~1',
    type: 'Nuclear Reset',
    safety: 'Destructive',
    safetyBadge: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    description: 'Moves branch pointer back AND forcibly overwrites both Index and Working Directory to match HEAD~1.',
    workingTree: 'Discarded permanently',
    index: 'Discarded permanently',
    headBranch: 'Moves back to HEAD~1',
    history: 'Rewrites branch tip',
    warning: 'High risk: All uncommitted modifications in your working directory and staging area will be permanently destroyed. Committed work can only be recovered via reflog.',
    sandboxCmd: 'git reset --hard HEAD~1'
  },
  {
    id: 'git-revert',
    name: 'git revert <commit>',
    type: 'Safe Public History Undo',
    safety: 'Safest',
    safetyBadge: 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    description: 'Creates a brand-new commit that inverts the changes of the target commit. Does not delete or rewrite past history.',
    workingTree: 'Updated with inverse diff',
    index: 'Committed cleanly',
    headBranch: 'Advances forward to new revert commit',
    history: 'Fully preserved (adds new commit)',
    warning: 'The recommended way to undo work on shared or team branches because it does not alter past commit hashes.',
    sandboxCmd: 'git revert HEAD'
  },
  {
    id: 'git-reflog',
    name: 'git reflog & recovery',
    type: 'Emergency Recovery Net',
    safety: 'Safe',
    safetyBadge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Logs every HEAD position visited. Allows recovering "lost" commits after accidental reset or branch deletion.',
    workingTree: 'Read-only inspection',
    index: 'Unchanged',
    headBranch: 'Unchanged',
    history: 'Reveals all previous commit hashes',
    warning: 'Reflog entries are local only and expire after 90 days by default.',
    sandboxCmd: 'git reflog'
  }
];

export default function UndoLabView({ onRunCommand, isDark = true }) {
  const [selectedMethod, setSelectedMethod] = useState(UNDO_METHODS[2]); // default to reset --soft

  return (
    <div className={`space-y-6 max-w-5xl mx-auto transition-colors ${
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    }`}>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Safe Undo Guide
        </h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
          Compare how different Git undo commands affect your Working Directory, Index, and Commit History.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <table className="w-full text-left text-xs border-collapse" aria-label="Git Undo operations comparison table">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400">
              <th className="py-2.5 px-4 font-semibold">Command</th>
              <th className="py-2.5 px-3 font-semibold">Safety</th>
              <th className="py-2.5 px-3 font-semibold">Working Directory</th>
              <th className="py-2.5 px-3 font-semibold">Index (Staging)</th>
              <th className="py-2.5 px-3 font-semibold">History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
            {UNDO_METHODS.map((method) => {
              const isSelected = selectedMethod.id === method.id;
              return (
                <tr 
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-orange-500/10 dark:bg-orange-500/10' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {method.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${method.safetyBadge}`}>
                      {method.safety}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{method.workingTree}</td>
                  <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{method.index}</td>
                  <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{method.history}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Method Details */}
      <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${selectedMethod.safetyBadge}`}>
              {selectedMethod.safety}
            </span>
            <h3 className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">{selectedMethod.name}</h3>
          </div>

          {onRunCommand && (
            <button
              onClick={() => onRunCommand(selectedMethod.sandboxCmd)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              Run in Sandbox: <code className="font-mono">{selectedMethod.sandboxCmd}</code>
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">{selectedMethod.description}</p>

        {/* Warning Banner */}
        {selectedMethod.warning && (
          <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
            selectedMethod.safety === 'Destructive' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          }`}>
            <span className="font-semibold block mb-0.5">Note on data safety:</span>
            <p>{selectedMethod.warning}</p>
          </div>
        )}

        {/* 3 Pillars Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium block mb-1 text-[11px]">Working Directory</span>
            <span className="text-zinc-800 dark:text-zinc-200">{selectedMethod.workingTree}</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium block mb-1 text-[11px]">Staging Area (Index)</span>
            <span className="text-zinc-800 dark:text-zinc-200">{selectedMethod.index}</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium block mb-1 text-[11px]">Commit History</span>
            <span className="text-zinc-800 dark:text-zinc-200">{selectedMethod.history}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
