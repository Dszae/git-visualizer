/**
 * Scenarios and URL State Serialization for Git Visualizer
 */
import { createDefaultRepo, executeCommand } from './gitEngine.js';

export const PRESET_SCENARIOS = [
  {
    id: 'default',
    title: 'Basic Workflow',
    description: 'Clean repository with 3 commits, an untracked file, and a modified file ready to stage and commit.',
    category: 'Basics',
    generate: () => createDefaultRepo()
  },
  {
    id: 'diverging',
    title: 'Diverging Branches',
    description: 'Two independent branches (main and feature/auth) with diverging commit histories ready for merge or rebase.',
    category: 'Branching',
    generate: () => {
      let state = createDefaultRepo();
      // Create feature branch and add commit
      state = executeCommand(state, 'git switch -c feature/auth').state;
      state.workingDir.files['auth.js'] = { content: 'export const login = () => true;', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feat: add user authentication handler"').state;

      // Switch back to main and add commit
      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['server.js'] = { content: 'import express from "express";', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "chore: setup server middleware"').state;

      return state;
    }
  },
  {
    id: 'conflict',
    title: 'Merge Conflict Scenario',
    description: 'Both main and feature branches modified the same lines in README.md. Run "git merge feature" to observe and resolve the conflict.',
    category: 'Merging',
    generate: () => {
      let state = createDefaultRepo();
      state = executeCommand(state, 'git switch -c feature/docs').state;
      state.workingDir.files['README.md'] = { content: '# Project Documentation\nVersion 2.0 with GraphQL API.', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "docs: update readme with graphql spec"').state;

      state = executeCommand(state, 'git switch main').state;
      state.workingDir.files['README.md'] = { content: '# Project Documentation\nVersion 2.0 with REST API architecture.', status: 'modified' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "docs: update readme with rest architecture"').state;

      return state;
    }
  },
  {
    id: 'detached-head',
    title: 'Detached HEAD State',
    description: 'HEAD points directly to commit c1a2b34 instead of a branch. Learn how to inspect and safely navigate detached HEAD.',
    category: 'Advanced',
    generate: () => {
      const state = createDefaultRepo();
      return executeCommand(state, 'git checkout c1a2b34').state;
    }
  },
  {
    id: 'stash-practice',
    title: 'Dirty Worktree & Stashing',
    description: 'Multiple uncommitted changes in both working tree and staging area. Practice `git stash`, `git stash list`, and `git stash pop`.',
    category: 'Stashing',
    generate: () => {
      const state = createDefaultRepo();
      state.workingDir.files['temp-script.py'] = { content: 'print("experimenting")', status: 'untracked' };
      state.workingDir.files['styles.css'] = { content: 'body { margin: 0; }', status: 'modified' };
      return state;
    }
  },
  {
    id: 'undo-lab',
    title: 'Safe Undo & Recovery',
    description: 'Compare git restore, git reset (--soft/--mixed/--hard), and git revert on real commits.',
    category: 'Undo',
    generate: () => {
      let state = createDefaultRepo();
      state.workingDir.files['buggy-feature.js'] = { content: 'function crash() { throw new Error(); }', status: 'untracked' };
      state = executeCommand(state, 'git add .').state;
      state = executeCommand(state, 'git commit -m "feat: add buggy experimental module"').state;
      return state;
    }
  }
];

/**
 * Encodes a repository state into a URL-safe Base64 string
 */
export function serializeStateToUrl(state) {
  try {
    const compact = {
      isInitialized: state.isInitialized,
      workingDir: state.workingDir,
      index: state.index,
      commits: state.commits,
      branches: state.branches,
      HEAD: state.HEAD,
      tags: state.tags,
      stash: state.stash,
      remotes: state.remotes,
      mergeState: state.mergeState,
      reflog: state.reflog.slice(0, 15) // limit size
    };
    const jsonStr = JSON.stringify(compact);
    return encodeURIComponent(btoa(jsonStr));
  } catch (err) {
    console.error('Failed to serialize state to URL:', err);
    return null;
  }
}

/**
 * Safely parses and validates a state from URL string
 */
export function deserializeStateFromUrl(encoded) {
  try {
    if (!encoded) return null;
    const jsonStr = atob(decodeURIComponent(encoded));
    const parsed = JSON.parse(jsonStr);

    // Basic structure verification
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (typeof parsed.isInitialized !== 'boolean') return null;
    if (!parsed.commits || typeof parsed.commits !== 'object') return null;
    if (!parsed.branches || typeof parsed.branches !== 'object') return null;
    if (!parsed.HEAD || typeof parsed.HEAD !== 'object') return null;

    return parsed;
  } catch (err) {
    console.warn('Invalid serialized state in URL:', err);
    return null;
  }
}
