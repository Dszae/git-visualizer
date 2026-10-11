/**
 * Topological layout calculator for Git commit DAG
 */

export function calculateGraphLayout(state) {
  const { commits, branches, HEAD, tags, remotes } = state;
  const commitList = Object.values(commits);

  if (commitList.length === 0) {
    return { nodes: [], edges: [], width: 400, height: 200 };
  }

  // 1. Build adjacency maps
  const childrenMap = {};
  const parentMap = {};
  commitList.forEach(c => {
    childrenMap[c.hash] = [];
    parentMap[c.hash] = c.parentHashes || [];
  });

  commitList.forEach(c => {
    (c.parentHashes || []).forEach(pHash => {
      if (childrenMap[pHash]) {
        childrenMap[pHash].push(c.hash);
      }
    });
  });

  // 2. Topological sort (oldest to newest)
  // Roots are commits with 0 parents
  const inDegree = {};
  commitList.forEach(c => {
    inDegree[c.hash] = (c.parentHashes || []).length;
  });

  const queue = commitList.filter(c => inDegree[c.hash] === 0);
  queue.sort((a, b) => a.timestamp - b.timestamp);

  const sorted = [];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.hash)) continue;
    visited.add(current.hash);
    sorted.push(current);

    const children = childrenMap[current.hash] || [];
    children.forEach(chHash => {
      inDegree[chHash]--;
      if (inDegree[chHash] <= 0 && !visited.has(chHash)) {
        queue.push(commits[chHash]);
      }
    });
    queue.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Add any unvisited (e.g. disconnected)
  commitList.forEach(c => {
    if (!visited.has(c.hash)) sorted.push(c);
  });

  // 3. Assign lanes
  // Lanes track active branches
  const laneOccupants = []; // lane index -> last commit hash on that lane
  const commitLanes = {};

  sorted.forEach((c) => {
    const parents = c.parentHashes || [];
    let assignedLane = -1;

    // Check if we can continue first parent's lane
    if (parents.length > 0) {
      const p1 = parents[0];
      const p1Lane = commitLanes[p1];
      if (p1Lane !== undefined && laneOccupants[p1Lane] === p1) {
        assignedLane = p1Lane;
      }
    }

    // Otherwise find first empty lane
    if (assignedLane === -1) {
      assignedLane = laneOccupants.findIndex(occ => occ === null);
      if (assignedLane === -1) {
        assignedLane = laneOccupants.length;
        laneOccupants.push(null);
      }
    }

    commitLanes[c.hash] = assignedLane;
    laneOccupants[assignedLane] = c.hash;

    // If commit was a merge, other parent lanes might become available if no other children
  });

  // 4. Coordinates
  const NODE_SPACING_X = 120;
  const LANE_SPACING_Y = 85;
  const START_X = 80;
  const START_Y = 80;

  const nodes = sorted.map((c, idx) => {
    const lane = commitLanes[c.hash] || 0;
    const x = START_X + idx * NODE_SPACING_X;
    const y = START_Y + lane * LANE_SPACING_Y;

    // Branch references pointing to this commit
    const refBranches = Object.entries(branches)
      .filter(([, bHash]) => bHash === c.hash)
      .map(([bName]) => ({
        name: bName,
        isHead: HEAD.type === 'branch' && HEAD.name === bName
      }));

    // Remote tracking references
    const refRemotes = [];
    Object.entries(remotes || {}).forEach(([rName, remote]) => {
      Object.entries(remote.branches || {}).forEach(([rbName, rbHash]) => {
        if (rbHash === c.hash) {
          refRemotes.push(`${rName}/${rbName}`);
        }
      });
    });

    // Tag references
    const refTags = Object.entries(tags || {})
      .filter(([, tHash]) => tHash === c.hash)
      .map(([tName]) => tName);

    const isDetachedHead = HEAD.type === 'detached' && HEAD.name === c.hash;

    return {
      hash: c.hash,
      shortHash: c.shortHash || c.hash.slice(0, 7),
      message: c.message,
      author: c.author,
      timestamp: c.timestamp,
      parentHashes: c.parentHashes || [],
      tree: c.tree || {},
      lane,
      x,
      y,
      branches: refBranches,
      remotes: refRemotes,
      tags: refTags,
      isHead: isDetachedHead || refBranches.some(b => b.isHead),
      isDetachedHead
    };
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.hash] = n; });

  // 5. Generate Edges (Parent -> Child)
  const edges = [];
  nodes.forEach(child => {
    child.parentHashes.forEach(pHash => {
      const parent = nodeMap[pHash];
      if (parent) {
        // Curve if different lanes, straight line if same lane
        const isCurved = parent.lane !== child.lane;
        let path = '';
        if (isCurved) {
          const midX = (parent.x + child.x) / 2;
          path = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${child.y}, ${child.x} ${child.y}`;
        } else {
          path = `M ${parent.x} ${parent.y} L ${child.x} ${child.y}`;
        }

        edges.push({
          id: `${pHash}->${child.hash}`,
          parentHash: pHash,
          childHash: child.hash,
          path,
          isCurved,
          isMerge: child.parentHashes.length > 1
        });
      }
    });
  });

  const maxLane = Math.max(...nodes.map(n => n.lane), 0);
  const totalWidth = Math.max(START_X + (nodes.length + 1) * NODE_SPACING_X, 600);
  const totalHeight = Math.max(START_Y + (maxLane + 2) * LANE_SPACING_Y, 260);

  return { nodes, edges, width: totalWidth, height: totalHeight };
}
