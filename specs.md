# Specifications

What Idealan does, agreed with the owner on 2026-11-01 (step 1 of [roadmap.md](roadmap.md)). Behavior only: the technical choices live in [docs/technical-choices.md](docs/technical-choices.md), the limits of Netlify and Steam in [docs/external-services.md](docs/external-services.md). The structure of the screens and of the data is drawn in [docs/wireframes/structure.excalidraw](docs/wireframes/structure.excalidraw).

## Purpose

- A LAN party between friends is coming, and nobody knows what to play once everyone is there. Before the LAN, each friend puts into a shared « bag » the Steam games they would like to play, by pasting the link of the game's Steam page; the friends vote for or against each game. On the day, each one opens the page and the group picks a game.
- Success: on the evening of the LAN, the choice takes two minutes.
- Users: about 9 people, the owner (the admin) and 8 friends at most, comfortable with games and links.
- Devices: before the LAN, a phone (adding and voting must work well at phone width); on the day, each friend on their own PC, Full HD at least. No shared screen.
- Volume: 50 games at most in the bag, all friends together; a friend adds as many games as they like within that limit.
- One bag only, kept from one LAN to the next: the admin empties it when they like.

## Design principles

- The covers of the games are the main material of the page.
- The interface speaks to the friends with « tu », everywhere (« Tu veux vraiment retirer ce jeu ? »).
- Layout and style are decided in the wireframes (step 2) and the mock-up (step 3): this section is completed then.

## Screens

One page (a single-page application): a friend not known to the browser sees the welcome; otherwise, the bag, with panels that open over it. The wireframes of step 2 will set the layout of each screen.

### Welcome

- Three fields: « Code d’accès », « Pseudo du joueur », « Code perso » (4 digits).
- A new nickname: the friend chooses their personal code. A known nickname: the friend gives its personal code.
- The admin code goes in the same « Code d’accès » field: the server recognizes it, and the bag then shows the moderation actions.
- Once in, the browser keeps the friend: they don't see the welcome again until « Se déconnecter ».

### The bag

- Header: the name of the application, the friend's nickname, « Se déconnecter »; for the admin, « Réglages » and « Vider le sac ».
- Adding: a « Lien Steam » field, an optional « Joueurs max » field (a whole number from 1 to 99), and an « Ajouter » button. The game goes into the bag at once, without a preview (the friend has already seen its Steam page); the friend who adds it counts as an automatic upvote.
- The maximum number of players comes only from the friend who adds the game: Steam doesn't give it, and PCGamingWiki, tested on 2026-11-01, had it for 21 of 24 classic LAN games but for none of the new releases, with server limits taken for player counts (Terraria: 255). Left empty, the card shows nothing about it; it can't be changed afterwards.
- A bar: « Jouable à N » first, then the filters by kind of game (Coop, Coop en LAN, JcJ en LAN, Écran partagé, and the genres of Steam), the number of games (« 47 / 50 jeux »), and « Rafraîchir ».
- « Jouable à N » hides the games whose maximum number of players is below N; the games without a number stay shown, since nobody knows. N starts at the number of players of the bag, and the friend changes it on the day (« Jouable à 9 »).
- The games, sorted by score (upvotes minus downvotes): the cover, the name, the categories, « Jusqu’à 8 joueurs » when known, the score, an upvote and a downvote, « ajouté par Nova ».
- A friend has one vote per game, up or down; a second tap on the same arrow withdraws it, a tap on the other one changes it. The friend who added a game can't vote on it otherwise.
- « Retirer » on the games the friend added, and on every game for the admin.
- Footer: « Données et images : Steam. Idealan n’est pas affilié à Valve. »
- No real time: the bag reloads every 30 seconds while the tab is shown, after each action, and with « Rafraîchir ».

### Who voted (panel)

- On hover on a computer, on a tap on a phone, the score of a game shows the nicknames of its voters: « Pour : Nova (a ajouté), Krak · Contre : Pixel ».

### Confirmation (panel)

Before what can't be undone, with the numbers at stake, and « Annuler » or the action:

- Removing a game: « Retirer Valheim du sac ? Il a 4 votes. »
- Deleting a player: « Supprimer le joueur Nova3 ? Ses 3 jeux et ses 12 votes partent avec lui. »
- Emptying the bag: « 38 jeux seront retirés. Cette action est définitive. »

### Settings (admin panel)

- One line per player: their nickname in a pre-filled field with « Renommer », their number of votes (not what they voted for), « Remettre à zéro le code perso », « Supprimer ».
- Renaming: the player's games and votes follow the new nickname.
- Resetting the personal code: the friend chooses a new one at their next entry.
- Deleting: the player's games and votes go with them, after the confirmation. It is the answer to doubled nicknames (« Nova », « Nova2 ») created to vote twice.

### Emptying the bag (admin panel)

- The bag with a box per game: the admin checks the games to keep (their votes stay), then « Vider (38 jeux) » opens the confirmation and removes all the others.

