import React, { useState } from 'react';
import { resolveFileConflict } from '../../engine/gitEngine.js';

export default function RepoInspector({
  state,
  onStateChange,
  onRunCommand,
  isDark = true
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'branches' | 'stash' | 'remotes'

  const workingFiles = Object.entries(state.workingDir.files || {});
  const indexFiles = Object.entries(state.index.files || {});
  const branchList = Object.entries(state.branches || {});
  const tagList = Object.entries(state.tags || {});
  const stashList = state.stash || [];
  const remoteList = Object.entries(state.remotes || {});

  const isConflict = state.mergeState?.inProgress;

  const handleResolveConflict = (filename, choice) => {
    if (!onStateChange) return;
    const newState = resolveFileConflict(state, filename, choice);
    onStateChange(newState);
  };

  return (
    <section 
      aria-label="Repository State Inspector"
      className={`rounded-2xl border flex flex-col h-[400px] sm:h-[460px] overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      {/* Header Tabs */}
      <div className={`px-3 py-2 border-b flex items-center justify-between text-xs font-mono gap-1 overflow-x-auto ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'files' ? (isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white text-orange-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <span>📁 Files & Index</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
              {workingFiles.length + indexFiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'branches' ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <span>🌿 Branches & HEAD</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
              {branchList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stash')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'stash' ? (isDark ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white text-purple-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <span>📦 Stash</span>
            {stashList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/40 text-purple-300 font-mono">
                {stashList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('remotes')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'remotes' ? (isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white text-cyan-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <span>🌐 Remotes</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono custom-scrollbar">
        {/* ================= TAB 1: FILES & INDEX ================= */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            {/* Merge Conflict Resolution Callout */}
            {isConflict && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 animate-[pulse_2s_infinite]">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-rose-400">
                    ⚠️ Merge Conflict in Progress!
                  </span>
                  <button
                    onClick={() => onRunCommand && onRunCommand('git merge --abort')}
                    className="px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-white text-[10px] font-bold transition-colors"
                  >
                    git merge --abort
                  </button>
                </div>
                <p className="text-[11px] text-rose-200/90 font-sans">
                  Files contain conflict markers. Choose how to resolve below, then stage with `git add` and commit:
                </p>
                {state.mergeState.conflictedFiles?.map(f => (
                  <div key={f} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-white font-bold block">{f}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleResolveConflict(f, 'head')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] transition-colors"
                      >
                        Keep HEAD (Current)
                      </button>
                      <button
                        onClick={() => handleResolveConflict(f, 'incoming')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-cyan-400 hover:text-white text-[10px] transition-colors"
                      >
                        Accept Incoming
                      </button>
                      <button
                        onClick={() => handleResolveConflict(f, 'both')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] transition-colors"
                      >
                        Combine Both
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Staging Area (Index) */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Staging Area / Index ({indexFiles.length})
                </span>
                <span className="text-[10px] text-slate-400">ready for commit</span>
              </div>
              {indexFiles.length === 0 ? (
                <p className="text-slate-400 italic text-[11px]">No files staged in the index (run `git add &lt;file&gt;`)</p>
              ) : (
                <div className="space-y-1.5">
                  {indexFiles.map(([filename, file]) => (
                    <div key={filename} className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                      <span className="text-emerald-400 font-semibold">{filename}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                        {file.content.length} chars staged
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Working Directory */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Working Directory ({workingFiles.length})
                </span>
                <span className="text-[10px] text-slate-400">local disk state</span>
              </div>
              {workingFiles.length === 0 ? (
                <p className="text-slate-400 italic text-[11px]">Working directory is empty</p>
              ) : (
                <div className="space-y-1.5">
                  {workingFiles.map(([filename, file]) => {
                    const statusColor = 
                      file.status === 'conflicted' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                      file.status === 'untracked' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                      file.status === 'modified' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' :
                      file.status === 'staged' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                      'text-slate-400 bg-slate-800/40 border-slate-800';

                    return (
                      <div key={filename} className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                        <span>{filename}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${statusColor}`}>
                          {file.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: BRANCHES & HEAD ================= */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            {/* HEAD Pointer */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">HEAD State</span>
              {state.HEAD.type === 'detached' ? (
                <div className="text-amber-400 font-bold">
                  ⚠️ Detached HEAD at commit {state.HEAD.name.slice(0, 7)}
                </div>
              ) : (
                <div className="text-emerald-400 font-bold">
                  Pointing to branch refs/heads/{state.HEAD.name}
                </div>
              )}
            </div>

            {/* Local Branches */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-slate-400 uppercase text-[10px] font-bold block mb-2">Local Branches</span>
              <div className="space-y-1.5">
                {branchList.map(([name, commitHash]) => {
                  const isActive = state.HEAD.type === 'branch' && state.HEAD.name === name;
                  return (
                    <div 
                      key={name}
                      className={`px-3 py-2 rounded-lg border flex items-center justify-between ${isActive ? 'bg-emerald-500/10 border-emerald-500/40' : (isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive && <span className="text-emerald-400 font-black">★</span>}
                        <span className={`font-bold ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{name}</span>
                      </div>
                      <span className="text-orange-400 font-mono text-[11px]">{commitHash ? commitHash.slice(0, 7) : 'empty'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            {tagList.length > 0 && (
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-amber-400 uppercase text-[10px] font-bold block mb-2">Release Tags</span>
                <div className="space-y-1">
                  {tagList.map(([name, hash]) => (
                    <div key={name} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-amber-400 font-bold">🏷️ {name}</span>
                      <span className="text-slate-400 font-mono">{hash.slice(0, 7)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: STASH ================= */}
        {activeTab === 'stash' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">
                Stash Stack ({stashList.length})
              </span>
              {stashList.length > 0 && onRunCommand && (
                <button
                  onClick={() => onRunCommand('git stash pop')}
                  className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[10px] font-bold transition-colors"
                >
                  git stash pop
                </button>
              )}
            </div>

            {stashList.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-4 text-center">
                Stash stack is empty. Run `git stash` when you have dirty modifications to save them here.
              </p>
            ) : (
              stashList.map((entry, idx) => (
                <div key={entry.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">stash@&#123;{idx}&#125;</span>
                    <span className="text-slate-400 text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{entry.message}</p>
                  <p className="text-slate-400 text-[10px]">Branch: {entry.branch}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 4: REMOTES ================= */}
        {activeTab === 'remotes' && (
          <div className="space-y-3">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] block">
              Configured Remotes
            </span>
            {remoteList.length === 0 ? (
              <p className="text-slate-400 italic text-xs">No remotes configured. Add one with `git remote add origin &lt;url&gt;`.</p>
            ) : (
              remoteList.map(([name, remote]) => (
                <div key={name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{name}</span>
                    <span className="text-slate-400 text-[10px]">Git remote</span>
                  </div>
                  <p className="text-slate-300 text-[11px] truncate">{remote.url}</p>
                  <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                    <span className="block font-bold text-slate-300 mb-1">Remote-Tracking Branches:</span>
                    {Object.entries(remote.branches || {}).map(([b, hash]) => (
                      <div key={b} className="flex justify-between py-0.5">
                        <span className="text-indigo-400">{name}/{b}</span>
                        <span className="text-orange-400">{hash.slice(0, 7)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

