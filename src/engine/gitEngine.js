/**
 * Git Visualizer - Core Git Repository Simulator Engine
 * 
 * Deterministic, accurate model of:
 * - Working Directory (untracked, modified, clean, conflicted)
 * - Staging Area / Index
 * - Local Repository (DAG of commits with multi-parent support)
 * - Remote Repository (remotes, tracking branches, fetch/pull/push semantics)
 * - Branches and HEAD (including detached HEAD)
 * - Tags, Stash stack, Reflog
 * - Merging (fast-forward, 3-way merge, conflict detection & abort)
 * - Rebase, Cherry-pick, Reset (soft/mixed/hard), Revert, Restore
 */

// Generate deterministic pseudo-hashes
let hashCounter = 1000;
export function generateHash(prefix = 'c') {
  hashCounter++;
  const hex = (hashCounter * 2654435761 >>> 0).toString(16).padStart(7, '0').slice(0, 7);
  return `${prefix}${hex.slice(1)}`;
}

export function resetHashCounter(seed = 1000) {
  hashCounter = seed;
}

/**
 * Creates the initial empty repository state
 */
export function createEmptyRepo() {
  return {
    isInitialized: false,
    workingDir: {
      files: {}
    },
    index: {
      files: {}
    },
    commits: {},
    branches: {},
    HEAD: {
      type: 'branch',
      name: 'main'
    },
    tags: {},
    stash: [],
    remotes: {},
    mergeState: null,
    reflog: [],
    history: []
  };
}

/**
 * Creates a rich, realistic default repository for immediate hands-on learning
 */
export function createDefaultRepo() {
  const c1Hash = 'c1a2b34';
  const c2Hash = 'c2d3e4f';
  const c3Hash = 'c3f4a5b';
  const now = Date.now();

  const c1 = {
    hash: c1Hash,
    shortHash: c1Hash,
    parentHashes: [],
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message: 'Initial commit: add project readme and license',
    timestamp: now - 3600000 * 24 * 3,
    tree: {
      'README.md': '# Project\nA modern web application.',
      'LICENSE': 'MIT License 2026'
    }
  };

  const c2 = {
    hash: c2Hash,
    shortHash: c2Hash,
    parentHashes: [c1Hash],
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message: 'feat: setup core application entry point',
    timestamp: now - 3600000 * 24 * 2,
    tree: {
      'README.md': '# Project\nA modern web application.',
      'LICENSE': 'MIT License 2026',
      'index.js': 'console.log("Starting server on port 3000");'
    }
  };

  const c3 = {
    hash: c3Hash,
    shortHash: c3Hash,
    parentHashes: [c2Hash],
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message: 'feat: implement basic API route handlers',
    timestamp: now - 3600000 * 24,
    tree: {
      'README.md': '# Project\nA modern web application with API support.',
      'LICENSE': 'MIT License 2026',
      'index.js': 'console.log("Starting server on port 3000");\napp.get("/api/health", (req, res) => res.json({ status: "ok" }));'
    }
  };

  return {
    isInitialized: true,
    workingDir: {
      files: {
        'README.md': {
          content: '# Project\nA modern web application with API support.',
          status: 'clean'
        },
        'LICENSE': {
          content: 'MIT License 2026',
          status: 'clean'
        },
        'index.js': {
          content: 'console.log("Starting server on port 3000");\napp.get("/api/health", (req, res) => res.json({ status: "ok" }));\n// TODO: add database connection',
          status: 'modified'
        },
        'utils.js': {
          content: 'export const formatDate = (d) => new Date(d).toISOString();',
          status: 'untracked'
        }
      }
    },
    index: {
      files: {
        'README.md': {
          content: '# Project\nA modern web application with API support.'
        },
        'LICENSE': {
          content: 'MIT License 2026'
        },
        'index.js': {
          content: 'console.log("Starting server on port 3000");\napp.get("/api/health", (req, res) => res.json({ status: "ok" }));'
        }
      }
    },
    commits: {
      [c1Hash]: c1,
      [c2Hash]: c2,
      [c3Hash]: c3
    },
    branches: {
      'main': c3Hash
    },
    HEAD: {
      type: 'branch',
      name: 'main'
    },
    tags: {
      'v0.1.0': c1Hash
    },
    stash: [],
    remotes: {
      'origin': {
        name: 'origin',
        url: 'https://github.com/dszae/my-app.git',
        branches: {
          'main': c2Hash
        }
      }
    },
    mergeState: null,
    reflog: [
      {
        index: 0,
        hash: c3Hash,
        selector: 'HEAD@{0}',
        action: 'commit: feat: implement basic API route handlers',
        timestamp: now - 3600000 * 24
      },
      {
        index: 1,
        hash: c2Hash,
        selector: 'HEAD@{1}',
        action: 'commit: feat: setup core application entry point',
        timestamp: now - 3600000 * 24 * 2
      },
      {
        index: 2,
        hash: c1Hash,
        selector: 'HEAD@{2}',
        action: 'commit (initial): Initial commit: add project readme and license',
        timestamp: now - 3600000 * 24 * 3
      }
    ]
  };
}

/**
 * Deep clone repository state helper
 */
export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Resolve current commit hash pointed by HEAD
 */
export function getHeadCommitHash(state) {
  if (!state.isInitialized) return null;
  if (state.HEAD.type === 'detached') {
    return state.HEAD.name;
  }
  const branchName = state.HEAD.name;
  return state.branches[branchName] || null;
}

/**
 * Helper to add reflog entry
 */
function addReflog(state, hash, action) {
  const newEntry = {
    index: 0,
    hash: hash || '0000000',
    selector: `HEAD@{0}`,
    action,
    timestamp: Date.now()
  };
  const updated = [newEntry, ...state.reflog.map((e, idx) => ({
    ...e,
    index: idx + 1,
    selector: `HEAD@{${idx + 1}}`
  }))];
  state.reflog = updated.slice(0, 50); // Keep last 50
}

/**
 * Parses user input command into tokens
 */
export function parseCommandLine(commandString) {
  const trimmed = commandString.trim();
  if (!trimmed) return [];

  const tokens = [];
  let current = '';
  let inQuote = null;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Main command dispatcher
 */
export function executeCommand(currentState, rawCommand) {
  const state = cloneState(currentState);
  const tokens = parseCommandLine(rawCommand);

  if (tokens.length === 0) {
    return {
      state: currentState,
      output: '',
      error: null,
      explanation: null
    };
  }

  const base = tokens[0].toLowerCase();

  // Validate git prefix
  if (base !== 'git') {
    return {
      state: currentState,
      output: '',
      error: `command not found: ${base}. Did you mean to type a 'git' command?`,
      explanation: {
        command: rawCommand,
        success: false,
        summary: `Invalid command: ${base}`,
        details: 'The terminal accepts Git commands starting with `git` (e.g. `git status`, `git commit`).'
      }
    };
  }

  if (tokens.length === 1) {
    return {
      state: currentState,
      output: `usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           [--config-env=<name>=<envvar>] <command> [<args>]\n\nThese are common Git commands used in various situations:\n  init, status, add, commit, diff, branch, checkout, switch, merge, rebase, log, stash, fetch, pull, push`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: 'Displayed Git usage information',
        details: 'Type `git --help` or specific commands like `git status` or `git log`.'
      }
    };
  }

  const subCommand = tokens[1].toLowerCase();
  const args = tokens.slice(2);

  // Commands allowed without init
  if (!state.isInitialized && subCommand !== 'init' && subCommand !== 'clone') {
    return {
      state: currentState,
      output: '',
      error: 'fatal: not a git repository (or any of the parent directories): .git\nRun "git init" to create a new Git repository.',
      explanation: {
        command: rawCommand,
        success: false,
        summary: 'Repository not initialized',
        details: 'Before running Git operations, the repository must be initialized with `git init` or cloned with `git clone`.'
      }
    };
  }

  switch (subCommand) {
    case 'init':
      return handleInit(state, args, rawCommand);
    case 'status':
      return handleStatus(state, args, rawCommand);
    case 'add':
      return handleAdd(state, args, rawCommand);
    case 'commit':
      return handleCommit(state, args, rawCommand);
    case 'log':
      return handleLog(state, args, rawCommand);
    case 'diff':
      return handleDiff(state, args, rawCommand);
    case 'branch':
      return handleBranch(state, args, rawCommand);
    case 'switch':
      return handleSwitch(state, args, rawCommand);
    case 'checkout':
      return handleCheckout(state, args, rawCommand);
    case 'merge':
      return handleMerge(state, args, rawCommand);
    case 'rebase':
      return handleRebase(state, args, rawCommand);
    case 'stash':
      return handleStash(state, args, rawCommand);
    case 'fetch':
      return handleFetch(state, args, rawCommand);
    case 'pull':
      return handlePull(state, args, rawCommand);
    case 'push':
      return handlePush(state, args, rawCommand);
    case 'clone':
      return handleClone(state, args, rawCommand);
    case 'remote':
      return handleRemote(state, args, rawCommand);
    case 'tag':
      return handleTag(state, args, rawCommand);
    case 'show':
      return handleShow(state, args, rawCommand);
    case 'restore':
      return handleRestore(state, args, rawCommand);
    case 'reset':
      return handleReset(state, args, rawCommand);
    case 'revert':
      return handleRevert(state, args, rawCommand);
    case 'cherry-pick':
      return handleCherryPick(state, args, rawCommand);
    case 'reflog':
      return handleReflog(state, args, rawCommand);
    default:
      return {
        state: currentState,
        output: '',
        error: `git: '${subCommand}' is not a git command. See 'git --help'.`,
        explanation: {
          command: rawCommand,
          success: false,
          summary: `Unknown Git command '${subCommand}'`,
          details: 'Please try standard Git commands such as add, commit, branch, switch, merge, status, log, diff, or stash.'
        }
      };
  }
}

