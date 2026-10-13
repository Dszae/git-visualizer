import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { LESSONS, CHALLENGES } from '../src/data/lessonsData.js';
import { COMMAND_REFERENCE } from '../src/data/commandReferenceData.js';

const outputDirectory = new URL('../dist/', import.meta.url);
const siteUrl = 'https://git-visualizer.dipeshsapkota7.com.np';

const UNDO_METHODS = [
  ['git restore <file>', 'Working Tree Undo', 'Caution', 'Discards unstaged modifications in the working directory, restoring the file to match the index/HEAD.', 'Discards unstaged edits', 'Unchanged', 'Preserved (no new commit)', 'Destructive for unstaged edits! Edits made in the working tree that were never staged will be lost permanently.'],
  ['git restore --staged <file>', 'Unstage from Index', 'Safe', 'Unstages a file from the Index back to the working directory without losing any edits.', 'Preserves your edits in working directory', 'Clears staged version back to HEAD', 'Preserved', ''],
  ['git reset --soft HEAD~1', 'Undo Commit (Keep Staged)', 'Safe', 'Moves branch pointer back by 1 commit. Leaves all changes staged in the Index ready to re-commit.', 'Completely preserved', 'Changes remain staged in index', 'Rewrites branch tip (reflog keeps old hash)', 'Safe locally. If the commit was already pushed to a shared remote, rewriting the branch tip can cause sync issues for teammates.'],
  ['git reset [--mixed] HEAD~1', 'Undo Commit (Keep Unstaged)', 'Safe', 'Moves branch pointer back and un-stages files from Index. All changes are kept as unstaged files in your working directory.', 'Preserved as unstaged files', 'Reset to match HEAD~1', 'Rewrites branch tip', 'Your changes are not lost; they are kept unstaged in your working directory.'],
  ['git reset --hard HEAD~1', 'Nuclear Reset', 'Destructive', 'Moves branch pointer back AND forcibly overwrites both Index and Working Directory to match HEAD~1.', 'Discarded permanently', 'Discarded permanently', 'Rewrites branch tip', 'High risk: All uncommitted modifications in your working directory and staging area will be permanently destroyed. Committed work can only be recovered via reflog.'],
  ['git revert <commit>', 'Safe Public History Undo', 'Safest', 'Creates a brand-new commit that inverts the changes of the target commit. Does not delete or rewrite past history.', 'Updated with inverse diff', 'Committed cleanly', 'Fully preserved (adds new commit)', 'The recommended way to undo work on shared or team branches because it does not alter past commit hashes.'],
  ['git reflog & recovery', 'Emergency Recovery Net', 'Safe', 'Logs every HEAD position visited. Allows recovering lost commits after accidental reset or branch deletion.', 'Read-only inspection', 'Unchanged', 'Reveals all previous commit hashes', 'Reflog entries are local only and expire after 90 days by default.']
];

const FLOW_STAGES = [
  ['Stash', 'Saved Uncommitted'], ['Workspace', 'Working Directory'], ['Staging', 'Index / Next Commit'], ['Local Repo', 'Local History (HEAD)'], ['Remote Repo', 'GitHub / GitLab']
];

const FLOW_COMMANDS = [
  ['git status', 'Show the working tree status.'], ['git diff', 'Show changes between commits, commit and working tree, etc.'], ['git diff --staged', 'Show changes between the index and your last commit.'], ['git log', 'Show commit logs.'], ['git add <file>', 'Add file contents to the index (Staging).'], ['git add -u', 'Update tracked files in the index.'], ['git rm', 'Remove files from the working tree and from the index.'], ['git mv', 'Move or rename a file, a directory, or a symlink.'], ['git commit', 'Record changes to the repository.'], ['git commit -a', 'Automatically stage modified/deleted files and commit.'], ['git restore', 'Restore working tree files from the index.'], ['git reset', 'Reset current HEAD to the specified state, un-staging files.'], ['git reset --hard', 'Reset index and working tree to match HEAD.'], ['git revert', 'Create a new commit that undoes changes from a previous commit.'], ['git switch', 'Switch branches, updating the working tree.'], ['git merge', 'Join two or more development histories together.'], ['git rebase', 'Reapply commits on top of another base tip.'], ['git fetch', 'Download objects and refs from another repository.'], ['git pull', 'Fetch from and integrate with another repository or a local branch.'], ['git push', 'Update remote refs along with associated objects.'], ['git clone', 'Clone a repository into a new directory.'], ['git stash', 'Stash the changes in a dirty working directory away.'], ['git stash pop', 'Remove a single stashed state from the stash list and apply it.'], ['git stash apply', 'Apply a single stashed state without removing it from the list.']
];

