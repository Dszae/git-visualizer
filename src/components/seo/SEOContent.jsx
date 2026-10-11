import React from 'react';

const TOPICS = [
  {
    id: 'commit-visualizer',
    title: 'Git Commit Visualizer: Understanding the Directed Acyclic Graph (DAG)',
    content: `
      Git represents repository history not as a simple list of changes, but as an immutable Directed Acyclic Graph (DAG) of commit objects. Every commit holds a snapshot of tracked files, author and committer metadata, a commit message, and one or more parent hashes.

      Because every commit hash is computed deterministically from its contents and its parent hashes, Git history is cryptographically verifiable. When you create a new commit, your active branch pointer moves forward to reference the new node, while existing commits remain permanently unchanged.
    `
  },
  {
    id: 'branching-merging',
    title: 'Git Branching & Merging: Fast-Forward vs. 3-Way Merges',
    content: `
      In Git, a branch is simply a 41-byte text file containing a 40-character commit hash. Creating a branch is instantaneous because it requires zero copying of file contents.

      When merging branches:
      - Fast-Forward Merge: Occurs when the target branch has no diverged commits. Git simply moves the current branch pointer forward to the target tip. No merge commit is created.
      - 3-Way Merge: Occurs when both branches have diverged with independent commits. Git finds the best common ancestor commit (the merge base) and combines both change sets into a new merge commit having two parents.
    `
  },
  {
    id: 'merge-vs-rebase',
    title: 'Git Merge vs. Git Rebase: Historical Record vs. Linear History',
    content: `
      Both 'git merge' and 'git rebase' integrate changes from one branch into another, but they treat history differently:

      - 'git merge' preserves the complete historical context, showing exactly when and where features branched and joined. It never alters existing commit hashes.
      - 'git rebase' rewrites commits by lifting them and reapplying them one-by-one onto the tip of the upstream branch. Because each replayed commit has a different parent hash, its commit ID changes. Rebase produces a clean, linear history, but should never be used on shared public branches.
    `
  },
  {
    id: 'reset-vs-revert',
    title: 'Git Reset vs. Git Revert: Which Undo Command Should You Use?',
    content: `
      Choosing the right undo command depends on whether your changes are private or already shared:

      - 'git restore <file>': Reverts working directory changes back to the index or HEAD.
      - 'git reset --soft': Moves HEAD back without modifying index or working directory (changes remain staged).
      - 'git reset --mixed' (default): Moves HEAD back and resets index, keeping changes unstaged in working directory.
      - 'git reset --hard': Moves HEAD back and overwrites both index and working directory. Destructive for uncommitted work.
      - 'git revert <commit>': Safe public undo. Instead of rewriting past commits, it records a brand-new commit that inverts the targeted commit. Perfect for team branches.
    `
  },
  {
    id: 'staging-area',
    title: 'The Git Staging Area (Index) Explained',
    content: `
      The Staging Area (historically known as the Index) is an intermediate staging cache between your working directory and the commit history. 

      Rather than forcing developers to commit all modified files in a directory at once, the staging area allows crafting focused, modular commits. You can review diffs with 'git diff --staged' and stage only related changes before freezing them into repository history.
    `
  },
  {
    id: 'head-detached',
    title: 'HEAD and Detached HEAD State',
    content: `
      HEAD is the reference pointer designating your current location in the repository. Normally, HEAD points symbolically to a branch name (such as 'refs/heads/main').

      When you checkout a specific commit hash or tag ('git checkout c1a2b34'), HEAD enters a 'Detached HEAD' state. You can make experimental changes and commits in this state without advancing any branch. If you want to keep experimental commits made in detached HEAD, create a branch with 'git switch -c new-feature'.
    `
  },
  {
    id: 'git-stash',
    title: 'Git Stash Explained: Temporary Context Switching',
    content: `
      When you need to pull urgent updates or switch branches while working on an incomplete feature, 'git stash' saves your uncommitted working directory and index modifications onto a local stack ('refs/stash').

      Your working tree is restored to a clean HEAD state. Later, running 'git stash pop' re-applies your shelving work and removes it from the stash stack.
    `
  }
];

const FAQS = [
  {
    q: "How does the Git visualizer simulate commands?",
    a: "The platform runs an in-memory, deterministic Git repository state machine. It manages a complete Working Directory, Staging Area, commit DAG, branch references, HEAD, and remotes without sending user input to any external server."
  },
  {
    q: "Is git revert safer than git reset?",
    a: "Yes. 'git revert' creates a new commit that inverts changes without rewriting history, making it completely safe for shared branches. 'git reset' alters branch pointers and can discard history or create sync conflicts if pushed."
  },
  {
    q: "What causes a Git merge conflict?",
    a: "A merge conflict occurs when two branches make different changes to the exact same lines of a file, or when one branch modifies a file that the other deleted. Git embeds conflict markers (<<<<<<< HEAD, =======, >>>>>>>) for manual resolution."
  },
  {
    q: "Can I recover commits lost after running git reset --hard?",
    a: "Yes! Running 'git reflog' reveals the previous commit hashes that HEAD pointed to. You can recover your commits by creating a new branch at that hash: 'git switch -c recovery <hash>'."
  }
];

export default function SEOContent({ isDark = true }) {
  return (
    <section 
      aria-label="Git In-Depth Guides and FAQ"
      className={`mt-12 pt-8 border-t max-w-5xl mx-auto px-4 text-left ${isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-700'}`}
    >
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Git Internals, Architecture & Concepts
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
          In-depth educational guides breaking down version control concepts, branching mechanics, safe undo patterns, and real-world workflows.
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {TOPICS.map(topic => (
          <article 
            key={topic.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-2 hover:border-slate-700 transition-colors"
          >
            <h3 className="text-sm font-bold text-white font-sans">{topic.title}</h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
              {topic.content.trim()}
            </p>
          </article>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <h3 className="text-base font-bold text-white mb-2">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <h4 className="text-xs font-bold text-orange-400">{faq.q}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
