# Technical choices

The technical choices of the [roadmap](../roadmap.md), with their reasons and the alternatives rejected. They come from the owner's discussion of 2026-11-01, before the setup: confirm or adapt them in steps 0 and 1, and record each change here with its date.

## Stack

| Topic | Choice | Reason |
|---|---|---|
| Hosting | Netlify, free plan, at `ts-svelte-idealan-sylent.netlify.app` | The interface and the server part in one place, deployed from GitHub on every merge, with a deploy preview per pull request. The address carries the owner's name, who signs every product they make (2026-11-01: the former rule that kept the project apart from the owner's business is removed). Limits in [external-services.md](external-services.md). |
| Interface | [Svelte](https://svelte.dev/) 5 with the runes, built with [Vite](https://vite.dev/), in TypeScript | A component is one file with its HTML, script and style; the reactivity is part of the language (`$state`, `$derived`), without hooks. The owner prefers it to React. |
| Server | Netlify Functions, in TypeScript | Plain files of `netlify/functions/` that use the standard `Request`, `Response` and `fetch`: they call the Steam Store (which the browser can't call, no CORS), check the access code and write the bag. |
| Data | Netlify Blobs: the whole bag in one key (`bag`), the players in another (`players`), one key per Steam page (`steam/<appid>`) | A key-value store of Netlify, without an account or a service of its own. One key for the bag (2026-11-01, lead B of the structure, rather than one key per game): one read shows the bag, and the limit of 50 games and the emptying are exact in one write; the conflicts of 9 friends are settled by conditional writes (`onlyIfMatch`), read again and retried. Detail in [Data](#data). |
| Access | Two shared codes in environment variables (member, admin), checked by the functions; a personal code of 4 digits per nickname, hashed in `players` | No accounts for a group of friends; the member code protects the reading and the writes, the admin code the moderation, and the personal code keeps a friend from taking another's nickname (2026-11-01). |
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
- **A VPS, Docker**: a server to maintain, useless for a few friends; an idea of the backlog for the next projects.
- **Supabase, Firebase**: an account and a service more, for a bag of a few dozen games; kept for real time or accounts (backlog).
- **Real time** (2026-11-01): Netlify Functions answer and stop, and Blobs doesn't notify a change; the bag reloads every 30 seconds while the tab is shown instead (about 1 credit for a LAN).
- **GitHub Pages**: no server-side code, so nowhere to call Steam or check the code.

## Functions

- Each function of `netlify/functions/` gives its address in its `config` (`path: "/api/<name>"`), so that the interface calls `/api/get-bag` rather than `/.netlify/functions/get-bag`. The `ping` of the skeleton went with step 6b, once the bag answered.
- The tests of the functions live in `netlify/tests/`, not next to them: Netlify bundles every file of `netlify/functions/` as a function, a test included.
- The code shared by the functions lives in `netlify/lib/` (the store, the access codes, Steam), for the same reason; the reading of a Steam link, needed by the interface too, lives in `src/lib/steam-link.ts`.
- Every function checks the access code first (`netlify/lib/access.ts`), sent in the `x-access-code` header rather than in the query, which the logs of Netlify keep. The codes are the environment variables `MEMBER_CODE` and `ADMIN_CODE`, secret values of the contexts Production, Deploy previews and Branch deploys, for the Functions scope only (set by the owner on 2026-11-01): Netlify never shows them again and fails a build whose files contain one. They are compared by their SHA-256 digests, so that the time of the answer tells nothing; without `MEMBER_CODE`, a function answers `server-not-configured` rather than « wrong code ».
- The functions of the bag: `POST /api/enter` (`{ nickname, code }`), `GET /api/get-bag`, `POST /api/add-game` (`{ link, maxPlayers }`), `POST /api/vote` (`{ appid, vote: "up" | "down" | null }`, the vote the friend ends with) and `POST /api/remove-game` (`{ appid }`). Each answers the whole bag (`BagView` of `src/lib/bag.ts`: the role, the player, the players, the games), so that the interface shows the result of an action without asking again. The temporary `steam-game` of step 5 is gone.
- After the welcome, every function but `enter` checks the player too: their id and personal code in the `x-player-id` and `x-player-code` headers (`netlify/lib/http.ts`). An unknown id, a reset code, a locked nickname or a wrong code answers `unknown-player`, `personal-code-reset`, `player-locked` (423) or `wrong-personal-code` (401): the interface sends the friend back to the welcome.
- A body is a small JSON object (2 KB at most); an unexpected one answers `invalid-request`. What a function doesn't expect (Blobs down, a bug) answers `server-error`, logged.
- The rules of the fields (`src/lib/field-rules.ts`: nickname, personal code, « Joueurs max ») are shared by the interface, which explains them, and the functions, which enforce them.
- An error answers with an error code (`{ "error": "method-not-allowed" }`) and its HTTP status; the interface turns the code into a French message of `src/i18n/fr.json`.
- The width check serves `dist/` without the functions: it checks the welcome, then the bag with the test data of `scripts/check-overflow-bag.json` (a nickname of 16 letters, a long name, many tags, no cover) for a friend written in the storage of the browser, and the bag whose server doesn't answer.

## Data

- `bag`, `players` and `steam/<appid>` live in a site-wide store (`getStore`) in production. A site-wide store is shared by every deploy, previews included: outside production (a deploy preview, a branch deploy, `netlify dev`), the functions use a store of the deploy (`getDeployStore`), emptied with each push, so that a preview never touches the friends' bag (`netlify/lib/store.ts`; chosen by the owner on 2026-11-01 over a store shared by every preview, accepting to start each try from an empty bag).
- Every write of `bag` or `players` reads the key with its ETag, changes it, and writes it with `onlyIfMatch`; when `modified` is `false`, another friend wrote meanwhile: read again and retry, a few times at most.
- A new nickname goes into `players` under the same conditional write (`onlyIfNew` for the first one), so that two friends taking the same nickname at the same second can't both get it. The read, the change and the retries live in `updateJSON` of `netlify/lib/store.ts`, 5 tries at most, with a short pause drawn by chance before each new try (up to 20, 40, 80, 160 ms), then `server-error`.
- The local Blobs server of `netlify dev` answers no ETag on a read (`@netlify/blobs` 11.1.7, checked on 2026-11-01): in the `dev` context only, the write is then unconditional, harmless with one developer; online, a read without an ETag fails. `netlify functions:serve` gives no deploy and can't open the store: use `netlify dev`.
- The personal code is hashed with `scrypt` and a salt of 16 bytes of its own (`netlify/lib/players.ts`); 5 wrong codes in a row lock the nickname. The tries are counted in a key per player, `attempts/<id>`, so that the reloads of the friends don't collide on `players`; each try is written as pending (an id and its time) by a conditional write before its code is hashed, so that a burst of parallel calls can't check more than 5 codes (the reviews of step 6a); a wrong code turns it into a failure, a right one removes it, `enter` clears the failures, and the player is read again after the check, in case the admin reset the code meanwhile. A pending try expires after 2 minutes (a call lasts 60 seconds at most), so that a call that crashed never locks a friend for good. When the failures and the live pending tries reach 5 but the failures alone don't, the answer is `player-busy` (429, `retry-after: 2`), not `player-locked`. A stored hash is checked against its exact format, since a malformed one would give an empty hash that an empty one matches. A code that isn't 4 digits is refused before any try or hash, and `add-game` asks Steam only once the link, « Joueurs max », the room in the bag and the duplicates are checked.
- `add-game` keeps the `steam_appid` of the answer of Steam as the id of the game (it may differ from the link), and checks the duplicates on it again when writing.
- The votes and the adder of a game point to the fixed id of a player (`j1`), so that renaming writes only `players`.
- The reads use the strong consistency of Blobs, so that a friend sees their own vote at once (the default, eventual, takes up to 60 seconds).

## Interface

Built in step 6b, from the mock-up (`docs/mockups/`), which stays the visual reference.

- One page and one state: `src/lib/app-state.svelte.ts` (a class with runes) holds who the friend is, the bag as last read and the messages; the screens (`src/components/`) read it and call its actions. The welcome shows when the browser keeps no session, the bag otherwise.
- The browser keeps the friend in `localStorage` under the key `idealan` (`src/lib/session.ts`): the access code, the id, the nickname and the personal code, read field by field (a field malformed is left out). A storage that refuses (a private window) keeps the friend for the visit only.
- The calls go through `src/lib/api.ts`, one at a time, in the order asked: a friend's calls never race, so that they can't spend the tries of their personal code together. The credentials are read when a call is sent, and credentials once refused (a refusal of the player, or `wrong-access-code`) are never sent again until the friend enters anew: a call waiting behind a refusal is dropped, even before the screen has gone back to the welcome. `player-busy` is tried again after its `retry-after` (10 seconds at most), 3 times, the credentials read again before each try; each try gives up after 25 seconds (`server-unreachable`), so that it never holds the others.
- The three rules the lock of the nicknames depends on (the second review of step 6a): any refusal of the player sends the friend back to the welcome, forgets the personal code and stops the reload; a kept session resumes with `get-bag`, never `enter` (which would clear the failures); one call at a time. Tested in `src/lib/app-state.svelte.test.ts` and `src/lib/api.test.ts`.
- An access code with a character beyond U+00FF (or a line break), which `fetch` refuses in a header, is `wrong-access-code` without calling. The access code is trimmed, the nickname capitalized as the server would.
- The tabs of one browser share what is kept: a tab follows the `storage` event of another (« Se déconnecter », a new entry, a refusal), and a tab sent back to the welcome takes the session another tab entered meanwhile rather than writing over it (the review of step 6b).
- The bag reloads every 30 seconds while the tab is shown, and at once when the tab comes back after longer; a reload is skipped while another call runs. Every answer of a function is the whole bag, so an action shows its result without a reload.
- The interface checks the link (`readSteamLink`) and « Joueurs max » (`readMaxPlayers`) before calling, with the rules the functions use.
- The cards: sorted by score, then the oldest first; the kinds of a LAN named in short from the id of their Steam category (`src/lib/games.ts`: 9 Coop, 48 Coop en LAN, 49 JcJ, 47 JcJ en LAN, 24 Écran partagé), then the genres as Steam names them. A cover missing or that doesn't load becomes the striped block with the name.
- The floor runs by a `transform` of its grid, inside a plane that keeps the tilt and the fade: an animated `background-position` would paint the whole floor again at each frame (the review of step 6b).
- Fonts: the Latin subset of each, in WOFF2, from the npm packages of Fontsource 5.3.0 (`@fontsource/chakra-petch` 500 and 700, `@fontsource-variable/manrope`, `@fontsource/montserrat` 800), with their licenses (SIL Open Font License), in `src/assets/fonts/`, preloaded by `index.html`; copied rather than installed, since only four files are needed. `font-display: swap`: the text shows at once in the font of the system.
- `build.assetsInlineLimit: 0` in `vite.config.ts`: Vite would inline a file under 4 KB as a `data:` address, which the Content Security Policy refuses.
- `src/styles/tokens.css` is the tokens file of the mock-up, moved there: the mock-up reads it from `src/`, so that both share it. Stylelint lets its groups of custom properties be separated by an empty line (`.stylelintrc.json`).

## Steam

- The `appid` is read in the link (`/app/<digits>`), so that a friend only pastes the link of the game's page; the full list of Steam apps (`IStoreService/GetAppList`, which needs a key) is not needed.
- The link is read by `src/lib/steam-link.ts`: `store.steampowered.com` (`/app/<appid>`, `/agecheck/app/<appid>`) and `steamcommunity.com` (`/app/<appid>`), in `http` or `https`; an `appid` is a whole number from 1 to 4,294,967,295 without a leading zero; `/sub/` and `/bundle/` are packages.
- The game comes from `https://store.steampowered.com/api/appdetails?appids=<appid>&cc=fr&l=french&filters=basic,categories,genres` (one `appid` per call, about 7 KB with the filters), undocumented and rate limited, without a key: its answer is cached in Netlify Blobs (`steam/<appid>`), and only `type: "game"` goes in the bag (a soundtrack or a DLC answers too). The cache keeps a page that is not a game too, so that Steam is not asked again, but not an `appid` that Steam doesn't know (a game not released yet may get it). The answer is untrusted (`netlify/lib/steam-game.ts`): only the type, name, cover, categories (id and French name) and genres are kept, checked one by one, the texts cut at 200 characters, the cover kept only on `https://*.steamstatic.com`. Steam is given 8 seconds; a refusal (429), an error, an unexpected answer or no answer is `steam-unavailable`. When Blobs fails, Steam is asked as if nothing was cached.
- The cover is `header_image` of the answer; the vertical cover of the Steam CDN is an idea of the backlog.

## Commands

Set at step 0, listed here and in the `scripts` of `package.json`. Install the browser of the width check once with `npx playwright install --only-shell chromium`.

| Command | What it does |
|---|---|
| `npm install` | Installs the dependencies, the Netlify CLI included. |
| `npm run dev` | `netlify dev`: Vite and the functions together on `http://localhost:8888`, with the environment variables of the linked Netlify site or of a local `.env`. Add `--offline` to run without the Netlify account. When 5173 is taken: `npm run dev -- --port 8899 --command "vite --strictPort --port 5199" --target-port 5199`. |
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
