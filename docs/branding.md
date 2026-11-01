# Branding

The visual identity of the application: the few brand assets, then every design decision settled with the owner during the mock-up, with its tokens. Each decision is written here in the same commit as the change; the options set aside go to [Set aside](#set-aside).

## Brand assets

The application has no brand of its own yet: the covers of the Steam games are its main material. What the mock-up may need:

| Asset | Format | File | Status |
|---|---|---|---|
| Name shown in the interface (« Idealan »?) | Text | `src/i18n/fr.json` | To confirm |
| Square icon, readable at 16 px, for the favicon | SVG | the « Bloc évidé » of the mock-up (`LOGOS.tile` in `docs/mockups/shared/app.js`) | Chosen on 2026-11-01 |
| The signature of the footer: the mark of Sylent and its wordmark | SVG and PNG | `docs/mockups/assets/sylent-mark.svg` (from sylent.art), `docs/mockups/assets/sylent-wordmark.png` (from `assets/logo-text.png` of sylent-courses, cropped to its ink) | Chosen on 2026-11-01 |
| Fonts, with their license (self-hosting allowed) | WOFF2 | Chakra Petch, Manrope, Montserrat (SIL Open Font License): from Google Fonts in the mock-up, self-hosted by the application in `src/assets/fonts/` (the Latin subset, with their licenses; step 6b) | Chosen on 2026-11-01 |

## Principles

<!-- Three to five sentences: what the application must convey, for whom, and the main rule of the style. -->

Chosen by the owner on 2026-11-01 among four styles of the family of sylent.art, with the blue instead of its orange: **D · Néon**, the style that « raises the temperature ».

1. **The room of a LAN at night**: near-black backgrounds, a grid floor that runs to the horizon, scanlines, the title and the logo that glow.
2. **The covers of the games are the material**: chamfered at their top right corner, they carry the colors; the interface around them stays in blue and white.
3. **Blue is the light of the room**: unlike sylent.art, where the signal color is rare, the electric blue lights the main buttons, the borders and the glows; the friend's own vote and the active filters fill with it.
4. **It moves, but never for a friend who asked to reduce motion**: the floor runs, the cards tilt under the pointer, the score jumps when voting; all of it stops with `prefers-reduced-motion`.

## Tokens

Written in step 4 (design system), on 2026-11-01: [`src/styles/tokens.css`](../src/styles/tokens.css) holds every token with a short comment. It was the tokens file of the mock-up and became the tokens file of the application as it is in step 6b; the mock-up now reads it from there, so that both share one source, and its CSS uses nothing else. The sections below give each group and its reasons.

- Every length, color, shadow, duration, layer, weight, line height and letter spacing is a token; the ratios proper to one component (a percentage, a viewport share, an angle, a scale factor, an opacity) stay in it.
- A token says its role (`--size-caption`, `--layer-toast`), not its value, so that a value changes in one place.
- One breakpoint, 900 px (phone below, PC from it), written as a number in the media queries (`width >= 900px`), since a variable can't be used there; a few tokens change from it (`--size-card-title`, `--watermark`, `--footer-height`).

## Logo

<!-- Which variant where (header, footer, favicon, card), the minimum size, the clear space. -->

- The symbol: an RJ45 jack (the plug of a LAN) cut out of a white square, its four contacts in the blue signal (« Bloc évidé »), chosen on 2026-11-01 among six symbols, then among four drawings of the jack: a solid square reads best at 16 px.
- Beside the name « Idealan », glowing in blue, in the header (symbol 28 px) and above the title of the welcome (symbol 72 px).
- The footer signs with the wordmark « SYLENT » of sylent-courses alone (its letters joined, not the one of sylent.art), in the color of the text, linked to sylent.art; behind the footer, the mark of Sylent (the three bars) as a large faint watermark (230 px high on a phone, 280 px on a PC, 6 % opacity, centered then 35 px lower, cut by the bottom of the page). Both chosen by the owner on 2026-11-01, after « Fait par Sylent », then the mark beside the wordmark.
- « Idealan » is written in Montserrat 800 (the font of the wordmark of Sylent, SIL Open Font License), uppercase, its letters tightened by −0.02 em (`--tracking-brand`): −2 px at the 96 px of the board of the logo, chosen by the owner on 2026-11-01 among −5 to 0 px (first −1 to +1 px); in em, so that it holds at every size (about −0.5 px in the header).

## Colors

<!-- One line per token: name, value, use, contrast checked against WCAG AA. -->

The electric blue `#2e6bff`, chosen on 2026-11-01 among six blues, lights the room; neutral blacks with a blue tint around it. Contrasts measured on `--bg` (`#04050a`) with the formula of WCAG 2.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--signal` | `#2e6bff` | The electric blue: main buttons, the friend's vote, active filters, the edge of the banner, the glows | 4.5:1 on the background |
| `--on-signal` | `#ffffff` | Text on the blue | 4.5:1 |
| `--signal-text` | `#86a8ff` | The blue for small text on the background: a score the friend voted for, « Jouable à » active | 8.8:1 |
| `--signal-tint` | the blue at 14 % | The background of an active chip and of the banner | |
| `--bg` | `#04050a` | The background of the page | |
| `--header-bg` | `--bg` at 80 % | The header, blurred over the floor | |
| `--surface` | `rgb(10 14 28 / 72%)` | The glass cards, over the floor | |
| `--surface-hover` | `rgb(16 22 44 / 82%)` | A button or a vote under the pointer | |
| `--surface-solid` | `#0a0e1c` | Panels, bubbles, a missing cover | |
| `--field-bg` | `rgb(0 0 0 / 55%)` | The fields | |
| `--overlay` | `rgb(0 0 0 / 62%)` | Behind a panel | |
| `--line` | the blue at 28 % | Separators, the border of a card | 1.3:1 |
| `--line-strong` | the blue at 55 % | The border of the fields, buttons, chips and votes | 2.1:1 (see [Accessibility](#accessibility)) |
| `--text` | `#f2f5ff` | The text | 18.7:1, 17.7:1 on `--surface-solid` |
| `--secondary` | `#a9b1c7` | Second text: labels, the lead, « ajouté par » | 9.5:1 |
| `--dim` | `#8a93ab` | Weak text: tags, notes, placeholders, the footer | 6.6:1, 6.0:1 on `--signal-tint` |
| `--focus` | `--text` | The focus ring, 2 px, offset by 2 px | 18.7:1 |
| `--error-text` | `#ff8f85` | The message under a field, the border of a field at fault | 9.2:1 |
| `--error` | `#8c1626` | The bordeaux of the strip of the errors, chosen by the owner on 2026-11-01 over the first red `#d62839` (« il pique les yeux ») | |
| `--error-bg` | `--error` at 88 % | The strip of the errors, still translucent | white on it 10.6:1, 7.2:1 at worst over white |
| `--on-error` | `#ffffff` | Text and cross on the strip | |
| `--icon-bg`, `--icon-fg` | `#0a0a0a`, `#ffffff` | The square of the favicon | |

There is no success color: a success shows by the change itself (the game appears, the vote fills with the blue).

The light of the room (the glows, the floor and the scanlines) is in [Motion](#motion).

## Typography

<!-- The fonts and their license, one size per role (display, title, body, label), weights, line heights. -->

- `--font-title`: Chakra Petch 700 for the titles, the buttons, the chips, the labels of the fields and the scores, with the style D · Néon.
- `--font-text`: Manrope 500 to 800 for the text, as on sylent.art.
- `--font-brand`: Montserrat 800 for « Idealan » only (see [Logo](#logo)).
- All three under the SIL Open Font License: self-hosted by the application, preloaded.

One size per role:

| Token | Size | Role |
|---|---|---|
| `--size-display` | 40 to 64 px (`clamp`, 9vw) | « Idealan » on the welcome |
| `--size-number` | 32 px | The number of « Jouable à » |
| `--size-brand` | 22 px | « Idealan » in the header |
| `--size-title` | 20 px | The titles of the panels and of the empty bag, the name on a missing cover |
| `--size-score` | 20 px | The score of a game |
| `--size-card-title` | 18 px, 17 px on a PC | The name of a game on its card |
| `--size-body` | 16 px | The text |
| `--size-small` | 14 px | Buttons, messages, the lines of a card on a phone, the Steam link in its field (2 px smaller, asked by the owner on 2026-11-01, accepting that an iPhone zooms when the field is tapped) |
| `--size-caption` | 13 px | Field labels, chips, notes, the lines of a card on a PC, the footer |
| `--size-label` | 12 px | Uppercase labels (« ADMIN », « ONT VOTÉ POUR »), the hint under « Joueurs max » |
| `--size-board` | 96 px | The name on the board of the logo (mock-up only) |

- Weights: `--weight-text` 500, `--weight-semibold` 600 (labels, chips), `--weight-bold` 700 (titles, buttons), `--weight-black` 800 (« Idealan », the score, the count).
- Line heights: `--leading-none` 1 (buttons, scores, one-line titles), `--leading-title` 1.2, `--leading-snug` 1.35 (labels, short lines, messages), `--leading-body` 1.5. Step 4 rounded 1.3 and 1.4 to 1.35: the fields moved by less than 1 px.
- Letter spacing: `--tracking-brand` and `--tracking-title` −0.02 em (« Idealan », the names of the games, the titles of the panels), `--tracking-button` 0.01 em, `--tracking-label` 0.14 em (uppercase labels).

## Spacing

<!-- The scale: --space-N = N × 4 px, and where each common value is used. -->

`--space-N` = N × 4 px: `--space-1` 4 px to `--space-12` 48 px (1, 2, 3, 4, 5, 6, 8, 10, 12). The common uses:

- 16 px (`--space-4`): the gutter of the page on a phone, the gap between the cards on a phone, the inner padding of a bubble.
- 32 px (`--space-8`): the gutter on a PC; 24 px (`--space-6`) between the cards on a PC.
- 12 px (`--space-3`): the gaps inside a block (fields of the adding, the bar, the actions of a panel).
- 8 px (`--space-2`) and 4 px (`--space-1`): between an icon and its text, between the lines of a card.

## Layout and shapes

<!-- Content width, gutters, corner radius, the breakpoints (written as numbers in the media queries). -->

- One page, phone first; from 900 px, the PC layout: the adding on one row, a grid of five covers, panels as windows in the middle instead of sheets from the bottom.
- `--content` 1600 px: the width of the header and of the bag; the welcome is a column of `--width-welcome` 420 px.
- Panels: `--width-dialog` 520 px, the tall ones (settings, emptying) `--width-dialog-tall` 1080 px (at most 90 % of the screen); the bubbles (who voted, « Jouable à ») `--width-bubble` 260 px.
- Touch targets: `--tap` 44 px (fields, buttons, votes on a phone, the cross of the strip), `--tap-small` 36 px (chips, small buttons, votes on a PC).
- Sharp corners everywhere (`--radius` 0): the shape of the style is the chamfer of the covers, `--chamfer` 18 px cut at their top right corner. Exceptions: the handle of a sheet (`--radius-pill`), the square of the favicon rounded by 20 % (`--radius-icon`).
- Borders of `--hairline` 1 px; `--stroke` 2 px for the focus ring, the spinner and the lines of the floor; `--edge` 3 px for the blue edge of the banner.
- Layers, from the back: the floor, the content, the header, the bubble of the votes, « Jouable à », the strip of the errors, the card whose bubble is open, the panels, the scanlines over everything (`--layer-*`).

## Components

<!-- Buttons, cards, form fields, navigation: their states (hover, focus, active, disabled). -->

The CSS of the mock-up ([`docs/mockups/shared/app.css`](mockups/shared/app.css)) is copied into the components of the application.

- **Buttons**: a border `--line-strong`, transparent; under the pointer `--surface-hover`. The main one (« Entrer », « Ajouter ») fills with `--signal`, darker by 10 % under the pointer. Disabled: 75 % opacity, the cursor « progress ». The action of a confirmation (« Retirer », « Vider ») fills with the blue from the left for `--duration-arm` (2 s) before it can be clicked.
- **Fields**: `--field-bg`, a border `--line-strong`, its label above in Chakra Petch 600, a hint or an error below; at fault, a border `--error-text`.
- **Chips** (filters): pressed, the border in `--signal`, a background `--signal-tint`, the text in `--signal-text`. The window of « Jouable à N » opens `--space-1` (4 px) under its chip, on a phone and on a PC: a small gap the owner liked (2026-11-01).
- **Cards**: glass (`--surface` blurred by `--glass-blur` 8 px), the cover chamfered on top; under the pointer, a blue border and `--glow-card`, a slight tilt and press.
- **Votes**: square buttons of `--tap`; the friend's vote fills with `--signal` and glows (`--glow-vote`); the score in `--signal-text` when the friend voted for it; their own game can't be voted against (a dashed border, 40 % opacity).
- **Bubbles and panels**: `--surface-solid`, a border `--line-strong`, `--shadow-pop`; behind a panel, `--overlay`.
- **The strip of the errors**: under the header, over the page, `--error-bg` blurred, white text, a cross of `--tap`.
- **The banner** (the welcome, a code changed): a border with a blue edge of 3 px, `--signal-tint`.

## Motion

<!-- What moves, how long, and what happens when the friend asked to reduce motion. -->

- **The light of the room**: the floor, a grid of `--floor-line` (the blue at 32 %) with cells of `--floor-cell` 56 px seen in perspective (`--floor-depth`), on the lower 46 % of the screen; scanlines over the page (`--scanline`, a dark line every `--scanline-pitch` 3 px); « Idealan » and the logo glow (`--glow-text`, `--glow-logo`), the header too (`--glow-header`).
- **What moves**: the floor runs one cell every `--duration-floor` (2.6 s); a card tilts under the pointer in `--duration` (200 ms); the colors of a button change in `--duration-fast` (150 ms); the score jumps in `--duration-bump` (350 ms) when voting; the strip of the errors slides in, in 200 ms; the spinner turns in `--duration-spin` (800 ms); the action of a confirmation fills in `--duration-arm` (2 s).
- **When the friend asked to reduce motion** (`prefers-reduced-motion`): every animation and transition stops, the cards don't tilt; the action of a confirmation keeps its delay of 2 s, a guard against a double tap, without the fill.

## Tone of the texts

<!-- « vous » or « tu », length, how the calls to action and the errors are worded. -->

- « Tu » for every friend, everywhere (`specs.md`, Design principles); short, friendly sentences, no jargon.
- The calls to action are verbs: « Entrer », « Ajouter », « Rafraîchir », « Retirer », « Vider le sac ».
- An error says what happened and what to do, in one sentence: « Steam ne répond pas : réessaie dans une minute. », « Le sac est plein : vois avec l’admin. »
- French typography: a non-breaking space before « : ? ! ; » and inside « », the apostrophe ’.
- Every text lives in `src/i18n/fr.json`.

## Icons and images

<!-- Where they come from, their license, their format and sizes. -->

- **Covers**: the header images of the Steam CDN (460 × 215, the ratio kept by every cover), never copied into the repository; shown at the width of a card (about 340 px on a phone, 300 px on a PC) and as 88 px thumbnails in the emptying (`--thumb`). A missing cover becomes a striped block (`--stripe`) with the name of the game. The footer says « Données et images : Steam. Idealan n’est pas affilié à Valve. »
- **Icons**: SVG lines in the color of the text, never text symbols, drawn in the mock-up (`ICON` of `app.js`): vote up and down, refresh, chevron, people.
- **The logo and the signature**: see [Brand assets](#brand-assets) and [Logo](#logo).

## Accessibility

<!-- Contrast, focus, the minimum size of touch targets, the alternative texts. -->

- Every text passes WCAG AA on its background (see [Colors](#colors)); the focus ring is white, 2 px, offset by 2 px; the touch targets are 44 px on a phone; a cover is decorative (an empty `alt`), since the name of the game is written under it.
- The borders of the fields and buttons stay the blue at 55 % (`--line-strong`, 2.1:1 on the background), below the 3:1 that WCAG 1.4.11 asks for the border of a field: kept by the owner on 2026-11-01, over the fields alone at 80 % (3.2:1) or everything at 80 %, since the application is for a few friends at a LAN, not for the public. The texts themselves all pass AA.

## Set aside

<!-- The options compared and not kept, with the reason, so that they are not proposed again. -->

On 2026-11-01, in the mock-up:

- **Styles**: A · Nuit (sylent.art as it is: white accent, glass cards, Anaheim, a large faded word), B · Écran de LAN (a blurred halo of its cover behind each card, soft corners), C · Tableau des scores (a large rank on each cover, Barlow Condensed). The owner chose D · Néon.
- **Blues**: cobalt `#2a52e0`, ultramarine `#4338ff`, azure `#0a7cff`, sky `#1a9fff` (the blue of Steam, which would make the application look like a product of Valve), glacier `#56c6ff`.
- **Symbols**: a light bulb on an RJ45 plug (the clearest for « idée + LAN », unreadable at 16 px), a bag with a vote, an « i » whose dot is a vote, three rising chevrons, three linked computers.
- **Drawings of the RJ45 jack**: in a frame of lines (too thin at 16 px), a solid jack without frame, a plug with its cable.

On 2026-11-01, in the design system:

- **Reds of the strip of the errors**: the first red `#d62839` at 78 % (too bright, « il pique les yeux »), carmine `#b01e30`, garnet `#6e1220`: the owner chose the bordeaux `#8c1626`.
- **Borders at 80 %** of the blue, for the fields alone or for everything, to reach the 3:1 of WCAG 1.4.11: the owner kept 55 % (see [Accessibility](#accessibility)).
