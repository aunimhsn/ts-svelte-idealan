<!-- The header of the bag: the name, the friend's nickname (« admin » for the owner, on a PC) and
     « Se déconnecter »; the strip of the errors hangs under it. -->
<script lang="ts">
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { bagMessage } from "../lib/messages";
  import AppLogo from "./app-logo.svelte";
  import ErrorStrip from "./error-strip.svelte";

  let { app }: { app: AppState } = $props();
</script>

<header class="header">
  <div class="inner">
    <h1 class="brand"><AppLogo size={28} /><span>{fr.app.name}</span></h1>
    <div class="actions">
      <span class="nick" data-one-line>
        {app.view?.me.nickname ?? app.kept.nickname}
        {#if app.view?.role === "admin"}
          <span class="role">{fr.header.admin}</span>
        {/if}
      </span>
      <button
        type="button"
        class="button is-small"
        onclick={() => app.logout()}
      >
        {fr.header.logout}
      </button>
    </div>
  </div>
  {#if app.toast !== null}
    <ErrorStrip
      message={bagMessage(app.toast, app.loadedAt)}
      onclose={() => app.closeToast()}
    />
  {/if}
</header>

<style>
  .header {
    position: relative;
    z-index: var(--layer-header);
    border-bottom: var(--hairline) solid var(--line);
    background: var(--header-bg);
    backdrop-filter: blur(var(--glass-blur));
    box-shadow: var(--glow-header);
  }

  .inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    max-width: var(--content);
    margin: 0 auto;
    padding: var(--space-3) var(--space-4);
  }

  /* « Idealan » in Montserrat 800, uppercase, glowing. */
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-family: var(--font-brand);
    font-size: var(--size-brand);
    font-weight: var(--weight-black);
    line-height: var(--leading-none);
    letter-spacing: var(--tracking-brand);
    text-transform: uppercase;
    text-shadow: var(--glow-text);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    margin-left: auto;
  }

  .nick {
    overflow: hidden;
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role {
    margin-left: var(--space-1);
    color: var(--dim);
    font-size: var(--size-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  @media (width < 900px) {
    .role {
      display: none;
    }
  }

  @media (width >= 900px) {
    .inner {
      padding: var(--space-3) var(--space-8);
    }

    .nick {
      margin: 0 var(--space-2) 0 var(--space-4);
    }
  }
</style>
