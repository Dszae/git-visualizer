import React, { useState } from 'react';

export default function ExplanationPanel({ explanation, isDark = true }) {
  const [isDetailedMode, setIsDetailedMode] = useState(true);

  if (!explanation) {
    return (
      <section 
        aria-label="Command Explanation Panel"
        className={`rounded-2xl border p-4 text-center text-xs font-mono transition-colors duration-300 ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
      >
        <p className="italic">Run a Git command in the terminal above to inspect its before-and-after effects and conceptual explanation.</p>
      </section>
    );
  }

  return (
    <section 
      aria-label="Command Explanation and Before-and-After Analysis"
      className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
    >
      {/* Header bar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${explanation.success ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span className="font-bold text-slate-300">Command Breakdown:</span>
          <code className="text-orange-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            {explanation.command}
          </code>
        </div>

        {/* Toggle between Compact & Detailed Beginner mode */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDetailedMode(false)}
            aria-pressed={!isDetailedMode}
            className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium transition-colors ${!isDetailedMode ? 'bg-orange-500 text-white' : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600')}`}
          >
            Compact
          </button>
          <button
            onClick={() => setIsDetailedMode(true)}
            aria-pressed={isDetailedMode}
            className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium transition-colors ${isDetailedMode ? 'bg-orange-500 text-white' : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600')}`}
          >
            Detailed Beginner
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 space-y-3 text-xs font-sans">
        <div className="flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">{explanation.summary}</h3>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {isDetailedMode ? explanation.details : explanation.summary}
            </p>
          </div>
        </div>

        {isDetailedMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
            {/* What Changed */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800/80 text-emerald-400' : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-[11px] uppercase tracking-wider">
                <span>✓</span> What Changed
              </div>
              {explanation.changes && explanation.changes.length > 0 ? (
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {explanation.changes.map((c, i) => (
                    <li key={i}><span className="font-bold text-emerald-400">[{c.type}]</span> {c.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">No files or pointers were modified.</p>
              )}
            </div>

            {/* What Remained Unchanged */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800/80 text-cyan-400' : 'bg-cyan-50/60 border-cyan-200 text-cyan-800'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-[11px] uppercase tracking-wider">
                <span>🔒</span> What Remained Unchanged
              </div>
              {explanation.unchanged && explanation.unchanged.length > 0 ? (
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {explanation.unchanged.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">State transitioned completely.</p>
              )}
            </div>
          </div>
        )}

        {/* Resulting state & Next steps */}
        {explanation.resultingState && (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/60 text-xs">
            <div className="text-slate-300 font-mono">
              <span className="text-slate-400">Result: </span>
              <span className="text-orange-400 font-semibold">{explanation.resultingState}</span>
            </div>
            {explanation.nextSuggestions && explanation.nextSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                <span>Next try:</span>
                {explanation.nextSuggestions.map((s, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

