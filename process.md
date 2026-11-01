# Process

How a web application goes from an idea to a site online, then keeps growing, with Claude Code. It follows the process of [ts-astro-static-website-template](https://github.com/aunimhsn/ts-astro-static-website-template/blob/main/process.md) and [rust-cli-template](https://github.com/aunimhsn/rust-cli-template/blob/main/process.md), adapted to a dynamic application on Netlify: the release becomes the launch on Netlify, and the friends are the users. At the retrospective of the first cycle, this project becomes the template `ts-svelte-dynamic-website-template` (see `backlog.md`).

The process is not a straight line. Its phases are **tools**, picked for each change according to what it needs: a text goes straight to the build, a new screen goes through its wireframe and mock-up first. What is not being done lives in a **backlog**; what is chosen goes to the **roadmap**, one pull request per step. Each tool ends with something the owner validates, from the cheapest to the most expensive: changing a sentence in the specifications costs less than changing a wireframe, which costs less than changing code.

This file is a living document: update it with what worked and what didn't (see [Retrospective](#retrospective)), and bring back to the templates the lessons that apply to every project.

![The process: the backlog feeds the roadmap; each change goes through the tools it needs to a pull request; a cycle ends with the launch and the retrospective, whose leftovers go back to the backlog.](docs/process.svg)

## How it works

1. **Start a project** from the template, and size it with the owner: which tools this project uses, and how far (see [Size the project](#size-the-project)).
2. **The first cycle** takes the site to its launch, through every tool in order: specifications, structure, wireframes, mock-up, design system, build, launch, retrospective.
3. **Then the loop**: with the owner, pick from the [backlog](#the-backlog) what comes next, write it in `roadmap.md` as steps, size each change and split it into sub-steps when it helps ([Size a change](#size-a-change)), and run only the tools it needs. A group of steps with a goal (« random draw and games outside Steam ») is a **cycle**: it ends with its retrospective, and with a launch when it changes the stored data or the address.
4. **Outside the roadmap**, two kinds of work: an [urgent fix](#urgent-fixes) that can't wait, and an [exploration](#explorations) that tries an idea before deciding.

## Size the project

At the setup, Claude Code asks how large the project is and proposes the tools and their depth; the owner decides, and the choice is written at the top of `roadmap.md`. The template is made for a full site; a smaller one skips what it doesn't need without breaking a rule.

| Project | Tools |
|---|---|
| One screen (a list, a form) | Short specifications, one wireframe, 2 styles in the mock-up, tokens written straight into the styles, build, launch. |
| A small application of a few screens (the usual case, as idealan) | Every tool, in order, for the first cycle. |
| An application with accounts or a lot of data | Every tool, with the structure and the data model first, and a database instead of a key-value store. |

## Size a change

At the start of each step, Claude Code says which tools the change needs, and why; the owner may add or remove one.

| Change | Tools |
|---|---|
| A text, a fix, a dependency | Build. |
| A visual touch, a new component | Mock-up (a tab group to compare), then build; the decision in `docs/branding.md`. |
| A new action on an existing screen (a vote, a filter) | Specifications, then build. |
| A new screen | Specifications, wireframe, mock-up, build. |
| A new kind of stored data, a new external service | Specifications and structure first (the data, its migration, the service checked in `docs/external-services.md`), then the tools of the screens it touches. |
| A new application, a redesign | Every tool, in order. |

Only when it helps, a step is split into sub-steps, one pull request each, each one coherent and tested on its own: a step that needs several tools, or more than one review (on sylent.art, the classification of the offers became 13a (specifications), 13b (wireframe and mock-up) and 13c (build)). A small step stays whole, since each pull request also costs a review, the checks and an archive.
When a step turns out larger than sized (a text change that questions the data), stop and size it again with the owner rather than stretching the pull request.

## The backlog

`backlog.md` holds everything noted and not being done: an evolving list, read when the next work is chosen, not at every session (`roadmap.md` stays short).

- **What goes in**: the touches set aside during a step (polish), the edge cases that need thought, the features for later, the large works, and what waits on someone else (the friends' feedback after the LAN).
- **One entry per item**: what it is in one sentence, its kind (polish, edge case, feature, large work, waiting), what it depends on, and the date it was noted. Claude Code adds an entry as soon as an idea comes up outside the current step, rather than keeping it only in its memory.
- **From the backlog to the roadmap**: when the roadmap has no step left, or at the end of a cycle, Claude Code proposes the next items with their cost and dependencies; the owner picks; the chosen items leave the backlog and become steps of `roadmap.md`.
- **Polish**: after a launch, a series of small touches from the backlog, one small pull request each, is often worth doing before anything new.
- At each retrospective, the backlog is sorted: what is done or no longer wanted leaves it.

## Urgent fixes

A fix that can't wait (the bag lost or overwritten, a security alert, a function that writes without the access code) jumps the roadmap:

1. Branch `fix/<short-description>` from `main`, even while a step is in progress (prepare it in a worktree if the owner is testing the step in the main folder).
2. The fix, the check that would have caught it, the code review if it changes code, a pull request opened at once.
3. Once merged, one line in `roadmap.md`, under the step in progress, and the step goes on (rebased on `main`).

## Explorations

An idea that needs trying before deciding (an animation of the random draw, the vertical covers of the Steam CDN, a new library) is an exploration, not a step. It happens at any time: during a step, when a choice needs trying before it is made (on sylent.art, whether a 3D scene runs on a phone, during the mock-up); or between steps, from an idea of the backlog (the launch videos).

1. A branch `explore/<short-description>`, or a page in the scratchpad: nothing of it is merged as it is.
2. Bounded: the owner and Claude Code agree on what it must answer (« does the vertical cover exist for most of the games of the bag? »).
3. It ends with its result written down: during a step, the decision goes back to the step (and to `docs/`); otherwise a decision in `docs/` (kept or set aside, and why), an entry of the backlog, or a step of the roadmap that rebuilds it properly. The branch is then deleted, or kept with a line in the backlog that says why.

## The tools

| Tool | Use it when | Output | Done when |
|---|---|---|---|
| [Start a project](#start-a-project) | Once, at the start | The repository from the template, its settings, the size of the project | `main` is protected and the setup pull request is merged. |
| [Specifications](#specifications) | The application does something new | `specs.md`, the external services | The owner has answered the open questions and merged them. |
| [Structure](#structure) | The screens or the stored data change | The screens and the data in Excalidraw, written in `specs.md` | The owner has moved the cards and chosen a lead. |
| [Wireframes](#wireframes) | A new screen, a new layout | `docs/wireframes/*.excalidraw` | The owner has edited and approved the layout. |
| [Mock-up](#mock-up) | Any visual choice | `docs/mockups/*.html` | Every screen and state looks right at every width, on the owner's phone too. |
| [Design system](#design-system) | At the end of a mock-up, a new token | Tokens and decisions in `docs/branding.md` | Colors, sizes and typography are written as tokens. |
| [Build](#build) | Always | One pull request per step | The step's box of `roadmap.md` is checked. |
| [Launch](#launch) | The first cycle, a change of the stored data | The application on its `netlify.app` address, the link sent to the friends | The owner has checked it on a phone and the friends have the link and the code. |
| [Retrospective](#retrospective) | The end of a cycle, or a phase that went badly | Changes to this file, the templates and the backlog | The lessons are written down. |

## Start a project

1. Create the repository from the template (see the README, **Start a new project**).
2. Apply the pull request settings: squash merging only, branches deleted once merged.
3. Protect `main` with a ruleset. On a free GitHub account, rulesets only apply to **public** repositories.
4. Size the project with the owner ([Size the project](#size-the-project)), and write the tools kept at the top of `roadmap.md`, with the steps of the first cycle.
5. Setup pull request: the skeleton of the application (Vite, Svelte 5, TypeScript, one Netlify Function, the checks, CI, Dependabot), the **Project** section of `CLAUDE.md`, the name in `package.json` and `src/i18n/fr.json`, a port of its own for the mock-up server in `docs/technical-choices.md` (Commands), the size of the project in `roadmap.md`; then the Netlify site linked to the repository by the owner.
6. Open Claude Code in the project folder. Its memory is stored per project: a new session doesn't remember a conversation held in another project. To carry context over, paste a summary of it.
7. Check the connectors: `.claude/settings.json` turns off the claude.ai connectors (`disableClaudeAiConnectors`), whose instructions and tools would be sent with every message. If the project needs one, remove the setting; `/mcp` lists the servers that are on, and `/context` what fills the context. In the same file, `skillOverrides` hides from the model the skills the project doesn't use (still available with `/<name>`): adjust the list, or use `/skills`. The skills of the project are in `.claude/skills/`, copied from the template.

## Specifications

Goal: agree on **what** the application does before deciding **how**. For a change after the first cycle, only the sections it touches.

1. Describe the idea in a few sentences, then let Claude Code ask its questions, in batches of a few at a time. The usual ones for a small application:
   - Who uses it, on which devices (a phone the evening before, a big screen at the LAN), and how comfortable with tech?
   - What is in version 1, and what comes later? What must be easy to add later?
   - What does each screen show, what does each action do, and what happens when two people act at once?
   - Which data is kept, where, for how long, and who may change or delete it?
   - Which external services, with which limits, and what happens when one doesn't answer?
2. **Ask for the brand assets** only if the application has some (a name, a logo, a favicon), and record in `docs/branding.md` what is given and what is missing.
3. **Check the external services early** (Netlify and its free plan, Functions and Blobs; the Steam Store and its images): documentation, limits, terms of use, personal data, licenses of the images and fonts. Record the limits and every risk the owner accepts, with its date, in `docs/external-services.md`.
4. Write `specs.md`: behavior and content only (what the friend sees, what each action does, the stored data, edge cases, errors).
5. Confirm or adapt the technical choices of `docs/technical-choices.md`, with their reasons (and the alternatives rejected), then write the steps in `roadmap.md`, each small enough for one pull request. Choose only what the specifications need: the JavaScript libraries and the weight of script a page may carry wait for the mock-up (on sylent.art, « no JavaScript » was written before the mock-up and replaced after it by GSAP and Three.js).
6. Open the pull request; the owner reads the files on GitHub (**Files changed**) or in VS Code.

## Structure

Goal: agree on the screens, how one goes from one to the other, and the data they keep, before drawing them. On sylent.art, the classification of the offers came after the build: the URLs changed twice and the offer pages were rebuilt.

1. Claude Code draws the structure in Excalidraw (`excalidraw-wireframes` skill): one card per screen or per kind of data (a game of the bag, a vote, the cached Steam answer), with the current state and **two leads** side by side, a parking area for the items not placed yet and the open questions, one group per item so that the owner moves the cards by hand.
2. The owner moves the cards, compares the leads, and chooses; Claude Code redraws the chosen lead, completed.
3. The data follows from it: write in `specs.md` what each key of Netlify Blobs holds, who writes it, and what happens when two friends write at once.

## Wireframes

Goal: agree on the **layout** of each screen, without colors or code, in a format the owner can edit.

The `excalidraw-wireframes` skill carries out this phase: its Python helpers write the file and preview it.

1. Claude Code generates an Excalidraw file in `docs/wireframes/`: grayscale, real content from the specifications, one frame per screen and width, **one group per block** so that a block moves in one click (double-click a block to edit one of its elements, **Ctrl+Shift+G** to ungroup it).
2. It checks the result with a preview, kept in its scratchpad, before handing over the `.excalidraw` file.
3. The owner edits it in VS Code with the **Excalidraw** extension (`pomdtr.excalidraw-editor`), or on excalidraw.com (**Open**, then **Save to…**).
4. Iterate: the owner draws their version, Claude Code rearranges it and fills the gaps, the owner draws the next version, and so on. Claude Code commits the owner's version before changing it, so that every iteration stays in the history.
5. Once the main frames are agreed, Claude Code draws the rest under them: other kinds of content, the empty bag, a link being read, a wrong link, a wrong access code, Steam not answering, the bag on a big screen at the LAN.
6. Claude Code writes the agreed layout in `specs.md`.

Start with the phone width (mobile first): it forces to choose the essential, and the wider layouts then only rearrange the same blocks.

Working with the file:

- The VS Code extension does **not** save by itself, unlike excalidraw.com: press **Ctrl+S** before asking Claude Code to read the file.
- The extension keeps the drawing in memory and doesn't reload the file when it changes on disk. Before Claude Code rewrites the file, save and close its tab; afterwards, reopen it, and never save the old tab over the new file.

## Mock-up

Goal: choose the style with real content, every screen and every state, before building the application.

The `html-mockups` skill carries out this phase, from a starting page with the style and decision tabs, a server without cache and a headless screenshot script.

1. HTML pages in `docs/mockups/`, built from the approved wireframes, with the real content. Once the application has several screens, one page per screen, with the shared styles and scripts in `docs/mockups/shared/`, shown in a viewer (phone and desktop frames side by side).
2. **Several styles, 3 or 4**, each with its own fonts, colors and density, switched with **tabs at the top of the page**, from sober to spectacular. The address keeps the chosen style (e.g. `?theme=slate`) to share it. Each style only sets tokens (CSS variables); the components use them all, so that a style is cheap to add or tweak.
   - **Start from a scale of tokens** (spacing in steps of 4 px, one size per typographic role, a few breakpoints), even rough: raw values multiply during the iterations, and rounding them at the end shifts lines of text.
   - The styles explore **new directions** for this application and its users. [design-journal.md](design-journal.md) records the past experiences: it may inspire one of the styles, never all of them, and nothing in it is a default.
3. The owner picks a style, or mixes two; iterate on it alone, one change at a time (e.g. the main color, then the logo, then the font).
   - **Each open decision gets its own group of tabs** on the page, so that the owner compares on screen; once decided, the tab is removed, the choice is kept, and the decision is written in `docs/branding.md`.
   - **Pixel alignments are tuned by eye on the owner's real screen**, with a tab of offsets: the display scale differs from the headless screenshots, which only give the direction.
   - **Check the mock-up on the owner's phone** before approving it: on sylent.art, most of the feedback on the built site came from the phone (a page wider than the screen on Android, titles on two lines); here, the friends add their games from their phone.
   - From then on, **the mock-up is the reference** of the interface; the wireframe only fixed the first layout, and is removed with the pull request of the mock-up (the Git history keeps it).
4. Use web fonts whose license allows self-hosting (e.g. SIL Open Font License). Preload the font files, so that the page, and its screenshots, only finish loading once the fonts are there.
5. Serve the repository root without cache, on the port of the project (written in `docs/technical-choices.md`, Commands), so that the page reaches the images of the repository, even in a sandboxed browser (Flatpak, Snap), and a reload never mixes old and new files:

   ```sh
   python3 docs/mockups/serve.py <port>
   ```

   then open `http://127.0.0.1:<port>/docs/mockups/<file>.html`, and reload after each change.
6. Claude Code checks its own changes with headless screenshots before asking for a review, and exports one large PNG per style to `outputs/` to compare them at a glance. A test that needs extra code runs on a copy of the page, never on the file the owner has open.

## Design system

Goal: write down the visual choices once, so that every screen stays consistent.

Write them in `docs/branding.md`, as named tokens, next to the decisions they come from:

- **Colors**: background, surfaces, borders, text, weak text, accent, link, focus, error, success; contrast checked against WCAG AA.
- **Sizes**: a spacing scale (e.g. 4, 8, 12, 16, 24 px), corner radius, content width, breakpoints.
- **Typography**: fonts, sizes per role (headline, title, body, caption), weights, line heights.
- **Images**: where they come from, their license, their format and sizes (the Steam covers at the size shown, their fallback).
- **Tone of the texts**: « vous » or « tu » for the friends, length, how the calls to action and the errors are worded.

The mock-up is then updated to use exactly these tokens, compared with screenshots taken before the rewrite to see which shifts matter; its `:root` becomes the tokens file of the application. At the end of the phase, add an entry to [design-journal.md](design-journal.md), here and in the template: the choices kept, the ones rejected, and why.

## Build

The first build step (step 0 of `roadmap.md`) sets up the skeleton: Vite, Svelte 5 and TypeScript, one Netlify Function, the checks, CI and Dependabot, then the owner links the Netlify site to the repository. A later build step adapts it to the mock-up (tokens, fonts).

For each step of `roadmap.md`, in order:

1. Branch `<type>/<short-description>` from `main`. If the owner isn't testing anything, work in the main folder so that they can follow the changes in VS Code; otherwise, in a Git worktree outside the project.
2. Code, with the tests; then run `npm run check`: formatter, linters, tests, production build without errors or warnings, width of every screen on a phone.
3. Run the `code-reviewer` subagent: its notes, in French, go to `outputs/`. Claude Code summarizes them; the owner chooses which to apply.
4. Commit (Conventional Commits), push, open the pull request; it checks the step's box in `roadmap.md`. Netlify builds its deploy preview.
5. The CI passes; the owner tries the deploy preview, reviews and squash merges; `git pull` on `main`. The merge deploys the application.
6. When a step changes the behavior or the stored data, update `specs.md` and `roadmap.md` in the same pull request.

The owner tries the deploy preview on their phone after each screen step, rather than all the screens at the end. When a bug reaches the owner that a test or a check could have caught, the fix adds it.

## Launch

1. The owner checks every screen on the `netlify.app` address, at phone width and on the screen used at the LAN.
2. The access code is set in the Netlify environment variables, and the old values of the tests are removed from the bag.
3. The owner sends the link and the access code to the friends, in their group conversation, never in the repository.
4. On the day of the LAN, the owner opens the page; afterwards, the friends' feedback goes to the backlog.

## Retrospective

At the end of each cycle (the first one ends with the LAN itself), or after any tool that went badly:

1. What took longer than expected? What had to be redone? What did the owner like most?
2. Sort the backlog: the leftovers and the ideas of the cycle go in, what is done or no longer wanted goes out.
3. Read Claude Code's memory of the project: a rule or a preference that holds for the whole project moves to `CLAUDE.md` or this file, where the next sessions and the templates find it.
4. Update this file, and the template (`CLAUDE.md`, `process.md`, the skills, the skeleton) when the lesson applies to every project: at the end of the first cycle, the template `ts-svelte-dynamic-website-template` is made from this project.

## Lessons learned

The lessons of the previous projects:

| Project | Lesson |
|---|---|
| rust-exile-market | Coded mock-ups were never exactly what the owner wanted: start with editable wireframes. |
| rust-exile-market | Read the terms of use of every data source during the specifications: a forbidden API changes the scope of version 1. |
| rust-exile-market | A Flatpak browser only receives the opened file: serve the repository with a local server. |
| rust-exile-market | On a free GitHub account, rulesets only protect public repositories. |
| rust-exile-market | The owner draws, Claude Code rearranges and completes: the wireframe iterations made the interface personal. |
| rust-exile-market | The VS Code Excalidraw extension neither autosaves nor reloads a file changed on disk: save, close, reopen. |
| rust-exile-market | Mock-ups got much better once the layout was settled: one question per phase (layout, then style). |
| rust-exile-market | Three styles on one page with tabs made the choice easy. |
| rust-exile-market | One tab group per open decision, removed once decided, turned about a hundred small decisions into quick on-screen comparisons. |
| rust-exile-market | Pixel offsets measured on headless screenshots were wrong on the owner's scaled screen: tune them by eye with a tab of values. |
| sylent.art | Mock-up as the reference: the build of a page mostly copied it, and the tokens of the mock-up became `tokens.css` as is. |
| sylent.art | The content tree came after the build: the URLs changed twice and the offer pages were rebuilt. Draw it in Excalidraw during the specifications. |
| sylent.art | Excalidraw also serves to sort content (a tree of offers, cards moved by hand), not only to lay out pages. |
| sylent.art | Bold variants (Three.js line-art scenes) showed the owner what they wanted: they couldn't have said « sober or spectacular » before seeing them. |
| sylent.art | Most feedback on the preview came from the phone: check the mock-up on a real phone, and the width of every page in CI from the first step. |
| sylent.art | A choice written before the mock-up (« no JavaScript ») was replaced once the mock-up was approved: choose the scripts after it. |
| sylent.art | The checks born from a bug (former URLs, page wider than the phone, title on two lines) kept it from coming back. |
| sylent.art | A worktree outside the folder open in VS Code is invisible to the owner: work on the branch in the main folder while they test nothing there. |
| sylent.art | Open a pull request only once the owner has seen the result (the review applied, the schema looked at). |
| sylent.art | Two mock-up servers of two projects on the same port broke the owner's page: one port per project, a server without cache. |
| sylent.art | The classification of the offers ran as a mini-cycle of its own (specifications, then wireframe and mock-up, then build): the unit of the process is the change, not the project. |
| sylent.art | Ideas kept only in Claude Code's memory are easily lost between sessions, and some wait on other people: a `backlog.md` holds them, and the roadmap only what is chosen. |
