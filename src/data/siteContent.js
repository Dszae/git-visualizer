/**
 * Single source for Git Visualizer's public copy and identity data.
 *
 * Used by the React app (visible text) and scripts/prerender-pages.mjs (server HTML,
 * JSON-LD, llms-full.txt), so the FAQ shown on the page and the FAQ in the schema
 * are always word-for-word identical.
 *
 * The Person mirrors the one on the main website (dipeshsapkota7.com.np) and on
 * Sportivo: same @id, url and description, so search engines merge them into one
 * entity. Change it in all three places together.
 */

export const SITE_URL = 'https://git-visualizer.dipeshsapkota7.com.np';
export const MAIN_SITE = 'https://www.dipeshsapkota7.com.np/';
/** Same @id as the main website and Sportivo. */
export const PERSON_ID = `${MAIN_SITE}#author`;
export const SOURCE_REPO = 'https://github.com/dszae/git-visualizer';

export const PROFILES = {
  website: MAIN_SITE,
  wikidata: 'https://www.wikidata.org/wiki/Q141595522',
  orcid: 'https://orcid.org/0009-0001-7595-5114',
  github: 'https://github.com/dszae',
  linkedin: 'https://www.linkedin.com/in/dipeshsapkota7',
  devto: 'https://dev.to/dszae',
  x: 'https://x.com/DszAe18',
  instagram: 'https://instagram.com/dsz.ae',
  facebook: 'https://www.facebook.com/dsz.ae',
};

/** Visible on /profile/, in this order. */
export const PROFILE_LINKS = [
  { label: 'Dipesh Sapkota', meta: 'Official website', href: PROFILES.website },
  { label: 'Wikidata', meta: 'Q141595522', href: PROFILES.wikidata },
  { label: 'ORCID', meta: '0009-0001-7595-5114', href: PROFILES.orcid },
  { label: 'GitHub', meta: '@dszae', href: PROFILES.github },
  { label: 'LinkedIn', meta: 'dipeshsapkota7', href: PROFILES.linkedin },
  { label: 'Dev.to', meta: '@dszae', href: PROFILES.devto },
];

export const PRODUCT_NAME = 'Git Visualizer';
export const HOME_H1 = 'Git Visualizer: see how Git works, visually';
export const HOME_INTRO =
  'Type a command or pick an action below to watch commits, branches, and pointers update in real time.';

export const DEFINITION = {
  q: 'What is Git Visualizer?',
  a: 'Git Visualizer is a free, interactive Git learning tool by Dipesh Sapkota. It simulates a Git repository in your browser and draws the commit graph live as you run commands, with guided lessons, an undo lab, an architecture flowchart, and a command reference.',
};

/** Homepage FAQ. Shown on the page and used verbatim in the FAQPage schema. */
export const HOME_FAQS = [
  DEFINITION,
  {
    q: 'Is Git Visualizer free?',
    a: 'Yes. Git Visualizer is free to use, needs no account or sign-up, and runs locally in your browser. Repository state never leaves your device.',
  },
  {
    q: 'How does Git Visualizer simulate commands?',
    a: 'Git Visualizer runs an in-memory, deterministic Git repository state machine in the browser. It models the working directory, staging area, commit DAG, branches, HEAD, stash, and remotes without sending repository data to an external server.',
  },
  {
    q: 'Is git revert safer than git reset?',
    a: 'git revert creates a new commit that reverses an earlier commit without rewriting shared history. git reset moves branch pointers and can discard or rewrite history, so it needs more care on shared branches.',
  },
  {
    q: 'What causes a Git merge conflict?',
    a: 'A merge conflict happens when two branches change the same lines of a file, or when one branch edits a file the other deleted. Git marks the conflicting sections so you can resolve them by hand.',
  },
  {
    q: 'Can lost commits be recovered after git reset --hard?',
    a: 'Often, yes. git reflog records earlier positions of HEAD, so you can find the lost commit hash and create a new branch at it, for example with git switch -c recovery <hash>.',
  },
];

/** Main routes, used for llms.txt, server HTML navigation and the 404 page. */
export const ROUTES = [
  { path: '/', name: 'Interactive Sandbox', summary: 'Run Git commands in a simulated repository and watch the commit graph update live.' },
  { path: '/lessons/', name: 'Guided Lessons and Challenges', summary: 'Step-by-step lessons from git init to rebase and reflog, plus target-state challenges.' },
  { path: '/undo-lab/', name: 'Undo Lab', summary: 'Compare git restore, reset (soft, mixed, hard), revert and reflog side by side.' },
  { path: '/flowchart/', name: 'How Git Works', summary: 'Flowchart of how commands move code between stash, workspace, staging, local and remote.' },
  { path: '/reference/', name: 'Command Reference', summary: 'Searchable Git command reference with syntax, preconditions, effects and safety notes.' },
  { path: '/profile/', name: 'Creator profile', summary: 'About Dipesh Sapkota, the creator of Git Visualizer, with links to his profiles.' },
];

