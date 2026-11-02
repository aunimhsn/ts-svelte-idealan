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
- The style « Néon » of the mock-up (step 3): the room of a LAN at night, the covers as the material, the electric blue as the light of the room; its principles and decisions are in [docs/branding.md](docs/branding.md).

## Screens

One page (a single-page application): a friend not known to the browser sees the welcome; otherwise, the bag, with panels (modals) that open over it. The layout of each screen is summed up in « Layout »; the look of every screen and state is set by the mock-up, [docs/mockups/index.html](docs/mockups/index.html), the reference of the interface since step 3.

### Welcome

- Three fields: « Code d’accès », « Pseudo du joueur », « Code perso » (4 digits).
- A new nickname: the friend chooses their personal code. A known nickname: the friend gives its personal code.
- The admin code goes in the same « Code d’accès » field: the server recognizes it, and the bag then shows the moderation actions.
- Once in, the browser keeps the friend: they don't see the welcome again until « Se déconnecter ».

### The bag

- Header: the name of the application, then the friend's nickname on the right, with « admin » under it for the admin; a tap on the nickname opens a menu: « Réglages », « Vider le sac » in red (the admin only), « Se déconnecter » (step 9a).
- Adding: a « Lien Steam » field, an optional « Joueurs max » field (a whole number from 1 to 25, lowered from 99 in step 9a: a game already added with a larger number keeps it), and an « Ajouter » button. The game goes into the bag at once, without a preview (the friend has already seen its Steam page); the friend who adds it counts as an automatic upvote.
- The maximum number of players comes only from the friend who adds the game: Steam doesn't give it, and PCGamingWiki, tested on 2026-11-01, had it for 21 of 24 classic LAN games but for none of the new releases, with server limits taken for player counts (Terraria: 255). Left empty, the card shows nothing about it; it can't be changed afterwards.
- A bar: the number of games and the free places (« 47 jeux · 3 places libres », « sac plein » at 50) and « Rafraîchir », then the filters: « Jouable à N » first, then the kinds of game (Coop, Coop en LAN, JcJ, JcJ en LAN, Écran partagé, then the genres of Steam, the most frequent first). Only the kinds and genres of at least one game of the bag are offered, so that no filter alone empties the bag.
- Several filters pressed show the games that have every one of them (« Coop en LAN » and « Action »: the action games playable in coop on a LAN). With a filter on, the count reads « 12/47 jeux · filtres actifs » (step 9a). Every filter is off when the bag shows and after a reload of the page: they are not kept (chosen by the owner on 2026-11-01).
- « Jouable à N » hides the games whose maximum number of players is below N; the games without a number stay shown, since nobody knows. Opening it turns it on, « Retirer ce filtre » turns it off. N, from 1 to 25 (step 9a), starts at the number of players of the bag and follows it until the friend changes it on the day (« Jouable à 9 »).
- The games, sorted by score (upvotes minus downvotes): the cover, the name, « Ajouté par Nova » right under it, « Jusqu’à 8 joueurs » when known, the score, an upvote and a downvote. The categories are no longer on the card (step 9a): the filters keep them, and the Steam page shows them.
- A tap anywhere on a card, but its buttons, opens the Steam page of the game (`https://store.steampowered.com/app/<appid>/`) in a new tab (step 9a).
- A friend has one vote per game, up or down; a second tap on the same arrow withdraws it, a tap on the other one changes it. The friend who added a game can't vote on it otherwise.
- A vote shows at once, and goes back if the server refuses it. After the friend's own vote, the cards stay where they are until the bag is read again (the reload, « Rafraîchir », adding or removing a game), so that a card never moves under their finger (chosen in step 6c).
- « Retirer », a cross at the top right of the cover, on the games the friend added, and on every game for the admin (step 9a).
- Footer: « Données et images : Steam. Idealan n’est pas affilié à Valve. »
- No real time: the bag reloads every 30 seconds while the tab is shown, after each action, and with « Rafraîchir ».

### Who voted (panel)

- On hover on a computer, on a tap on a phone, the score of a game shows the nicknames of its voters in two columns, « Pour » and « Contre », each with its count and one nickname per line; who added the game is not marked there, since the card already says it (asked by the owner on 2026-11-01).

### Confirmation (panel)

Before what can't be undone, with the numbers at stake, and « Annuler » or the action. The action button fills in blue for 2 seconds before it can be clicked, so that a quick double tap never removes a game, a player or the bag (asked by the owner on 2026-11-01 for removing a game, kept for the two others). A question, then the name on one line (cut with « … » when too long), then the numbers on the next line:

