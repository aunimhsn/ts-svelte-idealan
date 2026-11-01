# Technical choices

The technical choices of the [roadmap](../roadmap.md), with their reasons and the alternatives rejected. They come from the owner's discussion of 2026-11-01, before the setup: confirm or adapt them in steps 0 and 1, and record each change here with its date.

## Stack

| Topic | Choice | Reason |
|---|---|---|
| Hosting | Netlify, free plan, at `ts-svelte-idealan-sylent.netlify.app` | The interface and the server part in one place, deployed from GitHub on every merge, with a deploy preview per pull request. The address carries the owner's name, who signs every product they make (2026-11-01: the former rule that kept the project apart from the owner's business is removed). Limits in [external-services.md](external-services.md). |
| Interface | [Svelte](https://svelte.dev/) 5 with the runes, built with [Vite](https://vite.dev/), in TypeScript | A component is one file with its HTML, script and style; the reactivity is part of the language (`$state`, `$derived`), without hooks. The owner prefers it to React. |
| Server | Netlify Functions, in TypeScript | Plain files of `netlify/functions/` that use the standard `Request`, `Response` and `fetch`: they call the Steam Store (which the browser can't call, no CORS), check the access code and write the bag. |
| Data | Netlify Blobs | A key-value store of Netlify, without an account or a service of its own; one key per game, so that two friends adding two games at once don't overwrite each other. |
| Access | A shared access code in an environment variable, checked by the functions | No accounts for a group of friends; the code protects the writes, and the nickname is kept in the browser. |
| Runtime and packages | Node.js 24 (LTS), npm (`package-lock.json`) | Pinned in `.nvmrc` (read by CI and by Netlify) and in `engines` of `package.json`. Node.js 24 is the one installed on the owner's machine and is maintained until April 2028; Node.js 26 brings nothing this project needs (2026-11-01). |
| Language | TypeScript 6 | TypeScript 7 (the rewrite in Go) is out, but `svelte-check` and `typescript-eslint` don't support it yet (2026-11-01): move to it once they do. |
| Tests | Vitest | Same configuration as Vite; tests of the reading of the Steam links and of the functions. |
| Formatter and linters | Prettier with `prettier-plugin-svelte`; ESLint with `typescript-eslint` and `eslint-plugin-svelte`; `svelte-check --fail-on-warnings`; Stylelint with `stylelint-config-html/svelte` | As in the web template, adapted to Svelte. `svelte-check` also reports the accessibility warnings of the Svelte compiler, which fail the check. `svelte.config.js` forces the runes mode, so that the syntax of Svelte 4 doesn't compile. |
| Netlify CLI | `netlify-cli` as a development dependency, run with `npx netlify` or `npm run dev` | Its version is pinned in `package-lock.json`, the same for the owner and CI, with nothing to install globally; the cost is a heavy package (about a minute more of `npm ci` in CI). |
| Install scripts | Denied in `allowScripts` of `package.json` (`esbuild`, `netlify-cli`, `unix-dgram`) | npm 11 runs no install script that isn't approved: these three are not needed (esbuild and Vite ship their binary as a package, `unix-dgram` is an optional native module of the CLI), so they stay denied. Approve one only if a tool breaks without it. |
| Width check | A `scripts/check-overflow.mjs` as in the web template, in the Chromium of Playwright | Most of the feedback on sylent.art came from the phone; the friends add their games from theirs. |
| Checks in CI | GitHub Actions (`.github/workflows/ci.yml`) on every pull request | Runs `npm run check`; it doesn't deploy, Netlify does. |
| Updates | Dependabot (`.github/dependabot.yml`), monthly | npm packages and GitHub Actions, read with the `dependency-reviewer` subagent. Monthly rather than weekly: each merge that changes the dependencies is a production deploy, 15 of the 300 credits of the free plan of Netlify (2026-11-01); the major versions of `@types/node` are ignored, raised by hand with `.nvmrc`. |

Rejected:

- **React**: hooks and their rules, and an ecosystem to assemble; the owner doesn't like it.
- **SvelteKit**: its own server routes would replace the Netlify Functions, with more concepts to learn for a few screens.
- **Vercel, Cloudflare Pages**: as capable; Netlify is the owner's choice.
- **A VPS, Docker**: a server to maintain, useless for a few friends.
- **Supabase, Firebase**: an account and a service more, for a bag of a few dozen games; kept for real time or accounts (backlog).
- **GitHub Pages**: no server-side code, so nowhere to call Steam or check the code.

## Functions

- Each function of `netlify/functions/` gives its address in its `config` (`path: "/api/<name>"`), so that the interface calls `/api/ping` rather than `/.netlify/functions/ping`. The skeleton has one, `ping`, which answers `{ "ok": true }` to a `GET`; the home screen shows whether it answers.
- The tests of the functions live in `netlify/tests/`, not next to them: Netlify bundles every file of `netlify/functions/` as a function, a test included.
- An error answers with an error code (`{ "error": "method-not-allowed" }`) and its HTTP status; the interface turns the code into a French message of `src/i18n/fr.json`.
- The width check serves `dist/` without the functions: a call to `/api/` answers 404 there, so each screen is checked in its error state until the bag gets test data.

## Steam

- The `appid` is read in the link (`/app/<digits>`), so that a friend only pastes the link of the game's page; the full list of Steam apps (`IStoreService/GetAppList`, which needs a key) is not needed.
- The game comes from `https://store.steampowered.com/api/appdetails?appids=<appid>&cc=fr&l=french`, undocumented and rate limited, without a key: its answer is cached in Netlify Blobs.
- The cover is `header_image` of the answer; the vertical cover of the Steam CDN is an idea of the backlog.

## Commands

Set at step 0, listed here and in the `scripts` of `package.json`. Install the browser of the width check once with `npx playwright install --only-shell chromium`.

| Command | What it does |
|---|---|
| `npm install` | Installs the dependencies, the Netlify CLI included. |
| `npm run dev` | `netlify dev`: Vite and the functions together on `http://localhost:8888`, with the environment variables of the linked Netlify site or of a local `.env`. Add `--offline` to run without the Netlify account. |
| `npm run build` | The production build of the interface in `dist/`. |
| `npm test` | The Vitest tests. |
| `npm run format` | Formats every file with Prettier. |
| `npm run check` | Everything run before a commit and in CI: format, lint (`svelte-check`, ESLint, Stylelint), tests, build, width of the screens on a phone and on a computer. |
| `python3 docs/mockups/serve.py 8742` | Serves the repository root without cache for the mock-up, on the port of this project: 8742 (8765 and 8781 are taken by other projects). |

## Exceptions to the naming conventions

Imposed by Svelte, Netlify or the tools, everything else in kebab-case:

- Configuration files keep the names the tools look for: `netlify.toml`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`, `.nvmrc`, `.env.example`.
- `netlify/functions/`: the folder Netlify reads by default; the name of a function is its name in Netlify.
- `index.html` at the root: the entry of Vite, which reads it there. Its title and description come from `src/i18n/fr.json`, through a small plugin of `vite.config.ts`.
- Svelte components stay in kebab-case, imported under a PascalCase name; runes modules end with `.svelte.ts`.