// ==========================================
// INDIVIDUAL COMMAND HANDLERS
// ==========================================

function handleInit(state, args, rawCommand) {
  const isReinit = state.isInitialized;
  state.isInitialized = true;
  if (!state.branches['main']) {
    state.branches = {};
    state.HEAD = { type: 'branch', name: 'main' };
  }

  const output = isReinit 
    ? 'Reinitialized existing Git repository in /workspace/.git/'
    : 'Initialized empty Git repository in /workspace/.git/';

  return {
    state,
    output,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: isReinit ? 'Reinitialized repository' : 'Initialized new Git repository',
      details: 'Created an empty Git repository. The .git metadata folder is initialized, HEAD points to the default branch "main", and files can now be tracked.',
      changes: [{ type: 'REPO', description: 'Created or verified .git directory' }],
      unchanged: ['Existing files in working directory are left intact'],
      resultingState: 'Repository active on branch "main"',
      nextSuggestions: ['git status', 'git add <file>', 'git commit -m "Initial commit"']
    }
  };
}

function handleStatus(state, args, rawCommand) {
  const headHash = getHeadCommitHash(state);
  const branchName = state.HEAD.type === 'branch' ? state.HEAD.name : `HEAD detached at ${state.HEAD.name}`;
  
  let out = `On branch ${branchName}\n`;
  if (state.HEAD.type === 'detached') {
    out = `HEAD detached at ${state.HEAD.name}\n`;
  }

  // Remote tracking comparison
  const remoteBranch = state.remotes['origin']?.branches?.[state.HEAD.name];
  if (remoteBranch && headHash) {
    if (remoteBranch === headHash) {
      out += `Your branch is up to date with 'origin/${state.HEAD.name}'.\n`;
    } else {
      // Check ahead / behind
      const isAhead = isAncestor(state, remoteBranch, headHash);
      const isBehind = isAncestor(state, headHash, remoteBranch);
      if (isAhead) {
        out += `Your branch is ahead of 'origin/${state.HEAD.name}' by 1 commit.\n  (use "git push" to publish your local commits)\n`;
      } else if (isBehind) {
        out += `Your branch is behind 'origin/${state.HEAD.name}' by 1 commit, and can be fast-forwarded.\n  (use "git pull" to update your local branch)\n`;
      } else {
        out += `Your branch and 'origin/${state.HEAD.name}' have diverged.\n`;
      }
    }
  }

  // Merge state check
  if (state.mergeState?.inProgress) {
    out += `\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\nUnmerged paths:\n`;
    state.mergeState.conflictedFiles?.forEach(f => {
      out += `\tboth modified:   ${f}\n`;
    });
  }

  // Check staged changes
  const headTree = headHash && state.commits[headHash] ? state.commits[headHash].tree : {};
  const stagedChanges = [];
  const indexFiles = state.index.files;

  Object.keys(indexFiles).forEach(file => {
    if (!headTree[file]) {
      stagedChanges.push(`new file:   ${file}`);
    } else if (indexFiles[file].content !== headTree[file]) {
      stagedChanges.push(`modified:   ${file}`);
    }
  });

  // Tracked deleted in index
  Object.keys(headTree).forEach(file => {
    if (!indexFiles[file]) {
      stagedChanges.push(`deleted:    ${file}`);
    }
  });

  // Check unstaged changes
  const unstagedChanges = [];
  const untrackedFiles = [];
  const workingFiles = state.workingDir.files;

  Object.keys(workingFiles).forEach(file => {
    const wf = workingFiles[file];
    if (wf.status === 'conflicted') return;
    
    if (!indexFiles[file] && !headTree[file]) {
      untrackedFiles.push(file);
    } else if (indexFiles[file]) {
      if (wf.content !== indexFiles[file].content) {
        unstagedChanges.push(`modified:   ${file}`);
      }
    }
  });

  // Files in index deleted from working dir
  Object.keys(indexFiles).forEach(file => {
    if (!workingFiles[file]) {
      unstagedChanges.push(`deleted:    ${file}`);
    }
  });

  if (stagedChanges.length > 0) {
    out += `\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n`;
    stagedChanges.forEach(sc => {
      out += `\t\x1b[32m${sc}\x1b[0m\n`;
    });
  }

  if (unstagedChanges.length > 0) {
    out += `\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n`;
    unstagedChanges.forEach(uc => {
      out += `\t\x1b[31m${uc}\x1b[0m\n`;
    });
  }

  if (untrackedFiles.length > 0) {
    out += `\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n`;
    untrackedFiles.forEach(uf => {
      out += `\t\x1b[31m${uf}\x1b[0m\n`;
    });
  }

  if (stagedChanges.length === 0 && unstagedChanges.length === 0 && untrackedFiles.length === 0 && !state.mergeState?.inProgress) {
    out += `\nnothing to commit, working tree clean\n`;
  }

  return {
    state,
    output: out,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: 'Inspected repository status',
      details: `Current branch is ${branchName}. Staged files: ${stagedChanges.length}, Unstaged files: ${unstagedChanges.length}, Untracked files: ${untrackedFiles.length}.`,
      changes: [],
      unchanged: ['No files or references were modified by git status'],
      resultingState: `Branch ${branchName} status inspected`,
      nextSuggestions: stagedChanges.length > 0 ? ['git commit -m "commit message"'] : untrackedFiles.length > 0 || unstagedChanges.length > 0 ? ['git add .'] : ['git log --oneline']
    }
  };
}

function handleAdd(state, args, rawCommand) {
  if (args.length === 0) {
    return {
      state,
      output: '',
      error: 'Nothing specified, nothing added.\nMaybe you wanted to say "git add ."?',
      explanation: {
        command: rawCommand,
        success: false,
        summary: 'Missing argument for git add',
        details: 'You must specify which files to add (e.g. `git add .` or `git add filename`).'
      }
    };
  }

  const target = args[0];
  const stagedFiles = [];
  const workingFiles = state.workingDir.files;

  if (target === '.' || target === '-A' || target === '--all') {
    // Add all untracked and modified files
    Object.keys(workingFiles).forEach(filename => {
      const file = workingFiles[filename];
      if (file.status !== 'conflicted') {
        state.index.files[filename] = { content: file.content };
        file.status = 'staged';
        stagedFiles.push(filename);
      } else {
        // If conflicted file was resolved and added
        state.index.files[filename] = { content: file.content };
        file.status = 'staged';
        stagedFiles.push(filename);
      }
    });

    // Check if merge conflicts were resolved
    if (state.mergeState?.inProgress) {
      const stillConflicted = Object.values(state.workingDir.files).some(f => f.status === 'conflicted');
      if (!stillConflicted) {
        state.mergeState.conflictedFiles = [];
      }
    }
  } else {
    // Add specific file(s)
    args.forEach(f => {
      if (workingFiles[f]) {
        state.index.files[f] = { content: workingFiles[f].content };
        workingFiles[f].status = 'staged';
        stagedFiles.push(f);
      }
    });

    if (stagedFiles.length === 0) {
      return {
        state,
        output: '',
        error: `fatal: pathspec '${target}' did not match any files`,
        explanation: {
          command: rawCommand,
          success: false,
          summary: `File not found: ${target}`,
          details: `The file '${target}' does not exist in the working directory.`
        }
      };
    }
  }

  return {
    state,
    output: '',
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Staged ${stagedFiles.length} file(s) into the index`,
      details: `Copied working tree file contents into the Staging Area (index). Files: ${stagedFiles.join(', ')}. These changes are now prepared for the next commit.`,
      changes: stagedFiles.map(f => ({ type: 'INDEX', description: `Staged version of ${f}` })),
      unchanged: ['Commit history and branch pointers remain unchanged'],
      resultingState: `${stagedFiles.length} file(s) staged in index`,
      nextSuggestions: ['git status', 'git commit -m "Your descriptive commit message"']
    }
  };
}

function handleCommit(state, args, rawCommand) {
  // Parse flags
  let message = '';
  let autoStage = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-m' || args[i] === '--message') {
      message = args[i + 1] || '';
      i++;
    } else if (args[i] === '-a' || args[i] === '--all') {
      autoStage = true;
    } else if (args[i].startsWith('-m')) {
      message = args[i].slice(2);
    } else if (args[i] === '-am' || args[i] === '-ma') {
      autoStage = true;
      message = args[i + 1] || '';
      i++;
    }
  }

  if (!message) {
    message = 'Update repository files';
  }

  // Handle auto-stage if -a flag is passed
  if (autoStage) {
    Object.keys(state.workingDir.files).forEach(f => {
      if (state.index.files[f]) {
        state.index.files[f] = { content: state.workingDir.files[f].content };
      }
    });
  }

  // If merge in progress
  const isMergeCommit = state.mergeState?.inProgress;
  let parentHashes = [];
  const currentHeadHash = getHeadCommitHash(state);

  if (isMergeCommit) {
    if (state.mergeState.conflictedFiles && state.mergeState.conflictedFiles.length > 0) {
      return {
        state,
        output: '',
        error: `error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.`,
        explanation: {
          command: rawCommand,
          success: false,
          summary: 'Cannot commit with unresolved conflicts',
          details: `Please resolve the conflict in ${state.mergeState.conflictedFiles.join(', ')} and stage with 'git add' first.`
        }
      };
    }
    parentHashes = [currentHeadHash, state.mergeState.mergingCommit].filter(Boolean);
    message = message === 'Update repository files' ? `Merge branch '${state.mergeState.mergingBranch}'` : message;
  } else {
    parentHashes = currentHeadHash ? [currentHeadHash] : [];
  }

  // Check if index has any changes compared to current HEAD
  const headCommit = currentHeadHash ? state.commits[currentHeadHash] : null;
  const headTree = headCommit ? headCommit.tree : {};
  const indexFiles = state.index.files;

  // Verify tree content
  const newTree = {};
  Object.keys(indexFiles).forEach(f => {
    newTree[f] = indexFiles[f].content;
  });

  const isDifferent = Object.keys(newTree).length !== Object.keys(headTree).length ||
    Object.keys(newTree).some(f => newTree[f] !== headTree[f]);

  if (!isDifferent && !isMergeCommit) {
    return {
      state,
      output: 'On branch ' + (state.HEAD.type === 'branch' ? state.HEAD.name : 'detached') + '\nnothing to commit, working tree clean',
      error: null,
      explanation: {
        command: rawCommand,
        success: false,
        summary: 'No changes staged to commit',
        details: 'The staging area contains exactly the same file contents as HEAD. Modify files and run `git add` before committing.'
      }
    };
  }

  // Create commit
  const newHash = generateHash('c');
  const now = Date.now();
  const commitObj = {
    hash: newHash,
    shortHash: newHash,
    parentHashes,
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message,
    timestamp: now,
    tree: newTree
  };

  state.commits[newHash] = commitObj;

  // Advance branch or detached HEAD
  if (state.HEAD.type === 'branch') {
    const branchName = state.HEAD.name;
    state.branches[branchName] = newHash;
    addReflog(state, newHash, `commit: ${message}`);
  } else {
    state.HEAD.name = newHash;
    addReflog(state, newHash, `commit: ${message}`);
  }

  // Clear merge state if applicable
  if (isMergeCommit) {
    state.mergeState = null;
  }

  // Mark files in working dir as clean if matching index
  Object.keys(state.workingDir.files).forEach(f => {
    if (state.workingDir.files[f].content === newTree[f]) {
      state.workingDir.files[f].status = 'clean';
    }
  });

  const branchDisplay = state.HEAD.type === 'branch' ? state.HEAD.name : `(root-commit) ${newHash}`;
  const output = `[${branchDisplay} ${newHash}] ${message}\n ${Object.keys(newTree).length} files changed, recorded in history.`;

  return {
    state,
    output,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Created commit ${newHash}: "${message}"`,
      details: `Captured snapshot of the Staging Area into a permanent Commit object (${newHash}). Updated branch pointer and advanced HEAD.`,
      changes: [
        { type: 'COMMIT', description: `Created commit ${newHash}` },
        { type: 'BRANCH', description: `Moved ${state.HEAD.name} -> ${newHash}` },
        { type: 'HEAD', description: `HEAD now points to ${newHash}` }
      ],
      unchanged: ['Unstaged modifications outside index were preserved'],
      resultingState: `HEAD is now at ${newHash} on ${state.HEAD.name}`,
      nextSuggestions: ['git log --oneline', 'git status', 'git branch']
    }
  };
}

