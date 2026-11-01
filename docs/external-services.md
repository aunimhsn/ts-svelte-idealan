# External services

The external services of the application, their limits and terms of use, and the risks the owner accepts, with their date. Check them again before relying on a figure, since the terms change.

Nothing here is checked yet: step 1 of `roadmap.md` reads the documentation of each service and fills its section, with the sources and the date.

## Netlify (hosting, Functions, Blobs)

To check in step 1:

- The limits of the free plan: bandwidth, builds, calls and duration of the functions, size and number of blobs.
- What happens when a limit is reached on the free plan (the site paused, or charged), with no payment method on the account.
- Whether the deploy previews of a public repository are public, and what they show (the bag of the production site, or an empty one).
- The rules of the names of a site (`<name>.netlify.app`) and whether `idealan` is free.

## Steam Store (games and covers)

To check in step 1:

- The [Steam Web API Terms of Use](https://steamcommunity.com/dev/apiterms) and the Steam Subscriber Agreement: whether showing the name, the description and the cover of a game in a private page between friends is allowed, and the attribution to give.
- `appdetails`: undocumented by Valve, rate limited; the limit seen in practice, and what it answers for an unknown `appid`, a game not sold in France, or a package.
- The images of the Steam CDN: their addresses, whether they may be shown directly (hotlinking) or must be copied.

## Risks accepted by the owner

<!-- One line per risk, with the date: for example, an undocumented Steam endpoint that may change without notice. -->
