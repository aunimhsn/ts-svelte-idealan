# External services

The external services of the application, their limits and terms of use, and the risks the owner accepts, with their date. Check them again before relying on a figure, since the terms change.

## Netlify (hosting, Functions, Blobs)

Checked on 2026-11-01 in the [pricing](https://www.netlify.com/pricing/), [How credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), the [billing FAQ](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) and the [Powered by Netlify badge](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/).

### The free plan

- 300 credits a month, a hard limit, never charged (« You'll never be charged for the Free plan »); unused credits don't roll over.
- When the credits are used up, **every project of the Netlify account** is paused and shows « Site not available » until the next billing cycle. Netlify sends an email and an in-app notification at 50 %, 75 %, 90 % and 100 %.
- What costs credits:

| Meter | Cost |
|---|---|
| A successful production deploy (a merge to `main`) | 15 credits |
| Web requests, the calls to the functions included | 2 credits per 10,000 |
| Bandwidth | 20 credits per GB |
| Compute of the functions | 10 credits per GB-hour |
| Deploy previews, failed deploys, rollbacks | free |

- Netlify Blobs is not listed among the meters: its storage and reads cost nothing on 2026-11-01.
- Estimate for idealan: 9 friends make a few thousand requests a month (about 1 credit), the page weighs a few hundred KB and the covers come from the Steam CDN, not from Netlify (a few credits of bandwidth), and a function answers in a fraction of a second (compute negligible). **The production deploys dominate**: 300 credits are 20 merges to `main` a month, every pull request counted (documentation and Dependabot included).
- Whether a build skipped by `build.ignore` of `netlify.toml` costs the 15 credits is not documented. It doesn't make a deploy live, so it most likely costs nothing: to check on the usage page of the account after the first skipped build.

### Netlify Blobs

- Limits: a key of 600 bytes, an object of 5 GB, metadata of 2 KB, lists by pages of 1,000; no limit on the number of objects.
- Consistency: eventual by default (an update reaches every edge location within 60 seconds); strong on demand, per store or per read, slower.
- Two writes on the same key: the last one wins, without warning. Conditional writes avoid it: `onlyIfNew` (only if the key doesn't exist) and `onlyIfMatch` with the ETag read before (only if nobody changed it meanwhile); both answer `modified: false` when the condition fails, and the function reads again and retries.
- A store made with `getStore` is shared by every deploy of the site: **a deploy preview reads and writes the bag of the production site**. A store per deploy (`getDeployStore`) is emptied with the deploy.
- The site-wide stores live in the region `us-east-2` (United States).

### Deploy previews and the badge

- Visitor access is turned off: production and previews are public (`https://deploy-preview-<n>--ts-svelte-idealan-sylent.netlify.app`); the bag stays protected by the codes, checked by the functions.
- The projects created on the free plan since 2026-08-19 show a « Powered by Netlify » badge, injected by Netlify in every page. The documentation says it can be turned off in **Project configuration > General > Powered by Netlify badge**, but on the free plan the setting is locked (« Upgrade to unlock », seen by the owner on 2026-11-01): the badge stays injected (`data-account-tier="free"`). The Content Security Policy of `netlify.toml` blocks it anyway (the documentation calls it a side effect: « nothing else on your project is affected »), with an error in the console of the browser.

## Steam Store (games and covers)

Checked on 2026-11-01: the [Steam Web API Terms of Use](https://steamcommunity.com/dev/apiterms), and `appdetails` and the CDN called directly.

### `appdetails`

- `https://store.steampowered.com/api/appdetails?appids=<appid>&l=french&cc=fr`: undocumented by Valve, no key. One `appid` per call (`appids=730,570` answers 400).
- The answer, in French: `type`, `name`, `short_description`, `header_image`, `categories`, `genres`, about 18 KB; `&filters=basic,categories,genres` brings it down to about 7 KB. Steam asks to cache it an hour (`Cache-Control: max-age=3600`).
- An unknown `appid`: HTTP 200 with `{"<appid>":{"success":false}}`.
- An `appid` that is not a game answers `success: true` with another `type`: the soundtrack of Counter-Strike 2 (2678630) is `music`; a DLC is `dlc`. Only `type: "game"` goes in the bag.
- The categories that matter at a LAN, with their stable ids: 1 Multijoueur, 9 Coopération, 38 Coopération en ligne, 39 Coop locale et écran partagé, 24 Écran partagé, 36 JcJ en ligne, 47 JcJ en LAN, 48 Coop en LAN, 49 PvP. The genres are words (Action, Stratégie, RPG, Indépendant…).
- **No number of players**: Steam says « Multijoueur », never « 2 to 8 players ».
- Rate limit: not published. The community reports HTTP 429 from about 200 calls in 5 minutes from one address. With at most 50 games, each asked once and cached, idealan stays far below.

### Covers

- `header_image` (460 × 215) at `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/<appid>/<hash>/header.jpg?t=<time>`; the address without the hash (`…/apps/<appid>/header.jpg`) answers too, as `library_600x900.jpg` (the vertical cover, missing for some games).
- The CDN allows any site (`Access-Control-Allow-Origin: *`) and caches for years: the page shows the covers directly from Steam, with nothing to copy and no bandwidth on Netlify. The Content Security Policy already allows `https://*.steamstatic.com`.

### Terms

- The Steam Web API Terms of Use (2010) allow to « distribute Steam Data to end users for their personal use », forbid to suggest that the application is « endorsed or affiliated with Valve or Steam », and forbid unsolicited marketing. They don't name the Store endpoints, which are not part of the documented Web API.
- The covers and descriptions belong to Valve and to the publishers of each game; no license covers them explicitly. Their use here: a private page between friends, behind a code, non-commercial, each game linked to its Steam page, with a mention « Données et images : Steam. Idealan n’est pas affilié à Valve. »

## Personal data

- Kept in Netlify Blobs, in the United States: the nicknames of the friends, their personal codes (hashed, never readable), their games and votes. No email, no first name, no address.
- The repository is public: no nickname, code or data of the bag in it, nor in the tests (invented nicknames).

## Risks accepted by the owner

<!-- One line per risk, with the date. -->

- `appdetails` is undocumented and may change or close without notice: the bag keeps what it has cached, and only the new additions fail. (Accepted on 2026-11-01.)
- The covers and descriptions of Steam are shown without an explicit license, in a private page between friends. (Accepted on 2026-11-01.)
- The free plan of Netlify pauses every project of the account when its 300 credits are used up, until the next month. (Accepted on 2026-11-01.)
- The data of the bag lives in the United States (`us-east-2`). (Accepted on 2026-11-01.)
- The « Powered by Netlify » badge, locked on the free plan, stays blocked by the Content Security Policy, with an error in the console of the browser: the owner refuses to weaken the policy to show an advertisement. (Accepted on 2026-11-01.)
