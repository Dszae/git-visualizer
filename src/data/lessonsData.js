/**
 * Guided Git Lessons and Challenge Mode Data
 */
import { createEmptyRepo, createDefaultRepo, executeCommand, getHeadCommitHash } from '../engine/gitEngine.js';

export const LESSONS = [
  {
    id: 'lesson-1',
    level: 'Beginner',
    title: '1. Initialize a Repository',
    subtitle: 'Transform an ordinary directory into a Git repository',
    objective: 'Create a fresh Git repository using git init and inspect the initial status.',
    explanation: 'Git tracks changes by creating a hidden `.git` folder in your project root. This contains all commits, branches, and configuration metadata.',
    initialStateGenerator: () => createEmptyRepo(),
    steps: [
      {
        instruction: 'Initialize a new repository by running `git init`.',
        hint: 'Type "git init" into the terminal.',
        verify: (state) => state.isInitialized === true
      },
      {
        instruction: 'Check repository status with `git status`.',
        hint: 'Type "git status" to view the working tree status.',
        verify: (state) => state.isInitialized === true
      }
    ],
    summary: 'Great job! You initialized a Git repository. HEAD is now pointing to the default branch "main".'
  },
  {
    id: 'lesson-2',
    level: 'Beginner',
    title: '2. Working Directory & Staging Area',
    subtitle: 'Stage files to prepare for a commit',
    objective: 'Move untracked and modified files from the Working Directory into the Staging Area (Index).',
    explanation: 'Git has a two-phase workflow: first you prepare files in the Staging Area using `git add`, and then you freeze that snapshot into history with `git commit`.',
    initialStateGenerator: () => {
      let state = createEmptyRepo();
      state.isInitialized = true;
      state.branches['main'] = null;
      state.HEAD = { type: 'branch', name: 'main' };
      state.workingDir.files['index.html'] = { content: '<h1>Hello World</h1>', status: 'untracked' };
      state.workingDir.files['style.css'] = { content: 'body { color: blue; }', status: 'untracked' };
      return state;
    },
    steps: [
      {
        instruction: 'Stage only `index.html` using `git add index.html`.',
        hint: 'Run "git add index.html" to stage just that single file.',
        verify: (state) => !!state.index.files['index.html'] && !state.index.files['style.css']
      },
      {
        instruction: 'Stage all remaining files with `git add .`.',
        hint: 'Run "git add ." to stage everything in the working directory.',
        verify: (state) => !!state.index.files['index.html'] && !!state.index.files['style.css']
      }
    ],
    summary: 'Both files are now staged in the Index! They are ready to be permanently recorded into a commit.'
  },
  {
    id: 'lesson-3',
    level: 'Beginner',
    title: '3. Make Your First Commit',
    subtitle: 'Permanently record a project snapshot',
    objective: 'Create a permanent commit object with a meaningful message.',
    explanation: 'A commit captures the exact state of all staged files in the index, assigns a cryptographic hash, stores your author identity, and points to the previous commit.',
    initialStateGenerator: () => {
      let state = createEmptyRepo();
      state.isInitialized = true;
      state.branches['main'] = null;
      state.HEAD = { type: 'branch', name: 'main' };
      state.workingDir.files['app.js'] = { content: 'console.log("App ready");', status: 'staged' };
      state.index.files['app.js'] = { content: 'console.log("App ready");' };
      return state;
    },
    steps: [
      {
        instruction: 'Commit your staged changes with `git commit -m "Initial commit"`.',
        hint: 'Run: git commit -m "Initial commit"',
        verify: (state) => Object.keys(state.commits).length >= 1
      }
    ],
    summary: 'You made your first commit! The branch "main" and HEAD now point to your new commit node.'
  },
  {
    id: 'lesson-4',
    level: 'Beginner',
    title: '4. Read Commit History',
    subtitle: 'Explore previous commits using git log',
    objective: 'Inspect previous commits and branch pointers in the terminal log.',
    explanation: '`git log` displays commits in reverse chronological order, showing hashes, authors, timestamps, and commit messages.',
    initialStateGenerator: () => createDefaultRepo(),
    steps: [
      {
        instruction: 'Inspect the commit log in one-line summary mode: `git log --oneline`.',
        hint: 'Run "git log --oneline" to see compact commit summaries.',
        verify: () => true
      }
    ],
    summary: 'You explored the commit log! Each commit has a unique abbreviated hash (e.g. c3f4a5b).'
  },
  {
    id: 'lesson-5',
    level: 'Intermediate',
    title: '5. Create & Switch Branches',
    subtitle: 'Work safely in parallel isolated lines of development',
    objective: 'Create a feature branch, switch HEAD to it, and make a commit.',
    explanation: 'Branches in Git are merely lightweight pointers to commits. Switching branches updates HEAD and adjusts files in your working directory.',
    initialStateGenerator: () => createDefaultRepo(),
    steps: [
      {
        instruction: 'Create and switch to a new branch called `feature-login`: `git switch -c feature-login`.',
        hint: 'Run: git switch -c feature-login',
        verify: (state) => state.HEAD.name === 'feature-login' && !!state.branches['feature-login']
      },
      {
        instruction: 'Stage existing changes and commit: run `git add .` then `git commit -m "feat: login form"`.',
        hint: 'Run "git add ." then "git commit -m \'feat: login form\'"',
        verify: (state) => state.HEAD.name === 'feature-login' && state.commits[getHeadCommitHash(state)]?.message.includes('login form')
      }
    ],
    summary: 'Awesome! Your commit advanced `feature-login` while `main` remained securely untouched.'
  },
  {
    id: 'lesson-6',
    level: 'Intermediate',
    title: '6. Fast-Forward vs 3-Way Merge',
    subtitle: 'Integrate feature branch changes into main',
    objective: 'Switch back to main and merge the feature branch.',
    explanation: 'If `main` has no new commits since branching, Git does a Fast-Forward merge by simply sliding the branch pointer forward. If both branches diverged, Git generates a 3-way merge commit.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state = executeCommand(state, 'git switch -c feature-nav').state;
      state.workingDir.files['navbar.jsx'] = { content: '<nav>Menu</nav>', status: 'untracked' };
      state = executeCommand(state, 'git add navbar.jsx').state;
      state = executeCommand(state, 'git commit -m "feat: add responsive navbar"').state;
      return state;
    },
    steps: [
      {
        instruction: 'Switch back to `main`: `git switch main`.',
        hint: 'Run: git switch main',
        verify: (state) => state.HEAD.name === 'main'
      },
      {
        instruction: 'Merge `feature-nav` into main: `git merge feature-nav`.',
        hint: 'Run: git merge feature-nav',
        verify: (state) => state.branches['main'] === state.branches['feature-nav']
      }
    ],
    summary: 'You executed a Fast-Forward merge! The main branch pointer caught up to feature-nav seamlessly.'
  },
  {
    id: 'lesson-7',
    level: 'Intermediate',
    title: '7. Resolve a Merge Conflict',
    subtitle: 'Fix conflicting simultaneous edits with confidence',
    objective: 'Trigger a merge conflict, understand the markers, resolve it, and finalize the merge commit.',
    explanation: 'Merge conflicts happen when two branches modify the exact same lines of a file. Git halts and embeds `<<<<<<< HEAD`, `=======`, and `>>>>>>>` markers for you to resolve.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state = executeCommand(state, 'git switch -c feature-hero').state;
      state.workingDir.files['README.md'] = { content: '# New Hero Design Header', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "hero header in feature"').state;

      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['README.md'] = { content: '# Main Production Header', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "production header in main"').state;
      return state;
    },
    steps: [
      {
        instruction: 'Attempt to merge `feature-hero` into main: `git merge feature-hero`.',
        hint: 'Run: git merge feature-hero',
        verify: (state) => state.mergeState?.inProgress === true
      },
      {
        instruction: 'Mark the conflict as resolved by adding the file: `git add README.md`.',
        hint: 'Run "git add README.md" (or resolve via the Conflict button in the Inspector, then stage).',
        verify: (state) => !state.mergeState?.conflictedFiles || state.mergeState.conflictedFiles.length === 0
      },
      {
        instruction: 'Finalize the merge: `git commit -m "Merge resolved"`.',
        hint: 'Run: git commit -m "Merge resolved"',
        verify: (state) => !state.mergeState && state.commits[getHeadCommitHash(state)]?.parentHashes.length === 2
      }
    ],
    summary: 'You resolved a real merge conflict and produced a multi-parent merge commit!'
  },
  {
    id: 'lesson-8',
    level: 'Intermediate',
    title: '8. Undo Safely (Restore & Revert)',
    subtitle: 'Discard working changes and invert commits safely',
    objective: 'Use git restore to discard dirty edits, and git revert to safely undo a public commit without rewriting history.',
    explanation: '`git restore` resets files in your working directory. `git revert` is the safest undo tool for shared branches because it creates an inverse commit instead of erasing history.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state.workingDir.files['scratch.txt'] = { content: 'bad unintended edit', status: 'modified' };
      return state;
    },
    steps: [
      {
        instruction: 'Discard modified changes to `scratch.txt` using `git restore scratch.txt`.',
        hint: 'Run: git restore scratch.txt',
        verify: (state) => state.workingDir.files['scratch.txt']?.status === 'clean' || !state.workingDir.files['scratch.txt']
      },
      {
        instruction: 'Revert the latest commit safely: `git revert HEAD`.',
        hint: 'Run: git revert HEAD',
        verify: (state) => state.commits[getHeadCommitHash(state)]?.message.startsWith('Revert')
      }
    ],
    summary: 'You safely undid changes! The history remains transparent, reproducible, and intact.'
  },
  {
    id: 'lesson-9',
    level: 'Advanced',
    title: '9. Stash Uncommitted Work',
    subtitle: 'Shelve changes temporarily when you need to switch contexts',
    objective: 'Save a dirty working directory to the stash, and restore it later.',
    explanation: '`git stash` takes your uncommitted modifications (both staged and unstaged) and pushes them onto a temporary stack, leaving your workspace completely clean.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state.workingDir.files['wip.js'] = { content: 'half-finished algorithm', status: 'modified' };
      return state;
    },
    steps: [
      {
        instruction: 'Stash your work away: `git stash`.',
        hint: 'Run: git stash',
        verify: (state) => state.stash.length === 1
      },
      {
        instruction: 'Check your stash list: `git stash list`.',
        hint: 'Run: git stash list',
        verify: (state) => state.stash.length === 1
      },
      {
        instruction: 'Restore and pop your saved work: `git stash pop`.',
        hint: 'Run: git stash pop',
        verify: (state) => state.stash.length === 0
      }
    ],
    summary: 'Stash mastered! You can safely shelve work and switch tasks without losing progress.'
  },
  {
    id: 'lesson-10',
    level: 'Advanced',
    title: '10. Synchronize with Remotes (Fetch & Push)',
    subtitle: 'Coordinate code with GitHub or remote team repositories',
    objective: 'Fetch remote changes, inspect tracking branches, and push local commits.',
    explanation: '`git fetch` downloads remote objects without touching your local working files. `git push` publishes your local branch commits to the remote.',
    initialStateGenerator: () => createDefaultRepo(),
    steps: [
      {
        instruction: 'Fetch remote metadata from origin: `git fetch`.',
        hint: 'Run: git fetch',
        verify: (state) => !!state.remotes['origin']
      },
      {
        instruction: 'Push your latest local commits to origin: `git push`.',
        hint: 'Run: git push',
        verify: (state) => state.remotes['origin']?.branches?.['main'] === state.branches['main']
      }
    ],
    summary: 'Your local repository and GitHub origin remote are now completely in sync!'
  },
  {
    id: 'lesson-11',
    level: 'Advanced',
    title: '11. Merge vs Rebase',
    subtitle: 'Keep history clean and linear with rebase',
    objective: 'Rebase a feature branch on top of main, observing how commit hashes are rewritten.',
    explanation: 'While merge preserves the exact branching structure with a merge commit, rebase replays your commits one by one on top of the target branch tip, creating clean linear history with new commit IDs.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state = executeCommand(state, 'git switch -c feature-widget').state;
      state.workingDir.files['widget.js'] = { content: 'export const widget = true;', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feat: widget module"').state;

      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['core.js'] = { content: 'export const core = true;', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feat: core module"').state;

      state = executeCommand(state, 'git switch feature-widget').state;
      return state;
    },
    steps: [
      {
        instruction: 'Rebase current branch onto main: `git rebase main`.',
        hint: 'Run: git rebase main',
        verify: (state) => {
          const currentHead = getHeadCommitHash(state);
          const parent = state.commits[currentHead]?.parentHashes[0];
          return parent === state.branches['main'];
        }
      }
    ],
    summary: 'Rebase successful! The widget commit was replayed directly on top of main with a clean linear parent relationship.'
  },
  {
    id: 'lesson-12',
    level: 'Advanced',
    title: '12. Recover Commits with Reflog',
    subtitle: 'Git\'s ultimate safety net for recovering lost work',
    objective: 'View the reflog history and understand how every HEAD movement is recorded.',
    explanation: 'Even if you accidentally reset or delete a branch, Git records every commit hash that HEAD has pointed to in the reflog. Nothing is lost!',
    initialStateGenerator: () => createDefaultRepo(),
    steps: [
      {
        instruction: 'Inspect the reflog to view all HEAD transitions: `git reflog`.',
        hint: 'Run: git reflog',
        verify: (state) => state.reflog.length > 0
      }
    ],
    summary: 'Reflog examined! You now know how to locate commit hashes for any previously visited state.'
  }
];

