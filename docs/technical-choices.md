# Technical choices

The technical choices of the [roadmap](../roadmap.md), with their reasons and the alternatives rejected. They come from the owner's discussion of 2026-11-01, before the setup: confirm or adapt them in steps 0 and 1, and record each change here with its date.

## Stack

| Topic | Choice | Reason |
|---|---|---|
| Hosting | Netlify, free plan, at its `netlify.app` address | The interface and the server part in one place, deployed from GitHub on every merge, with a deploy preview per pull request. The `netlify.app` address keeps the project apart from the owner's business. Limits in [external-services.md](external-services.md). |
| Interface | [Svelte](https://svelte.dev/) 5 with the runes, built with [Vite](https://vite.dev/), in TypeScript | A component is one file with its HTML, script and style; the reactivity is part of the language (`$state`, `$derived`), without hooks. The owner prefers it to React. |
| Server | Netlify Functions, in TypeScript | Plain files of `netlify/functions/` that use the standard `Request`, `Response` and `fetch`: they call the Steam Store (which the browser can't call, no CORS), check the access code and write the bag. |
| Data | Netlify Blobs | A key-value store of Netlify, without an account or a service of its own; one key per game, so that two friends adding two games at once don't overwrite each other. |
| Access | A shared access code in an environment variable, checked by the functions | No accounts for a group of friends; the code protects the writes, and the nickname is kept in the browser. |
| Runtime and packages | Node.js LTS, npm (`package-lock.json`) | The version pinned in `.nvmrc` and in `engines` of `package.json`, and CI uses the same one. To set at step 0. |
| Tests | Vitest | Same configuration as Vite; tests of the reading of the Steam links and of the functions. |
| Formatter and linters | Prettier with `prettier-plugin-svelte`; ESLint with `typescript-eslint` and `eslint-plugin-svelte`; `svelte-check`; Stylelint | As in the web template, adapted to Svelte. To confirm at step 0. |
| Width check | A `scripts/check-overflow.mjs` as in the web template, in the Chromium of Playwright | Most of the feedback on sylent.art came from the phone; the friends add their games from theirs. |
| Checks in CI | GitHub Actions (`.github/workflows/ci.yml`) on every pull request | Runs `npm run check`; it doesn't deploy, Netlify does. |
| Updates | Dependabot (`.github/dependabot.yml`), weekly | npm packages and GitHub Actions, read with the `dependency-reviewer` subagent. |

Rejected:

- **React**: hooks and their rules, and an ecosystem to assemble; the owner doesn't like it.
- **SvelteKit**: its own server routes would replace the Netlify Functions, with more concepts to learn for a few screens.
- **Vercel, Cloudflare Pages**: as capable; Netlify is the owner's choice.
- **A VPS, Docker**: a server to maintain, useless for a few friends.
- **Supabase, Firebase**: an account and a service more, for a bag of a few dozen games; kept for real time or accounts (backlog).
- **GitHub Pages**: no server-side code, so nowhere to call Steam or check the code.

## Steam

- The `appid` is read in the link (`/app/<digits>`), so that a friend only pastes the link of the game's page; the full list of Steam apps (`IStoreService/GetAppList`, which needs a key) is not needed.
- The game comes from `https://store.steampowered.com/api/appdetails?appids=<appid>&cc=fr&l=french`, undocumented and rate limited, without a key: its answer is cached in Netlify Blobs.
- The cover is `header_image` of the answer; the vertical cover of the Steam CDN is an idea of the backlog.

## Commands

To set at step 0, then listed here and in the `scripts` of `package.json`.

| Command | What it does |
|---|---|
| `netlify dev` | The interface and the functions together, locally. |
| `npm run check` | Everything run before a commit and in CI: format, lint, tests, build, width. |
| `python3 docs/mockups/serve.py <port>` | Serves the repository root without cache for the mock-up. The port of this project: `<port>` (choose one between 8700 and 8799 at the setup, unused by the other projects). |

## Exceptions to the naming conventions

Imposed by Svelte, Netlify or the tools, everything else in kebab-case:

- Configuration files keep the names the tools look for: `netlify.toml`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`, `.nvmrc`, `.env.example`.
- `netlify/functions/`: the folder Netlify reads by default.
- Svelte components stay in kebab-case, imported under a PascalCase name; runes modules end with `.svelte.ts`.
