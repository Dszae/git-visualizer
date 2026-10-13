import React from 'react';

const profileLinks = [
  ['Official website', 'https://www.dipeshsapkota7.com.np/'],
  ['GitHub', 'https://github.com/dszae'],
  ['LinkedIn', 'https://www.linkedin.com/in/dszae'],
  ['Dev.to', 'https://dev.to/dszae']
];

export default function ProfileView() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl space-y-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
          <a href="/" className="hover:text-orange-400">Git Visualizer</a>
          <span aria-hidden="true"> / </span>
          <span>Dipesh Sapkota profile</span>
        </nav>

        <section className="space-y-6 border-b border-zinc-800 pb-8">
          <img src="/profile.svg" alt="Profile illustration for Dipesh Sapkota" width="160" height="160" className="h-40 w-40 rounded-3xl" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">Developer profile</p>
            <h1 className="text-4xl font-bold tracking-tight">Dipesh Sapkota</h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              Dipesh Sapkota is the creator of Git Visualizer, an interactive Git learning platform for understanding commits, branches, merges, rebases, undo operations, and repository architecture.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Git Visualizer by Dipesh Sapkota</h2>
          <p className="leading-7 text-zinc-300">
            Git Visualizer combines a deterministic Git simulator, live commit graph, guided lessons, safe undo comparisons, architecture flowchart, and command reference. It runs in the browser and does not send repository state to an external server.
          </p>
          <a href="/" className="inline-flex rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500">Open Git Visualizer</a>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Verified profiles and websites</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {profileLinks.map(([label, href]) => (
              <li key={href}><a href={href} target="_blank" rel="noopener noreferrer me" className="text-orange-400 hover:text-orange-300">{label}</a></li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
