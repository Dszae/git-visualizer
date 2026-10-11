import React, { useState, useEffect } from 'react';

export default function TimelineControls({
  historySteps = [],
  currentStepIndex = 0,
  onGoToStep,
  onResetSession,
  isDark = true
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < historySteps.length - 1) {
          onGoToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, historySteps.length, onGoToStep]);

  if (historySteps.length <= 1) {
    return null;
  }

  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < historySteps.length - 1;

  return (
    <div 
      aria-label="Simulation Time Travel and Playback Controls"
      className={`rounded-2xl border p-3 sm:p-4 flex flex-col gap-3 transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
            Playback Timeline
          </span>
          <span className="text-xs font-mono text-orange-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Step {currentStepIndex + 1} of {historySteps.length}
          </span>
        </div>

        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => onGoToStep(currentStepIndex - 1)}
            disabled={!canGoBack}
            aria-label="Previous step"
            className="px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Prev</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause playback" : "Play step-by-step history"}
            className="px-3 py-1.5 rounded-lg border transition-all bg-orange-600 hover:bg-orange-500 text-white font-bold border-orange-500 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {isPlaying ? (
              <>
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg aria-hidden="true" className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => onGoToStep(currentStepIndex + 1)}
            disabled={!canGoForward}
            aria-label="Next step"
            className="px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <span>Next</span>
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {onResetSession && (
            <button
              onClick={onResetSession}
              aria-label="Reset sandbox timeline"
              className="px-2.5 py-1.5 rounded-lg border transition-all bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30 text-[11px] ml-1 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              Reset Session
            </button>
          )}
        </div>
      </div>

      {/* Visual Timeline Track */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 custom-scrollbar">
        {historySteps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          return (
            <button
              key={idx}
              onClick={() => onGoToStep(idx)}
              aria-label={`Jump to step ${idx + 1}: ${step.command || 'initial'}`}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap transition-all border shrink-0 ${isCurrent ? 'bg-orange-500 text-white border-orange-400 font-bold scale-105 shadow-md' : (isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-black')}`}
            >
              {idx === 0 ? '0: Initial' : `${idx}: ${step.command}`}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 italic flex items-center gap-1.5">
        <svg aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>Educational Time-Travel:</strong> This timeline navigates through your simulation steps. It is independent of Git's internal commands like <code className="text-orange-400 font-mono">git reset</code> or <code className="text-orange-400 font-mono">git revert</code>.
        </span>
      </p>
    </div>
  );
}

