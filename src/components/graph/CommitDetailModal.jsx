import React, { useEffect, useRef } from 'react';

export default function CommitDetailModal({ commit, onClose, onSelectCommit }) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const prevFocusedElem = useRef(null);

  useEffect(() => {
    prevFocusedElem.current = document.activeElement;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (prevFocusedElem.current && typeof prevFocusedElem.current.focus === 'function') {
        prevFocusedElem.current.focus();
      }
    };
  }, [onClose]);

  if (!commit) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commit-detail-title"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
            <h2 id="commit-detail-title" className="text-sm font-semibold font-mono">
              Commit {commit.shortHash}
            </h2>
          </div>
          <button 
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close commit details"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Commit Message */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-500 font-medium block text-[11px] mb-1">Message</span>
            <p className="text-zinc-900 dark:text-zinc-100 font-medium whitespace-pre-wrap">{commit.message}</p>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <span className="text-zinc-400 dark:text-zinc-500 block text-[11px]">Author</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">{commit.author}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <span className="text-zinc-400 dark:text-zinc-500 block text-[11px]">Date</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">{new Date(commit.timestamp).toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sm:col-span-2">
              <span className="text-zinc-400 dark:text-zinc-500 block text-[11px]">Hash</span>
              <span className="text-orange-600 dark:text-orange-400 select-all font-mono break-all font-medium">{commit.hash}</span>
            </div>
          </div>

          {/* Parents */}
          <div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium block mb-1.5 text-xs">
              Parents ({commit.parentHashes.length})
            </span>
            {commit.parentHashes.length === 0 ? (
              <p className="text-zinc-400 italic">Initial commit</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {commit.parentHashes.map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => onSelectCommit && onSelectCommit(p)}
                    aria-label={`Jump to parent commit ${p.slice(0, 7)}`}
                    className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    ← {p.slice(0, 7)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Files Snapshot */}
          <div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium block mb-1.5 text-xs">
              Files in snapshot ({Object.keys(commit.tree || {}).length})
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {Object.entries(commit.tree || {}).map(([file, content]) => (
                <div key={file} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                  <div className="px-3 py-1.5 bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{file}</span>
                    <span className="text-zinc-400 text-[11px]">{content.length} chars</span>
                  </div>
                  <pre className="p-2.5 text-xs text-zinc-700 dark:text-zinc-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
