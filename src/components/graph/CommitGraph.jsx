import React, { useState, useRef, useEffect, useMemo } from 'react';
import CommitDetailModal from './CommitDetailModal.jsx';

/**
 * Calculates deterministic visual layout coordinates (X, Y) for Git commit DAG
 */
function computeGraphLayout(commits, branches, head) {
  const commitList = Object.values(commits || {});
  if (commitList.length === 0) return { nodes: [], edges: [] };

  // Sort commits topologically / chronologically
  const sortedCommits = [...commitList].sort((a, b) => a.timestamp - b.timestamp);

  // Map hashes to branch names
  const branchMap = {};
  Object.entries(branches || {}).forEach(([bName, bHash]) => {
    if (!branchMap[bHash]) branchMap[bHash] = [];
    branchMap[bHash].push({
      name: bName,
      isHead: head.type === 'branch' && head.name === bName
    });
  });

  // Assign lane (Y coordinate) to avoid overlapping lines
  const lanes = {}; // hash -> laneIndex
  let maxLane = 0;

  sortedCommits.forEach((commit, idx) => {
    if (idx === 0) {
      lanes[commit.hash] = 0;
      return;
    }

    const parents = commit.parentHashes || [];
    if (parents.length === 0) {
      maxLane++;
      lanes[commit.hash] = maxLane;
    } else {
      const primaryParent = parents[0];
      const parentLane = lanes[primaryParent] !== undefined ? lanes[primaryParent] : 0;
      
      const siblingInSameLane = sortedCommits.slice(0, idx).some(prev => 
        lanes[prev.hash] === parentLane && 
        prev.parentHashes?.includes(primaryParent) && 
        prev.hash !== commit.hash
      );

      if (siblingInSameLane) {
        maxLane++;
        lanes[commit.hash] = maxLane;
      } else {
        lanes[commit.hash] = parentLane;
      }
    }
  });

  // Calculate coordinates with comfortable spacing
  const SPACING_X = 140;
  const SPACING_Y = 85;
  const OFFSET_X = 80;
  const OFFSET_Y = 90;

  const nodes = sortedCommits.map((commit, idx) => {
    const lane = lanes[commit.hash] || 0;
    const x = OFFSET_X + idx * SPACING_X;
    const y = OFFSET_Y + lane * SPACING_Y;

    const isHead = head.type === 'detached' 
      ? head.name === commit.hash 
      : (branches[head.name] === commit.hash);

    const isDetachedHead = head.type === 'detached' && head.name === commit.hash;

    return {
      hash: commit.hash,
      shortHash: commit.hash.slice(0, 7),
      message: commit.message,
      author: commit.author,
      timestamp: commit.timestamp,
      parentHashes: commit.parentHashes || [],
      branches: branchMap[commit.hash] || [],
      tags: commit.tags || [],
      remotes: commit.remotes || [],
      isHead,
      isDetachedHead,
      x,
      y,
      lane
    };
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.hash] = n; });

  const edges = [];
  nodes.forEach(node => {
    node.parentHashes.forEach(parentHash => {
      const parent = nodeMap[parentHash];
      if (parent) {
        const isMerge = node.parentHashes.length > 1;
        const deltaX = node.x - parent.x;
        const deltaY = node.y - parent.y;

        let path = '';
        if (deltaY === 0) {
          path = `M ${parent.x} ${parent.y} L ${node.x} ${node.y}`;
        } else {
          const controlX1 = parent.x + deltaX * 0.5;
          const controlX2 = node.x - deltaX * 0.2;
          path = `M ${parent.x} ${parent.y} C ${controlX1} ${parent.y}, ${controlX2} ${node.y}, ${node.x} ${node.y}`;
        }

        edges.push({
          id: `${parent.hash}->${node.hash}`,
          path,
          from: parent,
          to: node,
          isMerge
        });
      }
    });
  });

  return { nodes, edges };
}

