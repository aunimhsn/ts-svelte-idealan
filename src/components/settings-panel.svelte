<!-- The settings of the admin (specs.md, Settings): one line per player, their nickname in a field
     with « Renommer », their votes and games, the state of their account (« verrouillé », « code à
     choisir »), « Réinitialiser le code perso » and « Supprimer », with its confirmation; the admin's
     own line has neither, only « toi ». An error shows in a red bubble under the line of its player
     (docs/branding.md, Components). A tall panel (tall-panel.svelte). -->
<script lang="ts">
  import { untrack } from "svelte";
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import type { PlayerAccount } from "../lib/bag";
  import { format } from "../lib/messages";
  import {
    accountsOf,
    countsOf,
    deleteText,
    settingsMessage,
  } from "../lib/settings";
  import ConfirmPanel from "./confirm-panel.svelte";
  import TallPanel from "./tall-panel.svelte";

  let { app, onclose }: { app: AppState; onclose: () => void } = $props();

  const id = $props.id();
  const errorId = `${id}-error`;

  const accounts = $derived(
    app.view === null ? [] : accountsOf(app.view, app.accounts),
  );
  const games = $derived(app.view?.games ?? []);
  const meId = $derived(app.view?.me.id);
  const busy = $derived(app.settingsBusy !== null);
  const error = $derived(app.settingsError);

  // The nicknames being typed, by the id of their player, until renamed.
  let drafts = $state<Record<string, string>>({});
  // The player whose deletion waits for its confirmation.
  let deleting = $state<PlayerAccount | null>(null);

  // Once, when the panel opens: untracked, since reading the players changes the state it reads.
  $effect(() => {
    untrack(() => void app.openSettings());
  });

  const rename = async (event: SubmitEvent, account: PlayerAccount) => {
    event.preventDefault();
    const text = drafts[account.id] ?? account.nickname;
    if (await app.renamePlayer(account.id, text)) {
      delete drafts[account.id];
    }
  };

  // The note of the panel, where the keyboard focus goes once the line deleted is gone.
  let note = $state<HTMLElement>();

  const remove = async (id: string) => {
    const removed = await app.deletePlayer(id);
    const lost =
      document.activeElement === null ||
      document.activeElement === document.body;
    if (removed && lost) note?.focus();
  };

  const plural = (count: number, one: string, many: string) =>
    count === 1 ? one : many;
</script>

<TallPanel
  title={fr.settings.title}
  onclose={() => {
    app.closeSettings();
    onclose();
  }}
