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

- [ ] **0. Project setup** (start a project, build), in two pull requests:
  - [x] **0a. The documents**: the documents of the project and `.claude/` (agents, skills, settings) committed; the size of the project; the repository settings (squash merging only, branches deleted, ruleset on `main`), applied on 2026-11-01.
  - [ ] **0b. The skeleton**: Vite, Svelte 5 with the runes and TypeScript, one Netlify Function that answers, the Netlify CLI as a dependency of the project, `npm run check` (Prettier, ESLint, `svelte-check`, Stylelint, Vitest, build, width on a phone), CI (then required by the ruleset), Dependabot, `.env.example`, Node.js pinned, the port of the mock-up server; the owner creates a Netlify account, links the site to the repository and names it.
- [ ] **1. Specifications and structure**: the starting notes of `specs.md` turned into its sections; Netlify and the Steam Store checked in `docs/external-services.md`; the screens and the stored data in Excalidraw.
- [ ] **2. Wireframes**: one Excalidraw wireframe per screen, phone first, then the big screen of the LAN.
- [ ] **3. Mock-up**: 3 or 4 styles with real covers of Steam games, then every screen and state in `docs/mockups/`, checked on the owner's phone; decisions in `docs/branding.md`.
- [ ] **4. Design system**: the tokens in `docs/branding.md`, the mock-up rewritten to use only them, an entry in `design-journal.md`.
- [ ] **5. Read a Steam game** (build): the `appid` read from a link, the function that fetches the game from the Steam Store and caches it, with their tests.
- [ ] **6. The bag** (build): add a game with the access code and a nickname, the duplicates turned into votes, the bag shown with the covers.
- [ ] **7. Launch**: the application checked on the `netlify.app` address, the access code set, the link and the code sent to the friends.
- [ ] **8. Retrospective**: after the LAN, the friends' feedback in the backlog, the lessons in `process.md`, the memory moved to the files, and the template `ts-svelte-dynamic-website-template` made from this project.

The steps may be split into sub-steps when a pull request grows too large. When no step is left, Claude Code proposes the next items of the backlog to the owner.
