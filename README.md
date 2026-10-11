# Git Visualizer 🌿

An interactive Git visualization and learning platform featuring a live SVG commit graph, deterministic Git repository simulator, interactive CLI terminal, guided curriculum & target challenges, safe undo laboratory, and 5-stage architecture flowchart.

**Live Website:** [https://git-visualizer.dipeshsapkota7.com.np/](https://git-visualizer.dipeshsapkota7.com.np/)

---

## 🌟 Key Features

### 1. Deterministic Git Repository Simulator
- Real state machine accurately modeling the **Working Directory**, **Staging Area (Index)**, **Local Repository (Commit DAG)**, **Remote Repository & Tracking Branches**, **HEAD (including Detached HEAD)**, **Tags**, **Stashes**, and **Merge Conflict States**.
- Supports 25+ real Git commands with argument parsing, error validation, and state integrity checks:
  - `git init`, `git status`, `git add`, `git commit [-m | -a]`, `git log [--oneline]`, `git diff [--staged]`, `git branch [-d | -a]`, `git switch [-c]`, `git checkout [-b]`, `git merge [--abort]`, `git rebase`, `git stash [pop | list | apply | drop | clear]`, `git fetch`, `git pull`, `git push`, `git clone`, `git remote [-v | add]`, `git tag [-d]`, `git show`, `git restore [--staged]`, `git reset [--soft | --mixed | --hard]`, `git revert`, `git cherry-pick`, `git reflog`.

### 2. Live Interactive SVG Commit Graph
- Topological lane layout supporting multi-branch diverging histories, multi-parent merge commits, and linear rebases.
- Dynamic branch indicators, HEAD badges, tags, and remote tracking labels (`origin/main`).
- Node click inspection for full commit hash, author, date, message, parent links, and file snapshot contents.
- Zoom in/out, pan, reset view, and accessible table toggle for screen-reader / keyboard navigation (WCAG 2.2 AA).

### 3. Interactive CLI Terminal & Before/After Explanations
- Terminal with syntax highlighting, ANSI color rendering, command history (Up/Down arrow keys), and tab auto-completion.
- Rich before-and-after breakdown explaining initial state, what changed, what remained unchanged, resulting state, and suggested next steps.
- Time-travel scrubber allowing step-by-step playback, pausing, and history inspection.

### 4. Guided Curriculum & Target Challenges
- 12 structured lessons ranging from Beginner to Advanced:
  1. Initialize a Repository
  2. Working Directory & Staging Area
  3. Make Your First Commit
  4. Read Commit History
  5. Create & Switch Branches
  6. Fast-Forward vs 3-Way Merge
  7. Resolve a Merge Conflict
  8. Undo Safely (Restore & Revert)
  9. Stash Uncommitted Work
  10. Synchronize with Remotes (Fetch & Push)
  11. Merge vs Rebase
  12. Recover Commits with Reflog
- Challenge Mode with target state validation (verifies branch tips, commits, and files).
- Local progress persistence via `localStorage`.

### 5. Safe Undo & Recovery Laboratory
- Comparative matrix showing the impact of `git restore`, `git reset --soft`, `git reset --mixed`, `git reset --hard`, `git revert`, and `git reflog` across Working Tree, Index, Branch Tips, and Commit History.
- Safety warnings and one-click execution in the simulator.

### 6. 5-Stage Architecture Flowchart
- Preserved and enhanced original visual flowchart mapping data movement across **Stash**, **Workspace**, **Staging**, **Local Repo**, and **Remote Repo** with glowing data flows and instant sandbox execution.

### 7. Searchable Command Reference
- Comprehensive directory of commands with syntax, preconditions, expected effects, common errors, and one-click execution.

### 8. Shareable Scenario URLs
- Encode and share arbitrary repository states via URL parameters (`?state=...` or `?scenario=...`).

---

## 🛠️ Tech Stack

- **Framework:** React 19, Vite 8
- **Styling:** Tailwind CSS (Dark & Light themes)
- **Testing:** Vitest
- **Linting:** oxlint
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/dszae/git-visualizer.git

# Navigate to project directory
cd git-visualizer

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Running Tests & Linting
```bash
# Run automated Vitest test suite
npm test

# Run oxlint
npm run lint

# Build for production
npm run build
```

---

## 👤 Author

**Dipesh Sapkota**  
Website: [https://www.dipeshsapkota7.com.np/](https://www.dipeshsapkota7.com.np/)  
Project: [https://git-visualizer.dipeshsapkota7.com.np/](https://git-visualizer.dipeshsapkota7.com.np/)
