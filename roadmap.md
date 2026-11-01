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
- [x] **2. Wireframes** ([#7](https://github.com/aunimhsn/ts-svelte-idealan/pull/7)).
- [x] **3. Mock-up** ([#8](https://github.com/aunimhsn/ts-svelte-idealan/pull/8)).
- [x] **4. Design system** ([#9](https://github.com/aunimhsn/ts-svelte-idealan/pull/9)).
- [x] **5. Read a Steam game** ([#10](https://github.com/aunimhsn/ts-svelte-idealan/pull/10)).
- [x] **6. The bag** (build), in sub-steps agreed with the owner on 2026-11-01 (6c split into 6c and 6d the same day):
  - [x] **6a. The server** ([#11](https://github.com/aunimhsn/ts-svelte-idealan/pull/11)).
  - [x] **6b. The welcome and the bag** ([#12](https://github.com/aunimhsn/ts-svelte-idealan/pull/12)).
  - [x] **6c. Votes and removing** ([#13](https://github.com/aunimhsn/ts-svelte-idealan/pull/13)).
  - [x] **6d. Filters**: the filters by kind of game with « Jouable à N », « Aucun jeu ne correspond à ces filtres. » and « Retirer les filtres » (the sort by score came with 6b).
- [ ] **7. Moderation** (build): the admin's settings (rename, reset a personal code, which also clears `attempts/<id>` and unlocks the nickname, delete a player and its `attempts/<id>` (an orphan one is harmless); after a reset, the first one to enter with the nickname chooses its code: the admin tells the friend to enter at once — from the review of step 6a) and emptying the bag; needed before the LAN, since only the admin unlocks a nickname.
- [ ] **8. Launch**: the application checked on the `netlify.app` address, the two codes set, the link and the member code sent to the friends.
- [ ] **9. Retrospective**: after the LAN, the friends' feedback in the backlog, the lessons in `process.md`, the memory moved to the files, and the template `ts-svelte-dynamic-website-template` made from this project.

The steps may be split into sub-steps when a pull request grows too large. When no step is left, Claude Code proposes the next items of the backlog to the owner.
