<!-- The bag (specs.md, The bag): the header, the adding, the count with « Rafraîchir », and the
     games sorted by score, with their votes, who voted, and « Retirer » with its confirmation.
     It reloads every 30 seconds while the tab is shown, and at once when the tab comes back after
     a longer time; the reload stops with the screen, when the friend leaves. -->
<script lang="ts">
  import fr from "../i18n/fr.json";
  import { RELOAD_MS, type AppState } from "../lib/app-state.svelte";
  import { MAX_GAMES } from "../lib/bag";
  import type { BagGame } from "../lib/bag";
  import { format } from "../lib/messages";
  import AddGame from "./add-game.svelte";
  import AppHeader from "./app-header.svelte";
  import ConfirmPanel from "./confirm-panel.svelte";
  import GameCard from "./game-card.svelte";
  import Icon from "./icon.svelte";

  let { app }: { app: AppState } = $props();

  const nicknames = $derived(
    new Map(app.view?.players.map((player) => [player.id, player.nickname])),
  );

  // The game whose bubble « who voted » is open, one at a time.
  let openVoters = $state<number | null>(null);
  // The game whose removal waits for its confirmation.
  let removal = $state<BagGame | null>(null);

  const votesText = (game: BagGame) => {
    const count = Object.keys(game.votes).length;
    return count === 0
      ? fr.confirm.removeVotesNone
      : count === 1
        ? fr.confirm.removeVotesOne
        : format(fr.confirm.removeVotes, { count });
  };

  // A tap outside the score and its bubble closes the bubble.
  const onWindowClick = (event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".score, .voters")) return;
    openVoters = null;
  };

  // « Échap » closes it too.
  const onWindowKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") openVoters = null;
  };

  // The count of the games, where the keyboard focus goes once the card removed is gone, rather
  // than back to the top of the page.
  let count = $state<HTMLElement>();

  const remove = async (appid: number) => {
    const removed = await app.removeGame(appid);
    const lost =
      document.activeElement === null ||
      document.activeElement === document.body;
    if (removed && lost) count?.focus();
  };

  $effect(() => {
    const shown = () => document.visibilityState === "visible";
    const timer = setInterval(() => {
      if (shown()) void app.refresh({ background: true });
    }, RELOAD_MS);
    const onVisibility = () => {
      if (shown() && app.isStale()) void app.refresh({ background: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  });
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<AppHeader {app} />
<main class="main">
  <AddGame {app} />
  <div class="bar">
    {#if app.view !== null}
      <p class="count" tabindex="-1" bind:this={count}>
        <strong>{app.view.games.length}</strong>
        {format(fr.bag.count, { max: MAX_GAMES })}
        <span>{fr.bag.sorted}</span>
      </p>
    {:else if app.loading}
      <p class="count" role="status">{fr.bag.loading}</p>
    {/if}
    <button
      type="button"
      class="button is-small refresh"
      aria-disabled={app.loading}
      onclick={() => {
        if (!app.loading) void app.refresh();
      }}
    >
      <Icon name="refresh" size={16} /><span>{fr.bag.refresh}</span>
    </button>
  </div>
  {#if app.view !== null}
    {#if app.games.length > 0}
      {@const me = app.view.me.id}
      {@const admin = app.view.role === "admin"}
      <h2 class="visually-hidden">{fr.bag.games}</h2>
      <ul class="games">
        {#each app.games as game (game.appid)}
          <GameCard
            {game}
            {me}
            {nicknames}
            canRemove={admin || game.addedBy === me}
            removing={app.removing === game.appid}
            removeLocked={app.removing !== null}
            votersOpen={openVoters === game.appid}
            onvote={(tapped) => void app.vote(game.appid, tapped)}
            onremove={() => (removal = game)}
            onvoters={(open) => {
              if (open) openVoters = game.appid;
              else if (openVoters === game.appid) openVoters = null;
            }}
          />
        {/each}
      </ul>
    {:else}
      <div class="empty">
        <p class="empty-title">{fr.bag.emptyTitle}</p>
        <p>{fr.bag.emptyHint}</p>
      </div>
    {/if}
  {/if}
</main>
{#if removal !== null}
  {@const game = removal}
  <ConfirmPanel
    title={fr.confirm.removeTitle}
    name={game.name}
    text={votesText(game)}
    action={fr.confirm.removeAction}
    onconfirm={() => void remove(game.appid)}
    onclose={() => (removal = null)}
  />
{/if}

<style>
  .main {
    flex: 1;
    width: 100%;
    max-width: var(--content);
    margin: 0 auto;
    padding: var(--space-4);
  }

  .bar {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin: var(--space-5) 0 var(--space-4);
  }

  .refresh {
    margin-left: auto;
  }

  .count {
    margin: 0;
    color: var(--secondary);
    font-size: var(--size-small);
  }

  .count strong {
    color: var(--text);
    font-weight: var(--weight-black);
  }

  .games {
    display: grid;
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .empty {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-10) var(--space-6);
    border: var(--hairline) dashed var(--line-strong);
    color: var(--secondary);
    text-align: center;
  }

  .empty p {
    margin: 0;
  }

  .empty-title {
    color: var(--text);
    font: var(--weight-bold) var(--size-title) / var(--leading-title)
      var(--font-title);
  }

  @media (width >= 900px) {
    .main {
      padding: var(--space-6) var(--space-8);
    }

    .bar {
      margin-top: var(--space-6);
    }

    .games {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: var(--space-6);
    }
  }
</style>