const pages = [
  {
    route: 'lessons',
    title: 'Git Lessons and Challenges | Git Visualizer',
    description: 'Step-by-step Git lessons and challenges covering repositories, commits, branches, merges, conflicts, rebase, and reflog recovery.',
    heading: 'Guided Git Lessons and Challenges',
    body: 'Learn Git from repository initialization through commits, branches, merging, conflict resolution, rebasing, and reflog recovery. Each lesson in Git Visualizer provides a practical target state and an interactive repository to explore.',
    links: 'Start with Git fundamentals, then practice branching, merging, undo commands, and advanced history recovery.'
  },
  {
    route: 'undo-lab',
    title: 'Git Reset vs Revert vs Restore vs Reflog | Git Visualizer',
    description: 'Compare git restore, git reset, git revert, and git reflog in a safe interactive Git undo laboratory.',
    heading: 'Git Undo Lab: Reset, Revert, Restore, and Reflog',
    body: 'Understand the difference between git restore, git reset --soft, git reset --mixed, git reset --hard, git revert, and git reflog. The safe undo lab shows how each command changes the working tree, staging area, branch pointer, and commit history.',
    links: 'Use git revert for a public history-preserving undo, and learn when reset or reflog is appropriate for local recovery.'
  },
  {
    route: 'flowchart',
    title: 'How Git Works: Workspace, Staging, Local, Remote | Git Visualizer',
    description: 'Trace Git code movement through the workspace, staging area, local repository, remote repository, and stash.',
    heading: 'How Git Works: Git Architecture Flowchart',
    body: 'Trace code through the five major Git areas: stash, working directory, staging area, local repository, and remote repository. See how commands such as git add, git commit, git fetch, git pull, git push, and git stash move information between them.',
    links: 'The flowchart connects everyday Git commands to the repository areas they read and update.'
  },
  {
    route: 'reference',
    title: 'Git Command Reference | Git Visualizer',
    description: 'Searchable Git command reference with syntax, preconditions, expected effects, and safety guidance.',
    heading: 'Searchable Git Command Reference',
    body: 'Find practical explanations for git init, status, add, commit, log, diff, branch, switch, checkout, merge, rebase, stash, fetch, pull, push, clone, remote, tag, show, restore, reset, revert, cherry-pick, and reflog.',
    links: 'Every reference entry explains what a command does, what state it expects, and what changes to inspect afterward.'
  },
  {
    route: 'profile',
    title: 'Dipesh Sapkota Developer Profile | Git Visualizer',
    description: 'Profile of Dipesh Sapkota, software developer and creator of Git Visualizer, with verified website and professional links.',
    heading: 'Dipesh Sapkota Developer Profile',
    body: 'Dipesh Sapkota is the software developer and creator of Git Visualizer, an interactive Git learning platform for commits, branches, merges, rebases, undo operations, and repository architecture.',
    links: 'Explore the Git Visualizer project or visit Dipesh Sapkota\'s official developer portfolio and verified professional profiles.'
  }
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderArticle(page) {
  return `<article id="pre-rendered-content" style="padding: 2.5rem; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto;">
      <nav aria-label="Breadcrumb" style="margin-bottom: 1rem; font-size: 0.9rem;">
        <a href="${siteUrl}/" rel="home">Git Visualizer</a> &gt; <a href="${siteUrl}/profile/" rel="author">Dipesh Sapkota</a> &gt; <span>${escapeHtml(page.heading)}</span>
      </nav>
      <h1>${escapeHtml(page.heading)}</h1>
      <p>${escapeHtml(page.body)}</p>
      <p>${escapeHtml(page.links)}</p>
      ${page.extraHtml || ''}
      <h2>Explore Git Visualizer</h2>
      <ul>
        <li><a href="${siteUrl}/">Interactive Git Sandbox and Commit Graph</a></li>
        <li><a href="${siteUrl}/lessons/">Guided Git Lessons and Challenges</a></li>
        <li><a href="${siteUrl}/undo-lab/">Git Undo Lab</a></li>
        <li><a href="${siteUrl}/flowchart/">How Git Works Architecture Flowchart</a></li>
        <li><a href="${siteUrl}/reference/">Git Command Reference</a></li>
        <li><a href="${siteUrl}/profile/">Dipesh Sapkota Developer Profile</a></li>
      </ul>
      <p>Git Visualizer is created by <a href="https://www.dipeshsapkota7.com.np/" rel="author">Dipesh Sapkota</a>.</p>
    </article>`;
}

function renderLessons() {
  const lessons = LESSONS.map(lesson => `<article><h2>${escapeHtml(lesson.title)}</h2><p><strong>${escapeHtml(lesson.level)}:</strong> ${escapeHtml(lesson.subtitle)}</p><p><strong>Objective:</strong> ${escapeHtml(lesson.objective)}</p><p>${escapeHtml(lesson.explanation)}</p><h3>Steps</h3><ol>${lesson.steps.map(step => `<li><p>${escapeHtml(step.instruction)}</p><p><strong>Hint:</strong> ${escapeHtml(step.hint)}</p></li>`).join('')}</ol><p><strong>Summary:</strong> ${escapeHtml(lesson.summary)}</p></article>`).join('');
  const challenges = CHALLENGES.map(challenge => `<article><h2>${escapeHtml(challenge.title)}</h2><p><strong>${escapeHtml(challenge.difficulty)}:</strong> ${escapeHtml(challenge.description)}</p><p><strong>Target goal:</strong> ${escapeHtml(challenge.targetGoalDescription)}</p><h3>Hints</h3><ol>${challenge.hints.map(hint => `<li>${escapeHtml(hint)}</li>`).join('')}</ol></article>`).join('');
  return `<section><h2>All Git Lessons</h2>${lessons}<h2>Git Challenges</h2>${challenges}</section>`;
}

function renderReference() {
  return `<section><h2>All Git Commands</h2>${COMMAND_REFERENCE.map(item => `<article><h3><code>${escapeHtml(item.syntax)}</code></h3><p><strong>Category:</strong> ${escapeHtml(item.category)}</p><p>${escapeHtml(item.purpose)}</p><p><strong>Example:</strong></p><pre>${escapeHtml(item.example)}</pre><p><strong>Preconditions:</strong> ${escapeHtml(item.preconditions)}</p><p><strong>Expected effect:</strong> ${escapeHtml(item.expectedEffect)}</p>${item.commonErrors.length ? `<p><strong>Common errors:</strong> ${escapeHtml(item.commonErrors.join(' '))}</p>` : ''}${item.safetyWarning ? `<p><strong>Safety:</strong> ${escapeHtml(item.safetyWarning)}</p>` : ''}<p><strong>Related commands:</strong> ${escapeHtml(item.relatedCommands.join(', '))}</p></article>`).join('')}</section>`;
}

function renderUndo() {
  return `<section><h2>Complete Git Undo Comparison</h2><table><thead><tr><th>Command</th><th>Type</th><th>Safety</th><th>Description</th><th>Working Directory</th><th>Index</th><th>History</th><th>Warning</th></tr></thead><tbody>${UNDO_METHODS.map(method => `<tr>${method.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
}

function renderFlowchart() {
  return `<section><h2>Git Architecture Stages</h2><ol>${FLOW_STAGES.map(stage => `<li><strong>${escapeHtml(stage[0])}</strong>: ${escapeHtml(stage[1])}</li>`).join('')}</ol><h2>Git Data-Flow Commands</h2><dl>${FLOW_COMMANDS.map(command => `<dt><code>${escapeHtml(command[0])}</code></dt><dd>${escapeHtml(command[1])}</dd>`).join('')}</dl></section>`;
}

function renderProfile() {
  return `<section><img src="${siteUrl}/profile.svg" alt="Profile illustration for Dipesh Sapkota" width="160" height="160"><h2>About Dipesh Sapkota</h2><p>Dipesh Sapkota is a software developer and the creator of Git Visualizer. His work focuses on practical developer tools, interactive technical education, and browser-based learning experiences.</p><h2>Git Visualizer</h2><p>Git Visualizer provides a deterministic Git simulator, live commit graph, guided lessons, safe undo comparisons, architecture flowchart, and command reference.</p><h2>Verified profiles</h2><ul><li><a href="https://www.dipeshsapkota7.com.np/">Official website</a></li><li><a href="https://github.com/dszae">GitHub</a></li><li><a href="https://www.linkedin.com/in/dszae">LinkedIn</a></li><li><a href="https://dev.to/dszae">Dev.to</a></li></ul></section>`;
}

const pageContent = {
  lessons: renderLessons(),
  'undo-lab': renderUndo(),
  flowchart: renderFlowchart(),
  reference: renderReference(),
  profile: renderProfile()
};

const template = await readFile(new URL('index.html', outputDirectory), 'utf8');

for (const page of pages) {
  const url = `${siteUrl}/${page.route}/`;
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="${url}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<article id="pre-rendered-content"[\s\S]*?<\/article>/, renderArticle({ ...page, extraHtml: pageContent[page.route] }));

  const directory = new URL(`./${page.route}/`, outputDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}

const today = new Date().toISOString().slice(0, 10);
const sitemapUrls = [
  { path: '/', priority: '1.0' },
  ...pages.map(page => ({ path: `/${page.route}/`, priority: '0.9' }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ path, priority }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
await writeFile(new URL('sitemap.xml', outputDirectory), sitemap);

console.log(`Generated ${pages.length} prerendered section pages in dist/.`);