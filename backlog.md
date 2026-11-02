# Backlog

What is noted and not being done: an evolving list, read when the next work is chosen (process.md, The backlog), not at every session. When the owner picks an item, it leaves this file and becomes a step of [roadmap.md](roadmap.md).

<!--
One entry per item, in the section of its kind: what it is in one sentence, what it depends on, and the date it was noted. For example:
- The cover takes a second to show on a phone. Noted on 2026-11-02.
- A Windows build. Waits on: a Windows machine to test the clipboard. Noted on 2026-11-02.
-->

## Polish

<!-- Small touches, one small pull request each. -->

- The counts of the settings say « 0 votes · 0 jeux »: in French, 0 takes the singular (« 0 vote · 0 jeu »), as the bar of the emptying already does (`src/lib/empty-bag.ts`). Depends on: step 7b. Noted on 2026-11-02.
- Claude Code runs inside the Flatpak of VS Code, where neither `firefox` nor `flatpak` is on the path: `screenshot.sh` of the `html-mockups` skill should fall back to `flatpak-spawn --host flatpak run org.mozilla.firefox`, here and in the template. Depends on: step 3. Noted on 2026-11-01.

## Edge cases

<!-- Cases at the margin that need thought before a pull request. -->


## Features

<!-- New screens, actions or behaviors for a later cycle. -->

- The address `idealan.sylent.art` instead of `ts-svelte-idealan-sylent.netlify.app`: the domain added in Netlify, a CNAME `idealan` at the DNS of `sylent.art` (Squarespace, ex-Google Domains), no deploy needed; the friends' sessions are kept per address, so they enter again once on the new one. Then update the address in `CLAUDE.md`, `specs.md` and the README. Set aside by the owner on 2026-11-02 for after the launch. Noted on 2026-11-02.
- A « random draw » button on the day of the LAN, weighted or not by the votes. Noted on 2026-11-01.
- Vertical covers (`library_600x900.jpg` of the Steam CDN), with the horizontal one (`header_image`) as fallback when a game has none. Needs an exploration: does the vertical cover exist for most of the games of the bag? Noted on 2026-11-01.
- Change the maximum number of players of a game after adding it (by the friend who added it, or the admin), when it was left empty or is wrong. Depends on: step 6. Noted on 2026-11-01.
- Games outside Steam (Epic, Battle.net, free games): added by hand, with a name and an image. Noted on 2026-11-01.
- An invitation link that carries the member code (`#code=…`, never sent to the server): the friends click it and the welcome asks only for the nickname and the personal code; the link is worth the code if forwarded, and stays in the browser history. Set aside for version 1 by the owner, who prefers the typed code. Noted on 2026-11-01.
- Who already owns each game, with `IPlayerService/GetOwnedGames`: needs a Steam Web API key and public profiles. Waits on: the friends' Steam IDs and their consent. Noted on 2026-11-01.
- A detail of a game: screenshots, the background of its Steam page, the trailer. Noted on 2026-11-01.

## Large works

<!-- Works of several cycles, or that change the structure. -->

- The template `ts-svelte-dynamic-website-template`, made from this project at the retrospective of the first cycle: what held for idealan and applies to every dynamic site in Svelte on Netlify (the conventions, the process, the checks, the skeleton), without what is specific to the LAN. Named after its language and framework (see the naming of the repositories in `CLAUDE.md`). Noted on 2026-11-01.
- Several bags (one per group of friends or per LAN), each with its codes: a screen to create a bag, the codes hashed in Netlify Blobs instead of the environment variables, one key per bag instead of `bag`, and a choice between nicknames shared by every bag or one set per bag. Worth it only if the application serves other groups (a product, or the template). Needs the specifications and the structure again. Noted on 2026-11-01.
- Real time updates (a game appears for everyone as soon as a friend adds it), or user accounts: both would need another service than Netlify Blobs (Supabase, for example). Noted on 2026-11-01.

- Move to TypeScript 7 (the rewrite in Go) once `svelte-check` and `typescript-eslint` accept it (their peer dependencies stop at `^6.0.0` and `<6.1.0` on 2026-11-01): one `build` pull request that raises `typescript`, `svelte-check` and `typescript-eslint` together, runs `npm run check` again and updates `docs/technical-choices.md`; about one session once the tools are ready. Dependabot no longer proposes it once the major version is ignored (#3): check at the end of each cycle. Noted on 2026-11-01.

- A French VPS to host several projects, instead of the free plan of Netlify (300 credits a month, 15 per production deploy): no credit limit, data in France; in return, the server to maintain (security updates, firewall, certificates, backups), the functions and Blobs to replace (a Node.js server and SQLite, for example), and the deploy previews to rebuild (Coolify does it). The owner also sees the upkeep as a skill to learn. Compare with a paid Netlify plan before choosing. On 2026-11-02, the owner plans Coolify on a VPS after the LAN. Depends on: the retrospective of this project, and the template. Noted on 2026-11-01.

- The links to `astro-static-website-template`, renamed `ts-astro-static-website-template` on 2026-11-01, in the documents of `rust-cli-template`, `sylent.art` and the other projects: GitHub redirects them, but the redirect breaks if a repository takes the old name again. Noted on 2026-11-01.

## Waiting on others

<!-- What depends on someone else than the owner and Claude Code; say on whom and on what. -->

- The friends' feedback after the LAN. Waits on: the LAN. Noted on 2026-11-01.

## Explorations kept

<!-- Exploration branches kept unmerged, and why. -->
