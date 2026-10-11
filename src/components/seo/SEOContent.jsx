import React, { useState } from 'react';

const TOPICS = [
  {
    id: 'commit-visualizer',
    title: 'Understanding the Git Commit Graph (DAG)',
    content: `Git represents repository history not as a simple list of changes, but as an immutable Directed Acyclic Graph (DAG) of commit objects. Every commit holds a snapshot of tracked files, author and committer metadata, a commit message, and one or more parent hashes.

Because every commit hash is computed deterministically from its contents and its parent hashes, Git history is cryptographically verifiable. When you create a new commit, your active branch pointer moves forward to reference the new node, while existing commits remain permanently unchanged.`
  },
  {
    id: 'branching-merging',
    title: 'Fast-Forward vs. 3-Way Merges',
    content: `In Git, a branch is simply a lightweight text pointer referencing a commit hash. Creating a branch is instantaneous because it requires zero copying of file contents.

When merging branches:
• Fast-Forward Merge: Occurs when the target branch has no diverged commits. Git simply moves the current branch pointer forward to the target tip. No merge commit is created.
• 3-Way Merge: Occurs when both branches have diverged with independent commits. Git finds the common ancestor commit and combines both change sets into a new merge commit having two parents.`
  },
  {
    id: 'merge-vs-rebase',
    title: 'Git Merge vs. Git Rebase',
    content: `Both 'git merge' and 'git rebase' integrate changes from one branch into another, but they treat history differently:

• 'git merge' preserves historical context, showing exactly when and where features branched and joined. It never alters existing commit hashes.
• 'git rebase' rewrites commits by lifting them and reapplying them onto the tip of the upstream branch. Because each replayed commit has a different parent hash, its commit ID changes. Rebase produces a clean linear history, but should never be used on shared public branches.`
  },
  {
    id: 'reset-vs-revert',
    title: 'Safe Undos: Reset vs. Revert',
    content: `Choosing the right undo command depends on whether your changes are private or already shared:

• 'git restore <file>': Reverts working directory changes back to the index or HEAD.
• 'git reset --soft': Moves HEAD back without modifying index or working directory.
• 'git reset --mixed': Moves HEAD back and resets index, keeping changes in working directory.
• 'git reset --hard': Overwrites both index and working directory. Destructive for uncommitted work.
• 'git revert <commit>': Safe public undo. Records a brand-new commit that inverts the targeted commit.`
  }
];

const FAQS = [
  {
    q: "How does this Git visualizer simulate commands?",
    a: "The platform runs an in-memory, deterministic Git repository state machine. It manages a complete Working Directory, Staging Area, commit DAG, branch references, HEAD, and remotes entirely in your browser without sending data to an external server."
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section 
      aria-label="Git Concepts and Reference"
      className={`mt-12 pt-8 border-t transition-colors ${
        isDark ? 'border-zinc-800 text-zinc-300' : 'border-zinc-200 text-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Git Internals & Concepts
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Quick reference guides covering version control mechanics, branching, and safe undos.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800"
        >
          {isOpen ? 'Collapse guides ▴' : 'Read guides ▾'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-8 pt-4 animate-[fadeIn_0.15s_ease-out]">
          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOPICS.map(topic => (
              <article key={topic.id} className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {topic.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {topic.content}
                </p>
              </article>
            ))}
          </div>

          {/* FAQs */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{faq.q}</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
