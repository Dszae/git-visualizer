import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultRepo,
  createEmptyRepo,
  executeCommand,
  getHeadCommitHash,
  resolveFileConflict,
  resetHashCounter
} from '../src/engine/gitEngine.js';

describe('Git Repository Engine', () => {
  beforeEach(() => {
    resetHashCounter(2000);
  });

  describe('Initialization and Basics', () => {
    it('creates an uninitialized empty repository and initializes it with git init', () => {
      const empty = createEmptyRepo();
      expect(empty.isInitialized).toBe(false);

      // Attempting git status on uninitialized repo should fail
      const statusRes = executeCommand(empty, 'git status');
      expect(statusRes.error).toContain('fatal: not a git repository');

      // git init should initialize it
      const initRes = executeCommand(empty, 'git init');
      expect(initRes.error).toBeNull();
      expect(initRes.state.isInitialized).toBe(true);
      expect(initRes.state.HEAD.name).toBe('main');
    });

    it('creates a default rich sample repository', () => {
      const repo = createDefaultRepo();
      expect(repo.isInitialized).toBe(true);
      expect(Object.keys(repo.commits).length).toBe(3);
      expect(repo.HEAD.name).toBe('main');
      expect(getHeadCommitHash(repo)).toBe('c3f4a5b');
    });

    it('rejects non-git commands gracefully', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'npm test');
      expect(res.error).toContain("command not found: npm");
    });
  });

  describe('Staging and Committing', () => {
    it('stages specific files with git add <file>', () => {
      const repo = createDefaultRepo();
      expect(repo.workingDir.files['utils.js'].status).toBe('untracked');
      expect(repo.index.files['utils.js']).toBeUndefined();

      const res = executeCommand(repo, 'git add utils.js');
      expect(res.error).toBeNull();
      expect(res.state.index.files['utils.js']).toBeDefined();
      expect(res.state.workingDir.files['utils.js'].status).toBe('staged');
    });

    it('stages all modified and untracked files with git add .', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git add .');
      expect(res.error).toBeNull();
      expect(res.state.index.files['utils.js']).toBeDefined();
      expect(res.state.index.files['index.js'].content).toContain('add database connection');
    });

    it('commits staged files with a descriptive message', () => {
      const repo = createDefaultRepo();
      const addRes = executeCommand(repo, 'git add .');
      const commitRes = executeCommand(addRes.state, 'git commit -m "feat: add utils and db placeholder"');

      expect(commitRes.error).toBeNull();
      const newHead = getHeadCommitHash(commitRes.state);
      expect(newHead).not.toBe('c3f4a5b');
      expect(commitRes.state.commits[newHead].message).toBe('feat: add utils and db placeholder');
      expect(commitRes.state.commits[newHead].parentHashes).toEqual(['c3f4a5b']);
      expect(commitRes.state.branches['main']).toBe(newHead);
      expect(commitRes.state.reflog[0].action).toContain('feat: add utils and db placeholder');
    });

    it('fails to commit when working tree and index are clean', () => {
      const repo = createDefaultRepo();
      // restore index.js to clean HEAD state first
      executeCommand(repo, 'git restore index.js');
      delete repo.workingDir.files['utils.js'];
      const commitRes = executeCommand(repo, 'git commit -m "empty commit"');
      expect(commitRes.explanation.success).toBe(false);
      expect(commitRes.output).toContain('nothing to commit');
    });
  });

  describe('Branching and Switching', () => {
    it('creates a new branch with git branch <name>', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git branch feature-login');
      expect(res.error).toBeNull();
      expect(res.state.branches['feature-login']).toBe('c3f4a5b');
      // HEAD should remain on main
      expect(res.state.HEAD.name).toBe('main');
    });

    it('switches branches with git switch <name>', () => {
      const repo = createDefaultRepo();
      const brRes = executeCommand(repo, 'git branch feature-login');
      const swRes = executeCommand(brRes.state, 'git switch feature-login');

      expect(swRes.error).toBeNull();
      expect(swRes.state.HEAD.name).toBe('feature-login');
    });

    it('creates and switches branch in one step with git switch -c <name>', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git switch -c feature-auth');
      expect(res.error).toBeNull();
      expect(res.state.HEAD.name).toBe('feature-auth');
      expect(res.state.branches['feature-auth']).toBe('c3f4a5b');
    });

    it('safely deletes merged or unmerged branches with git branch -d', () => {
      const repo = createDefaultRepo();
      const brRes = executeCommand(repo, 'git branch temp-branch');
      const delRes = executeCommand(brRes.state, 'git branch -d temp-branch');
      expect(delRes.error).toBeNull();
      expect(delRes.state.branches['temp-branch']).toBeUndefined();
    });

    it('prevents deleting the currently checked out branch', () => {
      const repo = createDefaultRepo();
      const delRes = executeCommand(repo, 'git branch -d main');
      expect(delRes.error).toContain('Cannot delete branch');
    });
  });

  describe('Merging and Conflicts', () => {
    it('performs a Fast-Forward merge when target branch is directly ahead', () => {
      const repo = createDefaultRepo();
      // create branch 'feature' from main
      let state = executeCommand(repo, 'git switch -c feature').state;
      // add a commit on feature
      state.workingDir.files['feature.js'] = { content: 'console.log("feature");', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "add feature.js"').state;
      const featureCommit = getHeadCommitHash(state);

      // switch back to main
      state = executeCommand(state, 'git switch main').state;
      expect(getHeadCommitHash(state)).toBe('c3f4a5b');

      // merge feature into main (should fast-forward)
      const mergeRes = executeCommand(state, 'git merge feature');
      expect(mergeRes.error).toBeNull();
      expect(mergeRes.output).toContain('Fast-forward');
      expect(mergeRes.state.branches['main']).toBe(featureCommit);
    });

    it('performs a 3-way merge with multi-parent commit when branches diverge without conflicts', () => {
      const repo = createDefaultRepo();
      // Branch 1: feature
      let state = executeCommand(repo, 'git switch -c feature').state;
      state.workingDir.files['feature.js'] = { content: 'export const f = 1;', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feature commit"').state;
      const featureHash = getHeadCommitHash(state);

      // Branch 2: main
      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['docs.md'] = { content: '# Docs', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "docs commit"').state;
      const mainHash = getHeadCommitHash(state);

      // Merge feature into main
      const mergeRes = executeCommand(state, 'git merge feature');
      expect(mergeRes.error).toBeNull();
      expect(mergeRes.output).toContain('Merge made by the \'ort\' strategy');
      const mergeCommitHash = getHeadCommitHash(mergeRes.state);
      const mergeCommit = mergeRes.state.commits[mergeCommitHash];
      expect(mergeCommit.parentHashes).toEqual([mainHash, featureHash]);
    });

    it('detects merge conflicts when both branches modified the same file differently', () => {
      const repo = createDefaultRepo();
      // Branch 1: feature
      let state = executeCommand(repo, 'git switch -c feature').state;
      state.workingDir.files['README.md'] = { content: '# Feature Readme', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "update readme in feature"').state;

      // Branch 2: main
      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['README.md'] = { content: '# Main Readme', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "update readme in main"').state;

      // Merge feature into main -> conflict!
      const mergeRes = executeCommand(state, 'git merge feature');
      expect(mergeRes.output).toContain('CONFLICT');
      expect(mergeRes.state.mergeState.inProgress).toBe(true);
      expect(mergeRes.state.workingDir.files['README.md'].status).toBe('conflicted');
      expect(mergeRes.state.workingDir.files['README.md'].content).toContain('<<<<<<< HEAD');

      // Aborting merge restores pre-merge state
      const abortRes = executeCommand(mergeRes.state, 'git merge --abort');
      expect(abortRes.error).toBeNull();
      expect(abortRes.state.mergeState).toBeNull();
      expect(abortRes.state.workingDir.files['README.md'].content).toBe('# Main Readme');
    });

    it('resolves merge conflicts via UI helper and commits', () => {
      const repo = createDefaultRepo();
      let state = executeCommand(repo, 'git switch -c feature').state;
      state.workingDir.files['README.md'] = { content: '# Feature Readme', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feature readme"').state;

      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['README.md'] = { content: '# Main Readme', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "main readme"').state;

      let mergeRes = executeCommand(state, 'git merge feature').state;
      // Resolve conflict by choosing 'incoming'
      const resolved = resolveFileConflict(mergeRes, 'README.md', 'incoming');
      expect(resolved.workingDir.files['README.md'].content).toBe('# Feature Readme');

      // Now commit the resolved merge
      const finalCommit = executeCommand(resolved, 'git commit -m "Merge resolved"');
      expect(finalCommit.error).toBeNull();
      expect(finalCommit.state.mergeState).toBeNull();
    });
  });

  describe('Rebasing', () => {
    it('replays commits with brand new hashes on top of target branch', () => {
      const repo = createDefaultRepo();
      // Create feature branch and make 2 commits
      let state = executeCommand(repo, 'git switch -c feature').state;
      state.workingDir.files['f1.txt'] = { content: '1', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "commit 1 on feature"').state;

      state.workingDir.files['f2.txt'] = { content: '2', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "commit 2 on feature"').state;
      const featC2 = getHeadCommitHash(state);

      // Go to main and make 1 commit
      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['m1.txt'] = { content: 'main', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "main commit"').state;
      const mainTip = getHeadCommitHash(state);

      // Switch back to feature and rebase onto main
      state = executeCommand(state, 'git switch feature').state;
      const rebaseRes = executeCommand(state, 'git rebase main');

      expect(rebaseRes.error).toBeNull();
      expect(rebaseRes.output).toContain('Successfully rebased');

      const rebasedTip = getHeadCommitHash(rebaseRes.state);
      // Tip must NOT be featC2 because rebase creates new commit IDs
      expect(rebasedTip).not.toBe(featC2);
      expect(rebaseRes.state.commits[rebasedTip].message).toBe('commit 2 on feature');

      // Verify ancestry is linear on top of mainTip
      const parentOfTip = rebaseRes.state.commits[rebasedTip].parentHashes[0];
      expect(rebaseRes.state.commits[parentOfTip].message).toBe('commit 1 on feature');
      expect(rebaseRes.state.commits[parentOfTip].parentHashes[0]).toBe(mainTip);
    });
  });

  describe('Safe Undo Operations: reset, revert, restore', () => {
    it('git restore --staged unstages a file while preserving working tree edits', () => {
      const repo = createDefaultRepo();
      let state = executeCommand(repo, 'git add .').state;
      expect(state.index.files['utils.js']).toBeDefined();

      const res = executeCommand(state, 'git restore --staged utils.js');
      expect(res.error).toBeNull();
      expect(res.state.index.files['utils.js']).toBeUndefined();
      expect(res.state.workingDir.files['utils.js']).toBeDefined();
    });

    it('git reset --soft moves HEAD backwards while leaving index and working tree staged', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git reset --soft HEAD~1');
      expect(res.error).toBeNull();
      expect(res.state.branches['main']).toBe('c2d3e4f');
      // Index is still intact
      expect(res.state.index.files['README.md']).toBeDefined();
    });

    it('git reset --hard resets HEAD, Index, and Working Directory', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git reset --hard HEAD~1');
      expect(res.error).toBeNull();
      expect(res.state.branches['main']).toBe('c2d3e4f');
      // Working dir README matches c2d3e4f
      expect(res.state.workingDir.files['README.md'].content).toBe('# Project\nA modern web application.');
    });

    it('git revert creates a new commit that safely inverts changes without rewriting history', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git revert HEAD');
      expect(res.error).toBeNull();
      const newHead = getHeadCommitHash(res.state);
      expect(res.state.commits[newHead].message).toContain('Revert "feat: implement basic API route handlers"');
      expect(res.state.commits['c3f4a5b']).toBeDefined(); // old commit remains!
    });
  });

  describe('Stash Operations', () => {
    it('stashes uncommitted modifications and restores with git stash pop', () => {
      const repo = createDefaultRepo();
      expect(repo.stash.length).toBe(0);

      // git stash
      const stashRes = executeCommand(repo, 'git stash');
      expect(stashRes.error).toBeNull();
      expect(stashRes.state.stash.length).toBe(1);
      expect(stashRes.state.workingDir.files['index.js'].content).not.toContain('add database connection');

      // git stash pop
      const popRes = executeCommand(stashRes.state, 'git stash pop');
      expect(popRes.error).toBeNull();
      expect(popRes.state.stash.length).toBe(0);
      expect(popRes.state.workingDir.files['index.js'].content).toContain('add database connection');
    });
  });

  describe('Detached HEAD and Cherry-Pick', () => {
    it('enters detached HEAD state with git checkout <hash>', () => {
      const repo = createDefaultRepo();
      const res = executeCommand(repo, 'git checkout c1a2b34');
      expect(res.error).toBeNull();
      expect(res.state.HEAD.type).toBe('detached');
      expect(res.state.HEAD.name).toBe('c1a2b34');
    });

    it('cherry-picks a commit onto current branch', () => {
      const repo = createDefaultRepo();
      // create separate branch with a commit
      let state = executeCommand(repo, 'git switch -c other').state;
      state.workingDir.files['other.txt'] = { content: 'other data', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "other feature"').state;
      const otherCommit = getHeadCommitHash(state);

      // back to main
      state = executeCommand(state, 'git switch main').state;
      const cpRes = executeCommand(state, `git cherry-pick ${otherCommit}`);
      expect(cpRes.error).toBeNull();
      const newHead = getHeadCommitHash(cpRes.state);
      expect(cpRes.state.commits[newHead].message).toContain('other feature (cherry picked)');
    });
  });
});
