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

### The owner's answers (2026-11-01)

To be turned into the sections below with the next answers; noted here so that they are not lost between sessions.

- About 9 people: the owner and 8 friends at most. The bag holds 50 games at most, all friends together; a friend adds as many games as they like within that limit.
- Each game has an upvote and a downvote.
- Friends add and vote from their phone, before the LAN: the adding must work well at phone width.
- On the day of the LAN, no shared screen: each friend opens the page in the browser of their own PC (Full HD at least).
- Two codes: a member code for the friends, and an admin code for the owner, to moderate abuses.
- Reading the bag also needs a code: only the members and the owner see it.
- A friend may remove a game they added; the owner, with the admin code, may remove any game.
- The bag may be filtered by kind of game.
- One bag only, kept from one LAN to the next. The owner empties it by hand, with the admin code, whenever they like (Claude Code may suggest it after a LAN): they first select the games to keep, then remove all the others.
- One vote per friend and per game (up or down), which they may withdraw. The friend who added a game counts as an automatic upvote, and can't vote on it otherwise.
- The games are sorted by score (upvotes minus downvotes); the nicknames of the voters are visible (on hover on a computer, on a tap on a phone).
- The identity is the player's nickname (« Sylent »), not their first name. The onboarding has two fields: the access code and « Pseudo du joueur ». The admin code goes in the same field: the server recognizes it and shows the moderation buttons; no separate admin page.
- Nicknames: 3 to 16 letters (without accents) and digits, no space or special character, the first letter capitalized automatically; compared without case (« SYLENT » is « Sylent »), shown as typed.
- Friends may try to take another's nickname on purpose: the first time a friend creates their nickname, they choose a personal code of 4 digits, kept hashed on the server; taking the nickname back on another device asks for it. The admin may reset the personal code of a friend who forgot it.
- Emptying the bag keeps the votes of the games kept, and asks for a confirmation first.
- Structure (drawing `docs/wireframes/structure.excalidraw`, 2026-11-01): the screens follow lead A, one page (a single-page application) with panels over it; the data follow lead B, the whole bag in one key of Netlify Blobs.
- A game is added directly from its link, without a preview of the Steam page (the friend has already seen it).
- The footer says « Données et images : Steam. Idealan n’est pas affilié à Valve. »
- Only the admin changes a friend's nickname (their games and votes follow), in a settings panel: one pre-filled field per friend, and a button to reset their personal code.
- « Se déconnecter » lets a friend leave their nickname (a PC lent at the LAN); coming back under a new nickname makes a new player.
- A game already in the bag is refused with an error message (this replaces the vote of the starting notes); a full bag (50 games) too, with a message that says to see the admin.
- The admin code moderates the games only: the owner votes once per game, like every friend, and can't change the votes of others.

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