function handleLog(state, args, rawCommand) {
  const currentHeadHash = getHeadCommitHash(state);
  if (!currentHeadHash || !state.commits[currentHeadHash]) {
    return {
      state,
      output: 'fatal: your current branch does not have any commits yet',
      error: null,
      explanation: {
        command: rawCommand,
        success: false,
        summary: 'No commits in repository',
        details: 'Run `git commit` to create your first commit before viewing logs.'
      }
    };
  }

  const isOneLine = args.includes('--oneline');
  const commitsList = [];
  const visited = new Set();
  const queue = [currentHeadHash];

  while (queue.length > 0) {
    const hash = queue.shift();
    if (!hash || visited.has(hash)) continue;
    visited.add(hash);

    const c = state.commits[hash];
    if (c) {
      commitsList.push(c);
      c.parentHashes.forEach(p => queue.push(p));
    }
  }

  commitsList.sort((a, b) => b.timestamp - a.timestamp);

  let out = '';
  commitsList.forEach((c) => {
    const refs = [];
    Object.entries(state.branches).forEach(([bName, bHash]) => {
      if (bHash === c.hash) {
        if (state.HEAD.type === 'branch' && state.HEAD.name === bName) {
          refs.push(`\x1b[36mHEAD -> \x1b[32m${bName}\x1b[0m`);
        } else {
          refs.push(`\x1b[32m${bName}\x1b[0m`);
        }
      }
    });

    Object.entries(state.tags).forEach(([tName, tHash]) => {
      if (tHash === c.hash) refs.push(`\x1b[33mtag: ${tName}\x1b[0m`);
    });

    if (state.HEAD.type === 'detached' && state.HEAD.name === c.hash) {
      refs.push(`\x1b[36mHEAD\x1b[0m`);
    }

    const refStr = refs.length > 0 ? ` (${refs.join(', ')})` : '';

    if (isOneLine) {
      out += `\x1b[33m${c.shortHash}\x1b[0m${refStr} ${c.message}\n`;
    } else {
      out += `\x1b[33mcommit ${c.hash}\x1b[0m${refStr}\n`;
      if (c.parentHashes.length > 1) {
        out += `Merge: ${c.parentHashes.map(p => p.slice(0, 7)).join(' ')}\n`;
      }
      out += `Author: ${c.author}\n`;
      out += `Date:   ${new Date(c.timestamp).toUTCString()}\n\n`;
      out += `    ${c.message}\n\n`;
    }
  });

  return {
    state,
    output: out.trimEnd(),
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Viewed history of ${commitsList.length} commit(s)`,
      details: 'Traversed the Directed Acyclic Graph (DAG) backwards starting from current HEAD.',
      changes: [],
      unchanged: ['Repository state remained unmodified'],
      resultingState: 'Displaying commit log',
      nextSuggestions: ['git status', 'git diff', 'git branch']
    }
  };
}

function handleDiff(state, args, rawCommand) {
  const isStaged = args.includes('--staged') || args.includes('--cached');
  const currentHeadHash = getHeadCommitHash(state);
  const headTree = currentHeadHash && state.commits[currentHeadHash] ? state.commits[currentHeadHash].tree : {};
  const indexFiles = state.index.files;
  const workingFiles = state.workingDir.files;

  let diffOutput = '';

  if (isStaged) {
    // Diff between Index and HEAD
    Object.keys(indexFiles).forEach(file => {
      const indexContent = indexFiles[file].content;
      const headContent = headTree[file] || '';
      if (indexContent !== headContent) {
        diffOutput += `diff --git a/${file} b/${file}\nindex ${generateHash('h')}..${generateHash('h')} 100644\n--- a/${file}\n+++ b/${file}\n`;
        const oldLines = headContent ? headContent.split('\n') : [];
        const newLines = indexContent.split('\n');
        oldLines.forEach(l => { diffOutput += `\x1b[31m-${l}\x1b[0m\n`; });
        newLines.forEach(l => { diffOutput += `\x1b[32m+${l}\x1b[0m\n`; });
      }
    });
  } else {
    // Diff between Working Directory and Index
    Object.keys(workingFiles).forEach(file => {
      const workContent = workingFiles[file].content;
      const indexContent = indexFiles[file]?.content ?? headTree[file] ?? '';
      if (workContent !== indexContent && workingFiles[file].status !== 'untracked') {
        diffOutput += `diff --git a/${file} b/${file}\n--- a/${file}\n+++ b/${file}\n`;
        const oldLines = indexContent ? indexContent.split('\n') : [];
        const newLines = workContent.split('\n');
        oldLines.forEach(l => { diffOutput += `\x1b[31m-${l}\x1b[0m\n`; });
        newLines.forEach(l => { diffOutput += `\x1b[32m+${l}\x1b[0m\n`; });
      }
    });
  }

  if (!diffOutput) {
    diffOutput = isStaged ? 'No staged changes to display' : 'No unstaged modifications to tracked files';
  }

  return {
    state,
    output: diffOutput.trimEnd(),
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: isStaged ? 'Inspected staged changes (Index vs HEAD)' : 'Inspected unstaged changes (Working Tree vs Index)',
      details: isStaged ? 'Compares the Staging Area against the latest commit.' : 'Compares modified working directory files against staged index versions.',
      changes: [],
      unchanged: ['Files and references left unchanged'],
      resultingState: 'Diff inspection complete',
      nextSuggestions: isStaged ? ['git commit -m "Commit changes"'] : ['git add .']
    }
  };
}

function handleBranch(state, args, rawCommand) {
  // Case 1: list branches
  if (args.length === 0 || args[0] === '-a' || args[0] === '--all') {
    let out = '';
    const active = state.HEAD.type === 'branch' ? state.HEAD.name : null;
    Object.keys(state.branches).forEach(b => {
      if (b === active) {
        out += `* \x1b[32m${b}\x1b[0m\n`;
      } else {
        out += `  ${b}\n`;
      }
    });

    if (args[0] === '-a' || args[0] === '--all') {
      Object.entries(state.remotes).forEach(([rName, remote]) => {
        Object.keys(remote.branches).forEach(rb => {
          out += `  \x1b[31mremotes/${rName}/${rb}\x1b[0m\n`;
        });
      });
    }

    return {
      state,
      output: out.trimEnd(),
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Listed branches (active: ${active || 'detached HEAD'})`,
        details: 'Branches in Git are lightweight, movable pointers to specific commits.',
        changes: [],
        unchanged: ['No branches created or modified'],
        resultingState: 'Branch listing displayed',
        nextSuggestions: ['git switch <branch>', 'git branch <new-branch>']
      }
    };
  }

  // Case 2: Delete branch (-d or -D)
  if (args[0] === '-d' || args[0] === '-D') {
    const branchToDelete = args[1];
    if (!branchToDelete) {
      return {
        state,
        output: '',
        error: 'fatal: branch name required',
        explanation: { command: rawCommand, success: false, summary: 'Branch name missing', details: 'Specify branch to delete: git branch -d <branch>' }
      };
    }

    if (!state.branches[branchToDelete]) {
      return {
        state,
        output: '',
        error: `error: branch '${branchToDelete}' not found.`,
        explanation: { command: rawCommand, success: false, summary: 'Branch not found', details: `Branch '${branchToDelete}' does not exist.` }
      };
    }

    if (state.HEAD.type === 'branch' && state.HEAD.name === branchToDelete) {
      return {
        state,
        output: '',
        error: `error: Cannot delete branch '${branchToDelete}' checked out at '/workspace'`,
        explanation: { command: rawCommand, success: false, summary: 'Cannot delete current branch', details: 'You cannot delete the branch currently checked out. Switch to another branch first.' }
      };
    }

    const deletedCommit = state.branches[branchToDelete];
    delete state.branches[branchToDelete];

    return {
      state,
      output: `Deleted branch ${branchToDelete} (was ${deletedCommit.slice(0, 7)}).`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Deleted branch '${branchToDelete}'`,
        details: `Removed pointer '${branchToDelete}'. The commit ${deletedCommit.slice(0, 7)} remains in history if reachable.`,
        changes: [{ type: 'BRANCH', description: `Removed branch reference '${branchToDelete}'` }],
        unchanged: ['Commits and other branches preserved'],
        resultingState: `Branch '${branchToDelete}' removed`,
        nextSuggestions: ['git branch', 'git status']
      }
    };
  }

  // Case 3: Create new branch
  const newBranch = args[0];
  if (state.branches[newBranch]) {
    return {
      state,
      output: '',
      error: `fatal: a branch named '${newBranch}' already exists`,
      explanation: {
        command: rawCommand,
        success: false,
        summary: `Branch '${newBranch}' already exists`,
        details: 'Choose a different branch name or switch to the existing one with `git switch ' + newBranch + '`.'
      }
    };
  }

  const currentHeadHash = getHeadCommitHash(state);
  if (!currentHeadHash) {
    return {
      state,
      output: '',
      error: 'fatal: not a valid object name: \'main\'. Cannot create branch without initial commit.',
      explanation: {
        command: rawCommand,
        success: false,
        summary: 'Cannot create branch without commits',
        details: 'Make an initial commit first before creating additional branches.'
      }
    };
  }

  state.branches[newBranch] = currentHeadHash;

  return {
    state,
    output: '',
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Created branch '${newBranch}' pointing to ${currentHeadHash}`,
      details: `Created a new pointer '${newBranch}' referencing commit ${currentHeadHash}. Note that HEAD remains on '${state.HEAD.name}'. Use 'git switch ${newBranch}' to switch to it.`,
      changes: [{ type: 'BRANCH', description: `Created branch pointer '${newBranch}' at ${currentHeadHash}` }],
      unchanged: ['HEAD pointer remained on current branch'],
      resultingState: `Branch '${newBranch}' created`,
      nextSuggestions: [`git switch ${newBranch}`, 'git log --oneline']
    }
  };
}

function handleSwitch(state, args, rawCommand) {
  if (args.length === 0) {
    return {
      state,
      output: '',
      error: 'fatal: missing branch name for git switch',
      explanation: { command: rawCommand, success: false, summary: 'Missing branch name', details: 'Use git switch <branch> or git switch -c <new-branch>.' }
    };
  }

  let targetBranch = args[0];
  let createNew = false;

  if (args[0] === '-c' || args[0] === '--create') {
    createNew = true;
    targetBranch = args[1];
    if (!targetBranch) {
      return {
        state,
        output: '',
        error: 'fatal: missing branch name to create',
        explanation: { command: rawCommand, success: false, summary: 'Branch name missing', details: 'Specify: git switch -c <name>' }
      };
    }
  }

  if (createNew) {
    if (state.branches[targetBranch]) {
      return {
        state,
        output: '',
        error: `fatal: a branch named '${targetBranch}' already exists`,
        explanation: { command: rawCommand, success: false, summary: 'Branch already exists', details: `Switch to it using 'git switch ${targetBranch}'.` }
      };
    }
    const headHash = getHeadCommitHash(state);
    state.branches[targetBranch] = headHash;
  } else {
    if (!state.branches[targetBranch]) {
      // Check if matches remote branch
      const remoteMatch = state.remotes['origin']?.branches?.[targetBranch];
      if (remoteMatch) {
        state.branches[targetBranch] = remoteMatch;
      } else {
        return {
          state,
          output: '',
          error: `fatal: invalid reference: ${targetBranch}`,
          explanation: {
            command: rawCommand,
            success: false,
            summary: `Branch '${targetBranch}' does not exist`,
            details: `Use 'git switch -c ${targetBranch}' if you want to create and switch to it.`
          }
        };
      }
    }
  }

  // Update HEAD
  const prevBranch = state.HEAD.type === 'branch' ? state.HEAD.name : state.HEAD.name;
  state.HEAD = { type: 'branch', name: targetBranch };
  const targetCommitHash = state.branches[targetBranch];

  // Update working directory and index to match target branch commit tree
  if (targetCommitHash && state.commits[targetCommitHash]) {
    const targetTree = state.commits[targetCommitHash].tree;
    // Replace tracked files
    Object.keys(targetTree).forEach(f => {
      state.index.files[f] = { content: targetTree[f] };
      state.workingDir.files[f] = { content: targetTree[f], status: 'clean' };
    });
  }

  addReflog(state, targetCommitHash, `checkout: moving from ${prevBranch} to ${targetBranch}`);

  return {
    state,
    output: createNew 
      ? `Switched to a new branch '${targetBranch}'`
      : `Switched to branch '${targetBranch}'`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Switched HEAD to branch '${targetBranch}'`,
      details: `Moved HEAD to point to '${targetBranch}'. Working directory and index updated to match commit ${targetCommitHash ? targetCommitHash.slice(0, 7) : 'empty'}.`,
      changes: [
        { type: 'HEAD', description: `HEAD -> refs/heads/${targetBranch}` },
        { type: 'WORKING_DIR', description: 'Updated files to target commit snapshot' }
      ],
      unchanged: ['Untracked files were preserved'],
      resultingState: `Active on branch '${targetBranch}'`,
      nextSuggestions: ['git status', 'git log --oneline', 'git branch']
    }
  };
}

function handleCheckout(state, args, rawCommand) {
  if (args.length === 0) {
    return {
      state,
      output: '',
      error: 'fatal: missing argument for git checkout',
      explanation: { command: rawCommand, success: false, summary: 'Missing argument', details: 'Specify branch or commit to checkout.' }
    };
  }

  // git checkout -b <new-branch>
  if (args[0] === '-b') {
    return handleSwitch(state, ['-c', args[1]], rawCommand);
  }

  // git checkout -- <file>
  if (args[0] === '--') {
    return handleRestore(state, [args[1]], rawCommand);
  }

  const target = args[0];

  // If matches branch name
  if (state.branches[target]) {
    return handleSwitch(state, [target], rawCommand);
  }

  // If matches commit hash -> Detached HEAD state
  if (state.commits[target]) {
    const prevBranch = state.HEAD.type === 'branch' ? state.HEAD.name : state.HEAD.name;
    state.HEAD = { type: 'detached', name: target };

    // Update working directory and index
    const targetTree = state.commits[target].tree;
    Object.keys(targetTree).forEach(f => {
      state.index.files[f] = { content: targetTree[f] };
      state.workingDir.files[f] = { content: targetTree[f], status: 'clean' };
    });

    addReflog(state, target, `checkout: moving from ${prevBranch} to ${target}`);

    return {
      state,
      output: `Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.\n\nHEAD is now at ${target.slice(0, 7)} ${state.commits[target].message}`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Entered Detached HEAD state at ${target.slice(0, 7)}`,
        details: 'HEAD now points directly to a commit hash instead of a branch pointer. Commits made here will not advance any branch.',
        changes: [
          { type: 'HEAD', description: `HEAD detached at commit ${target}` }
        ],
        unchanged: ['Branch pointers remained unchanged'],
        resultingState: `Detached HEAD at ${target.slice(0, 7)}`,
        nextSuggestions: ['git status', 'git switch -c new-feature-from-here', 'git switch main']
      }
    };
  }

  return {
    state,
    output: '',
    error: `error: pathspec '${target}' did not match any file(s) known to git`,
    explanation: {
      command: rawCommand,
      success: false,
      summary: `Reference or file '${target}' not found`,
      details: 'Check that the branch or commit hash exists.'
    }
  };
}

function handleMerge(state, args, rawCommand) {
  if (args.length === 0) {
    return {
      state,
      output: '',
      error: 'fatal: No commit specified and merge.default to current not configured.',
      explanation: { command: rawCommand, success: false, summary: 'Missing branch to merge', details: 'Specify branch: git merge <branch>' }
    };
  }

  // Abort merge if --abort passed
  if (args[0] === '--abort') {
    if (!state.mergeState?.inProgress) {
      return {
        state,
        output: '',
        error: 'fatal: There is no merge to abort (MERGE_HEAD missing).',
        explanation: { command: rawCommand, success: false, summary: 'No merge in progress', details: 'Cannot abort because no merge was currently active.' }
      };
    }

    state.mergeState = null;
    const currentHead = getHeadCommitHash(state);
    if (currentHead && state.commits[currentHead]) {
      const headTree = state.commits[currentHead].tree;
      Object.keys(headTree).forEach(f => {
        state.workingDir.files[f] = { content: headTree[f], status: 'clean' };
        state.index.files[f] = { content: headTree[f] };
      });
    }

    return {
      state,
      output: '',
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: 'Aborted in-progress merge',
        details: 'Restored working directory and index to the pre-merge HEAD commit state.',
        changes: [{ type: 'MERGE', description: 'Cancelled merge and reverted changes' }],
        unchanged: ['Pre-merge commits and branch pointers preserved'],
        resultingState: 'Merge aborted cleanly',
        nextSuggestions: ['git status', 'git log --oneline']
      }
    };
  }

  const targetBranchName = args[0];
  const targetCommitHash = state.branches[targetBranchName];

  if (!targetCommitHash) {
    return {
      state,
      output: '',
      error: `merge: ${targetBranchName} - not something we can merge`,
      explanation: { command: rawCommand, success: false, summary: `Branch '${targetBranchName}' not found`, details: 'Specify a valid branch name to merge.' }
    };
  }

  const currentBranchName = state.HEAD.type === 'branch' ? state.HEAD.name : null;
  const currentHeadHash = getHeadCommitHash(state);

  if (targetCommitHash === currentHeadHash) {
    return {
      state,
      output: 'Already up to date.',
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: 'Already up to date',
        details: 'The target branch points to the same commit as the current branch. Nothing to merge.',
        changes: [],
        unchanged: ['All references and files remain unchanged'],
        resultingState: 'No merge required',
        nextSuggestions: ['git status']
      }
    };
  }

  // Check Fast-Forward condition: Is currentHeadHash an ancestor of targetCommitHash?
  const isFastForward = isAncestor(state, currentHeadHash, targetCommitHash);

  if (isFastForward) {
    if (state.HEAD.type === 'branch') {
      state.branches[currentBranchName] = targetCommitHash;
    } else {
      state.HEAD.name = targetCommitHash;
    }

    // Update working dir and index
    const targetTree = state.commits[targetCommitHash].tree;
    Object.keys(targetTree).forEach(f => {
      state.index.files[f] = { content: targetTree[f] };
      state.workingDir.files[f] = { content: targetTree[f], status: 'clean' };
    });

    addReflog(state, targetCommitHash, `merge ${targetBranchName}: Fast-forward`);

    return {
      state,
      output: `Updating ${currentHeadHash.slice(0, 7)}..${targetCommitHash.slice(0, 7)}\nFast-forward\n ${Object.keys(targetTree).length} files updated.`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Fast-forward merge of '${targetBranchName}' into '${currentBranchName}'`,
        details: 'Because the target commit had current HEAD as a direct ancestor, Git simply moved the branch pointer forward without creating a new merge commit.',
        changes: [
          { type: 'BRANCH', description: `Advanced ${currentBranchName} pointer to ${targetCommitHash}` }
        ],
        unchanged: ['No merge commit needed'],
        resultingState: `Fast-forwarded to ${targetCommitHash}`,
        nextSuggestions: ['git log --oneline', 'git status']
      }
    };
  }

  // Divergent history: check for merge conflicts in file trees
  const currentTree = state.commits[currentHeadHash].tree;
  const targetTree = state.commits[targetCommitHash].tree;
  const conflictedFiles = [];
  const mergedTree = { ...currentTree };

  Object.keys(targetTree).forEach(f => {
    if (currentTree[f] && currentTree[f] !== targetTree[f]) {
      // Conflict! Both changed the same file differently
      conflictedFiles.push(f);
    } else {
      mergedTree[f] = targetTree[f];
    }
  });

  if (conflictedFiles.length > 0) {
    // Merge conflict state!
    state.mergeState = {
      inProgress: true,
      mergingBranch: targetBranchName,
      mergingCommit: targetCommitHash,
      conflictedFiles
    };

    // Embed conflict markers in working tree
    conflictedFiles.forEach(f => {
      const content = `<<<<<<< HEAD\n${currentTree[f]}\n=======\n${targetTree[f]}\n>>>>>>> ${targetBranchName}`;
      state.workingDir.files[f] = {
        content,
        status: 'conflicted'
      };
    });

    return {
      state,
      output: `Auto-merging ${conflictedFiles.join(', ')}\nCONFLICT (content): Merge conflict in ${conflictedFiles.join(', ')}\nAutomatic merge failed; fix conflicts and then commit the result.`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Merge conflict in ${conflictedFiles.length} file(s)`,
        details: `Both '${currentBranchName}' and '${targetBranchName}' modified ${conflictedFiles.join(', ')} differently. Conflict markers have been placed in the file. Resolve them and run 'git add' followed by 'git commit', or cancel with 'git merge --abort'.`,
        changes: [
          { type: 'CONFLICT', description: `Conflict markers placed in ${conflictedFiles.join(', ')}` },
          { type: 'MERGE_STATE', description: 'Entered merge resolution state' }
        ],
        unchanged: ['Branch pointers not updated until conflict is resolved and committed'],
        resultingState: 'Merge conflict resolution required',
        nextSuggestions: ['git status', 'git diff', 'git merge --abort']
      }
    };
  }

  // 3-Way Merge Clean (No conflicts) -> Create automatic merge commit
  const newHash = generateHash('c');
  const now = Date.now();
  const mergeMessage = `Merge branch '${targetBranchName}' into ${currentBranchName}`;

  const mergeCommit = {
    hash: newHash,
    shortHash: newHash,
    parentHashes: [currentHeadHash, targetCommitHash],
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message: mergeMessage,
    timestamp: now,
    tree: mergedTree
  };

  state.commits[newHash] = mergeCommit;
  if (state.HEAD.type === 'branch') {
    state.branches[currentBranchName] = newHash;
  } else {
    state.HEAD.name = newHash;
  }

  // Update working directory and index
  Object.keys(mergedTree).forEach(f => {
    state.index.files[f] = { content: mergedTree[f] };
    state.workingDir.files[f] = { content: mergedTree[f], status: 'clean' };
  });

  addReflog(state, newHash, `merge ${targetBranchName}: Merge made by the 'ort' strategy.`);

  return {
    state,
    output: `Merge made by the 'ort' strategy.\n ${Object.keys(mergedTree).length} files merged.\nCommit ${newHash} created.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Created 3-way merge commit ${newHash}`,
      details: `Combined histories of '${currentBranchName}' and '${targetBranchName}'. Created a merge commit with 2 parents: ${currentHeadHash.slice(0, 7)} and ${targetCommitHash.slice(0, 7)}.`,
      changes: [
        { type: 'COMMIT', description: `Created merge commit ${newHash} with 2 parents` },
        { type: 'BRANCH', description: `Advanced ${currentBranchName} to ${newHash}` }
      ],
      unchanged: ['Target branch pointer preserved'],
      resultingState: `Branch ${currentBranchName} updated with merge commit`,
      nextSuggestions: ['git log --graph --oneline', 'git status']
    }
  };
}

function handleRebase(state, args, rawCommand) {
  if (args.length === 0) {
    return {
      state,
      output: '',
      error: 'fatal: No target branch specified for rebase.',
      explanation: { command: rawCommand, success: false, summary: 'Missing target branch', details: 'Specify branch: git rebase <target-branch>' }
    };
  }

  const targetBranch = args[0];
  const targetCommitHash = state.branches[targetBranch];

  if (!targetCommitHash) {
    return {
      state,
      output: '',
      error: `fatal: invalid upstream '${targetBranch}'`,
      explanation: { command: rawCommand, success: false, summary: `Target branch '${targetBranch}' not found`, details: 'Specify an existing branch to rebase onto.' }
    };
  }

  const currentBranch = state.HEAD.type === 'branch' ? state.HEAD.name : null;
  const currentHead = getHeadCommitHash(state);

  if (targetCommitHash === currentHead) {
    return {
      state,
      output: `Current branch ${currentBranch} is up to date.`,
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Rebase already up to date', details: 'No commits need to be replayed.' }
    };
  }

  // Find common base and collect commits unique to current branch
  const commitsToReplay = [];
  let curr = currentHead;
  while (curr && curr !== targetCommitHash && !isAncestor(state, curr, targetCommitHash)) {
    commitsToReplay.unshift(state.commits[curr]);
    curr = state.commits[curr]?.parentHashes[0];
  }

  if (commitsToReplay.length === 0) {
    // Just fast-forward
    state.branches[currentBranch] = targetCommitHash;
    return {
      state,
      output: `Successfully rebased and updated refs/heads/${currentBranch}.`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Fast-forwarded ${currentBranch} to ${targetBranch}`,
        details: 'No unique commits found on current branch; fast-forwarded branch pointer.'
      }
    };
  }

  // Replay each commit on top of targetCommitHash, generating NEW hashes
  let newParent = targetCommitHash;
  const replayedHashes = [];

  commitsToReplay.forEach(c => {
    const newHash = generateHash('r');
    const newCommit = {
      hash: newHash,
      shortHash: newHash,
      parentHashes: [newParent],
      author: c.author,
      message: c.message,
      timestamp: Date.now(),
      tree: { ...state.commits[newParent].tree, ...c.tree }
    };
    state.commits[newHash] = newCommit;
    newParent = newHash;
    replayedHashes.push(newHash);
  });

  // Re-point branch
  state.branches[currentBranch] = newParent;
  addReflog(state, newParent, `rebase (finish): returning to refs/heads/${currentBranch}`);

  // Update working directory and index
  const finalTree = state.commits[newParent].tree;
  Object.keys(finalTree).forEach(f => {
    state.index.files[f] = { content: finalTree[f] };
    state.workingDir.files[f] = { content: finalTree[f], status: 'clean' };
  });

  return {
    state,
    output: `Successfully rebased and updated refs/heads/${currentBranch}.\nReplayed ${commitsToReplay.length} commit(s) with new commit hashes.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Rebased ${currentBranch} onto ${targetBranch}`,
      details: `Reapplied ${commitsToReplay.length} commits linearly on top of ${targetBranch}. Notice that each replayed commit received a NEW commit hash (${replayedHashes.join(', ')}) because its parent hash changed.`,
      changes: [
        { type: 'REBASE', description: `Recreated commits: ${replayedHashes.join(', ')}` },
        { type: 'BRANCH', description: `Moved ${currentBranch} pointer to ${newParent}` }
      ],
      unchanged: ['Original base commits untouched'],
      resultingState: `Linear history established on ${currentBranch}`,
      nextSuggestions: ['git log --oneline --graph', 'git status']
    }
  };
}

function handleStash(state, args, rawCommand) {
  const sub = args[0] || 'push';

  if (sub === 'pop' || sub === 'apply') {
    if (state.stash.length === 0) {
      return {
        state,
        output: '',
        error: 'error: No stash entries found.',
        explanation: { command: rawCommand, success: false, summary: 'Stash is empty', details: 'No saved uncommitted work found in the stash stack.' }
      };
    }

    const stashedItem = sub === 'pop' ? state.stash.shift() : state.stash[0];

    // Restore files
    Object.entries(stashedItem.workingDir).forEach(([filename, file]) => {
      state.workingDir.files[filename] = { ...file };
    });
    Object.entries(stashedItem.index).forEach(([filename, file]) => {
      state.index.files[filename] = { ...file };
    });

    return {
      state,
      output: `On branch ${state.HEAD.name}\nChanges restored from stash (${stashedItem.message})\n${sub === 'pop' ? 'Dropped refs/stash@{0}' : 'Applied refs/stash@{0}'}`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `${sub === 'pop' ? 'Popped' : 'Applied'} stash entry`,
        details: `Restored uncommitted working tree and staged index changes from stash. ${sub === 'pop' ? 'Removed entry from stash stack.' : 'Entry retained in stash stack.'}`,
        changes: [
          { type: 'STASH', description: `${sub === 'pop' ? 'Removed' : 'Read'} stash@{0}` },
          { type: 'WORKING_DIR', description: 'Restored saved file modifications' }
        ],
        unchanged: ['Commit history unchanged'],
        resultingState: 'Uncommitted changes restored to working directory',
        nextSuggestions: ['git status', 'git diff']
      }
    };
  }

  if (sub === 'list') {
    let out = '';
    state.stash.forEach((s, idx) => {
      out += `stash@{${idx}}: ${s.message}\n`;
    });
    if (!out) out = 'No stash entries.';

    return {
      state,
      output: out.trimEnd(),
      error: null,
      explanation: { command: rawCommand, success: true, summary: `Listed ${state.stash.length} stash entries`, details: 'Displays stack of saved uncommitted states.' }
    };
  }

  if (sub === 'drop') {
    if (state.stash.length === 0) {
      return { state, output: '', error: 'error: No stash entries found.' };
    }
    state.stash.shift();
    return {
      state,
      output: 'Dropped refs/stash@{0}',
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Dropped stash@{0}', details: 'Removed top entry from stash stack.' }
    };
  }

  if (sub === 'clear') {
    state.stash = [];
    return {
      state,
      output: 'Cleared all stash entries.',
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Cleared stash stack', details: 'All stashed entries removed.' }
    };
  }

  // Push / save stash
  const modifiedOrUntracked = Object.values(state.workingDir.files).filter(
    (f) => f.status === 'modified' || f.status === 'staged'
  );

  if (modifiedOrUntracked.length === 0) {
    return {
      state,
      output: 'No local changes to save',
      error: null,
      explanation: { command: rawCommand, success: false, summary: 'Nothing to stash', details: 'Working tree is clean; no uncommitted modifications found.' }
    };
  }

  const msg = args.slice(1).join(' ') || `WIP on ${state.HEAD.name} at ${new Date().toLocaleTimeString()}`;
  const stashEntry = {
    id: state.stash.length,
    message: msg,
    workingDir: { ...state.workingDir.files },
    index: { ...state.index.files },
    timestamp: Date.now(),
    branch: state.HEAD.name
  };

  state.stash.unshift(stashEntry);

  // Clean working tree to match HEAD
  const headHash = getHeadCommitHash(state);
  const headTree = headHash && state.commits[headHash] ? state.commits[headHash].tree : {};

  state.workingDir.files = {};
  state.index.files = {};
  Object.keys(headTree).forEach(f => {
    state.workingDir.files[f] = { content: headTree[f], status: 'clean' };
    state.index.files[f] = { content: headTree[f] };
  });

  return {
    state,
    output: `Saved working directory and index state "${msg}"\nHEAD is now at ${headHash ? headHash.slice(0, 7) : 'empty'}`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: 'Stashed uncommitted changes into stash stack',
      details: 'Temporarily saved modified and staged files onto the stash stack and restored working tree to clean HEAD state.',
      changes: [
        { type: 'STASH', description: `Saved stash@{0}: ${msg}` },
        { type: 'WORKING_DIR', description: 'Reverted working directory to clean HEAD state' }
      ],
      unchanged: ['Commit history unchanged'],
      resultingState: 'Working tree clean, changes safely stashed',
      nextSuggestions: ['git stash list', 'git stash pop']
    }
  };
}

function handleFetch(state, args, rawCommand) {
  const remote = state.remotes['origin'];
  if (!remote) {
    return {
      state,
      output: '',
      error: 'fatal: \'origin\' does not appear to be a git repository',
      explanation: { command: rawCommand, success: false, summary: 'Remote not configured', details: 'Add remote origin first: git remote add origin <url>' }
    };
  }

  // Remote tracking references updated

  return {
    state,
    output: `From ${remote.url}\n * [new branch]      main       -> origin/main\nSynchronized remote references.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: 'Fetched latest refs from origin',
      details: 'Downloaded object graph and updated remote-tracking branches (e.g. `origin/main`). Local branch pointers were NOT modified.',
      changes: [
        { type: 'REMOTE', description: 'Updated origin tracking refs' }
      ],
      unchanged: ['Local branches and working directory unchanged'],
      resultingState: 'Remote-tracking references up to date',
      nextSuggestions: ['git status', 'git merge origin/main', 'git pull']
    }
  };
}

function handlePull(state, args, rawCommand) {
  // git pull is fetch + merge
  const remote = state.remotes['origin'];
  if (!remote) {
    return {
      state,
      output: '',
      error: 'fatal: No remote repository specified. Please add a remote.',
      explanation: { command: rawCommand, success: false, summary: 'Remote not found', details: 'Configure remote origin with `git remote add origin <url>`.' }
    };
  }

  const currentBranch = state.HEAD.name;
  const remoteCommitHash = remote.branches[currentBranch];

  if (!remoteCommitHash) {
    return {
      state,
      output: '',
      error: `There is no tracking information for the current branch '${currentBranch}'.`,
      explanation: { command: rawCommand, success: false, summary: 'No tracking branch', details: `Remote branch 'origin/${currentBranch}' not found.` }
    };
  }

  // Check if current is behind
  const currentHead = getHeadCommitHash(state);
  if (currentHead === remoteCommitHash) {
    return {
      state,
      output: 'Already up to date.',
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Already up to date', details: 'Local branch already has all commits from remote.' }
    };
  }

  // Fast forward to remote commit
  state.branches[currentBranch] = remoteCommitHash;
  const remoteTree = state.commits[remoteCommitHash]?.tree || {};
  Object.keys(remoteTree).forEach(f => {
    state.index.files[f] = { content: remoteTree[f] };
    state.workingDir.files[f] = { content: remoteTree[f], status: 'clean' };
  });

  return {
    state,
    output: `Updating ${currentHead.slice(0, 7)}..${remoteCommitHash.slice(0, 7)}\nFast-forward\nPulled latest changes into ${currentBranch}.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Pulled latest changes from origin/${currentBranch}`,
      details: 'Fetched remote commits and fast-forwarded local branch and working tree.',
      changes: [
        { type: 'BRANCH', description: `Updated ${currentBranch} -> ${remoteCommitHash}` },
        { type: 'WORKING_DIR', description: 'Updated working tree files' }
      ],
      unchanged: [],
      resultingState: `Synchronized with origin/${currentBranch}`,
      nextSuggestions: ['git log --oneline', 'git status']
    }
  };
}

function handlePush(state, args, rawCommand) {
  const remote = state.remotes['origin'];
  if (!remote) {
    return {
      state,
      output: '',
      error: 'fatal: No configured push destination.\nSpecify: git remote add origin <url>',
      explanation: { command: rawCommand, success: false, summary: 'Push destination missing', details: 'Configure remote origin before pushing.' }
    };
  }

  const currentBranch = state.HEAD.name;
  const currentHead = getHeadCommitHash(state);

  if (!currentHead) {
    return {
      state,
      output: '',
      error: 'error: src refspec main does not match any',
      explanation: { command: rawCommand, success: false, summary: 'No commits to push', details: 'Create at least one commit before pushing.' }
    };
  }

  const remoteHead = remote.branches[currentBranch];

  // Verify fast-forward push: is remoteHead an ancestor of currentHead?
  if (remoteHead && remoteHead !== currentHead) {
    const isFastForward = isAncestor(state, remoteHead, currentHead);
    if (!isFastForward) {
      return {
        state,
        output: '',
        error: `To ${remote.url}\n ! [rejected]        ${currentBranch} -> ${currentBranch} (non-fast-forward)\nerror: failed to push some refs to '${remote.url}'\nhint: Updates were rejected because the remote contains work that you do\nhint: not have locally. This is usually caused by another repository pushing\nhint: to the same ref. You may want to first integrate the remote changes\nhint: (e.g., 'git pull ...') before pushing again.`,
        explanation: {
          command: rawCommand,
          success: false,
          summary: 'Push rejected (non-fast-forward)',
          details: 'The remote branch contains commits not present in your local branch. Run `git pull` or `git fetch` and merge first.'
        }
      };
    }
  }

  // Update remote tracking branch
  remote.branches[currentBranch] = currentHead;

  return {
    state,
    output: `Enumerating objects: 5, done.\nWriting objects: 100% (5/5), done.\nTo ${remote.url}\n   ${remoteHead ? remoteHead.slice(0, 7) + '..' : ''}${currentHead.slice(0, 7)}  ${currentBranch} -> ${currentBranch}`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Pushed commits from ${currentBranch} to origin/${currentBranch}`,
      details: `Transferred local commits to remote repository at ${remote.url}. Updated remote tracking pointer.`,
      changes: [
        { type: 'REMOTE', description: `Updated origin/${currentBranch} -> ${currentHead}` }
      ],
      unchanged: ['Local branches and working tree unchanged'],
      resultingState: `Remote ${remote.url} synchronized with local branch`,
      nextSuggestions: ['git status']
    }
  };
}

function handleClone(state, args, rawCommand) {
  const url = args[0] || 'https://github.com/dszae/my-app.git';
  const defaultState = createDefaultRepo();
  defaultState.remotes['origin'] = {
    name: 'origin',
    url,
    branches: {
      'main': defaultState.branches['main']
    }
  };

  return {
    state: defaultState,
    output: `Cloning into 'my-app'...\nremote: Enumerating objects: 12, done.\nremote: Total 12 (delta 3), reused 12 (delta 3)\nReceiving objects: 100% (12/12), done.\nResolving deltas: 100% (3/3), done.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Cloned repository from ${url}`,
      details: 'Created a new local repository containing full history, branches, and configured origin remote.',
      changes: [
        { type: 'REPO', description: 'Initialized cloned repo with remote tracking' }
      ],
      unchanged: [],
      resultingState: 'Repository ready on branch main',
      nextSuggestions: ['git status', 'git log --oneline']
    }
  };
}

function handleRemote(state, args, rawCommand) {
  if (args.length === 0) {
    const list = Object.keys(state.remotes).join('\n');
    return {
      state,
      output: list,
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Listed remotes', details: 'Displays configured remote repositories.' }
    };
  }

  if (args[0] === '-v' || args[0] === '--verbose') {
    let out = '';
    Object.entries(state.remotes).forEach(([name, r]) => {
      out += `${name}\t${r.url} (fetch)\n${name}\t${r.url} (push)\n`;
    });
    return {
      state,
      output: out.trimEnd(),
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Listed verbose remotes', details: 'Displays remote URLs for fetch and push.' }
    };
  }

  if (args[0] === 'add') {
    const name = args[1];
    const url = args[2];
    if (!name || !url) {
      return { state, output: '', error: 'usage: git remote add <name> <url>' };
    }
    state.remotes[name] = { name, url, branches: {} };
    return {
      state,
      output: '',
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Added remote '${name}' -> ${url}`,
        details: 'Configured a remote repository reference.'
      }
    };
  }

  return { state, output: '', error: `Unknown remote command '${args[0]}'` };
}

function handleTag(state, args, rawCommand) {
  if (args.length === 0) {
    const list = Object.keys(state.tags).join('\n');
    return {
      state,
      output: list || 'No tags found.',
      error: null,
      explanation: { command: rawCommand, success: true, summary: 'Listed tags', details: 'Displays repository tags.' }
    };
  }

  if (args[0] === '-d') {
    const tagName = args[1];
    if (state.tags[tagName]) {
      delete state.tags[tagName];
      return {
        state,
        output: `Deleted tag '${tagName}'`,
        error: null,
        explanation: { command: rawCommand, success: true, summary: `Deleted tag '${tagName}'`, details: 'Removed tag reference.' }
      };
    }
    return { state, output: '', error: `error: tag '${tagName}' not found.` };
  }

  const tagName = args[0];
  const headHash = getHeadCommitHash(state);
  state.tags[tagName] = headHash;

  return {
    state,
    output: '',
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Created tag '${tagName}' at ${headHash.slice(0, 7)}`,
      details: 'Tags are permanent, human-readable labels attached to a specific commit.',
      changes: [{ type: 'TAG', description: `Created tag '${tagName}'` }],
      unchanged: ['Branch pointers untouched'],
      resultingState: `Tag '${tagName}' points to ${headHash}`,
      nextSuggestions: ['git tag', 'git log --oneline']
    }
  };
}

function handleShow(state, args, rawCommand) {
  const target = args[0] || getHeadCommitHash(state);
  const commit = state.commits[target] || state.commits[state.tags[target]] || state.commits[state.branches[target]];

  if (!commit) {
    return { state, output: '', error: `fatal: ambiguous argument '${target}': unknown revision` };
  }

  let out = `commit ${commit.hash}\n`;
  out += `Author: ${commit.author}\n`;
  out += `Date:   ${new Date(commit.timestamp).toUTCString()}\n\n`;
  out += `    ${commit.message}\n\n`;
  out += `Files in commit snapshot:\n`;
  Object.keys(commit.tree).forEach(f => {
    out += `  ${f}\n`;
  });

  return {
    state,
    output: out,
    error: null,
    explanation: { command: rawCommand, success: true, summary: `Showed details of commit ${commit.shortHash}`, details: 'Inspected commit metadata and file snapshot.' }
  };
}

function handleRestore(state, args, rawCommand) {
  const isStaged = args.includes('--staged');
  const filename = args.find(a => !a.startsWith('--'));

  if (!filename) {
    return { state, output: '', error: 'fatal: you must specify path(s) to restore' };
  }

  const headHash = getHeadCommitHash(state);
  const headTree = headHash && state.commits[headHash] ? state.commits[headHash].tree : {};

  if (isStaged) {
    // Unstage file: restore index version to match HEAD
    if (headTree[filename]) {
      state.index.files[filename] = { content: headTree[filename] };
    } else {
      delete state.index.files[filename];
    }

    if (state.workingDir.files[filename]) {
      state.workingDir.files[filename].status = 'modified';
    }

    return {
      state,
      output: '',
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `Unstaged ${filename} from index (git restore --staged)`,
        details: `Removed staged version of ${filename} from the index. Modifications in your working tree were preserved.`,
        changes: [{ type: 'INDEX', description: `Unstaged ${filename}` }],
        unchanged: ['Working tree modifications untouched'],
        resultingState: `${filename} is now unstaged in working directory`,
        nextSuggestions: ['git status', 'git diff']
      }
    };
  }

  // Restore working tree file from index (or HEAD)
  const sourceContent = state.index.files[filename]?.content ?? headTree[filename];
  if (sourceContent === undefined) {
    return { state, output: '', error: `error: pathspec '${filename}' did not match any file(s) known to git` };
  }

  state.workingDir.files[filename] = { content: sourceContent, status: 'clean' };

  return {
    state,
    output: '',
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Restored ${filename} in working directory (discarded unstaged edits)`,
      details: `Replaced modified working directory version of ${filename} with the staged index version.`,
      changes: [{ type: 'WORKING_DIR', description: `Reverted ${filename} to index state` }],
      unchanged: ['Index and commit history untouched'],
      resultingState: `${filename} is clean in working directory`,
      nextSuggestions: ['git status']
    }
  };
}

