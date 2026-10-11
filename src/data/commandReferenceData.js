/**
 * Comprehensive Git Command Reference Database
 */

export const COMMAND_REFERENCE = [
  // BASICS
  {
    id: 'git-init',
    category: 'Basics',
    command: 'git init',
    syntax: 'git init',
    purpose: 'Initialize a new empty Git repository or reinitialize an existing one.',
    example: 'git init',
    preconditions: 'None. Can be run in an empty directory or existing project folder.',
    expectedEffect: 'Creates a hidden `.git` directory containing object database, refs, and default HEAD pointer to "main".',
    commonErrors: ['Running git commands before git init yields "fatal: not a git repository".'],
    relatedCommands: ['git clone', 'git status'],
    safetyWarning: null,
    sandboxCommand: 'git init'
  },
  {
    id: 'git-status',
    category: 'Basics',
    command: 'git status',
    syntax: 'git status [-s]',
    purpose: 'Display state of the working directory and the staging area.',
    example: 'git status',
    preconditions: 'Must be inside an initialized Git repository.',
    expectedEffect: 'Shows tracked modified files, untracked files, staged files, active branch, and tracking status.',
    commonErrors: ['None. Safe read-only inspection command.'],
    relatedCommands: ['git diff', 'git log'],
    safetyWarning: null,
    sandboxCommand: 'git status'
  },

  // FILES & STAGING
  {
    id: 'git-add',
    category: 'Files and Staging',
    command: 'git add',
    syntax: 'git add <pathspec...>',
    purpose: 'Add file contents from working directory to the Staging Area (index).',
    example: 'git add index.js style.css\ngit add .',
    preconditions: 'Target files must exist in the working directory.',
    expectedEffect: 'Copies working file content snapshots into index, staging them for the next commit.',
    commonErrors: ['fatal: pathspec "file" did not match any files.'],
    relatedCommands: ['git restore --staged', 'git status', 'git commit'],
    safetyWarning: null,
    sandboxCommand: 'git add .'
  },
  {
    id: 'git-restore-staged',
    category: 'Files and Staging',
    command: 'git restore --staged',
    syntax: 'git restore --staged <file>',
    purpose: 'Remove files from the Staging Area without modifying the working directory.',
    example: 'git restore --staged app.py',
    preconditions: 'File must currently be staged in the index.',
    expectedEffect: 'Replaces index version with HEAD version. Working directory changes remain safely intact.',
    commonErrors: ['Omitting --staged restores the working directory instead!'],
    relatedCommands: ['git add', 'git restore'],
    safetyWarning: 'Ensure you include --staged if you do NOT want working directory edits discarded.',
    sandboxCommand: 'git restore --staged utils.js'
  },
  {
    id: 'git-restore',
    category: 'Files and Staging',
    command: 'git restore',
    syntax: 'git restore <file>',
    purpose: 'Discard unstaged modifications in the working tree to match the index or HEAD.',
    example: 'git restore index.js',
    preconditions: 'File must have tracked modifications in working directory.',
    expectedEffect: 'Overwrites working tree file with the staged index version.',
    commonErrors: ['fatal: pathspec did not match any file known to git.'],
    relatedCommands: ['git restore --staged', 'git checkout -- <file>'],
    safetyWarning: '⚠️ Destructive: Unstaged edits in the working file will be permanently discarded.',
    sandboxCommand: 'git restore index.js'
  },

  // COMMITS
  {
    id: 'git-commit',
    category: 'Commits',
    command: 'git commit',
    syntax: 'git commit -m "<message>"',
    purpose: 'Record staged changes from the index into a permanent commit in repository history.',
    example: 'git commit -m "feat: implement user authentication"',
    preconditions: 'Must have at least one change staged in the index (unless using -a flag).',
    expectedEffect: 'Creates a new commit object pointing to current HEAD commit, advances active branch pointer and HEAD.',
    commonErrors: ['"nothing to commit, working tree clean" when forgetting to git add first.'],
    relatedCommands: ['git add', 'git log', 'git status'],
    safetyWarning: null,
    sandboxCommand: 'git commit -m "feat: update project codebase"'
  },
  {
    id: 'git-commit-am',
    category: 'Commits',
    command: 'git commit -am',
    syntax: 'git commit -am "<message>"',
    purpose: 'Automatically stage all modified tracked files and commit in a single step.',
    example: 'git commit -am "fix: correct typo in layout"',
    preconditions: 'Target files must already be tracked by Git (does not include untracked new files).',
    expectedEffect: 'Stages modified tracked files and creates a new commit.',
    commonErrors: ['Will NOT stage brand new untracked files.'],
    relatedCommands: ['git commit', 'git add -u'],
    safetyWarning: null,
    sandboxCommand: 'git commit -am "refactor: simplify styles"'
  },

  // BRANCHING
  {
    id: 'git-branch',
    category: 'Branching',
    command: 'git branch',
    syntax: 'git branch [<branchname> | -d <branchname>]',
    purpose: 'List, create, or delete branches.',
    example: 'git branch\ngit branch feature/login\ngit branch -d feature/login',
    preconditions: 'Repo must have at least one commit to create a branch.',
    expectedEffect: 'With no arguments: lists branches with * on active branch. With name: creates branch pointer at HEAD.',
    commonErrors: ['fatal: a branch named "x" already exists.', 'Cannot delete currently checked out branch.'],
    relatedCommands: ['git switch', 'git checkout'],
    safetyWarning: null,
    sandboxCommand: 'git branch'
  },
  {
    id: 'git-switch',
    category: 'Branching',
    command: 'git switch',
    syntax: 'git switch [-c] <branchname>',
    purpose: 'Switch branches or create and switch to a new branch.',
    example: 'git switch feature/login\ngit switch -c feature/payments',
    preconditions: 'Target branch must exist (unless -c flag is passed).',
    expectedEffect: 'Moves HEAD to target branch pointer, updates working directory to match target commit tree.',
    commonErrors: ['fatal: invalid reference when branch does not exist.'],
    relatedCommands: ['git branch', 'git checkout'],
    safetyWarning: null,
    sandboxCommand: 'git switch -c feature/search'
  },
  {
    id: 'git-checkout',
    category: 'Branching',
    command: 'git checkout',
    syntax: 'git checkout [-b <branch>] [<commit/branch>]',
    purpose: 'Switch branches, restore files, or checkout a specific commit hash (detached HEAD).',
    example: 'git checkout -b feature/auth\ngit checkout c1a2b34',
    preconditions: 'Target commit or branch must be valid.',
    expectedEffect: 'Updates HEAD and working files. Checking out a commit hash puts repo in Detached HEAD state.',
    commonErrors: ['Confusing branch checkout with file checkout (`git checkout -- <file>`). Modern Git prefers `git switch` and `git restore`.'],
    relatedCommands: ['git switch', 'git restore'],
    safetyWarning: null,
    sandboxCommand: 'git checkout c1a2b34'
  },

  // MERGING & REBASING
  {
    id: 'git-merge',
    category: 'Merging and Rebasing',
    command: 'git merge',
    syntax: 'git merge <branch>',
    purpose: 'Join two or more development histories together.',
    example: 'git merge feature/auth',
    preconditions: 'Must be on the receiving branch. Target branch must exist.',
    expectedEffect: 'If linear: Fast-Forward merge (moves branch pointer). If diverged: creates a 3-way merge commit with two parents. If overlapping edits: pauses with conflict markers.',
    commonErrors: ['Merge conflict requires manual resolution and git commit.'],
    relatedCommands: ['git merge --abort', 'git rebase', 'git log --graph'],
    safetyWarning: null,
    sandboxCommand: 'git merge feature/auth'
  },
  {
    id: 'git-merge-abort',
    category: 'Merging and Rebasing',
    command: 'git merge --abort',
    syntax: 'git merge --abort',
    purpose: 'Abort an unmerged conflict state and restore pre-merge state.',
    example: 'git merge --abort',
    preconditions: 'A merge conflict must be actively in progress.',
    expectedEffect: 'Restores working directory and index to the pre-merge HEAD commit state.',
    commonErrors: ['fatal: There is no merge to abort.'],
    relatedCommands: ['git merge'],
    safetyWarning: null,
    sandboxCommand: 'git merge --abort'
  },
  {
    id: 'git-rebase',
    category: 'Merging and Rebasing',
    command: 'git rebase',
    syntax: 'git rebase <upstream-branch>',
    purpose: 'Reapply commits from current branch on top of another base tip.',
    example: 'git rebase main',
    preconditions: 'Current branch must have commits that diverge from upstream branch.',
    expectedEffect: 'Replays each commit onto target tip. Generates NEW commit hashes because parent hashes change. Yields linear history.',
    commonErrors: ['Never rebase public shared commits pushed to team branches!'],
    relatedCommands: ['git merge', 'git cherry-pick'],
    safetyWarning: '⚠️ Rewrites commit hashes. Do not rebase branches that have already been pushed to a public shared remote.',
    sandboxCommand: 'git rebase main'
  },

  // UNDO & RECOVERY
  {
    id: 'git-reset-soft',
    category: 'Undo and Recovery',
    command: 'git reset --soft',
    syntax: 'git reset --soft <commit>',
    purpose: 'Move HEAD and branch pointer back without touching Index or Working Directory.',
    example: 'git reset --soft HEAD~1',
    preconditions: 'Target commit must exist.',
    expectedEffect: 'Branch pointer moves to target commit. All changes between target and previous HEAD remain staged in the Index.',
    commonErrors: ['Resetting past initial commit.'],
    relatedCommands: ['git reset --mixed', 'git reset --hard', 'git revert'],
    safetyWarning: 'Safe: files are preserved in the staging area.',
    sandboxCommand: 'git reset --soft HEAD~1'
  },
  {
    id: 'git-reset-mixed',
    category: 'Undo and Recovery',
    command: 'git reset',
    syntax: 'git reset [--mixed] <commit>',
    purpose: 'Move HEAD and reset Index to target commit, keeping working directory changes unstaged.',
    example: 'git reset HEAD~1',
    preconditions: 'Target commit must exist.',
    expectedEffect: 'Branch pointer moves to target commit, index reset. Working tree retains modifications as unstaged files.',
    commonErrors: ['Forgetting that files become unstaged in working tree.'],
    relatedCommands: ['git reset --soft', 'git reset --hard'],
    safetyWarning: 'Safe: files are preserved in the working directory.',
    sandboxCommand: 'git reset HEAD~1'
  },
  {
    id: 'git-reset-hard',
    category: 'Undo and Recovery',
    command: 'git reset --hard',
    syntax: 'git reset --hard <commit>',
    purpose: 'Reset HEAD, Index, AND Working Directory to match the target commit snapshot.',
    example: 'git reset --hard HEAD~1',
    preconditions: 'Target commit must exist.',
    expectedEffect: 'Moves branch pointer and forcibly discards all uncommitted working tree and staged index changes.',
    commonErrors: ['Accidentally losing uncommitted work that was not stashed or committed.'],
    relatedCommands: ['git reflog', 'git stash'],
    safetyWarning: '🚨 DANGER: Uncommitted work in the working directory will be permanently destroyed!',
    sandboxCommand: 'git reset --hard HEAD~1'
  },
  {
    id: 'git-revert',
    category: 'Undo and Recovery',
    command: 'git revert',
    syntax: 'git revert <commit>',
    purpose: 'Safely undo a commit by creating a new inverse commit.',
    example: 'git revert HEAD',
    preconditions: 'Target commit must exist.',
    expectedEffect: 'Calculates the inverse diff of target commit and records a new commit without altering past history.',
    commonErrors: ['Reverting merge commits without specifying -m parent.'],
    relatedCommands: ['git reset', 'git log'],
    safetyWarning: 'Safe and recommended for public shared branches.',
    sandboxCommand: 'git revert HEAD'
  },
  {
    id: 'git-reflog',
    category: 'Undo and Recovery',
    command: 'git reflog',
    syntax: 'git reflog',
    purpose: 'Inspect reference logs showing all movements of HEAD.',
    example: 'git reflog',
    preconditions: 'None.',
    expectedEffect: 'Lists sequential record of every commit hash HEAD visited (commits, checkouts, merges, resets).',
    commonErrors: ['Reflog is local-only; not pushed to remotes.'],
    relatedCommands: ['git log', 'git reset --hard HEAD@{n}'],
    safetyWarning: null,
    sandboxCommand: 'git reflog'
  },

  // STASHING
  {
    id: 'git-stash',
    category: 'Stashing',
    command: 'git stash',
    syntax: 'git stash [push -m "<message>"]',
    purpose: 'Temporarily shelve dirty working directory and staged index changes.',
    example: 'git stash\ngit stash push -m "work in progress on auth"',
    preconditions: 'Working tree must have modified or staged files.',
    expectedEffect: 'Saves dirty changes onto stash stack and restores working directory to clean HEAD state.',
    commonErrors: ['Untracked files are not stashed unless -u flag is used.'],
    relatedCommands: ['git stash pop', 'git stash list'],
    safetyWarning: null,
    sandboxCommand: 'git stash'
  },
  {
    id: 'git-stash-pop',
    category: 'Stashing',
    command: 'git stash pop',
    syntax: 'git stash pop',
    purpose: 'Restore the top stashed state and remove it from the stash stack.',
    example: 'git stash pop',
    preconditions: 'Stash stack must contain at least one entry.',
    expectedEffect: 'Applies stash@{0} modifications back to working directory and index, then deletes stash@{0}.',
    commonErrors: ['error: No stash entries found.'],
    relatedCommands: ['git stash apply', 'git stash drop'],
    safetyWarning: null,
    sandboxCommand: 'git stash pop'
  },

  // REMOTES & SYNC
  {
    id: 'git-fetch',
    category: 'Remotes',
    command: 'git fetch',
    syntax: 'git fetch [<remote>]',
    purpose: 'Download objects and refs from remote repository without integrating them into local branches.',
    example: 'git fetch origin',
    preconditions: 'Remote must be configured and network accessible.',
    expectedEffect: 'Updates remote tracking branches like origin/main. Working directory and local branches untouched.',
    commonErrors: ['fatal: origin does not appear to be a git repository.'],
    relatedCommands: ['git pull', 'git remote'],
    safetyWarning: null,
    sandboxCommand: 'git fetch'
  },
  {
    id: 'git-pull',
    category: 'Remotes',
    command: 'git pull',
    syntax: 'git pull [<remote>] [<branch>]',
    purpose: 'Fetch from remote and integrate (merge) with current local branch.',
    example: 'git pull origin main',
    preconditions: 'Remote tracking branch must exist. Clean working directory recommended.',
    expectedEffect: 'Executes git fetch followed by git merge origin/<branch>.',
    commonErrors: ['Merge conflict during pull if remote and local diverged.'],
    relatedCommands: ['git fetch', 'git merge'],
    safetyWarning: null,
    sandboxCommand: 'git pull'
  },
  {
    id: 'git-push',
    category: 'Remotes',
    command: 'git push',
    syntax: 'git push [<remote>] [<branch>]',
    purpose: 'Update remote repository with local branch commits.',
    example: 'git push origin main',
    preconditions: 'Remote branch must be an ancestor of local branch (fast-forward push).',
    expectedEffect: 'Uploads commits and updates remote branch pointer.',
    commonErrors: ['Rejected non-fast-forward push if remote has newer commits. Fix with git pull first.'],
    relatedCommands: ['git fetch', 'git pull'],
    safetyWarning: 'Avoid `git push --force` on shared main branches.',
    sandboxCommand: 'git push'
  },

  // ADVANCED & INSPECTION
  {
    id: 'git-cherry-pick',
    category: 'Advanced workflows',
    command: 'git cherry-pick',
    syntax: 'git cherry-pick <commit>',
    purpose: 'Apply changes introduced by an existing commit to current HEAD as a new commit.',
    example: 'git cherry-pick c2d3e4f',
    preconditions: 'Target commit must exist.',
    expectedEffect: 'Extracts diff of target commit and applies it as a brand-new commit on current branch.',
    commonErrors: ['Conflicts if target commit changes lines already modified on HEAD.'],
    relatedCommands: ['git rebase', 'git revert'],
    safetyWarning: null,
    sandboxCommand: 'git cherry-pick c2d3e4f'
  },
  {
    id: 'git-tag',
    category: 'Advanced workflows',
    command: 'git tag',
    syntax: 'git tag [<tagname>]',
    purpose: 'Create, list, or delete tags (permanent release labels on commits).',
    example: 'git tag v1.0.0',
    preconditions: 'Must have at least one commit in repository.',
    expectedEffect: 'Attaches permanent label to current HEAD commit.',
    commonErrors: ['fatal: tag already exists.'],
    relatedCommands: ['git show', 'git log'],
    safetyWarning: null,
    sandboxCommand: 'git tag v1.0.0'
  }
];