## Steam links

The application reads the `appid` in the link, then asks Steam for the game.

| Link | Result |
|---|---|
| `https://store.steampowered.com/app/730/CounterStrike_2/` | Game 730 |
| `https://store.steampowered.com/app/730`, with or without the name, a final `/`, a query (`?snr=…`) or an anchor | Game 730 |
| `https://store.steampowered.com/agecheck/app/730/` | Game 730 |
| `https://steamcommunity.com/app/730` (the community hub of the game) | Game 730 |
| A package (`/sub/…`) or a bundle (`/bundle/…`) | Refused: « Ce lien est un pack : colle le lien d’un des jeux. » |
| An `appid` that Steam doesn't know, or that is not a game (a soundtrack, a DLC) | Refused: « Ce lien ne mène pas à un jeu Steam. » |
| Any other text or site | Refused: « Colle le lien d’un jeu de la boutique Steam. » |

The final wording of the messages lives in `src/i18n/fr.json`, written at the build.

## Stored data

In Netlify Blobs (a key-value store: a name, the key, holds a content). Each write reads the key again and starts over if another friend wrote it meanwhile (a conditional write): two friends who click at the same second never lose a vote.

| Key | Holds | Written by |
|---|---|---|
| `bag` | Up to 50 games, each with its `appid`, name, cover, categories, genres, the maximum number of players when given, the id of the player who added it, the date, and the votes (player id → up or down). About 50 KB. | Adding, voting, removing, emptying, deleting a player. |
| `players` | Each player: a fixed id (`j1`), the nickname as typed, the personal code hashed (never readable), the date of creation. A nickname exists once, without case. | Entering with a new nickname; the admin's settings. |
| `steam/<appid>` | The Steam page of a game: type, name, cover, categories, genres. Asked to Steam once, kept even when the game leaves the bag. | Adding a game not asked before. |

- The votes point to the id of the player, not to their nickname: renaming changes only `players`.
- The two codes (member, admin) live in the environment variables of Netlify, never in Blobs nor in the repository.
- The browser of each friend keeps the access code, their nickname and the proof of their personal code (the detail at step 5), until « Se déconnecter ».
- Nothing is deleted on its own: the bag lives until the admin empties it.

## Access code and nicknames

- Two codes, set by the owner in Netlify and sent in the friends' group conversation: the **member code** reads the bag, adds, votes and removes one's own games; the **admin code**, the owner's only, also removes any game, renames, resets and deletes players, and empties the bag.
- Reading the bag needs a code too: only the members and the owner see the games and the nicknames.
- The admin code moderates the games and the players, not the votes: the owner votes once per game, like every friend.
- The identity is the player's nickname (« Sylent »), not their first name: 3 to 16 letters without accents and digits, no space or special character; the first letter is capitalized automatically; compared without case (« SYLENT » is « Sylent »), shown as typed.
- The personal code (4 digits) protects a nickname: taking it on another device (the phone before the LAN, the PC on the day) asks for it. A friend who forgot it asks the admin to reset it.
- « Se déconnecter » forgets the friend in this browser (a PC lent at the LAN). Coming back under another nickname makes a new player: their former games and votes stay with the former nickname; only the admin renames a player.

## Error handling

Each error is a short sentence, with « tu », next to what caused it.

| Situation | Behavior |
|---|---|
| The link is not a Steam game | Refused, with the message of the table « Steam links ». |
| « Joueurs max » is not a whole number from 1 to 99 | Refused, next to the field: « Indique un nombre de joueurs entre 1 et 99, ou laisse vide. » |
| The game is already in the bag | Refused: « Ce jeu est déjà dans le sac : vote pour lui. » |
| The bag holds 50 games | Refused: « Le sac est plein : vois avec l’admin. » |
| Wrong access code | The welcome says the code is wrong; nothing is shown of the bag. |
| Wrong personal code | The welcome says the personal code is wrong for this nickname, and to ask the admin if forgotten. |
| A nickname refused (length, characters) | The welcome says what is allowed: 3 to 16 letters without accents and digits. |
| Steam doesn't answer, or limits the calls | The game is not added: « Steam ne répond pas : réessaie dans une minute. » The bag is not affected. |
| The game has no cover | A neutral placeholder with the name of the game. |
| The server doesn't answer | The bag keeps what it showed, with a message; « Rafraîchir » tries again. |
| A code changed by the owner in Netlify | The next action of a friend sends them back to the welcome. |

## Constraints

- Hosted on Netlify at `ts-svelte-idealan-sylent.netlify.app`; the server part is Netlify Functions, the data Netlify Blobs.
- Every screen has a title, `lang="fr"`, and is usable at phone width and on a Full HD screen.
- Accessibility: semantic HTML, contrast WCAG AA, keyboard access with a visible focus (the votes and the « Who voted » panel included, not only on hover), reduced motion respected.
