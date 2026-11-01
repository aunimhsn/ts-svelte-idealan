# CLAUDE.md

## Communication

- Always communicate with the user in French through the Claude Code harness (chat responses, explanations, questions).
- Address the user informally, with « tu » (tutoiement), never « vous », in every session.
- Ask a few numbered open questions at a time, in plain text, the main one first, rather than multiple-choice forms: the owner prefers to answer freely, often by voice dictation (interpret the misspelled names, and confirm when an answer is ambiguous). An unanswered question takes Claude Code's recommendation.
- Keep a critical eye on the owner's ideas: give a clear opinion with its reason, point out the consequence a choice hides (data shared between friends, cost of a service, what a viewer sees on a phone), offer an alternative, then follow the owner's decision.
- The first time a design or tooling term comes up (design token, rune, serverless function, key-value store…), explain it in plain words with a short example.

## Project

- Idealan (« idée » + « LAN ») is a small web application for a LAN party between friends: before the event, each friend pastes the link of a Steam game they would like to play into a shared « bag »; on the day, the group opens the page and picks what to play.
- Built with Svelte 5 (runes) and Vite in TypeScript; the server part is Netlify Functions, the data lives in Netlify Blobs; hosted on Netlify at its `netlify.app` address only, never on a domain of the owner, so that the project stays apart from the owner's business.
- No user accounts: a shared access code, checked by the functions on the server, protects the writes; each friend gives a nickname, kept in their browser.
- The Steam data (name, cover, categories) comes from the public Steam Store; no Steam key is needed for version 1. Any key or code lives in the Netlify environment variables, never in the repository or in the code sent to the browser.
- The repository is public: never commit secrets, the access code, the friends' nicknames or any personal data.
- Out of scope for version 1: user accounts, Steam sign-in, real time updates, games outside Steam (see `backlog.md`).

## Naming conventions

- Files and directories use kebab-case (e.g. `docs/getting-started.md`, `src/lib/steam-link.ts`, `netlify/functions/add-game.ts`), unless Svelte, Netlify or a tool imposes another name: then follow it, and write the exception in `docs/technical-choices.md`.
- Svelte components stay in kebab-case too (`src/components/game-card.svelte`), imported under a PascalCase name (`import GameCard from './components/game-card.svelte'`), as Svelte requires; a module that uses runes ends with `.svelte.ts` (`src/lib/bag-state.svelte.ts`).
- The name of a Netlify Function is its address (`netlify/functions/add-game.ts` answers on `/.netlify/functions/add-game`, or on the path its `config` gives): name it after the action, in kebab-case.
- Standard names keep their conventional form (e.g. `README.md`, `CLAUDE.md`, `package.json`, `netlify.toml`, `vite.config.ts`, `svelte.config.js`).
- File and directory names must be in English.
- Repositories are named `<languages>-<frameworks>-<name>` in kebab-case: the languages first, the main one first, then the frameworks, the one that defines the kind of project first (`ts-svelte-idealan`, `rust-repositories-cleaner`, `rust-ts-stepwise`, `rust-ts-tauri-svelte-<name>`). The host stays out of the name. A template ends with the kind of project it makes, then `-template` (`ts-svelte-dynamic-website-template`, `rust-cli-template`).

## Language

- Everything in the project (code, identifiers, comments, documentation, commit messages) must be written in English.
- Exception: the texts of the interface (labels, messages, errors, metadata) are written in French. They live in `src/i18n/fr.json`, never hard-coded in the components or the functions, so that a translation can be added later; a function answers with an error code that the interface turns into a French message.
- Exception: the code review notes in `outputs/` are written in French.
- French content follows French typography: a non-breaking space before `?`, `!`, `:`, `;` and inside « », the typographic apostrophe (’), and correct accents and capitals (e.g. « À propos »), even on capitals.

## Specifications and roadmap

