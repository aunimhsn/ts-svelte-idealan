# Roadmap archive

The detail of the steps of [roadmap.md](../roadmap.md) whose pull request is merged, the most recent first. `roadmap.md` keeps one line per step done.

## 9b. The polish of the bag

Merged on 2026-11-02 in [#20](https://github.com/aunimhsn/ts-svelte-idealan/pull/20). Tools: build.

- The cards without their categories nor their cut corner, « Ajouté par » and the nickname in a blue lightened by 10 % (`--signal-label`, WCAG AA on a card), the cross of « Retirer » on the cover, the whole card opening the Steam page in a new tab.
- The count with the free places, « 5/47 jeux » with a filter on; « Joueurs max » and « Jouable à » up to 25 for new input, a game stored with more keeping its number.
- The menu of the nickname: « Réglages » and « Vider le sac » in red for the admin, « Se déconnecter »; emptying the bag red all the way.
- The review applied: a tap that closes a bubble or the menu doesn't open the Steam page under it, the menu over the strip of the errors, the taps on a card checked by `check-overflow` on a phone.

## 9a. Mock-up and specifications of the polish

Merged on 2026-11-02 in [#19](https://github.com/aunimhsn/ts-svelte-idealan/pull/19). Tools: mock-up, specifications, structure.

- The cards without their categories nor their cut corner, « Ajouté par » in electric blue under the title, the cross of « Retirer » on the cover, the whole card opening the Steam page in a new tab.
- The count of the bar with the free places (« 47 jeux · 3 places libres »), « 5/47 jeux · filtres actifs » with a filter on; « Jouable à » and « Joueurs max » up to 25.
- The nickname on the right with « admin » under it, its menu: « Réglages », « Vider le sac » in red, « Se déconnecter »; emptying the bag red all the way.
- A friend renames themself 3 times at most, the admin gives the renames back and reads their journal; the renames in « Stored data » of `specs.md`.
- The decisions in `docs/branding.md`, the options set aside in its « Set aside » list.

## 8. Launch

Merged on 2026-11-02 in [#17](https://github.com/aunimhsn/ts-svelte-idealan/pull/17). Tools: launch.

- The production site checked: the member code is set (a call without code answers `wrong-access-code`, not `server-not-configured`), and the owner keeps the two codes of Netlify as final.
- No separate rehearsal: the friends' first real use serves as one, and the owner empties the bag (« Vider le sac ») and deletes the nicknames in « Réglages » if needed.
- The page is opened on the friends' PCs, Full HD at least, and on their phones.
- The link and the member code sent by the owner in the group conversation, never in the repository.
- Netlify's email of 50 % of the credits: until the LAN, only an urgent fix is merged ([external services](external-services.md)).

## 7b. Emptying the bag

Merged on 2026-11-02 in [#16](https://github.com/aunimhsn/ts-svelte-idealan/pull/16). Tools: build.

- « Vider le sac » in the admin's header: the whole bag, filters aside, its order frozen at opening, no box checked; the games to keep checked, « 9 gardés · 38 retirés », then the confirmation.
- `POST /api/empty-bag` receives the games to remove, 1 to 50 distinct appids, in one conditional write: a game added meanwhile stays.
- The error in a red block in the panel.
- `tall-panel.svelte` shared with the settings, with `.panel-note`, `.error-block`, `--stripes` and `adminMessage`.
- The review applied in full (6 points, the refactor included at the owner's request).

## 7a. Settings

Merged on 2026-11-02 in [#15](https://github.com/aunimhsn/ts-svelte-idealan/pull/15). Tools: mock-up, build.

- « Réglages » in the admin's header; four admin-only functions (`get-settings`, `rename-player`, `reset-player-code`, `delete-player`) answering the bag with `accounts` (active, locked, reset).
- A refused rename in a red bubble under its line, and the labels « verrouillé » and « code à choisir », chosen in the mock-up.
- The admin's own line without « Réinitialiser » nor « Supprimer ».
- `vote` and `add-game` check the player again inside the write of the bag (`isStillPlayer`), and a deletion cleans every player gone.
- The review applied in full (6 points).

## 6d. Filters

Merged on 2026-11-01 in [#14](https://github.com/aunimhsn/ts-svelte-idealan/pull/14). Tools: build.

- The filters in `src/lib/filters.ts` and `src/components/bag-filters.svelte`: every tag pressed is required (AND), only the kinds and genres of the bag are offered, « JcJ » added.
- « Jouable à N » off at start, N from 1 to 99 following the players of the bag until changed, its window fading in 4 px under its chip; every filter off after a reload; the count « 12 jeux sur 47 · filtres actifs ».
- On a PC, « Joueurs max » and « Ajouter » under the link, and « Rafraîchir » filled blue at the end of the row of the filters, outlined by the count on a phone.
- The review applied in full.

## 6c. Votes and removing

Merged on 2026-11-01 in [#13](https://github.com/aunimhsn/ts-svelte-idealan/pull/13). Tools: build.

- The votes on the cards, with the score that jumps; who voted in a bubble under the score (a tap, a hover or the keyboard focus).
- The votes shown at once over the bag as last read (`withVotes`), and the order of the cards kept after the friend's own vote (`inOrder`).
- « Retirer » with `src/components/confirm-panel.svelte`, a native `<dialog>` armed for 2 seconds, reused by step 7.
- A queued call dropped when another tab changed the player.
- The review applied as chosen by the owner, all but grouping the queued votes of one game.

## 6b. The welcome and the bag

Merged on 2026-11-01 in [#12](https://github.com/aunimhsn/ts-svelte-idealan/pull/12). Tools: build.

- The tokens of the mock-up moved to `src/styles/tokens.css`, and its fonts self-hosted.
- The welcome (the access code without capitals nor corrections, a code beyond U+00FF turned into `wrong-access-code`), the cards sorted by score (the fallback of a missing cover), adding a game, the strip of the errors with the French messages of every error code, « Se déconnecter », the reload every 30 seconds.
- The three client rules of the lock in `src/lib/api.ts` and `src/lib/app-state.svelte.ts`: any refusal of the player stops the reload and forgets the personal code, a kept session resumes with `get-bag`, one call at a time with `player-busy` tried again after its `retry-after`; credentials once refused are never sent again.
- The tabs of a browser kept in step by the `storage` event.
- The width check on the bag with `scripts/check-overflow-bag.json`; `ping` removed.
- The review applied as chosen by the owner; the 14 px link and the 2.1:1 borders kept.

## 6a. The server of the bag

Merged on 2026-11-01 in [#11](https://github.com/aunimhsn/ts-svelte-idealan/pull/11). Tools: build.

- The five functions of the bag, each answering the whole bag: `enter` (the nickname and its personal code), `get-bag`, `add-game` (reads the game with `readSteamGame`, keeps the `steam_appid` given by Steam as the id of the game), `vote` and `remove-game`; the temporary `steam-game` of step 5 removed.
- The personal code hashed with `scrypt` and a salt of its own; 5 wrong codes in a row lock the nickname, each try written as pending in `attempts/<id>` before its code is checked and expired after 2 minutes; `player-busy` (429, `retry-after`) while other calls hold the last tries.
- `updateJSON` in `netlify/lib/store.ts`: the conditional writes with the ETag (`onlyIfMatch`, `onlyIfNew`), 5 tries at most with a random pause.
- Two code reviews applied, chosen by the owner; tried with `netlify dev` and on the deploy preview with a script of `outputs/`.
- The rules of the client that the lock depends on, written into step 6b.

## 5. Read a Steam game

Merged on 2026-11-01 in [#10](https://github.com/aunimhsn/ts-svelte-idealan/pull/10). Tools: build.

- `src/lib/steam-link.ts`: reads the `appid` of a link (the table of `specs.md`), with its tests.
- `netlify/lib/steam-game.ts`: asks the Steam Store, keeps only the checked fields (type, name, cover on the Steam CDN, categories, genres) and caches the page in Blobs (`steam/<appid>`).
- `netlify/lib/access.ts`: checks `MEMBER_CODE` and `ADMIN_CODE`, set by the owner as secret values; the same value for both makes nobody admin.
- `netlify/lib/store.ts`: production uses the site-wide store, every other deploy a store of its own.
- A temporary function `GET /api/steam-game?appid=`, to try it on the deploy preview: Steam answers the servers of Netlify (tried by the owner with a script of `outputs/`).
- `build.ignore` in `netlify.toml`: skips a deploy when nothing that ends up in the site changed (an allowlist), and builds without a previous commit or without cache; the owner turned the Netlify builds back on.
- The review applied: a `Map` for the hosts of the links, a test of the store.
- The first preview failed on the secrets scanning of Netlify: the first member code was a word of a drawing of the repository; the owner changed it. A code must never appear in the repository.

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
