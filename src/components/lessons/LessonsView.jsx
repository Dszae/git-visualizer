import React, { useState, useMemo } from 'react';
import { LESSONS, CHALLENGES } from '../../data/lessonsData.js';

export default function LessonsView({
  currentState,
  onLoadState,
  isDark = true
}) {
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'challenges'
  const [selectedLessonId, setSelectedLessonId] = useState(LESSONS[0].id);
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('git_visualizer_completed_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedChallengeId, setSelectedChallengeId] = useState(CHALLENGES[0].id);
  const [challengeHintsOpen, setChallengeHintsOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem('git_visualizer_completed_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeLesson = LESSONS.find(l => l.id === selectedLessonId) || LESSONS[0];
  const activeChallenge = CHALLENGES.find(c => c.id === selectedChallengeId) || CHALLENGES[0];

  // Derive if current lesson or challenge is completed
  const isLessonComplete = activeLesson.steps.every(s => s.verify(currentState));
  const isChallengeComplete = activeChallenge.validateTargetState(currentState);

  const effectiveCompletedLessons = useMemo(() => {
    if (isLessonComplete && !completedLessons.includes(activeLesson.id)) {
      const next = [...completedLessons, activeLesson.id];
      try { localStorage.setItem('git_visualizer_completed_lessons', JSON.stringify(next)); } catch {}
      return next;
    }
    return completedLessons;
  }, [isLessonComplete, activeLesson.id, completedLessons]);

  const effectiveCompletedChallenges = useMemo(() => {
    if (activeTab === 'challenges' && isChallengeComplete && !completedChallenges.includes(activeChallenge.id)) {
      const next = [...completedChallenges, activeChallenge.id];
      try { localStorage.setItem('git_visualizer_completed_challenges', JSON.stringify(next)); } catch {}
      return next;
    }
    return completedChallenges;
  }, [isChallengeComplete, activeChallenge.id, activeTab, completedChallenges]);

  const handleStartLesson = (lesson) => {
    setSelectedLessonId(lesson.id);
    if (onLoadState) {
      onLoadState(lesson.initialStateGenerator());
    }
  };

  const handleStartChallenge = (challenge) => {
    setSelectedChallengeId(challenge.id);
    setChallengeHintsOpen(false);
    if (onLoadState) {
      onLoadState(challenge.initialStateGenerator());
    }
  };

  const handleResetProgress = () => {
    setCompletedLessons([]);
    setCompletedChallenges([]);
    try {
      localStorage.removeItem('git_visualizer_completed_lessons');
      localStorage.removeItem('git_visualizer_completed_challenges');
    } catch {}
  };

  return (
    <div className={`p-4 sm:p-6 max-w-6xl mx-auto space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🎓 Guided Git Curriculum & Challenges</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Master Git version control from fundamentals to advanced branch recovery through hands-on guided lessons and target state challenges.
          </p>
        </div>

        {/* Tab switch and Reset progress */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeTab === 'lessons' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Lessons ({effectiveCompletedLessons.length}/{LESSONS.length})
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeTab === 'challenges' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Target Challenges ({effectiveCompletedChallenges.length}/{CHALLENGES.length})
            </button>
          </div>

          <button
            onClick={handleResetProgress}
            title="Reset saved lesson progress"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 text-xs transition-colors"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* ================= TAB 1: GUIDED LESSONS ================= */}
      {activeTab === 'lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lessons List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Curriculum Lessons
            </h3>
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
              {LESSONS.map((lesson, idx) => {
                const isSelected = lesson.id === activeLesson.id;
                const isDone = effectiveCompletedLessons.includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleStartLesson(lesson)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${isSelected ? 'bg-orange-500/10 border-orange-500/50 shadow-md' : (isDark ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800')}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${lesson.level === 'Beginner' ? 'bg-emerald-500/20 text-emerald-400' : lesson.level === 'Intermediate' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {lesson.level}
                        </span>
                        <span className="text-xs font-bold font-sans text-white">{lesson.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[210px]">{lesson.subtitle}</p>
                    </div>

                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Lesson Detail Panel */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {activeLesson.level} Level
                </span>
                <button
                  onClick={() => handleStartLesson(activeLesson)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <span>↺</span> Load Initial State
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{activeLesson.title}</h3>
                <p className="text-sm font-medium text-slate-300 mt-1">{activeLesson.subtitle}</p>
              </div>

              {/* Objective */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <p className="font-mono text-orange-400 uppercase font-bold text-[10px] tracking-wider mb-1">Learning Objective</p>
                <p className="text-slate-200">{activeLesson.objective}</p>
              </div>

              {/* Conceptual Explanation */}
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                <p>{activeLesson.explanation}</p>
              </div>

              {/* Step by Step Instructions */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Step-by-Step Instructions
                </p>
                {activeLesson.steps.map((step, sIdx) => {
                  const isStepDone = step.verify(currentState);
                  return (
                    <div 
                      key={sIdx}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${isStepDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isStepDone ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {isStepDone ? '✓' : sIdx + 1}
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-white">{step.instruction}</p>
                        <p className="text-slate-400 font-mono text-[11px]">💡 Hint: {step.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion Box */}
              {isLessonComplete && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs space-y-1 animate-[fadeIn_0.3s_ease-out]">
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    🎉 Lesson Complete!
                  </p>
                  <p className="text-emerald-200/90">{activeLesson.summary}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Status: {isLessonComplete ? 'Completed' : 'In Progress'}
              </span>
              {/* Next Lesson Button */}
              {isLessonComplete && (
                <button
                  onClick={() => {
                    const currIdx = LESSONS.findIndex(l => l.id === activeLesson.id);
                    if (currIdx < LESSONS.length - 1) {
                      handleStartLesson(LESSONS[currIdx + 1]);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 transition-all"
                >
                  Next Lesson →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TARGET CHALLENGES ================= */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Challenges List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Available Challenges
            </h3>
            <div className="space-y-1.5">
              {CHALLENGES.map(ch => {
                const isSelected = ch.id === activeChallenge.id;
                const isDone = effectiveCompletedChallenges.includes(ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => handleStartChallenge(ch)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${isSelected ? 'bg-orange-500/10 border-orange-500/50' : (isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800')}`}
                  >
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 block w-max mb-1">
                        {ch.difficulty}
                      </span>
                      <p className="text-xs font-bold text-white font-sans">{ch.title}</p>
                    </div>
                    {isDone && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Challenge Workspace */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {activeChallenge.difficulty} Challenge
              </span>
              <button
                onClick={() => handleStartChallenge(activeChallenge)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>↺</span> Reset Challenge
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{activeChallenge.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeChallenge.description}</p>
            </div>

            {/* Target Goal Condition */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="font-mono text-cyan-400 font-bold uppercase text-[10px] tracking-wider">🎯 Target Goal</p>
              <p className="text-slate-200">{activeChallenge.targetGoalDescription}</p>
            </div>

            {/* Verification State Banner */}
            {isChallengeComplete ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-base">🏆</span>
                <span>Success! You brought the repository into the exact target state!</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <span>⏳</span>
                <span>Target state not yet reached. Use the terminal in the Sandbox tab to execute your commands.</span>
              </div>
            )}

            {/* Hints Accordion */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setChallengeHintsOpen(!challengeHintsOpen)}
                className="text-xs font-mono text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>{challengeHintsOpen ? '▼ Hide Hints' : '▶ Need a Hint?'}</span>
              </button>
              {challengeHintsOpen && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300 animate-[fadeIn_0.2s_ease-out]">
                  {activeChallenge.hints.map((h, i) => (
                    <p key={i} className="text-slate-300">{h}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