>
  <p class="note" tabindex="-1" aria-live="polite" bind:this={note}>
    {#if app.accounts === null && app.settingsBusy === ""}
      {fr.settings.loading}
    {:else if accounts.length === 1}
      {fr.settings.noteOne}
    {:else}
      {format(fr.settings.note, { count: accounts.length })}
    {/if}
  </p>
  {#if error !== null && error.id === null}
    <p class="error is-alone" role="alert">{settingsMessage(error.code)}</p>
  {/if}
  <ul class="players">
    {#each accounts as account (account.id)}
      {@const counts = countsOf(games, account.id)}
      {@const failed = error !== null && error.id === account.id}
      <li class="player" class:is-invalid={failed}>
        <form class="rename" onsubmit={(event) => rename(event, account)}>
          <input
            class="name"
            value={drafts[account.id] ?? account.nickname}
            oninput={(event) =>
              (drafts[account.id] = event.currentTarget.value)}
            aria-label={format(fr.settings.nicknameOf, {
              nickname: account.nickname,
            })}
            aria-invalid={failed}
            aria-describedby={failed ? errorId : undefined}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            maxlength="32"
          />
          <button type="submit" class="button is-small" aria-disabled={busy}>
            {fr.settings.rename}
          </button>
        </form>
        <span class="stats">
          <strong>{counts.votes}</strong>
          {plural(counts.votes, fr.settings.votesOne, fr.settings.votes)} ·
          <strong>{counts.games}</strong>
          {plural(counts.games, fr.settings.gamesOne, fr.settings.games)}
          {#if account.state === "locked"}
            <span class="status is-locked">{fr.settings.locked}</span>
          {:else if account.state === "reset"}
            <span class="status">{fr.settings.codeToChoose}</span>
          {/if}
        </span>
        {#if account.id === meId}
          <span class="self">{fr.settings.self}</span>
        {:else}
          <button
            type="button"
            class="button is-small reset"
            aria-disabled={busy}
            onclick={() => {
              if (!busy) void app.resetPlayerCode(account.id);
            }}
          >
            {fr.settings.reset}
          </button>
          <button
            type="button"
            class="button is-small delete"
            aria-disabled={busy}
            onclick={() => {
              if (!busy) deleting = account;
            }}
          >
            {fr.settings.delete}
          </button>
        {/if}
        {#if failed}
          <p class="error" id={errorId} role="alert">
            {settingsMessage(error.code, error.nickname)}
          </p>
        {/if}
      </li>
    {/each}
  </ul>
</TallPanel>

{#if deleting !== null}
  {@const player = deleting}
  <ConfirmPanel
    title={fr.confirm.deleteTitle}
    name={player.nickname}
    text={deleteText(countsOf(games, player.id))}
    action={fr.confirm.deleteAction}
    onconfirm={() => void remove(player.id)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .note {
    margin: var(--space-2) 0 var(--space-4);
    color: var(--secondary);
    font-size: var(--size-small);
  }

  .players {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .player {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-2);
    padding: var(--space-3) 0;
    border-bottom: var(--hairline) solid var(--line);
  }

  .rename {
    display: contents;
  }

  .name {
    min-width: 0;
    min-height: var(--tap-small);
    padding: 0 var(--space-3);
    border: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--field-bg);
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
  }

  .player.is-invalid .name {
    border-color: var(--error-text);
  }

  .stats {
    grid-column: 1 / -1;
    order: 2;
    color: var(--dim);
    font-size: var(--size-caption);
  }

  .stats strong {
    color: var(--secondary);
  }

  /* The state of a nickname: a label next to its counts, red when locked. */
  .status {
    margin-left: var(--space-2);
    padding: calc(var(--space-1) / 2) var(--space-2);
    border: var(--hairline) solid currentcolor;
    color: var(--secondary);
    font-size: var(--size-label);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status.is-locked {
    color: var(--error-text);
  }

  .reset,
  .delete,
  .self {
    order: 2;
  }

  /* Under « Supprimer » of the other lines: the admin's own line has no action. */
  .self {
    grid-column: -2 / -1;
    place-self: center;
    color: var(--dim);
    font-size: var(--size-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  /* An error: a red bubble under the line, its point toward the field. */
  .error {
    position: relative;
    grid-column: 1 / -1;
    justify-self: start;
    order: 1;
    margin: var(--space-1) 0 0;
    padding: var(--space-2) var(--space-3);
    background: var(--error-bg);
    box-shadow: var(--glow-error);
    color: var(--on-error);
    font-size: var(--size-caption);
  }

  .error::before {
    content: "";
    position: absolute;
    top: calc(var(--arrow) / -2);
    left: var(--space-4);
    border-right: calc(var(--arrow) / 2) solid transparent;
    border-bottom: calc(var(--arrow) / 2) solid var(--error-bg);
    border-left: calc(var(--arrow) / 2) solid transparent;
  }

  .error.is-alone {
    margin: 0 0 var(--space-3);
  }

  .error.is-alone::before {
    display: none;
  }

  @media (width >= 900px) {
    .player {
      grid-template-columns: var(--col-player) auto 1fr auto var(
          --col-player-action
        );
      align-items: center;
      gap: var(--space-3);
    }

    .stats,
    .reset,
    .delete,
    .self,
    .error {
      order: 0;
    }

    .stats {
      grid-column: auto;
    }
  }
</style>