function handleReset(state, args, rawCommand) {
  let mode = '--mixed'; // default
  let targetRef = 'HEAD';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--soft') mode = '--soft';
    else if (args[i] === '--hard') mode = '--hard';
    else if (args[i] === '--mixed') mode = '--mixed';
    else targetRef = args[i];
  }

  // Resolve target commit
  let targetCommit = targetRef;
  const currentHead = getHeadCommitHash(state);

  if (targetRef === 'HEAD' || targetRef === '@') {
    targetCommit = currentHead;
  } else if (targetRef === 'HEAD~1' || targetRef === 'HEAD^' || targetRef === '@~1') {
    targetCommit = state.commits[currentHead]?.parentHashes[0];
  } else if (state.branches[targetRef]) {
    targetCommit = state.branches[targetRef];
  }

  if (!targetCommit || !state.commits[targetCommit]) {
    return {
      state,
      output: '',
      error: `fatal: ambiguous argument '${targetRef}': unknown revision or path not in the working tree.`,
      explanation: { command: rawCommand, success: false, summary: `Unknown target ${targetRef}`, details: 'Could not resolve commit to reset to.' }
    };
  }

  const targetTree = state.commits[targetCommit].tree;

  // Move branch pointer
  if (state.HEAD.type === 'branch') {
    state.branches[state.HEAD.name] = targetCommit;
  } else {
    state.HEAD.name = targetCommit;
  }

  addReflog(state, targetCommit, `reset: moving to ${targetRef}`);

  if (mode === '--soft') {
    // Soft: Only move HEAD/branch. Keep index and working directory completely intact!
    return {
      state,
      output: '',
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `git reset --soft: moved HEAD to ${targetCommit.slice(0, 7)}`,
        details: 'Moved branch pointer backwards. Staging area (Index) and Working Directory were LEFT UNTOUCHED. All changes from the reset commits remain staged in the index ready to be re-committed.',
        changes: [{ type: 'BRANCH', description: `Moved ${state.HEAD.name} -> ${targetCommit}` }],
        unchanged: ['Index and Working Directory files remain preserved'],
        resultingState: `HEAD is at ${targetCommit.slice(0, 7)} (changes staged)`,
        nextSuggestions: ['git status', 'git commit -m "re-commit"']
      }
    };
  }

  if (mode === '--mixed') {
    // Mixed: Move HEAD/branch and reset Index to match targetTree. Working tree changes kept!
    state.index.files = {};
    Object.keys(targetTree).forEach(f => {
      state.index.files[f] = { content: targetTree[f] };
    });

    return {
      state,
      output: `Unstaged changes after reset:\n ${Object.keys(targetTree).join('\n ')}`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `git reset --mixed: moved HEAD and reset Index to ${targetCommit.slice(0, 7)}`,
        details: 'Moved branch pointer and reset the staging area (Index). Your Working Directory files were PRESERVED as unstaged modifications.',
        changes: [
          { type: 'BRANCH', description: `Moved ${state.HEAD.name} -> ${targetCommit}` },
          { type: 'INDEX', description: 'Reset index to match target commit tree' }
        ],
        unchanged: ['Working directory file contents preserved'],
        resultingState: `HEAD at ${targetCommit.slice(0, 7)} (changes unstaged in working directory)`,
        nextSuggestions: ['git status', 'git diff', 'git add .']
      }
    };
  }

  if (mode === '--hard') {
    // Hard: Move HEAD, reset Index, AND reset Working Directory. DISCARDS uncommitted work!
    state.index.files = {};
    state.workingDir.files = {};
    Object.keys(targetTree).forEach(f => {
      state.index.files[f] = { content: targetTree[f] };
      state.workingDir.files[f] = { content: targetTree[f], status: 'clean' };
    });

    return {
      state,
      output: `HEAD is now at ${targetCommit.slice(0, 7)} ${state.commits[targetCommit].message}`,
      error: null,
      explanation: {
        command: rawCommand,
        success: true,
        summary: `git reset --hard: DESTRUCTIVE reset to ${targetCommit.slice(0, 7)}`,
        details: 'DANGER: Moved branch pointer AND completely overwritten both the Staging Area and Working Directory to match the target commit snapshot. Any uncommitted work was permanently discarded.',
        changes: [
          { type: 'BRANCH', description: `Moved ${state.HEAD.name} -> ${targetCommit}` },
          { type: 'INDEX', description: 'Reset index' },
          { type: 'WORKING_DIR', description: 'Discarded all local changes to match target commit' }
        ],
        unchanged: [],
        resultingState: `Clean repository matching commit ${targetCommit.slice(0, 7)}`,
        nextSuggestions: ['git status', 'git log --oneline', 'git reflog']
      }
    };
  }
}

