# Roadmap

The steps chosen for the application described in [specs.md](specs.md), following [process.md](process.md). Each step is delivered in its own pull request, which checks its box. What is noted and not chosen yet lives in [backlog.md](backlog.md).

## Size of the project

A small application of a few screens: every tool, in order, for the first cycle (specifications, structure, wireframes, mock-up, design system, build, launch, retrospective). Chosen with the owner on 2026-11-01 (process.md, Size the project).

## Reference

Read only by the steps that need them:

- [Technical choices](docs/technical-choices.md): the stack, the commands and the main designs, with their reasons.
- [Branding](docs/branding.md): the visual identity and every design decision of the mock-up, with the tokens.
- [External services](docs/external-services.md): limits and terms of Netlify and of the Steam Store, and the risks accepted by the owner.
- [Roadmap archive](docs/roadmap-archive.md): the detail of the steps done, moved there once their pull request is merged.
- [Backlog](backlog.md): what is noted and not chosen yet, read when the next work is chosen.

## Steps

<!--
The usual steps of the first cycle of a small application; adapt them at the setup, one line per step done with its pull requests. Each step names the tools it needs (process.md, Size a change). A later cycle adds its steps under a heading of its own (« Cycle 2: random draw and games outside Steam »), numbered after the last one.
-->

### Cycle 1: the bag ready for the LAN

- [x] **0. Project setup** ([#1](https://github.com/aunimhsn/ts-svelte-idealan/pull/1), [#2](https://github.com/aunimhsn/ts-svelte-idealan/pull/2)).
- [x] **1. Specifications and structure** ([#6](https://github.com/aunimhsn/ts-svelte-idealan/pull/6)).
- [ ] **2. Wireframes**: one Excalidraw wireframe per screen of `specs.md` (the welcome, the bag, the panels: who voted, confirmation, settings, emptying), phone first, then a Full HD PC.
- [ ] **3. Mock-up**: 3 or 4 styles with real covers of Steam games, then every screen and state in `docs/mockups/`, checked on the owner's phone; decisions in `docs/branding.md`.
- [ ] **4. Design system**: the tokens in `docs/branding.md`, the mock-up rewritten to use only them, an entry in `design-journal.md`.
- [ ] **5. Read a Steam game** (build): the `appid` read from a link, the function that fetches the game from the Steam Store and caches it, with their tests. First, the owner turns the builds of Netlify back on (stopped during the design, to save credits), and `build.ignore` in `netlify.toml` deploys only when what ends up in the site changes (an allowlist: `src/` without its tests, `netlify/functions/`, `index.html`, the dependencies, the config of Vite, Svelte, TypeScript and Netlify, `.nvmrc`); it builds when `$CACHED_COMMIT_REF` is empty.
- [ ] **6. The bag** (build): the welcome (the two codes, the nickname and its personal code), adding a game with its maximum number of players, the votes and who voted, removing one's game, the sort and the filters (with « Jouable à N »), the reload every 30 seconds; probably split into sub-steps when sized.
- [ ] **7. Moderation** (build): the admin's settings (rename, reset a personal code, delete a player) and emptying the bag.
- [ ] **8. Launch**: the application checked on the `netlify.app` address, the two codes set, the link and the member code sent to the friends.
- [ ] **9. Retrospective**: after the LAN, the friends' feedback in the backlog, the lessons in `process.md`, the memory moved to the files, and the template `ts-svelte-dynamic-website-template` made from this project.

The steps may be split into sub-steps when a pull request grows too large. When no step is left, Claude Code proposes the next items of the backlog to the owner.
