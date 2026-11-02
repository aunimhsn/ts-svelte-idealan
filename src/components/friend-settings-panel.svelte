<!-- The settings of a friend (specs.md, Settings (friend panel)): « Ton pseudo » pre-filled, the
     renames left as three diamonds with « 2 restants », the rules under the field, « Annuler » and
     « Renommer ». An error shows under the field, in red, and the panel stays open; once renamed,
     it closes, and the header shows the new nickname. With no rename left, the field and
     « Renommer » are disabled, and a note says to ask the admin. A narrow tall panel
     (tall-panel.svelte). -->
<script lang="ts">
  import { untrack } from "svelte";
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { MAX_RENAMES } from "../lib/bag";
  import { panelMessage } from "../lib/messages";
  import { renamesLeftOf, renamesLeftText } from "../lib/settings";
  import TallPanel from "./tall-panel.svelte";

  let { app, onclose }: { app: AppState; onclose: () => void } = $props();

  const id = $props.id();
  const fieldId = `${id}-nickname`;
  const renamesId = `${id}-renames`;
  const noteId = `${id}-note`;
  const noneId = `${id}-none`;

  const me = $derived(app.view?.me);
  const left = $derived(renamesLeftOf(app.view?.renames ?? 0));
  const none = $derived(left === 0);
  const busy = $derived(app.settingsBusy !== null);
  const error = $derived(
    app.settingsError !== null && app.settingsError.id === me?.id
      ? app.settingsError
      : null,
  );

  // The nickname typed, pre-filled with the friend's own.
  let draft = $state(untrack(() => app.view?.me.nickname ?? ""));

  let panel = $state<TallPanel>();

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy || none) return;
    if (await app.renameSelf(draft)) panel?.close();
  };
</script>

<TallPanel
  bind:this={panel}
  title={fr.me.title}
  narrow
  describedby={none ? noneId : undefined}
  onclose={() => {
    app.closeSettings();
    onclose();
  }}
>
  <form class="me" novalidate onsubmit={submit}>
    <div class="field" class:is-invalid={error !== null}>
      <div class="label">
        <label for={fieldId}>{fr.me.nickname}</label>
        <span class="renames" id={renamesId}>
          {#each { length: MAX_RENAMES }, index (index)}
            <span class="pip" class:is-on={index < left} aria-hidden="true"
            ></span>
          {/each}
          <span
            ><span class="visually-hidden">{fr.me.renames}</span
            >{renamesLeftText(left)}</span
          >
        </span>
      </div>
      <input
        id={fieldId}
        bind:value={draft}
        type="text"
        maxlength="16"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        disabled={none}
        aria-invalid={error !== null}
        aria-describedby={`${renamesId} ${noteId}`}
      />
      <small id={noteId} class:is-error={error !== null} aria-live="polite">
        {error === null
          ? fr.welcome.nicknameHint
          : panelMessage(error.code, error.nickname)}
      </small>
    </div>
    {#if none}
      <p class="panel-note" id={noneId}>
        {fr.panelErrors["no-renames-left"]}
      </p>
    {/if}
    <p class="panel-note">{fr.me.follow}</p>
    <div class="actions">
      <button type="button" class="button" onclick={() => panel?.close()}>
        {fr.confirm.cancel}
      </button>
      <button
        type="submit"
        class="button is-primary"
        disabled={none}
        aria-disabled={busy}
      >
        {fr.me.rename}
      </button>
    </div>
  </form>
</TallPanel>

<style>
  .me {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .me .panel-note {
    margin: 0;
  }

  .label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1) var(--space-3);
  }

  .label label {
    color: var(--secondary);
    font: var(--weight-semibold) var(--size-caption) / var(--leading-snug)
      var(--font-title);
  }

  /* The renames left: a lit diamond for each. */
  .renames {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--dim);
    font: var(--weight-text) var(--size-label) / var(--leading-none)
      var(--font-text);
  }

  .pip {
    width: var(--space-2);
    height: var(--space-2);
    border: var(--hairline) solid var(--line-strong);
    transform: rotate(45deg);
  }

  .pip.is-on {
    border-color: var(--signal);
    background: var(--signal);
    box-shadow: var(--glow-vote);
  }

  .pip + span:not(.pip) {
    margin-left: var(--space-2);
  }

  .field input:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* No rename left: « Renommer » is off for good, not busy. */
  .actions .button:disabled {
    cursor: not-allowed;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  @media (width >= 900px) {
    .actions {
      grid-template-columns: auto auto;
      justify-content: end;
    }
  }
</style>