- Removing a game: « Retirer ce jeu du sac ? », « Age of Empires II: Definitive Editi… », « Il a 6 votes. »
- Deleting a player: « Supprimer ce joueur ? », « Nova2 », « Ses 3 jeux et ses 12 votes partent avec lui. »
- Emptying the bag: « Vider le sac ? », « 38 jeux seront retirés. Cette action est définitive. »

### Settings (admin panel)

- One line per player: their nickname in a pre-filled field with « Renommer », and « Redonner les 3 » next to it once the player used one of their renames (step 9a), their number of votes (not what they voted for; the votes on the games of the others, since the upvote on one's own game goes with the game) and of games, « Réinitialiser le code perso », « Supprimer ».
- The state of a nickname next to its counts: a red padlock, read « verrouillé », after 5 wrong personal codes in a row (step 9a; a label before), « code à choisir » once its code is reset and until the friend chooses a new one (step 7a, 2026-11-02).
- The admin's own line has neither « Réinitialiser le code perso » nor « Supprimer », only « toi », so that the admin never deletes themself by mistake, nor resets their own code: the first friend to enter as them would then take their nickname, their games and their votes (the review of step 7a, chosen by the owner on 2026-11-02).
- Renaming: the nickname follows the rules of the welcome, and one taken by another player, without case, is refused; the player's games and votes follow the new nickname. A rename by the admin doesn't count among the player's 3; « Redonner les 3 » gives them their 3 renames back.
- Under the list, the journal of the renames, the newest first, folded by default (« ▸ Renommages 4 »): « PixL → Pixel », the date, and « 2/3 » for a rename by the friend, « par toi, non compté » for one by the admin (step 9a). A friend renamed keeps their session; if they leave, they enter again with their new nickname, which the admin gives them (accepted by the owner on 2026-11-02): the old one would make a new player.
- Reinitializing the personal code: it unlocks the nickname, and the friend chooses a new one at their next entry; the admin tells them to enter at once, since the first one to enter with the nickname chooses its code.
- An error of the settings (a nickname refused or taken, the server not answering) shows in a red bubble under the line of its player, since the strip of the bag is under the panel.
- Deleting: the player's games and votes go with them, after the confirmation. It is the answer to doubled nicknames (« Nova », « Nova2 ») created to vote twice.

### Settings (friend panel)

Asked by the owner on 2026-11-02 (step 9a): a friend renames themself, 3 times at most.

- « Réglages » in the menu of the nickname opens it: « Ton pseudo » pre-filled, the renames left as three diamonds with « 2 restants », the rules under the field (« 3 à 16 lettres ou chiffres, sans accents »), « Tes jeux et tes votes suivent ton nouveau pseudo. », « Annuler » and « Renommer ».
- The rules of the welcome, and a nickname taken by another player, without case, is refused, under the field (« Lou existe déjà : choisis un autre pseudo. »). Renaming to the same nickname with another case (« nova » → « Nova ») counts as a rename.
- Each rename spends one of the 3; with none left, the field and « Renommer » are disabled: « Tu as utilisé tes 3 renommages : pour changer encore, demande à l’admin. » The admin renames them, or gives their 3 back.
- The friend keeps their session and their personal code; their next entry by the welcome takes the new nickname (the former one would make a new player).
- The admin has no « Ton pseudo » panel: their « Réglages » are the settings of every player, their own line included.

### Emptying the bag (admin panel)

- The bag with a box per game: the admin checks the games to keep (their votes stay), then « Vider (38 jeux) » opens the confirmation and removes all the others.
- The whole bag, whatever the filters, in the order of the bag when the panel opens: a reload never moves a game under the finger, and a game added meanwhile comes last. No box is checked when the panel opens; « Vider » waits until a game is to remove (chosen by the owner on 2026-11-02).
- Only the games the admin saw unchecked are removed: a game a friend adds while the confirmation is open stays in the bag, and the confirmation says exactly how many go (chosen by the owner on 2026-11-02). The players stay, and so do the Steam pages read, so that a game added again doesn't ask Steam.
- An error of the emptying (the server not answering) shows in a red block over the bar of the panel, since the strip of the bag is under it; the panel stays open with the boxes as they were.

### Layout

Agreed with the owner on 2026-11-01 in an Excalidraw wireframe, phone first (390 px), then a Full HD PC (1920 px); the wireframe only fixed the first layout and was removed with the mock-up (step 3, the Git history keeps it). **The mock-up is the reference**: [docs/mockups/index.html](docs/mockups/index.html), served with `python3 docs/mockups/serve.py 8742`; where this section and the mock-up disagree, the mock-up wins and this section is fixed.

- **Welcome**: the name and a short line, the three fields one under the other, each with its help or its error below it, « Entrer » across the width; the Steam footer and the signature (the wordmark of Sylent, linked to sylent.art, over the mark of Sylent as a large faint watermark) at the bottom. Under « Code perso »: « Nouveau venu : choisis-le. Déjà venu : redonne-le. » The errors come one at a time: the access code, then the nickname, then the personal code.
- **The bag, top to bottom**: the header (the name, then the nickname on the right, « admin » under it for the admin, and its menu as a list under it, on a phone as on a PC); the adding block (« Lien Steam » across the width, then, under it on the right, « Joueurs max », « facultatif » and « Ajouter »; the same on a PC, as wide as the link field, chosen by the owner on 2026-11-01); the count with the free places and « Rafraîchir »; the filters (« Jouable à N » first, then the kinds), one row that scrolls sideways on a phone and wraps on a PC, where the count takes a row of its own and « Rafraîchir », filled with the blue, ends the row of the filters (chosen by the owner on 2026-11-01); the games; the footer. Nothing stays fixed while the page scrolls.
- **A game card**: the cover across the width of the card, without its cut corner since step 9a, with the cross of « Retirer » at its top right when allowed; then the name, « Ajouté par Krak » in blue right under it, the friend's own nickname on their games (step 9b: a friend named « Toi » would make « Ajouté par toi » ambiguous), « Jusqu’à N joueurs » when known; the votes in a column on the right: upvote, score, downvote. The friend's vote is shown pressed; on their own game, the upvote is pressed and the downvote locked.
- **The games**: one card per row on a phone (about two per screen), a grid of five per row on a PC (about ten in full view).
- **Who voted**: a bubble under the score, on a tap on a phone, on hover or keyboard focus on a PC; the page is not dimmed.
- **Panels**: on a phone, they rise from the bottom of the screen over the dimmed bag (a bottom sheet); on a PC, a window in the middle of the dimmed bag. « Fermer », « Annuler », « Échap » or a click on the dimmed bag closes them. The settings are blocks per player on a phone, a table on a PC; emptying the bag is a list with a box per game on a phone, a grid of covers to check on a PC, with « 9 gardés · 38 retirés » and « Vider (38 jeux) » in a bar that stays at the bottom.
- **Messages**: the errors of the bag (link refused, Steam not answering, bag full, « Joueurs max » wrong, the server not answering) show in a strip of translucent red under the header, closed with its cross; the bag keeps what it showed. « Lecture du jeu sur Steam… » appears under the adding block, with the fields locked and « Lecture… » on the button. An empty bag shows « Le sac est vide. » without filters; filters with no game show « Aucun jeu ne correspond à ces filtres. » and « Retirer les filtres ».
- **« Jouable à N »**: a small window under its chip, with − and +, « 9 joueurs dans le sac » and « Retirer ce filtre ».

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
| `players` | Each player: a fixed id (`j1`), the nickname as typed, the personal code hashed with a salt of its own (never readable), the date of creation, and the renames they used (0 to 3, step 9a); the number of the next id, never reused; and the journal of the renames (step 9a): the last 100, each with the player's id, the former and the new nickname, the date, and whether the admin made it. A nickname exists once, without case. At most 50 players. | Entering with a new nickname; a friend renaming themself; the admin's settings. |
| `attempts/<id>` | The wrong personal codes given in a row for a player, and their tries being checked (each with the time it started; expired after 2 minutes). | Every action of the player (each try is written before its code is checked); the admin's reset. |
| `steam/<appid>` | The Steam page of a game: type, name, cover, categories, genres. Asked to Steam once, kept even when the game leaves the bag. | Adding a game not asked before. |

- The votes point to the id of the player, not to their nickname: renaming changes only `players`.
- Step 9a adds the renames used and the journal to `players` without a migration: a player without the count has used none, a `players` without the journal has an empty one. Deleting a player removes their lines of the journal too.
- The two codes (member, admin) live in the environment variables of Netlify, never in Blobs nor in the repository.
- The browser of each friend keeps the access code, their id and nickname, and their personal code itself, sent with each action and checked again by the server, until « Se déconnecter » (chosen by the owner on 2026-11-01, over a token signed by the server that would need one more secret in Netlify, accepting that whoever uses the browser next can read it there).
- Nothing is deleted on its own: the bag lives until the admin empties it.

## Access code and nicknames

- Two codes, set by the owner in Netlify and sent in the friends' group conversation: the **member code** reads the bag, adds, votes, removes one's own games and renames oneself 3 times; the **admin code**, the owner's only, also removes any game, renames, resets and deletes players, gives their renames back, sees the journal of the renames, and empties the bag.
- Reading the bag needs a code too: only the members and the owner see the games and the nicknames.
- The admin code moderates the games and the players, not the votes: the owner votes once per game, like every friend.
- The identity is the player's nickname (« Sylent »), not their first name: 3 to 16 letters or digits, without accents, spaces or special characters; the first letter is capitalized automatically; compared without case (« SYLENT » is « Sylent »), shown as typed.
- The personal code (4 digits) protects a nickname: taking it on another device (the phone before the LAN, the PC on the day) asks for it. A friend who forgot it asks the admin to reset it.
- 5 wrong personal codes in a row lock the nickname, even for the right code, until the admin resets its code (step 7); an entry by the welcome with the right code clears the count, never the reloads of the bag. Each try is written before its code is checked, so that calls sent all at once can't check more than 5 codes; a try whose check never ended (the server crashed) expires after 2 minutes, so that it never locks a friend for good. While a friend's other calls hold the last tries, the server answers « try again in a moment » rather than « locked ». 4 digits are 10,000 codes, which a script would otherwise try in minutes. Accepted by the owner on 2026-11-01: a friend can lock another's nickname on purpose by typing 5 wrong codes, and only the admin unlocks it.
- « Se déconnecter » forgets the friend in this browser (a PC lent at the LAN). Coming back under another nickname makes a new player: their former games and votes stay with the former nickname; a friend renames themself from their « Réglages » (3 times), the admin renames anyone (step 9a).

## Error handling

Each error is a short sentence, with « tu ». On the welcome, it sits under the field that caused it; in the bag, it shows in a strip of translucent red under the header, over the page, with white text and a cross to close it (asked by the owner on 2026-11-01); the field at fault keeps a red border.

| Situation | Behavior |
|---|---|
| The link is not a Steam game | Refused, with the message of the table « Steam links ». |
| « Joueurs max » is not a whole number from 1 to 25 | Refused, in the strip, the field in red: « Indique un nombre de joueurs entre 1 et 25, ou laisse vide. » (25 since step 9a) |
| The game is already in the bag | Refused: « Ce jeu est déjà dans le sac : vote pour lui. » |
| The bag holds 50 games | Refused: « Le sac est plein : vois avec l’admin. » |
| Wrong access code | The welcome says the code is wrong; nothing is shown of the bag. |
| Wrong personal code | The welcome says the personal code is wrong for this nickname, and to ask the admin if forgotten. |
| 5 wrong personal codes in a row | The welcome says the nickname is locked, and to ask the admin to reset its code. |
| The bag has 50 players | A new nickname is refused: « vois avec l’admin ». |
| A nickname refused (length, characters) | The welcome says what is allowed: « 3 à 16 lettres ou chiffres, sans accents ni espace. » (reworded with the owner on 2026-11-01: « sans accents et chiffres » read as « without digits »). |
| A friend's rename refused (rules, taken) | Under the field of their « Réglages », the field in red; the panel stays open (step 9a). |
| A friend with no rename left (renamed meanwhile from another device) | Refused by the server: « Tu as utilisé tes 3 renommages : pour changer encore, demande à l’admin. » (step 9a). |
| Steam doesn't answer, or limits the calls | The game is not added: « Steam ne répond pas : réessaie dans une minute. » The bag is not affected. |
| The game has no cover | A neutral placeholder with the name of the game. |
| The server doesn't answer | The bag keeps what it showed, with a message that says when it was read (« le sac affiché date de 21 h 04 »); « Rafraîchir » tries again. A reload every 30 seconds that fails says it once, not at each try. |
| A code changed by the owner in Netlify | The next action of a friend sends them back to the welcome, with a banner: « Le code d’accès a changé : redemande-le dans la conversation. » The nickname stays filled in. |
| The friend's player refused in the bag (deleted, code reset, locked, code changed on another device) | The friend goes back to the welcome with a banner that says why; the reload stops, the personal code kept in the browser is forgotten (an old device would otherwise lock the nickname again after a reset), the access code and the nickname stay filled in. |

## Constraints

- Hosted on Netlify at `ts-svelte-idealan-sylent.netlify.app`; the server part is Netlify Functions, the data Netlify Blobs.
- Every screen has a title, `lang="fr"`, and is usable at phone width and on a Full HD screen.
- Accessibility: semantic HTML, contrast WCAG AA, keyboard access with a visible focus (the votes and the « Who voted » panel included, not only on hover), reduced motion respected.