- Before writing code, describe the expected behavior of the application in `specs.md`, then split the work into steps in `roadmap.md`, and write the technical choices and their reasons in `docs/technical-choices.md`.
- At the start of each session, read `roadmap.md` to know the progress; when asked to continue, resume at the first unchecked step.
- At the start of each step, before writing any code, say which tools of `process.md` the change needs and why (Size a change); when a step turns out larger than sized, stop and size it again with the owner. Judge also whether splitting it into sub-steps (2a, 2b…) helps, and how finely: the split must be an advantage, never a burden. A sub-step is one pull request with one coherent change that can be reviewed in one pass and tested on its own, without leaving the application broken in between; a small step stays whole, since each pull request also costs a review, the checks and an archive. Propose the split to the owner, then write it in `roadmap.md`.
- Each step is delivered in its own pull request, which checks the step's box in `roadmap.md`.
- Keep `roadmap.md` consistent with `specs.md` when the specifications change.
- Keep `roadmap.md` short, since it is read at every session: the steps to come in detail, one line per step done with its pull requests. When the pull request of a step (or of a sub-step) is merged, move the detail of the step to `docs/roadmap-archive.md`. Reference notes (technical choices, branding, external services) live in `docs/`, linked from `roadmap.md`, and are read only by the steps that need them.
- When an idea, a small touch or an edge case comes up that is not part of the current step, add it to `backlog.md` (process.md, The backlog), with its kind, what it depends on and the date, rather than keeping it only in the memory. Read `backlog.md` only when the next work is chosen: when no step is left in `roadmap.md`, or at the end of a cycle, propose the next items to the owner with their cost and dependencies.
- Read `specs.md` by section: list its headings first (`grep -n '^#' specs.md`), then read only the sections the step needs.
- When the pull request of a step (or of a sub-step) is merged, tell the owner that the step is done and remind them to start a new session for the next step by typing `/clear` (give them the command): a fresh session costs far fewer tokens, and `roadmap.md` and the memory hold what is needed to resume.

## Connectors

- The claude.ai connectors (Claude Docs and the others) are turned off for the project in `.claude/settings.json` (`disableClaudeAiConnectors`): their instructions and tools would be sent with every message. Remove the setting only if the project needs one of them.
- The skills a project doesn't use (documents, slides, spreadsheets, browsers, charts, Claude API…) are hidden from the model in the same file (`skillOverrides`, `user-invocable-only`): their descriptions would be sent with every message. The owner can still run them with `/<name>`; to give one back to the model, remove its line or use `/skills`.
- The skills of the project live in `.claude/skills/`, copied into every project from the template, never shared from `~/.claude/skills`: each project has one source of truth. A lesson that improves a skill goes back to the template too.

## Working folders

Two folders are the exchange area between the owner and Claude Code. They are ignored by Git, except their `.gitkeep`, and hold only temporary files.

- `inputs/`: what the owner gives for context: screenshots, examples, references, copied texts, examples of Steam links or answers. Read them when the owner points to them; never commit, move or delete them unless asked.
- `outputs/`: what Claude Code produces for the owner: reports, code review notes, screenshots to compare styles. Name them `<YYYY-MM-DD>-<subject>.<ext>` when they are meant to be kept for a while. Claude Code's own checks (wireframe previews, test screenshots) stay in its scratchpad, never in `outputs/`, so that the owner doesn't take them for the deliverable.
- Anything meant to last goes elsewhere and is committed: documentation in `docs/`, the images of the application in `src/assets/`, the texts in `src/i18n/`, test data next to the tests.

## Process

