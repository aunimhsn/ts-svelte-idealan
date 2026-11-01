# Backlog

What is noted and not being done: an evolving list, read when the next work is chosen (process.md, The backlog), not at every session. When the owner picks an item, it leaves this file and becomes a step of [roadmap.md](roadmap.md).

<!--
One entry per item, in the section of its kind: what it is in one sentence, what it depends on, and the date it was noted. For example:
- The cover takes a second to show on a phone. Noted on 2026-11-02.
- A Windows build. Waits on: a Windows machine to test the clipboard. Noted on 2026-11-02.
-->

## Polish

<!-- Small touches, one small pull request each. -->

- Badges on each game for what matters at a LAN: multiplayer, co-op, local network, from the categories of the Steam Store. Depends on: step 5. Noted on 2026-11-01.

- Claude Code runs inside the Flatpak of VS Code, where neither `firefox` nor `flatpak` is on the path: `screenshot.sh` of the `html-mockups` skill should fall back to `flatpak-spawn --host flatpak run org.mozilla.firefox`, here and in the template. Depends on: step 3. Noted on 2026-11-01.

## Edge cases

<!-- Cases at the margin that need thought before a pull request. -->

- Two friends vote for the same game at the same second: with one key per game in Netlify Blobs, one vote may overwrite the other. Decide in the specifications whether it is acceptable between friends. Noted on 2026-11-01.
- A link of a package (`/sub/`) or a bundle (`/bundle/`) instead of a game: refuse it, or ask for the link of the game. Noted on 2026-11-01.

## Features

<!-- New screens, actions or behaviors for a later cycle. -->

- A « random draw » button on the day of the LAN, weighted or not by the votes. Noted on 2026-11-01.
- Sort and filter the bag: by number of friends interested, multiplayer or co-op only. Noted on 2026-11-01.
- Vertical covers (`library_600x900.jpg` of the Steam CDN), with the horizontal one (`header_image`) as fallback when a game has none. Needs an exploration: does the vertical cover exist for most of the games of the bag? Noted on 2026-11-01.
- Games outside Steam (Epic, Battle.net, free games): added by hand, with a name and an image. Noted on 2026-11-01.
- Who already owns each game, with `IPlayerService/GetOwnedGames`: needs a Steam Web API key and public profiles. Waits on: the friends' Steam IDs and their consent. Noted on 2026-11-01.
- A detail of a game: screenshots, the background of its Steam page, the trailer. Noted on 2026-11-01.

## Large works

<!-- Works of several cycles, or that change the structure. -->

- The template `ts-svelte-dynamic-website-template`, made from this project at the retrospective of the first cycle: what held for idealan and applies to every dynamic site in Svelte on Netlify (the conventions, the process, the checks, the skeleton), without what is specific to the LAN. Named after its language and framework (see the naming of the repositories in `CLAUDE.md`). Noted on 2026-11-01.
- Real time updates (a game appears for everyone as soon as a friend adds it), or user accounts: both would need another service than Netlify Blobs (Supabase, for example). Noted on 2026-11-01.

- Move to TypeScript 7 (the rewrite in Go) once `svelte-check` and `typescript-eslint` accept it (their peer dependencies stop at `^6.0.0` and `<6.1.0` on 2026-11-01): one `build` pull request that raises `typescript`, `svelte-check` and `typescript-eslint` together, runs `npm run check` again and updates `docs/technical-choices.md`; about one session once the tools are ready. Dependabot no longer proposes it once the major version is ignored (#3): check at the end of each cycle. Noted on 2026-11-01.

- The links to `astro-static-website-template`, renamed `ts-astro-static-website-template` on 2026-11-01, in the documents of `rust-cli-template`, `sylent.art` and the other projects: GitHub redirects them, but the redirect breaks if a repository takes the old name again. Noted on 2026-11-01.

## Waiting on others

<!-- What depends on someone else than the owner and Claude Code; say on whom and on what. -->

- The friends' feedback after the LAN. Waits on: the LAN. Noted on 2026-11-01.

## Explorations kept

<!-- Exploration branches kept unmerged, and why. -->
