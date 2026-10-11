import React, { useState } from 'react';
import { COMMAND_REFERENCE } from '../../data/commandReferenceData.js';

export default function CommandReferenceView({ onRunCommand, isDark = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', ...new Set(COMMAND_REFERENCE.map(c => c.category))];

  const filtered = COMMAND_REFERENCE.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = 
      item.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.syntax.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`space-y-6 max-w-5xl mx-auto transition-colors ${
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    }`}>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Command Reference
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
          Verified reference for standard Git commands with syntax, preconditions, and one-click execution.
        </p>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search commands (e.g. switch, reset, stash, merge)..."
            aria-label="Search git commands"
            className={`w-full px-4 py-2.5 pl-10 rounded-xl text-base sm:text-sm border font-mono transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[44px] ${
              isDark 
                ? 'bg-zinc-900 border-zinc-700/80 text-white placeholder:text-zinc-500' 
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-sm">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm font-medium border min-h-[38px] flex items-center cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold shadow-2xs' 
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Command Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-zinc-500 italic text-sm">
            No commands matched "{searchTerm}".
          </div>
        ) : (
          filtered.map(item => (
            <article 
              key={item.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-1.5 inline-block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-50">{item.syntax}</h3>
                  </div>

                  {item.safetyWarning && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                      Warning
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">{item.purpose}</p>

                {/* Example box */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                  {item.example}
                </div>

                {/* Details Breakdown */}
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-sans">
                  <p><strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Preconditions:</strong> {item.preconditions}</p>
                  <p><strong className="text-zinc-800 dark:text-zinc-200 font-semibold">Effect:</strong> {item.expectedEffect}</p>
                  {item.safetyWarning && (
                    <p className="text-amber-700 dark:text-amber-400 font-medium mt-1">{item.safetyWarning}</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {onRunCommand && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-end">
                  <button
                    onClick={() => onRunCommand(item.sandboxCommand)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center min-h-[44px] cursor-pointer shadow-2xs"
                  >
                    Run in Sandbox
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
