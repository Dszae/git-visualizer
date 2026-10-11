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
    <div className={`p-4 sm:p-6 max-w-6xl mx-auto space-y-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <span>📚 Searchable Git Command Reference</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Complete, verified reference for standard Git commands with syntax, preconditions, expected effects, common errors, and one-click execution in the interactive simulator.
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
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-500"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar text-xs font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap border text-[11px] ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500 font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Command Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-400 italic text-sm">
            No commands matched "{searchTerm}".
          </div>
        ) : (
          filtered.map(item => (
            <article 
              key={item.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-400 mb-1 inline-block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">{item.syntax}</h3>
                  </div>

                  {item.safetyWarning && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold shrink-0">
                      Warning
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.purpose}</p>

                {/* Example box */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 whitespace-pre-wrap">
                  {item.example}
                </div>

                {/* Details Breakdown */}
                <div className="space-y-1.5 text-[11px] text-slate-400 font-sans">
                  <p><strong className="text-slate-300 font-mono">Preconditions:</strong> {item.preconditions}</p>
                  <p><strong className="text-slate-300 font-mono">Expected Effect:</strong> {item.expectedEffect}</p>
                  {item.safetyWarning && (
                    <p className="text-amber-300 font-semibold">{item.safetyWarning}</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {onRunCommand && (
                <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => onRunCommand(item.sandboxCommand)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <span>▶</span> Try in Sandbox: <code className="text-orange-400 group-hover:text-white">{item.sandboxCommand}</code>
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