function handleRevert(state, args, rawCommand) {
  const targetRef = args[0] || 'HEAD';
  const currentHead = getHeadCommitHash(state);
  const targetCommitHash = targetRef === 'HEAD' ? currentHead : (state.commits[targetRef] ? targetRef : state.branches[targetRef]);

  if (!targetCommitHash || !state.commits[targetCommitHash]) {
    return { state, output: '', error: `fatal: bad revision '${targetRef}'` };
  }

  const targetCommit = state.commits[targetCommitHash];
  const parentHash = targetCommit.parentHashes[0];

  if (!parentHash || !state.commits[parentHash]) {
    return { state, output: '', error: 'cannot revert root commit' };
  }

  const parentTree = state.commits[parentHash].tree;
  const newHash = generateHash('v');
  const revertMsg = `Revert "${targetCommit.message}"`;

  const revertCommit = {
    hash: newHash,
    shortHash: newHash,
    parentHashes: [currentHead],
    author: 'Dipesh Sapkota <dipesh@example.com>',
    message: revertMsg,
    timestamp: Date.now(),
    tree: { ...parentTree }
  };

  state.commits[newHash] = revertCommit;
  if (state.HEAD.type === 'branch') {
    state.branches[state.HEAD.name] = newHash;
  } else {
    state.HEAD.name = newHash;
  }

  // Update working directory and index
  Object.keys(parentTree).forEach(f => {
    state.index.files[f] = { content: parentTree[f] };
    state.workingDir.files[f] = { content: parentTree[f], status: 'clean' };
  });

  addReflog(state, newHash, `revert: ${revertMsg}`);

  return {
    state,
    output: `[${state.HEAD.name} ${newHash}] ${revertMsg}\n 1 commit reverted safely via new inverse commit.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Created revert commit ${newHash} undoing ${targetCommitHash.slice(0, 7)}`,
      details: `Safe undo! Instead of rewriting or deleting history, git revert created a brand-new commit that inverts the changes introduced by ${targetCommitHash.slice(0, 7)}. History is fully preserved.`,
      changes: [
        { type: 'COMMIT', description: `Created new inverse commit ${newHash}` },
        { type: 'BRANCH', description: `Moved ${state.HEAD.name} to ${newHash}` }
      ],
      unchanged: ['Original commit remains safely in history'],
      resultingState: `Revert recorded as commit ${newHash}`,
      nextSuggestions: ['git log --oneline', 'git status']
    }
  };
}

