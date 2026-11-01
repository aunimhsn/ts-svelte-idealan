# Roadmap archive

The detail of the steps of [roadmap.md](../roadmap.md) whose pull request is merged, the most recent first. `roadmap.md` keeps one line per step done.

## 2. Wireframes

Merged on 2026-11-01 in [#7](https://github.com/aunimhsn/ts-svelte-idealan/pull/7). Tools: wireframes.

- `docs/wireframes/screens.excalidraw`: the welcome and the bag on a phone (390 px) and a Full HD PC (1920 px), then the panels and the states, agreed with the owner in four iterations; the layout written in `specs.md`.
- The maximum number of players, typed and optional when adding (Steam doesn't give it; PCGamingWiki, tested, misses the recent games), and the filter « Jouable à N ».
- Several bags, an invitation link and changing the number of players afterwards noted in `backlog.md`.

## 1. Specifications and structure

Merged on 2026-11-01 in [#6](https://github.com/aunimhsn/ts-svelte-idealan/pull/6). Tools: specifications, structure.

- The starting notes turned into the sections of `specs.md` with the owner's answers: the purpose, the design principles, the screens and panels, the Steam links, the stored data, the two codes and the nicknames with a personal code, the errors.
- Netlify and the Steam Store checked in `docs/external-services.md`, with the risks accepted by the owner.
- The structure drawn in `docs/wireframes/structure.excalidraw`: one page with panels, the bag in one key of Netlify Blobs.
- Step 6 split into « The bag » and « Moderation » (7); the Netlify builds stopped until step 5, which turns them back on with `build.ignore`.

## 0b. The skeleton

Merged on 2026-11-01 in [#2](https://github.com/aunimhsn/ts-svelte-idealan/pull/2). Tools: build.

- Vite, Svelte 5 with the runes and TypeScript, one Netlify Function that answers, the Netlify CLI as a dependency of the project.
- `npm run check`: Prettier, ESLint, `svelte-check`, Stylelint, Vitest, the build, the width on a phone; the same checks in CI, then required by the ruleset.
- Dependabot, `.env.example`, Node.js pinned, the port of the mock-up server.
- The owner created a Netlify account, linked the site to the repository and named it `ts-svelte-idealan-sylent`.

## 0a. The documents

Merged on 2026-11-01 in [#1](https://github.com/aunimhsn/ts-svelte-idealan/pull/1). Tools: start a project.

- The documents of the project and `.claude/` (the `code-reviewer` and `dependency-reviewer` agents, the `excalidraw-wireframes` and `html-mockups` skills, the settings that turn off the claude.ai connectors) committed.
- The size of the project written in `roadmap.md`: every tool, in order, for the first cycle.
- The repository settings applied: squash merging only, branches deleted once merged, the ruleset « Protect main » (pull request required, no force push, no deletion, squash only).
