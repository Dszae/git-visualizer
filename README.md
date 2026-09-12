# Git Visualizer 🌿

A minimalist, interactive web application designed to help developers visualize how standard Git commands move data across different stages of version control. 

**Live Demo:** [https://git-visualizer.dipeshsapkota7.com.np/](https://git-visualizer.dipeshsapkota7.com.np/)

## Overview
Git can be conceptually difficult for beginners to map out mentally. This tool provides a clean, hover-driven flowchart that maps exact commands to their specific data paths across five core Git areas:
* **Stash** (Temporary Clipboard)
* **Workspace** (Local Files)
* **Staging** (Index)
* **Local Repo** (HEAD / Local History)
* **Remote Repo** (GitHub / GitLab)

## Features
* **Hover-Driven Discovery:** Clean interface that reveals detailed tooltips and data paths only when a command is focused.
* **Path Differentiation:** Visually separates commands that *move data* (solid arrows) from commands that are *read-only* (dashed lines).
* **Cross-Stage Mapping:** Accurate start and end nodes for complex commands like `git pull` or `git commit -a`.
* **Zero-Clutter UI:** Built with a stark, distraction-free aesthetic focusing purely on the data flow.

## Tech Stack
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

## Local Development
To run this project locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/dszae/git-visualizer.git](https://github.com/dszae/git-visualizer.git)
