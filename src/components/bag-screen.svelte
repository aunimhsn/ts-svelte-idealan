<!-- The bag (specs.md, The bag): the header, the adding, the count and the free places with
     « Rafraîchir », the filters, and the games sorted by score, with their votes, who voted, and
     « Retirer » with its confirmation; for the admin, the settings and emptying the bag. The
     filters are all off when the bag shows, and after a reload of the page. It reloads every 30
     seconds while the tab is shown, and at once when the tab comes back after a longer time; the
     reload stops with the screen, when the friend leaves. -->
<script lang="ts">
  import fr from "../i18n/fr.json";
  import { RELOAD_MS, type AppState } from "../lib/app-state.svelte";
  import { MAX_GAMES } from "../lib/bag";
  import type { BagGame } from "../lib/bag";
  import { format } from "../lib/messages";
  import {
    freeOf,
    gamesWord,
    isFiltering,
    passes,
    playersOf,
    tagChoices,
    type Filters,
  } from "../lib/filters";
  import AddGame from "./add-game.svelte";
  import AppHeader from "./app-header.svelte";
  import BagFilters from "./bag-filters.svelte";
  import ConfirmPanel from "./confirm-panel.svelte";
  import EmptyPanel from "./empty-panel.svelte";
  import GameCard from "./game-card.svelte";
  import Icon from "./icon.svelte";
  import FriendSettingsPanel from "./friend-settings-panel.svelte";
  import SettingsPanel from "./settings-panel.svelte";

  let { app }: { app: AppState } = $props();

  const nicknames = $derived(
    new Map(app.view?.players.map((player) => [player.id, player.nickname])),
  );

  // The filters: the tags pressed, « Jouable à N » on or off, and N once the friend changed it.
  let tags = $state<string[]>([]);
  let playersOn = $state(false);
  let chosenPlayers = $state<number | null>(null);

  const choices = $derived(tagChoices(app.games));
  const bagPlayers = $derived(app.view?.players.length ?? 0);
  const players = $derived(playersOf(chosenPlayers, bagPlayers));
  // A tag whose last game left the bag no longer filters: its chip is gone.
  const filters = $derived<Filters>({
    tags: tags.filter((tag) => choices.includes(tag)),
    players: playersOn ? players : null,
  });
  // And it is unpressed, so that it doesn't come back pressed with the next game that has it.
  $effect(() => {
    const kept = tags.filter((tag) => choices.includes(tag));
    if (kept.length < tags.length) tags = kept;
  });
  const shown = $derived(app.games.filter((game) => passes(game, filters)));

  const clearFilters = () => {
    tags = [];
    playersOn = false;
    count?.focus();
  };

  // The game whose bubble « who voted » is open, one at a time.
  let openVoters = $state<number | null>(null);
  // The game whose removal waits for its confirmation.
  let removal = $state<BagGame | null>(null);
  // The settings (the friend's own, or the admin's) and emptying the bag, open or not.
  let settingsOpen = $state(false);
  let emptyOpen = $state(false);

  const votesText = (game: BagGame) => {
    const count = Object.keys(game.votes).length;
    return count === 0
      ? fr.confirm.removeVotesNone
      : count === 1
        ? fr.confirm.removeVotesOne
        : format(fr.confirm.removeVotes, { count });
  };

  // A tap that closes a bubble, the menu of the nickname or « Jouable à » doesn't also open the
  // Steam page of the card under the finger: it runs before the layers close, while the button that
  // opened one still says so.
  const onLinkCapture = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".games a")) return;
    if (document.querySelector("[aria-expanded='true']")) {
      event.preventDefault();
    }
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

<svelte:window
  onclickcapture={onLinkCapture}
  onclick={onWindowClick}
  onkeydown={onWindowKey}
/>

<AppHeader
  {app}
  onsettings={() => (settingsOpen = true)}
  onempty={() => (emptyOpen = true)}
/>
<main class="main">
  <AddGame {app} />
  <div class="bar">
    {#if app.view !== null}
      {@const total = app.games.length}
      <p class="count" tabindex="-1" aria-live="polite" bind:this={count}>
        {#if isFiltering(filters)}
          <strong>{shown.length}</strong>/{total}
          {gamesWord(total)}
          <span>{fr.bag.filtering}</span>
        {:else}
          <strong>{total}</strong>
          {gamesWord(total)}
          <span>{freeOf(total, MAX_GAMES)}</span>
        {/if}
      </p>
    {:else if app.loading}
      <p class="count" role="status">{fr.bag.loading}</p>
    {/if}
    {#if app.games.length > 0}
      <BagFilters
        {choices}
        {bagPlayers}
        {players}
        bind:tags
        bind:playersOn
        onplayers={(chosen) => (chosenPlayers = chosen)}
      />
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
    {#if shown.length > 0}
      {@const me = app.view.me.id}
      {@const admin = app.view.role === "admin"}
      <h2 class="visually-hidden">{fr.bag.list}</h2>
      <ul class="games">
        {#each shown as game (game.appid)}
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
    {:else if app.games.length > 0}
      <div class="empty">
        <p class="empty-title">{fr.bag.noMatchTitle}</p>
        <button type="button" class="button" onclick={clearFilters}>
          {fr.bag.clearFilters}
        </button>
      </div>
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

{#if settingsOpen && app.view?.role === "admin"}
  <SettingsPanel {app} onclose={() => (settingsOpen = false)} />
{:else if settingsOpen && app.view !== null}
  <FriendSettingsPanel {app} onclose={() => (settingsOpen = false)} />
{/if}

{#if emptyOpen && app.view?.role === "admin"}
  <EmptyPanel {app} onclose={() => (emptyOpen = false)} />
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

  /* « Rafraîchir » after the filters in the page, on their row on a PC, and on the row of the
     count on a phone, where the row of the filters scrolls sideways (chosen by the owner on
     2026-11-01). */
  .refresh {
    order: -1;
    margin-left: auto;
  }

  .count {
    order: -2;
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
      align-items: start;
      margin-top: var(--space-6);
    }

    .count,
    .refresh {
      order: 0;
    }

    .count {
      flex-basis: 100%;
    }

    /* Filled with the blue on a PC only, far from « Ajouter »: on a phone, two blue buttons one
       above the other would leave no main action. */
    .refresh {
      border-color: var(--signal);
      background: var(--signal);
      color: var(--on-signal);
    }

    .refresh:hover {
      filter: brightness(0.9);
    }

    .games {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: var(--space-6);
    }
  }
</style>