function handleCherryPick(state, args, rawCommand) {
  const targetHash = args[0];
  if (!targetHash || !state.commits[targetHash]) {
    return { state, output: '', error: `fatal: bad revision '${targetHash}'` };
  }

  const currentHead = getHeadCommitHash(state);
  const targetCommit = state.commits[targetHash];
  const newHash = generateHash('cp');

  const cherryCommit = {
    hash: newHash,
    shortHash: newHash,
    parentHashes: [currentHead],
    author: targetCommit.author,
    message: `${targetCommit.message} (cherry picked)`,
    timestamp: Date.now(),
    tree: { ...state.commits[currentHead].tree, ...targetCommit.tree }
  };

  state.commits[newHash] = cherryCommit;
  if (state.HEAD.type === 'branch') {
    state.branches[state.HEAD.name] = newHash;
  } else {
    state.HEAD.name = newHash;
  }

  // Update working directory and index
  Object.keys(cherryCommit.tree).forEach(f => {
    state.index.files[f] = { content: cherryCommit.tree[f] };
    state.workingDir.files[f] = { content: cherryCommit.tree[f], status: 'clean' };
  });

  addReflog(state, newHash, `cherry-pick: ${targetCommit.message}`);

  return {
    state,
    output: `[${state.HEAD.name} ${newHash}] ${targetCommit.message}\nCherry-picked commit ${targetHash.slice(0, 7)} onto current HEAD.`,
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Cherry-picked commit ${targetHash.slice(0, 7)} onto ${state.HEAD.name}`,
      details: `Reapplied changes from commit ${targetHash.slice(0, 7)} on top of current HEAD as a new distinct commit (${newHash}).`,
      changes: [{ type: 'COMMIT', description: `Created commit ${newHash}` }],
      unchanged: ['Original commit and its branch untouched'],
      resultingState: `HEAD advanced with cherry-picked commit`,
      nextSuggestions: ['git log --oneline']
    }
  };
}

function handleReflog(state, args, rawCommand) {
  let out = '';
  state.reflog.forEach(e => {
    out += `\x1b[33m${e.hash.slice(0, 7)}\x1b[0m \x1b[36m${e.selector}\x1b[0m: ${e.action}\n`;
  });

  if (!out) out = 'Reflog is empty.';

  return {
    state,
    output: out.trimEnd(),
    error: null,
    explanation: {
      command: rawCommand,
      success: true,
      summary: `Viewed reflog (${state.reflog.length} entries)`,
      details: 'Git reflog records every time HEAD moved in your local repository. It can be used to recover "lost" commits or aborted branches.',
      changes: [],
      unchanged: ['Repository state untouched'],
      resultingState: 'Reflog displayed',
      nextSuggestions: ['git reset --hard HEAD@{1}']
    }
  };
}

/**
 * Checks whether candidateHash is an ancestor of targetHash in commit DAG
 */
export function isAncestor(state, candidateHash, targetHash) {
  if (!candidateHash || !targetHash) return false;
  if (candidateHash === targetHash) return true;

  const visited = new Set();
  const queue = [targetHash];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (current === candidateHash) return true;

    const commit = state.commits[current];
    if (commit && commit.parentHashes) {
      commit.parentHashes.forEach(p => queue.push(p));
    }
  }

  return false;
}

/**
 * Resolves a merge conflict programmatically or from UI choice
 * choice: 'head' | 'incoming' | 'both'
 */
export function resolveFileConflict(currentState, filename, choice) {
  const state = cloneState(currentState);
  if (!state.mergeState?.inProgress) return state;

  const currentHead = getHeadCommitHash(state);
  const mergingCommit = state.mergeState.mergingCommit;
  const currentTree = state.commits[currentHead]?.tree || {};
  const mergingTree = state.commits[mergingCommit]?.tree || {};

  let resolvedContent = '';
  if (choice === 'head') {
    resolvedContent = currentTree[filename] || '';
  } else if (choice === 'incoming') {
    resolvedContent = mergingTree[filename] || '';
  } else {
    resolvedContent = `${currentTree[filename] || ''}\n${mergingTree[filename] || ''}`;
  }

  state.workingDir.files[filename] = {
    content: resolvedContent,
    status: 'staged'
  };
  state.index.files[filename] = { content: resolvedContent };

  if (state.mergeState.conflictedFiles) {
    state.mergeState.conflictedFiles = state.mergeState.conflictedFiles.filter(f => f !== filename);
  }

  return state;
}
