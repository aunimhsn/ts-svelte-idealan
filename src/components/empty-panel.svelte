<!-- Emptying the bag, for the admin (specs.md, Emptying the bag): the whole bag, filters aside, a
     box per game, none checked when the panel opens; the admin checks the games to keep, then
     « Vider (38 jeux) » opens the confirmation and removes the others. A list with thumbnails on a
     phone, a grid of covers on a PC, with « 9 gardés · 38 retirés » and the action in a bar under
     the list. The order of the games is the one of the opening: a reload never moves a game under
     the finger, and a game added meanwhile comes last, unchecked. The games sent are the ones
     unchecked when « Vider » was pressed, so that the confirmation says exactly what goes. A tall
     panel (tall-panel.svelte). -->
<script lang="ts">
  import { untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { scoreOf } from "../lib/bag";
  import {
    emptyAction,
    emptyText,
    keptWord,
    removedWord,
    toRemove,
  } from "../lib/empty-bag";
  import { inOrder, signed } from "../lib/games";
  import { settingsMessage } from "../lib/settings";
  import ConfirmPanel from "./confirm-panel.svelte";
  import TallPanel from "./tall-panel.svelte";

  let { app, onclose }: { app: AppState; onclose: () => void } = $props();

  let panel = $state<ReturnType<typeof TallPanel>>();

  const order = untrack(() => app.games.map((game) => game.appid));
  const games = $derived(inOrder(app.view?.games ?? [], order));

  // The games checked, to keep; the covers that didn't load.
  const kept = new SvelteSet<number>();
  const failed = new SvelteSet<number>();

  const removed = $derived(toRemove(games, kept));
  const keptCount = $derived(games.length - removed.length);
  const locked = $derived(removed.length === 0 || app.emptying);

  // The games to remove, set when « Vider » opens the confirmation.
  let confirming = $state<number[] | null>(null);

  const empty = async (appids: number[]) => {
    if (await app.emptyBag(appids)) panel?.close();
  };
</script>

<TallPanel
  bind:this={panel}
  title={fr.empty.title}
  onclose={() => {
    app.closeEmpty();
    onclose();
  }}
>
  <p class="note">
    {games.length === 0 ? fr.empty.noGames : fr.empty.note}
  </p>
  <ul class="games">
    {#each games as game (game.appid)}
      <li>
        <label class="game">
          <input
            type="checkbox"
            checked={kept.has(game.appid)}
            onchange={(event) => {
              if (event.currentTarget.checked) kept.add(game.appid);
              else kept.delete(game.appid);
            }}
          />
          {#if game.cover !== null && !failed.has(game.appid)}
            <img
              class="cover"
              src={game.cover}
              alt=""
              loading="lazy"
              width="460"
              height="215"
              onerror={() => failed.add(game.appid)}
            />
          {:else}
            <span class="cover is-missing"></span>
          {/if}
          <span class="name">{game.name}</span>
          <span class="score">
            <span class="visually-hidden">{fr.card.score}</span>
            {signed(scoreOf(game))}
          </span>
        </label>
      </li>
    {/each}
  </ul>
  {#if app.emptyError !== null}
    <p class="error" role="alert">{settingsMessage(app.emptyError)}</p>
  {/if}
  <div class="bar">
    <p aria-live="polite">
      <strong>{keptCount}</strong>
      {keptWord(keptCount)} ·
      <strong>{removed.length}</strong>
      {removedWord(removed.length)}
    </p>
    <button
      type="button"
      class="button is-primary"
      aria-disabled={locked}
      onclick={() => {
        if (!locked) confirming = removed;
      }}
    >
      {app.emptying ? fr.empty.emptying : emptyAction(removed.length)}
    </button>
  </div>
</TallPanel>

{#if confirming !== null}
  {@const appids = confirming}
  <ConfirmPanel
    title={fr.confirm.emptyTitle}
    text={emptyText(appids.length)}
    action={fr.confirm.emptyAction}
    onconfirm={() => void empty(appids)}
    onclose={() => (confirming = null)}
  />
{/if}

<style>
  .note {
    margin: var(--space-2) 0 var(--space-4);
    color: var(--secondary);
    font-size: var(--size-small);
  }

  .games {
    display: grid;
    flex: 1;
    gap: var(--space-2);
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .game {
    display: grid;
    grid-template-columns: auto var(--thumb) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    min-height: var(--tap);
    cursor: pointer;
  }

  .game input {
    width: var(--checkbox);
    height: var(--checkbox);
    margin: 0;
    accent-color: var(--signal);
  }

  .cover {
    display: block;
    width: var(--thumb);
    height: auto;
    aspect-ratio: 460 / 215;
    object-fit: cover;
  }

  .cover.is-missing {
    background:
      repeating-linear-gradient(
        135deg,
        transparent 0 var(--stripe-width),
        var(--stripe) var(--stripe-width) calc(2 * var(--stripe-width))
      ),
      var(--surface-solid);
  }

  /* A game to remove fades: the ones kept stand out. */
  .game:has(input:not(:checked)) .cover {
    opacity: 0.45;
    filter: grayscale(0.7);
  }

  .name {
    overflow: hidden;
    font: var(--weight-semibold) var(--size-small) / var(--leading-snug)
      var(--font-title);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score {
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
  }

  /* An error of the emptying, over the bar: the strip of the bag is under the panel. */
  .error {
    margin: var(--space-3) 0 0;
    padding: var(--space-2) var(--space-3);
    background: var(--error-bg);
    box-shadow: var(--glow-error);
    color: var(--on-error);
    font-size: var(--size-caption);
  }

  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: var(--hairline) solid var(--line);
  }

  .bar p {
    margin: 0;
    color: var(--secondary);
    font-size: var(--size-small);
  }

  .bar strong {
    color: var(--text);
  }

  .bar .button {
    flex: 1 1 auto;
  }

  @media (width >= 900px) {
    .games {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-content: start;
      gap: var(--space-4);
    }

    .game {
      position: relative;
      isolation: isolate;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--space-2);
    }

    /* Over the cover, which fades and would otherwise paint over it. */
    .game input {
      position: absolute;
      z-index: var(--layer-above);
      top: var(--space-2);
      left: var(--space-2);
    }

    .cover {
      grid-column: 1 / -1;
      width: 100%;
    }

    .bar .button {
      flex: none;
    }
  }
</style>