export const CHALLENGES = [
  {
    id: 'challenge-1',
    title: 'Challenge 1: Feature Branching Workflow',
    difficulty: 'Intermediate',
    description: 'Starting from main, create branch "feat-profile", add a file "profile.js", commit it, switch to main, and fast-forward merge "feat-profile".',
    initialStateGenerator: () => createDefaultRepo(),
    targetGoalDescription: 'Branch "main" must contain the commit from "feat-profile" with file "profile.js".',
    validateTargetState: (state) => {
      const mainHash = state.branches['main'];
      if (!mainHash || !state.commits[mainHash]) return false;
      const mainTree = state.commits[mainHash].tree;
      return !!mainTree['profile.js'] && state.HEAD.name === 'main';
    },
    hints: [
      '1. git switch -c feat-profile',
      '2. (Create/add profile.js or run: git add .)',
      '3. git commit -m "add profile"',
      '4. git switch main',
      '5. git merge feat-profile'
    ]
  },
  {
    id: 'challenge-2',
    title: 'Challenge 2: Safe Reset & Recovery',
    difficulty: 'Advanced',
    description: 'You made an experimental commit that you want to uncommit while keeping all changes staged in the index ready to be re-committed.',
    initialStateGenerator: () => {
      let state = createDefaultRepo();
      state.workingDir.files['temp.js'] = { content: 'test', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      return executeCommand(state, 'git commit -m "unwanted commit"').state;
    },
    targetGoalDescription: 'HEAD must point to c3f4a5b, but the index must still contain staged files.',
    validateTargetState: (state) => {
      const headHash = getHeadCommitHash(state);
      return headHash === 'c3f4a5b' && Object.keys(state.index.files).length >= 3;
    },
    hints: [
      'Think about which reset mode keeps staged changes in the index without touching them.',
      'Try: git reset --soft HEAD~1'
    ]
  }
];
