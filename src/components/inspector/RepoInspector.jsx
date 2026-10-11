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
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'files' ? (isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white text-orange-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Files & Index</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
              {workingFiles.length + indexFiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'branches' ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
            <span>Branches & HEAD</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
              {branchList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stash')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'stash' ? (isDark ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white text-purple-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Stash</span>
            {stashList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/40 text-purple-300 font-mono">
                {stashList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('remotes')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${activeTab === 'remotes' ? (isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white text-cyan-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black')}`}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Remotes</span>
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
                    <svg aria-hidden="true" className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Merge Conflict in Progress</span>
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
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Detached HEAD at commit {state.HEAD.name.slice(0, 7)}</span>
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
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" aria-hidden="true"></span>
                        )}
                        <span className={`font-bold ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{name}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-mono">HEAD</span>
                        )}
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
                    <div key={name} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{name}</span>
                      </span>
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