- Follow `process.md`: the first cycle runs every tool in order (specifications, structure, wireframes, mock-up, design system, build, launch, retrospective); after it, each change runs only the tools it needs, picked from the backlog into the roadmap. At the retrospective of a cycle, sort the backlog, and move to `CLAUDE.md` or `process.md` the rules of the memory that hold for the whole project.
- An urgent fix jumps the roadmap (a `fix/` branch from `main`, its check, a pull request at once, then one line in `roadmap.md`). An idea that needs trying before deciding is an exploration: a branch `explore/<short-description>` that is never merged as it is, bounded by the question it must answer, and ended by its result written down (a decision in `docs/`, a backlog entry or a roadmap step).
- Sketch any question of structure (the screens and how one goes from one to the other, the data kept in the bag) as an editable Excalidraw drawing, with the current state and two leads side by side, before writing it in `specs.md`.
- For each screen, start with editable Excalidraw wireframes in `docs/wireframes/` (grayscale, one group per block; `excalidraw-wireframes` skill), and build the HTML mock-up only once the owner has approved the layout (`html-mockups` skill).
- During the specifications, check the documentation, limits and terms of use of every external service (Netlify, its Functions and Blobs, the Steam Store and its images), and record its limits and the risks the owner accepts, with their date, in `docs/external-services.md`, linked from `roadmap.md`.
- For the mock-up, compare 3 or 4 styles that explore new directions for this application, from sober to spectacular: the owner decides by seeing, and a variant set aside is not wasted. `design-journal.md` records the past design experiences: use it as a source of ideas for one style at most, never as default rules. Give each open decision its own tab group on the mock-up page, and remove it once decided. A new section of the mock-up goes at the top of the page; past ten sections, a table of contents under the header links to each.
- Each time the mock-up changes, give the owner its link at once, served: `python3 docs/mockups/serve.py <port>` (no cache), on the port of this project written in `docs/technical-choices.md` (Commands), kept running in the background; check that the page answers with the change, and give `http://127.0.0.1:<port>/docs/mockups/<name>.html` with the section to look at. Never a `file://` path: a sandboxed browser may not open it.
- A test that needs extra code (a delay, a simulated click) runs on a copy of the page, never on the file the owner has open. Stop the helper processes by their PID, never with `pkill -f` and a pattern that also matches Claude Code's own command.
- Every design decision settled with the owner goes into `docs/branding.md`, in the same commit as the change, and the options set aside into its « Set aside » list.
- When a deliverable is handed to the owner to look at (a drawing, the mock-up, a preview), wait for their approval before writing it into `specs.md` or opening the pull request: « let's go » is not an approval of something they haven't seen yet.

## Git workflow

- Never commit or push directly to `main`.
- For each task, create a dedicated branch from `main`, commit and push only on that branch.
- Every change must go through a pull request targeting `main`.
- Each time a pull request is opened or updated, give the owner its full link (`https://github.com/<owner>/<repository>/pull/<number>`), not only its number.
- Merge pull requests with **Squash and merge** only, so that each pull request becomes one commit on `main`, titled in Conventional Commits. The repository allows only squash merging and deletes the branch once merged; check these settings on every new repository (`gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge`).
- Keep only one pull request open at a time: open the next one once the previous one is merged. Two open pull requests often edit the same files (`roadmap.md`, `docs/`), and the second one conflicts once the first is merged. If urgent work comes up meanwhile, prepare its branch and push it, then open its pull request once the open one is merged.
- When several pull requests are open anyway, resolve their conflicts before the owner sees them: as soon as the owner says a pull request is merged, rebase the others on `main` (`git rebase origin/main`, then `git push --force-with-lease`), run the checks again, and tell the owner when each one is ready to merge.
- Name branches `<type>/<short-description>` in kebab-case, using the commit types below (e.g. `feat/paste-steam-link`, `fix/duplicate-game`), or `explore/` for an exploration.
- Work on the branch in the main project folder, which the owner has open in VS Code: a worktree outside it is invisible to them. Only when the owner may be testing another branch there (for example with `npm run dev`), ask, and if so work in a separate Git worktree outside the project (`git worktree add <directory> -b <branch> origin/main`), give its exact path, and remove it with `git worktree remove <directory>` once the work is pushed.

## Commit messages

Follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Pull request titles use the same format.

```
<type>(<optional scope>): <description>

<optional body: what and why>

<optional footer>
```