export default function CommitGraph({ state, isDark = true }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [hoveredHash, setHoveredHash] = useState(null);
  const [showTableView, setShowTableView] = useState(false);

  const { nodes, edges } = useMemo(() => {
    return computeGraphLayout(state?.commits, state?.branches, state?.HEAD);
  }, [state]);

  // Center on latest commit automatically
  useEffect(() => {
    if (nodes.length > 0 && containerRef.current) {
      const lastNode = nodes[nodes.length - 1];
      const containerWidth = containerRef.current.clientWidth || 800;
      const containerHeight = containerRef.current.clientHeight || 400;

      if (lastNode.x > containerWidth * 0.7) {
        setPan({
          x: Math.max(0, containerWidth * 0.75 - lastNode.x),
          y: Math.max(0, (containerHeight / 2) - lastNode.y)
        });
      }
    }
  }, [nodes]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Touch Panning for Mobile & Tablet Devices
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [startTouchPan, setStartTouchPan] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsTouchPanning(true);
      const touch = e.touches[0];
      setStartTouchPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isTouchPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - startTouchPan.x,
      y: touch.clientY - startTouchPan.y
    });
  };

  const handleTouchEnd = () => setIsTouchPanning(false);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePanLeft = () => setPan(p => ({ ...p, x: p.x + 80 }));
  const handlePanRight = () => setPan(p => ({ ...p, x: p.x - 80 }));

  const activeCommitObj = selectedCommit ? state.commits[selectedCommit] : null;

  return (
    <section 
      aria-label="Git Commit Graph"
      className={`relative w-full h-[330px] sm:h-[400px] lg:h-[460px] rounded-xl border flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      {/* Top Toolbar */}
      <div className={`px-3 sm:px-4 py-2 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs z-20 ${
        isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
      }`}>
        {/* Left: Clear Status */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {nodes.length} {nodes.length === 1 ? 'commit' : 'commits'}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          {state.HEAD.type === 'detached' ? (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 truncate max-w-[140px] sm:max-w-none">
              HEAD detached at {state.HEAD.name.slice(0, 7)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 truncate max-w-[140px] sm:max-w-none inline-flex items-center gap-1">
              <span>HEAD</span>
              <svg aria-hidden="true" className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
              <span>{state.HEAD.name}</span>
            </span>
          )}
        </div>

        {/* Center: Friendly Legend for Absolute Beginners */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-zinc-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 inline-block"></span>
            <span>Commit</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            <span>HEAD</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1 py-0.2 rounded text-[9px] bg-zinc-200 dark:bg-zinc-700 font-mono text-zinc-800 dark:text-zinc-200 font-bold">
              branch
            </span>
            <span>Branch Pointer</span>
          </span>
        </div>

        {/* Right: Unobtrusive Zoom, Pan & View Controls */}
        <div className="flex items-center gap-1 font-mono ml-auto sm:ml-0">
          <button
            onClick={handlePanLeft}
            aria-label="Pan graph left"
            title="Pan left"
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handlePanRight}
            aria-label="Pan graph right"
            title="Pan right"
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="text-zinc-300 dark:text-zinc-700 mx-0.5">·</span>

          <button
            onClick={() => setShowTableView(!showTableView)}
            aria-label={showTableView ? "Switch to graph view" : "Switch to accessible table view"}
            className="px-2 py-1 rounded text-xs font-sans font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {showTableView ? 'Graph' : 'Table'}
          </button>
          
          <span className="text-zinc-300 dark:text-zinc-700 mx-0.5">·</span>

          <button
            onClick={handleZoomOut}
            aria-label="Zoom out commit graph"
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 w-9 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in commit graph"
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            aria-label="Fit graph to view"
            className="px-2 py-1 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Accessible Table View */}
      {showTableView ? (
        <div className="flex-1 overflow-auto p-4 text-xs font-mono">
          <table className="w-full text-left border-collapse" aria-label="Commit log table">
            <thead>
              <tr className={`border-b ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
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
                  className={`border-b transition-colors ${node.isHead ? (isDark ? 'bg-orange-500/10' : 'bg-orange-50/60') : ''} ${
                    isDark ? 'border-zinc-800/80 hover:bg-zinc-900 text-zinc-200' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-orange-600 dark:text-orange-400">{node.shortHash}</td>
                  <td className="py-2.5 px-3 max-w-xs truncate">{node.message}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {node.branches.map(b => (
                        <span key={b.name} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                          {b.isHead ? 'HEAD / ' : ''}{b.name}
                        </span>
                      ))}
                      {node.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                          tag: {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    {node.parentHashes.map(p => p.slice(0, 7)).join(', ') || 'root'}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setSelectedCommit(node.hash)}
                      className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs transition-colors"
                    >
                      Details
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing touch-none select-none ${
            isDark ? 'bg-zinc-950' : 'bg-zinc-50/50'
          }`}
        >
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <p className="font-medium text-sm text-zinc-800 dark:text-zinc-200">No commits in repository yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Stage your files and create a commit to see your history appear.</p>
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              className="w-full h-full"
              style={{ overflow: 'visible' }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* 1. Parent-Child Connecting Edges */}
                {edges.map(edge => (
                  <path
                    key={edge.id}
                    d={edge.path}
                    fill="none"
                    stroke={edge.isMerge ? (isDark ? '#a855f7' : '#9333ea') : (isDark ? '#52525b' : '#cbd5e1')}
                    strokeWidth={edge.isMerge ? '2.5' : '2'}
                    strokeDasharray={edge.isMerge ? '4 3' : 'none'}
                    className="transition-colors duration-200"
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
                      role="button"
                      tabIndex={0}
                      aria-label={`Commit ${node.shortHash}: ${node.message}. Press Enter to inspect details.`}
                      className="interactive-node cursor-pointer group focus:outline-none"
                      onMouseEnter={() => setHoveredHash(node.hash)}
                      onMouseLeave={() => setHoveredHash(null)}
                      onFocus={() => setHoveredHash(node.hash)}
                      onBlur={() => setHoveredHash(null)}
                      onClick={() => setSelectedCommit(node.hash)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCommit(node.hash);
                        }
                      }}
                    >
                      {/* HEAD Outer Indicator (Clean, non-spinning) */}
                      {isHeadNode && (
                        <circle
                          r="19"
                          fill="none"
                          stroke="#ea580c"
                          strokeWidth="2"
                          strokeOpacity="0.4"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={isMergeNode ? '14' : '12'}
                        fill={isHeadNode ? '#ea580c' : (isMergeNode ? (isDark ? '#9333ea' : '#7e22ce') : (isDark ? '#27272a' : '#ffffff'))}
                        stroke={isHeadNode ? '#ea580c' : (isMergeNode ? '#a855f7' : (isDark ? '#71717a' : '#94a3b8'))}
                        strokeWidth={isHovered ? '3' : '2'}
                        className="transition-all duration-150"
                      />

                      {/* Inner dot for merge commits */}
                      {isMergeNode && (
                        <circle r="4" fill="#ffffff" />
                      )}

                      {/* Abbreviated Hash Label */}
                      <text
                        y={isMergeNode ? 26 : 24}
                        textAnchor="middle"
                        className={`text-xs font-mono font-semibold ${
                          isDark ? 'fill-zinc-200' : 'fill-zinc-800'
                        } group-hover:fill-orange-600 dark:group-hover:fill-orange-400 transition-colors pointer-events-none`}
                      >
                        {node.shortHash}
                      </text>

                      {/* Commit Message Snippet */}
                      <text
                        y={isMergeNode ? 38 : 36}
                        textAnchor="middle"
                        className={`text-[11px] font-sans ${
                          isDark ? 'fill-zinc-400' : 'fill-zinc-600'
                        } max-w-[100px] truncate pointer-events-none`}
                      >
                        {node.message.length > 18 ? node.message.slice(0, 18) + '…' : node.message}
                      </text>

                      {/* Ref Labels Stacked Above Node */}
                      <g transform="translate(0, -20)">
                        {/* Branches */}
                        {node.branches.map((b, bIdx) => (
                          <g key={b.name} transform={`translate(0, ${-bIdx * 20})`}>
                            <rect
                              x={-((b.name.length * 7 + (b.isHead ? 46 : 20)) / 2)}
                              y="-16"
                              width={b.name.length * 7 + (b.isHead ? 46 : 20)}
                              height="18"
                              rx="5"
                              fill={b.isHead ? '#ea580c' : (isDark ? '#27272a' : '#f4f4f5')}
                              stroke={b.isHead ? '#ea580c' : (isDark ? '#3f3f46' : '#e4e4e7')}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className={`text-[10px] font-mono font-medium ${
                                b.isHead ? 'fill-white' : (isDark ? 'fill-zinc-200' : 'fill-zinc-800')
                              } pointer-events-none`}
                            >
                              {b.isHead ? 'HEAD / ' : ''}{b.name}
                            </text>
                          </g>
                        ))}

                        {/* Detached HEAD Badge */}
                        {node.isDetachedHead && (
                          <g transform="translate(0, 0)">
                            <rect
                              x="-44"
                              y="-16"
                              width="88"
                              height="18"
                              rx="5"
                              fill="#d97706"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className="text-[10px] font-mono font-medium fill-white pointer-events-none"
                            >
                              detached HEAD
                            </text>
                          </g>
                        )}

                        {/* Tags */}
                        {node.tags.map((t, tIdx) => (
                          <g key={t} transform={`translate(0, ${-(node.branches.length + tIdx) * 20})`}>
                            <rect
                              x={-((t.length * 7 + 24) / 2)}
                              y="-16"
                              width={t.length * 7 + 24}
                              height="18"
                              rx="5"
                              fill={isDark ? '#3f3f46' : '#e4e4e7'}
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className={`text-[10px] font-mono ${isDark ? 'fill-zinc-200' : 'fill-zinc-800'} pointer-events-none`}
                            >
                              tag: {t}
                            </text>
                          </g>
                        ))}

                        {/* Remotes */}
                        {node.remotes.map((r, rIdx) => (
                          <g key={r} transform={`translate(0, ${-(node.branches.length + node.tags.length + rIdx) * 20})`}>
                            <rect
                              x={-((r.length * 7 + 16) / 2)}
                              y="-16"
                              width={r.length * 7 + 16}
                              height="18"
                              rx="5"
                              fill={isDark ? '#1e1b4b' : '#e0e7ff'}
                              stroke={isDark ? '#3730a3' : '#c7d2fe'}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="-3.5"
                              textAnchor="middle"
                              className={`text-[10px] font-mono ${isDark ? 'fill-indigo-300' : 'fill-indigo-700'} pointer-events-none`}
                            >
                              {r}
                            </text>
                          </g>
                        ))}
                      </g>

                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <g transform="translate(0, 48)" className="pointer-events-none z-50">
                          <rect
                            x="-110"
                            y="0"
                            width="220"
                            height="52"
                            rx="6"
                            fill={isDark ? '#18181b' : '#ffffff'}
                            stroke={isDark ? '#3f3f46' : '#e4e4e7'}
                            strokeWidth="1"
                            className="shadow-lg"
                          />
                          <text x="0" y="18" textAnchor="middle" className={`text-xs font-mono font-semibold ${isDark ? 'fill-zinc-100' : 'fill-zinc-900'}`}>
                            Commit {node.shortHash}
                          </text>
                          <text x="0" y="34" textAnchor="middle" className={`text-[11px] font-sans ${isDark ? 'fill-zinc-400' : 'fill-zinc-600'}`}>
                            {node.message.length > 28 ? node.message.slice(0, 28) + '…' : node.message}
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

      {/* Bottom Guidance Strip for Absolute Beginners */}
      <div className={`px-4 py-2 border-t flex items-center justify-between text-xs text-zinc-500 z-10 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <span className="flex items-center gap-1.5">
          <span className="text-orange-500 font-bold">Tip:</span>
          <span>Click any commit circle to inspect its file snapshots. Drag canvas to pan.</span>
        </span>
        <span className="hidden sm:inline font-mono text-[11px] text-zinc-400">
          Scroll to zoom
        </span>
      </div>

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
