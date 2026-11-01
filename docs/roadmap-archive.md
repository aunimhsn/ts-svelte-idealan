# Roadmap archive

The detail of the steps of [roadmap.md](../roadmap.md) whose pull request is merged, the most recent first. `roadmap.md` keeps one line per step done.

## 4. Design system

Merged on 2026-11-01 in [#9](https://github.com/aunimhsn/ts-svelte-idealan/pull/9). Tools: design system.

- `docs/mockups/shared/tokens.css`: every length, color, shadow, duration, layer, weight, line height and letter spacing of the mock-up as a named token (about 110, by role), one breakpoint at 900 px; it becomes the tokens file of the application.
- `docs/mockups/shared/app.css` rewritten on these tokens only; the three logos set aside dropped.
- `docs/branding.md`: the tokens with their reasons and their contrasts on the real background `#04050a` (every text passes AA), the components, motion, tone, icons, accessibility.
- The owner's decisions, with the options set aside: the borders kept at 55 % of the blue (2.1:1, below the 3:1 of WCAG 1.4.11, accepted); a bordeaux `#8c1626` for the strip of the errors, among four reds; the Steam link written in 14 px everywhere, accepting that an iPhone zooms when the field is tapped.
- `design-journal.md`: the entry of idealan, with the lesson of the bolder fourth style.

## 3. Mock-up

Merged on 2026-11-01 in [#8](https://github.com/aunimhsn/ts-svelte-idealan/pull/8). Tools: mock-up.

- `docs/mockups/`: a viewer that shows the application (`app.html`) in a phone frame (390 px) and a PC frame (1920 px), with one tab group per open decision; every screen and state of the wireframe (the bag, the welcome and its errors, who voted, the confirmations, the admin's settings and the emptying, the empty bag, a link being read, the errors in a red strip, a game without cover, « Jouable à N », filters with no game). The covers come from the Steam CDN.
- The owner's decisions in `docs/branding.md`, with the options set aside: the style D · Néon (among four), the electric blue `#2e6bff` (among six), the logo « Bloc évidé » (an RJ45 jack), « Idealan » in Montserrat 800 at −0.02 em, the signature with the wordmark of Sylent over a watermark of its mark.
- `specs.md`: the mock-up is the reference of the interface; the wireframe of the screens removed.
- Checked on the owner's phone.

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
