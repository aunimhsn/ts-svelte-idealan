# Branding

The visual identity of the application: the few brand assets, then every design decision settled with the owner during the mock-up, with its tokens. Each decision is written here in the same commit as the change; the options set aside go to [Set aside](#set-aside).

## Brand assets

The application has no brand of its own yet: the covers of the Steam games are its main material. What the mock-up may need:

| Asset | Format | File | Status |
|---|---|---|---|
| Name shown in the interface (« Idealan »?) | Text | `src/i18n/fr.json` | To confirm |
| Square icon, readable at 16 px, for the favicon | SVG | the « Bloc évidé » of the mock-up (`LOGOS.tile` in `docs/mockups/shared/app.js`) | Chosen on 2026-11-01 |
| The signature of the footer: the mark of Sylent and its wordmark | SVG and PNG | `docs/mockups/assets/sylent-mark.svg` (from sylent.art), `docs/mockups/assets/sylent-wordmark.png` (from `assets/logo-text.png` of sylent-courses, cropped to its ink) | Chosen on 2026-11-01 |
| Fonts, with their license (self-hosting allowed) | Name, or files | | Chosen in the mock-up |

## Principles

<!-- Three to five sentences: what the application must convey, for whom, and the main rule of the style. -->

Chosen by the owner on 2026-11-01 among four styles of the family of sylent.art, with the blue instead of its orange: **D · Néon**, the style that « raises the temperature ».

1. **The room of a LAN at night**: near-black backgrounds, a grid floor that runs to the horizon, scanlines, the title and the logo that glow.
2. **The covers of the games are the material**: chamfered at their top right corner, they carry the colors; the interface around them stays in blue and white.
3. **Blue is the light of the room**: unlike sylent.art, where the signal color is rare, the electric blue lights the main buttons, the borders and the glows; the friend's own vote and the active filters fill with it.
4. **It moves, but never for a friend who asked to reduce motion**: the floor runs, the cards tilt under the pointer, the score jumps when voting; all of it stops with `prefers-reduced-motion`.

## Logo

<!-- Which variant where (header, footer, favicon, card), the minimum size, the clear space. -->

- The symbol: an RJ45 jack (the plug of a LAN) cut out of a white square, its four contacts in the blue signal (« Bloc évidé »), chosen on 2026-11-01 among six symbols, then among four drawings of the jack: a solid square reads best at 16 px.
- Beside the name « Idealan », glowing in blue, in the header (symbol 28 px) and above the title of the welcome (symbol 72 px).
- The footer carries the mark of Sylent beside the wordmark « SYLENT » of sylent-courses (its letters joined, not the one of sylent.art), both in the color of the text, linked to sylent.art; it replaced « Fait par Sylent » on 2026-11-01.
- « Idealan » is written in Montserrat 800 (the font of the wordmark of Sylent, SIL Open Font License), uppercase, its letters tightened by −0.02 em (`--tracking-brand`): −2 px at the 96 px of the board of the logo, chosen by the owner on 2026-11-01 among −5 to 0 px (first −1 to +1 px); in em, so that it holds at every size (about −0.5 px in the header).

## Colors

<!-- One line per token: name, value, use, contrast checked against WCAG AA. -->

The electric blue, chosen on 2026-11-01 among six blues (contrasts on #0a0a0a). The other tokens are settled in step 4.

| Token | Value | Use |
|---|---|---|
| `--signal` | `#2e6bff` | The electric blue: main buttons, the friend's vote, active filters, borders and glows; white on it 4.5:1, on the background 4.4:1 |
| `--on-signal` | `#ffffff` | Text on the blue |
| `--signal-text` | `#86a8ff` | The same blue, lighter, for small text on the background, 8.5:1 |

## Typography

<!-- The fonts and their license, one size per role (display, title, body, label), weights, line heights. -->

- Titles, the name and the scores: Chakra Petch 500 and 700 (SIL Open Font License), with the style D · Néon.
- Text and interface: Manrope 500 to 800 (SIL Open Font License), as on sylent.art.

## Spacing

<!-- The scale: --space-N = N × 4 px, and where each common value is used. -->

## Layout and shapes

<!-- Content width, gutters, corner radius, the breakpoints (written as numbers in the media queries). -->

## Components

<!-- Buttons, cards, form fields, navigation: their states (hover, focus, active, disabled). -->

## Motion

<!-- What moves, how long, and what happens when the friend asked to reduce motion. -->

## Tone of the texts

<!-- « vous » or « tu », length, how the calls to action and the errors are worded. -->

## Icons and images

<!-- Where they come from, their license, their format and sizes. -->

## Accessibility

<!-- Contrast, focus, the minimum size of touch targets, the alternative texts. -->

## Set aside

<!-- The options compared and not kept, with the reason, so that they are not proposed again. -->

On 2026-11-01, in the mock-up:

- **Styles**: A · Nuit (sylent.art as it is: white accent, glass cards, Anaheim, a large faded word), B · Écran de LAN (a blurred halo of its cover behind each card, soft corners), C · Tableau des scores (a large rank on each cover, Barlow Condensed). The owner chose D · Néon.
- **Blues**: cobalt `#2a52e0`, ultramarine `#4338ff`, azure `#0a7cff`, sky `#1a9fff` (the blue of Steam, which would make the application look like a product of Valve), glacier `#56c6ff`.
- **Symbols**: a light bulb on an RJ45 plug (the clearest for « idée + LAN », unreadable at 16 px), a bag with a vote, an « i » whose dot is a vote, three rising chevrons, three linked computers.
- **Drawings of the RJ45 jack**: in a frame of lines (too thin at 16 px), a solid jack without frame, a plug with its cable.
