import React from 'react';
import { DEFINITION, MAIN_SITE, PROFILE_LINKS, PROFILE_PAGE } from '../../data/siteContent.js';

export default function ProfileView() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl space-y-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
          <a href="/" className="hover:text-orange-400">Git Visualizer</a>
          <span aria-hidden="true"> / </span>
          <span>Dipesh Sapkota</span>
        </nav>

        <section className="space-y-6 border-b border-zinc-800 pb-8">
          <img src="/profile.svg" alt="Profile illustration for Dipesh Sapkota" width="160" height="160" className="h-40 w-40 rounded-3xl" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">Creator of Git Visualizer</p>
            <h1 className="text-4xl font-bold tracking-tight">Dipesh Sapkota</h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">{PROFILE_PAGE.intro}</p>
            <p className="text-sm text-zinc-500">
              Updated <time dateTime={PROFILE_PAGE.dateModified}>{PROFILE_PAGE.dateModifiedLabel}</time>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Git Visualizer</h2>
          <p className="leading-7 text-zinc-300">{DEFINITION.a}</p>
          <a href="/" className="inline-flex rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500">Open Git Visualizer</a>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Profiles</h2>
          <p className="leading-7 text-zinc-300">
            {PROFILE_PAGE.more}{' '}
            <a href={MAIN_SITE} rel="author me" className="text-orange-400 underline underline-offset-4 hover:text-orange-300">Dipesh Sapkota</a>
          </p>
          <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
            {PROFILE_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="flex items-center justify-between gap-4 py-3 text-orange-400 hover:text-orange-300"
                >
                  <span>{link.label}</span>
                  <span className="text-sm text-zinc-500">{link.meta}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
