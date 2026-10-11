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
    <div className={`space-y-6 max-w-5xl mx-auto transition-colors ${
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Guided Lessons & Challenges
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Hands-on tutorials to master branching, committing, merging, and recovery.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'lessons'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Lessons ({effectiveCompletedLessons.length}/{LESSONS.length})
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'challenges'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Challenges ({effectiveCompletedChallenges.length}/{CHALLENGES.length})
            </button>
          </div>

          <button
            onClick={handleResetProgress}
            title="Reset saved progress"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ================= TAB 1: LESSONS ================= */}
      {activeTab === 'lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Lessons List: Swipeable row on mobile, sidebar on desktop */}
          <div className="lg:col-span-4 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 max-h-none lg:max-h-[520px] pr-0 lg:pr-1">
            {LESSONS.map((lesson, idx) => {
              const isSelected = lesson.id === activeLesson.id;
              const isDone = effectiveCompletedLessons.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => handleStartLesson(lesson)}
                  className={`min-w-[220px] lg:min-w-0 w-full text-left p-2.5 sm:p-3 rounded-lg border transition-colors flex items-start justify-between gap-2 shrink-0 lg:shrink ${
                    isSelected
                      ? 'border-orange-500/50 bg-orange-500/5 text-zinc-900 dark:text-white'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {lesson.level}
                      </span>
                      <span className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">{lesson.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{lesson.subtitle}</p>
                  </div>

                  {isDone ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0 mt-0.5">{idx + 1}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Lesson Panel */}
          <div className="lg:col-span-8 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-zinc-500">
                  {activeLesson.level} Level
                </span>
                <button
                  onClick={() => handleStartLesson(activeLesson)}
                  className="px-2.5 py-1 rounded text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Reset scenario
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{activeLesson.title}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{activeLesson.subtitle}</p>
              </div>

              {/* Objective */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-500 block mb-0.5 text-[11px]">Objective</span>
                <p className="text-zinc-800 dark:text-zinc-200">{activeLesson.objective}</p>
              </div>

              {/* Explanation */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {activeLesson.explanation}
              </p>

              {/* Step by Step */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Steps to complete
                </span>
                {activeLesson.steps.map((step, sIdx) => {
                  const isStepDone = step.verify(currentState);
                  // Extract command from backticks or quotes
                  const cmdMatch = step.instruction.match(/`([^`]+)`/) || step.hint.match(/"([^"]+)"/);
                  const suggestedCmd = cmdMatch ? cmdMatch[1] : null;

                  return (
                    <div 
                      key={sIdx}
                      className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        isStepDone 
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isStepDone ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {isStepDone ? '✓' : sIdx + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{step.instruction}</p>
                          <p className="text-xs text-zinc-500 font-mono">Hint: {step.hint}</p>
                        </div>
                      </div>

                      {suggestedCmd && !isStepDone && onRunCommand && (
                        <button
                          onClick={() => onRunCommand(suggestedCmd)}
                          className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-mono text-xs font-semibold transition-all shrink-0 flex items-center justify-center gap-1 shadow-2xs min-h-[40px] sm:min-h-0"
                        >
                          Run: {suggestedCmd}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Completion Banner */}
              {isLessonComplete && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                  <p className="font-semibold text-sm">Lesson Complete</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200/90">{activeLesson.summary}</p>
                </div>
              )}
            </div>

            {/* Next Lesson Trigger */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {isLessonComplete ? 'Completed' : 'In Progress'}
              </span>
              {isLessonComplete && (
                <button
                  onClick={() => {
                    const currIdx = LESSONS.findIndex(l => l.id === activeLesson.id);
                    if (currIdx < LESSONS.length - 1) {
                      handleStartLesson(LESSONS[currIdx + 1]);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                >
                  Next Lesson →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CHALLENGES ================= */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          <div className="lg:col-span-4 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 pr-0 lg:pr-1">
            {CHALLENGES.map(ch => {
              const isSelected = ch.id === activeChallenge.id;
              const isDone = effectiveCompletedChallenges.includes(ch.id);

              return (
                <button
                  key={ch.id}
                  onClick={() => handleStartChallenge(ch)}
                  className={`min-w-[200px] lg:min-w-0 w-full text-left p-2.5 sm:p-3 rounded-lg border transition-colors flex items-start justify-between shrink-0 lg:shrink ${
                    isSelected
                      ? 'border-orange-500/50 bg-orange-500/5 text-zinc-900 dark:text-white'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="truncate">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 block w-max mb-1">
                      {ch.difficulty}
                    </span>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{ch.title}</p>
                  </div>
                  {isDone && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-zinc-500">
                {activeChallenge.difficulty} Challenge
              </span>
              <button
                onClick={() => handleStartChallenge(activeChallenge)}
                className="px-2.5 py-1 rounded text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Reset challenge
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{activeChallenge.title}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{activeChallenge.description}</p>
            </div>

            {/* Target Goal */}
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <span className="font-semibold text-zinc-500 block text-[11px]">Target Goal</span>
              <p className="text-zinc-800 dark:text-zinc-200">{activeChallenge.targetGoalDescription}</p>
            </div>

            {/* Verification State Banner */}
            {isChallengeComplete ? (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                Target state reached successfully!
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                Target state not yet reached. Use the command input in the Sandbox tab to execute your commands.
              </div>
            )}

            {/* Hints */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setChallengeHintsOpen(!challengeHintsOpen)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {challengeHintsOpen ? 'Hide hint ▴' : 'Show hint ▾'}
              </button>
              {challengeHintsOpen && (
                <div className="mt-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  {activeChallenge.hints.map((h, i) => (
                    <p key={i}>{h}</p>
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