/** Profile page. Bump dateModified when its content changes. */
export const PROFILE_PAGE = {
  title: 'About Git Visualizer’s Creator, Dipesh Sapkota',
  description:
    'Dipesh Sapkota, a Computer Engineering student at IOE Thapathali Campus in Kathmandu, Nepal, created Git Visualizer. About the project and where to find his profiles.',
  dateCreated: '2026-10-14',
  dateModified: '2026-11-18',
  dateModifiedLabel: '18 November 2026',
  intro:
    'Dipesh Sapkota is a Computer Engineering student at IOE Thapathali Campus in Kathmandu, Nepal, exploring artificial intelligence, machine learning, embedded systems and motion design. He created Git Visualizer, which redraws the commit graph after every command so branches, merges and undos are easy to see.',
  more: 'This page covers his work on Git Visualizer. His full profile, other projects and contact details are on his official website.',
};

export const PERSON_DESCRIPTION =
  'Computer Engineering student at IOE Thapathali Campus in Kathmandu, Nepal, exploring Artificial Intelligence, Machine Learning, embedded systems, and visual motion design.';

const defined = (name, wiki) => ({ '@type': 'DefinedTerm', name, sameAs: `https://en.wikipedia.org/wiki/${wiki}` });

const ioeThapathali = {
  '@type': 'CollegeOrUniversity',
  '@id': 'https://tcioe.edu.np/#organization',
  name: 'Institute of Engineering (IOE), Thapathali Campus',
  url: 'https://tcioe.edu.np',
  sameAs: ['https://en.wikipedia.org/wiki/Thapathali_Campus', 'https://www.wikidata.org/wiki/Q7710687'],
};

/** The one full Person node on each page. Everything else references PERSON_ID. */
export const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Dipesh Sapkota',
  givenName: 'Dipesh',
  familyName: 'Sapkota',
  alternateName: ['dszae', 'dsz.ae', 'Dipesh Sapkota (dszae)', 'Dipesh'],
  description: PERSON_DESCRIPTION,
  disambiguatingDescription:
    'Computer Engineering student and AI/ML enthusiast at IOE Thapathali Campus in Nepal; creator of IOE Admission Hub, Sportivo, and Git Visualizer; known online as dszae.',
  url: MAIN_SITE,
  mainEntityOfPage: `${MAIN_SITE}about`,
  image: `${MAIN_SITE}dipesh-sapkota-portrait.jpg`,
  jobTitle: ['Computer Engineering Student', 'AI/ML Enthusiast', 'Motion Graphics Designer', 'Video Editor'],
  identifier: PROFILES.orcid,
  nationality: { '@type': 'Country', name: 'Nepal', sameAs: 'https://www.wikidata.org/wiki/Q837' },
  homeLocation: { '@type': 'Place', name: 'Kathmandu, Nepal', sameAs: 'https://www.wikidata.org/wiki/Q2429' },
  alumniOf: [
    ioeThapathali,
    {
      '@type': 'CollegeOrUniversity',
      '@id': 'https://tu.edu.np/#organization',
      name: 'Tribhuvan University',
      url: 'https://tu.edu.np',
      sameAs: ['https://en.wikipedia.org/wiki/Tribhuvan_University', 'https://www.wikidata.org/wiki/Q1143890'],
    },
  ],
  affiliation: ioeThapathali,
  worksFor: {
    '@type': 'Organization',
    '@id': 'https://sportivo.dipeshsapkota7.com.np/#organization',
    name: 'Sportivo',
    url: 'https://sportivo.dipeshsapkota7.com.np/',
  },
  knowsAbout: [
    defined('Computer Engineering', 'Computer_engineering'),
    defined('Artificial Intelligence', 'Artificial_intelligence'),
    defined('Machine Learning', 'Machine_learning'),
    defined('Embedded Systems', 'Embedded_system'),
    defined('Motion Graphic Design', 'Motion_graphic_design'),
    defined('Video Editing', 'Video_editing'),
    defined('Python Programming', 'Python_(programming_language)'),
    defined('React', 'React_(software)'),
    defined('Web Development', 'Web_development'),
  ],
  sameAs: [
    PROFILES.website,
    PROFILES.wikidata,
    PROFILES.orcid,
    PROFILES.github,
    PROFILES.linkedin,
    PROFILES.devto,
    PROFILES.x,
    PROFILES.instagram,
    PROFILES.facebook,
  ],
};