| Type | Use for |
|---|---|
| `feat` | A new screen or feature for the friends. |
| `fix` | A bug fix (a link not read, a layout issue, a wrong message). |
| `docs` | Documentation only (`README.md`, `specs.md`, `roadmap.md`, `CLAUDE.md`, the mock-up). |
| `content` | Interface texts only (`src/i18n/fr.json`). |
| `style` | Formatting with no behavior change. |
| `refactor` | A change that neither fixes a bug nor adds a feature. |
| `perf` | A performance improvement (loading, number of calls to Steam). |
| `test` | Adding or fixing tests or checks only. |
| `build` | Build system or dependencies (`package.json`, lock file, Vite, Svelte and Netlify config). |
| `ci` | CI and deployment configuration (`.github/`). |
| `chore` | Other maintenance (tooling, `.gitignore`, Claude Code agents and skills). |
| `revert` | Reverting a previous commit. |

- Scope: optional, the page or area concerned (e.g. `feat(bag): ...`, `fix(steam): ...`).
- Description: imperative mood, lowercase, no final period, 72 characters max (e.g. `feat(bag): add a game from its Steam link`).
- Breaking change: add `!` after the type or scope (e.g. `feat(bag)!: ...`) and explain it in a `BREAKING CHANGE:` footer. Changing the shape of the stored data, which needs a migration of the bag, is a breaking change.

## Code review

- Before opening any pull request that changes code or its build (components, styles, functions, scripts, Vite, Svelte or Netlify config, dependencies, `.github/workflows/`), run the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`) on the branch. A pull request that only changes interface texts or documentation doesn't need it.
- It writes its recommendations, in French, to `outputs/<YYYY-MM-DD>-<branch>-code-review.md`. These notes are ignored by Git.
- Summarize the recommendations to the owner, apply only the ones they approve, then open the pull request: never before the owner has chosen.
- When the owner asks to look at the Dependabot pull requests (the dependency updates, `.github/dependabot.yml`), run the `dependency-reviewer` subagent (`.claude/agents/dependency-reviewer.md`): it writes, in French, to `outputs/<YYYY-MM-DD>-dependency-review.md`, a recommendation for each one, with its link and the comment to post. Give the owner its summary table; never merge, close or comment a Dependabot pull request yourself unless the owner asks.

## Development

- The commands to run, build and check the application are listed in `docs/technical-choices.md` (Commands) and in the README; they are set up in step 0 of `roadmap.md`.
- `netlify dev` runs the interface and the functions together, with the environment variables of the Netlify site or of a local `.env` (ignored by Git; `.env.example` lists the variables, without their values).
- Before committing, make sure `npm run check` passes: the formatter (Prettier), the linters (ESLint, `svelte-check`, Stylelint), the tests (Vitest), the production build without errors or warnings, and the width of the screens on a phone (as `scripts/check-overflow.mjs` of the web template).
- The same checks run in CI (`.github/workflows/ci.yml`) on every pull request.
- When a bug reaches the owner that a test or a check could have caught, add it in the same pull request as the fix.
- Svelte 5 only, with the runes (`$state`, `$derived`, `$props`, `$effect`): never the syntax of Svelte 4 (`export let`, `$:`, stores for the local state), which still fills the examples on the web.
- The functions treat everything they receive as untrusted: they check the access code first, validate every field (an `appid` is a positive integer), and never pass a value from the request into an address without checking it.
- The calls to Steam go through the functions only (the browser can't call the Steam Store: no CORS), and their answers are cached in Netlify Blobs, so that a game is asked to Steam once, not at every visit.
- Every screen has a title, a language (`lang="fr"`) and is usable at phone width. Images have an `alt` text; the covers come from the Steam CDN, with a fallback when one is missing.
- Accessibility: semantic HTML, sufficient contrast (WCAG AA), every action reachable with the keyboard with a visible focus, and nothing that moves when the friend asked their system to reduce motion.

## Deployment

- Netlify deploys the application on every push to `main`, i.e. when a pull request is merged, and gives every pull request a deploy preview: GitHub Actions only checks, it doesn't deploy.
- The site keeps its `netlify.app` address (`idealan.netlify.app` if the name is free); never set a custom domain of the owner.
- The environment variables (the access code, later a Steam key) are set in the Netlify site settings by the owner; never print their values, in the code, the logs or the conversation.
- Never enter a payment method or change the plan of the Netlify account: the free plan pauses the site instead of charging it when a limit is reached.
