<!-- Adding a game (specs.md, The bag): « Lien Steam » across the width, then « Joueurs max »,
     « facultatif » and « Ajouter »; one row on a PC. While Steam is read, the fields are locked
     (read only, not disabled, so that the keyboard focus stays where it was). -->
<script lang="ts">
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { ERROR_STRIP_ID } from "./error-strip.svelte";

  let { app }: { app: AppState } = $props();

  let link = $state("");
  let maxPlayers = $state("");

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (await app.addGame(link, maxPlayers)) {
      link = "";
      maxPlayers = "";
    }
  };
</script>

<form
  class="add"
  class:is-busy={app.adding}
  aria-label={fr.add.label}
  novalidate
  onsubmit={submit}
>
  <div class="field link" class:is-invalid={app.fault === "link"}>
    <label for="add-link">{fr.add.link}</label>
    <input
      id="add-link"
      bind:value={link}
      type="url"
      placeholder={fr.add.linkPlaceholder}
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      readonly={app.adding}
      aria-invalid={app.fault === "link"}
      aria-describedby={app.fault === "link" ? ERROR_STRIP_ID : undefined}
    />
  </div>
  <div class="field players" class:is-invalid={app.fault === "maxPlayers"}>
    <label for="add-max-players" class="players-label">
      {fr.add.maxPlayers}<small>{fr.add.optional}</small>
    </label>
    <input
      id="add-max-players"
      bind:value={maxPlayers}
      type="text"
      inputmode="numeric"
      maxlength="2"
      size="3"
      placeholder={fr.add.maxPlayersPlaceholder}
      autocomplete="off"
      readonly={app.adding}
      aria-invalid={app.fault === "maxPlayers"}
      aria-describedby={app.fault === "maxPlayers" ? ERROR_STRIP_ID : undefined}
    />
  </div>
  <button
    type="submit"
    class="button is-primary submit"
    aria-disabled={app.adding}
  >
    {#if app.adding}
      <span class="spinner" aria-hidden="true"></span>{fr.add.reading}
    {:else}
      {fr.add.submit}
    {/if}
  </button>
  {#if app.adding}
    <p class="message note" role="status">{fr.add.readingNote}</p>
  {/if}
</form>

<style>
  .add {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: end;
    gap: var(--space-3);
  }

  .link {
    grid-column: 1 / -1;
  }

  /* The link 2 px smaller, so that a long one shows more (an iPhone zooms when it is tapped). */
  .link input {
    font-size: var(--size-small);
  }

  .players {
    grid-template-columns: auto var(--width-players);
    align-items: center;
    grid-column: 1 / 3;
  }

  .players input {
    text-align: center;
  }

  .players-label {
    display: grid;
    justify-items: end;
  }

  .players-label small {
    color: var(--dim);
    font: var(--weight-text) var(--size-label) / var(--leading-title)
      var(--font-text);
  }

  .add.is-busy input {
    opacity: 0.6;
  }

  .note {
    grid-column: 1 / -1;
  }

  @media (width >= 900px) {
    .add {
      grid-template-columns: minmax(0, var(--width-link)) auto auto;
      justify-content: start;
      gap: var(--space-4);
    }

    .link,
    .players {
      grid-column: auto;
    }
  }
</style>
