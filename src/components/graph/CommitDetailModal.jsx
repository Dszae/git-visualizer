import React, { useEffect } from 'react';

export default function CommitDetailModal({ commit, onClose, onSelectCommit }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!commit) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commit-detail-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <h2 id="commit-detail-title" className="text-base font-bold text-white font-mono">
              Commit {commit.shortHash}
            </h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close commit details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300 custom-scrollbar font-sans">
          {/* Commit Message */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <p className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-1">Commit Message</p>
            <p className="text-white font-medium whitespace-pre-wrap">{commit.message}</p>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Author</span>
              <span className="text-slate-200">{commit.author}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Date</span>
              <span className="text-slate-200">{new Date(commit.timestamp).toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Full Hash</span>
              <span className="text-orange-400 select-all font-mono break-all">{commit.hash}</span>
            </div>
          </div>

          {/* Parents */}
          <div>
            <p className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-1.5">
              Parents ({commit.parentHashes.length})
            </p>
            {commit.parentHashes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Root commit (no parents)</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {commit.parentHashes.map(p => (
                  <button
                    key={p}
                    onClick={() => onSelectCommit && onSelectCommit(p)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    ↑ {p.slice(0, 7)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Files Snapshot */}
          <div>
            <p className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-1.5">
              Files in this snapshot ({Object.keys(commit.tree || {}).length})
            </p>
            <div className="space-y-2">
              {Object.entries(commit.tree || {}).map(([file, content]) => (
                <div key={file} className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>📄 {file}</span>
                    <span className="text-[10px] text-slate-400">{content.length} chars</span>
                  </div>
                  <pre className="p-3 text-xs font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

