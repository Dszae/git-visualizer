import React, { useState, useMemo, useRef } from 'react';
import { calculateGraphLayout } from './graphLayout.js';
import CommitDetailModal from './CommitDetailModal.jsx';

export default function CommitGraph({ state, isDark = true }) {
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showTableView, setShowTableView] = useState(false);
  const [hoveredHash, setHoveredHash] = useState(null);

  const containerRef = useRef(null);

  const { nodes, edges } = useMemo(() => {
    return calculateGraphLayout(state);
  }, [state]);

  const handleMouseDown = (e) => {
    // Only drag on canvas or svg background, not on interactive buttons/nodes
    if (e.target.tagName === 'circle' || e.target.closest('button') || e.target.closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const activeCommitObj = selectedCommit ? state.commits[selectedCommit] : null;

  return (
    <section 
      aria-label="Interactive Git Commit Graph"
      className={`relative w-full h-[400px] sm:h-[460px] rounded-2xl border flex flex-col overflow-hidden select-none transition-colors duration-300 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
    >
      {/* Top Toolbar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono z-20 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'}`}>
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Commit Graph ({nodes.length} commits)
          </span>
          {state.HEAD.type === 'detached' ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
              Detached HEAD ({state.HEAD.name.slice(0, 7)})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
              HEAD → {state.HEAD.name}
            </span>
          )}
        </div>

        {/* View and Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTableView(!showTableView)}
            aria-label={showTableView ? "Switch to visual graph view" : "Switch to accessible table view"}
            className={`px-2 py-1 rounded text-[11px] transition-colors border font-sans font-medium flex items-center gap-1 ${showTableView ? 'bg-orange-500 text-white border-orange-500' : (isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700')}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
            {showTableView ? 'Graph View' : 'Table View (A11y)'}
          </button>
          
          <div className="h-4 w-px bg-slate-700/50 mx-1"></div>

          <button
            onClick={handleZoomOut}
            aria-label="Zoom out commit graph"
            className={`p-1.5 rounded transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
          </button>
          <span className="text-[10px] w-10 text-center font-mono opacity-80">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in commit graph"
            className={`p-1.5 rounded transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
          <button
            onClick={handleResetZoom}
            aria-label="Fit graph to view"
            className={`px-2 py-1 rounded text-[11px] transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'}`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Accessible Table View for Screen Readers & Keyboard Power Users */}
      {showTableView ? (
        <div className="flex-1 overflow-auto p-4 custom-scrollbar text-xs font-mono">
          <table className="w-full text-left border-collapse" aria-label="Commit log table">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2 px-3 font-semibold">Hash</th>
                <th className="py-2 px-3 font-semibold">Message</th>
                <th className="py-2 px-3 font-semibold">Refs</th>
                <th className="py-2 px-3 font-semibold">Parents</th>
                <th className="py-2 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(node => (
                <tr 
                  key={node.hash}
                  className={`border-b transition-colors ${node.isHead ? (isDark ? 'bg-orange-500/10' : 'bg-orange-50') : ''} ${isDark ? 'border-slate-800/60 hover:bg-slate-900/40 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-800'}`}
                >
                  <td className="py-2.5 px-3 font-bold text-orange-400">{node.shortHash}</td>
                  <td className="py-2.5 px-3 max-w-xs truncate">{node.message}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {node.branches.map(b => (
                        <span key={b.name} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          {b.isHead ? 'HEAD → ' : ''}{b.name}
                        </span>
                      ))}
                      {node.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">
                          tag: {t}
                        </span>
                      ))}
                      {node.remotes.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {node.parentHashes.map(p => p.slice(0, 7)).join(', ') || 'root'}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setSelectedCommit(node.hash)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual Interactive SVG Graph Canvas */
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing ${isDark ? 'bg-slate-950/40' : 'bg-slate-100/40'}`}
        >
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="font-semibold text-sm">No commits in repository yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Stage your files and run <code className="text-orange-400 font-mono">git commit -m "Initial commit"</code> in the terminal below to start visualizing your history.</p>
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              className="w-full h-full"
              style={{ overflow: 'visible' }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <defs>
                  <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Parent-Child Connecting Edges */}
                {edges.map(edge => (
                  <path
                    key={edge.id}
                    d={edge.path}
                    fill="none"
                    stroke={edge.isMerge ? '#a855f7' : (isDark ? '#475569' : '#94a3b8')}
                    strokeWidth={edge.isMerge ? '3' : '2.5'}
                    strokeDasharray={edge.isMerge ? '4 2' : 'none'}
                    className="transition-all duration-300"
                  />
                ))}

                {/* 2. Commit Nodes & Ref Badges */}
                {nodes.map(node => {
                  const isHovered = hoveredHash === node.hash;
                  const isHeadNode = node.isHead;
                  const isMergeNode = node.parentHashes.length > 1;

                  return (
                    <g 
                      key={node.hash}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="interactive-node cursor-pointer group"
                      onMouseEnter={() => setHoveredHash(node.hash)}
                      onMouseLeave={() => setHoveredHash(null)}
                      onClick={() => setSelectedCommit(node.hash)}
                    >
                      {/* HEAD Outer Glow Ring */}
                      {isHeadNode && (
                        <circle
                          r="22"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          className="animate-spin-slow opacity-80"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={isMergeNode ? '16' : '14'}
                        fill={isMergeNode ? '#9333ea' : (isHeadNode ? '#ea580c' : (isDark ? '#1e293b' : '#ffffff'))}
                        stroke={isHeadNode ? '#f97316' : (isMergeNode ? '#c084fc' : (isDark ? '#38bdf8' : '#0284c7'))}
                        strokeWidth={isHovered ? '4' : '2.5'}
                        filter={isHovered ? 'url(#glowEffect)' : 'none'}
                        className="transition-all duration-200"
                      />

                      {/* Inner dot for merge commits */}
                      {isMergeNode && (
                        <circle r="6" fill="#ffffff" />
                      )}

                      {/* Abbreviated Hash Label */}
                      <text
                        y={isMergeNode ? 28 : 26}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-slate-400 group-hover:fill-orange-400 transition-colors pointer-events-none"
                      >
                        {node.shortHash}
                      </text>

                      {/* Commit Message Snippet */}
                      <text
                        y={isMergeNode ? 40 : 38}
                        textAnchor="middle"
                        className="text-[9px] font-sans fill-slate-400 max-w-[90px] truncate opacity-80 pointer-events-none"
                      >
                        {node.message.length > 16 ? node.message.slice(0, 16) + '…' : node.message}
                      </text>

                      {/* Ref Labels Stacked Above Node */}
                      <g transform="translate(0, -22)">
                        {/* Branches */}
                        {node.branches.map((b, bIdx) => (
                          <g key={b.name} transform={`translate(0, ${-bIdx * 19})`}>
                            <rect
                              x={-((b.name.length * 6.5 + (b.isHead ? 42 : 18)) / 2)}
                              y="-15"
                              width={b.name.length * 6.5 + (b.isHead ? 42 : 18)}
                              height="16"
                              rx="8"
                              fill={b.isHead ? '#ea580c' : '#059669'}
                              className="shadow-sm"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                            >
                              {b.isHead ? 'HEAD → ' : ''}{b.name}
                            </text>
                          </g>
                        ))}

                        {/* Detached HEAD Badge */}
                        {node.isDetachedHead && (
                          <g transform="translate(0, 0)">
                            <rect
                              x="-45"
                              y="-15"
                              width="90"
                              height="16"
                              rx="8"
                              fill="#d97706"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                            >
                              detached HEAD
                            </text>
                          </g>
                        )}

                        {/* Tags */}
                        {node.tags.map((t, tIdx) => (
                          <g key={t} transform={`translate(0, ${-(node.branches.length + tIdx) * 19})`}>
                            <rect
                              x={-((t.length * 6 + 16) / 2)}
                              y="-15"
                              width={t.length * 6 + 16}
                              height="16"
                              rx="8"
                              fill="#ca8a04"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                            >
                              🏷️ {t}
                            </text>
                          </g>
                        ))}

                        {/* Remotes */}
                        {node.remotes.map((r, rIdx) => (
                          <g key={r} transform={`translate(0, ${-(node.branches.length + node.tags.length + rIdx) * 19})`}>
                            <rect
                              x={-((r.length * 6 + 16) / 2)}
                              y="-15"
                              width={r.length * 6 + 16}
                              height="16"
                              rx="8"
                              fill="#4f46e5"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                            >
                              🌐 {r}
                            </text>
                          </g>
                        ))}
                      </g>

                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <g transform="translate(0, 52)" className="pointer-events-none z-50">
                          <rect
                            x="-110"
                            y="0"
                            width="220"
                            height="60"
                            rx="8"
                            fill="#0f172a"
                            stroke="#334155"
                            strokeWidth="1"
                            className="shadow-2xl"
                          />
                          <text x="0" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-orange-400">
                            Commit {node.shortHash}
                          </text>
                          <text x="0" y="32" textAnchor="middle" className="text-[9px] font-sans fill-slate-200">
                            {node.message.length > 32 ? node.message.slice(0, 32) + '…' : node.message}
                          </text>
                          <text x="0" y="47" textAnchor="middle" className="text-[8px] font-mono fill-slate-400">
                            Click node to inspect snapshot & diff
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      )}

      {/* Modal for commit inspection */}
      {selectedCommit && (
        <CommitDetailModal
          commit={activeCommitObj}
          onClose={() => setSelectedCommit(null)}
          onSelectCommit={(hash) => setSelectedCommit(hash)}
        />
      )}
    </section>
  );
}
