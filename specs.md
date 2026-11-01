# Specifications

<!--
Describe what the application does, before writing any code (process.md, Specifications).
Write behavior, not implementation: technical choices go in docs/technical-choices.md.
Remove or add sections as needed.
-->

## Starting notes

The idea as the owner described it on 2026-11-01, before the specifications step. Step 1 of `roadmap.md` turns it into the sections below, with the owner's answers, then removes this section.

- A LAN party between friends is coming. Nobody knows what to play once everyone is there.
- Before the LAN, each friend puts into a shared « bag » the games they would like to play, by pasting the link of the game's Steam page (`https://store.steampowered.com/app/730/...`): the application reads the `appid` in the link and fetches the name, the cover, the short description and the categories (multiplayer, co-op, LAN) from the Steam Store.
- On the day of the LAN, the group opens the page on a big screen and sees every game, with who wants to play it, and picks one in a couple of minutes.
- No accounts: a shared access code, sent in the friends' group conversation, protects the additions; each friend gives a nickname once, kept in their browser.
- A game already in the bag is not added twice: the friend's nickname joins the list of those who want to play it, which acts as a vote.
- Success: on the evening of the LAN, the page is opened and the choice takes two minutes.

## Purpose

<!-- What the application is for, who uses it (how many friends, on which devices), and the expected volume of data. -->

## Design principles

<!-- Look and feel, tone of the messages (« tu » between friends?), use of colors, the covers as the main material. -->

## Screens

<!-- One subsection per screen, as agreed on the wireframes: what the friend sees, what each button does, the edge cases. Then "the mock-up is the reference". -->

## Steam links

<!-- The links accepted (store, community, with or without the name and query), those refused (a package /sub/, a bundle /bundle/), and the message for each case. -->

| Link | Result |
|---|---|
| `https://store.steampowered.com/app/730/CounterStrike_2/` | Game 730 |

## Stored data

<!-- What each key of Netlify Blobs holds, who writes it, how long it is kept, what happens when two friends write at once, and how the bag is emptied after the LAN. -->

## Access code and nicknames

<!-- Who may read the bag, who may add or vote, what happens with a wrong code, where the nickname is kept, how a friend changes it. -->

## Error handling

| Situation | Behavior |
|---|---|
| The link is not a Steam game | |
| The game is already in the bag | |
| Wrong access code | |
| Steam doesn't answer | |
| The game has no cover | |

## Constraints

- Hosted on Netlify at its `netlify.app` address; the server part is Netlify Functions, the data Netlify Blobs.
- Every screen has a title, `lang="fr"`, and is usable at phone width and on a big screen.
- Accessibility: semantic HTML, contrast WCAG AA, keyboard access, reduced motion respected.
