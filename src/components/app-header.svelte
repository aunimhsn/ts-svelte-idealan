<!-- The header of the bag: the name, then the friend's nickname on the right, « admin » under it
     for the owner; a tap on it opens its menu as a list under it, on a phone as on a PC:
     « Réglages » and « Vider le sac » in red for the admin, then « Se déconnecter ». A tap outside
     the menu or « Échap » closes it. The strip of the errors hangs under the header. -->
<script lang="ts">
  import { tick } from "svelte";
  import fr from "../i18n/fr.json";
  import type { AppState } from "../lib/app-state.svelte";
  import { bagMessage } from "../lib/messages";
  import AppLogo from "./app-logo.svelte";
  import ErrorStrip from "./error-strip.svelte";
  import Icon from "./icon.svelte";

  let {
    app,
    onsettings,
    onempty,
  }: { app: AppState; onsettings: () => void; onempty: () => void } = $props();

  const id = $props.id();
  const menuId = `${id}-menu`;
  const admin = $derived(app.view?.role === "admin");

  let open = $state(false);
  let user = $state<HTMLElement>();
  let toggle = $state<HTMLButtonElement>();

  const openMenu = async () => {
    open = true;
    await tick();
    user?.querySelector<HTMLButtonElement>(".item")?.focus();
  };

  const close = (refocus: boolean) => {
    open = false;
    if (refocus) toggle?.focus();
  };

  // The focus goes back to the nickname before the panel opens, so that the panel gives it back
  // there when it closes, rather than to an item of the menu now hidden.
  const choose = (action: () => void) => {
    close(true);
    action();
  };

  const onWindowClick = (event: MouseEvent) => {
    if (!open) return;
    const target = event.target;
    if (target instanceof Node && user?.contains(target)) return;
    close(false);
  };

  const onWindowKey = (event: KeyboardEvent) => {
    if (open && event.key === "Escape") close(true);
  };

  // Leaving the menu with the keyboard closes it too; a click, which may not move the focus on
  // every browser, is left to the window.
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !user?.contains(next)) close(false);
  };
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<header class="header">
  <div class="inner">
    <h1 class="brand"><AppLogo size={28} /><span>{fr.app.name}</span></h1>
    <div class="user" bind:this={user} onfocusout={onFocusOut}>
      <button
        type="button"
        class="toggle"
        aria-expanded={open}
        aria-controls={menuId}
        bind:this={toggle}
        onclick={() => (open ? close(false) : void openMenu())}
      >
        <span class="who">
          <span class="nick">{app.view?.me.nickname ?? app.kept.nickname}</span>
          {#if admin}
            <small class="role">{fr.header.admin}</small>
          {/if}
        </span>
        <Icon name="chevron" size={16} />
      </button>
      <div class="menu" id={menuId} hidden={!open}>
        {#if admin}
          <button
            type="button"
            class="item open-settings"
            aria-haspopup="dialog"
            onclick={() => choose(onsettings)}
          >
            {fr.header.settings}
          </button>
          <button
            type="button"
            class="item is-danger open-empty"
            aria-haspopup="dialog"
            onclick={() => choose(onempty)}
          >
            {fr.header.emptyBag}
          </button>
        {/if}
        <button
          type="button"
          class="item is-quiet"
          onclick={() => {
            open = false;
            app.logout();
          }}
        >
          {fr.header.logout}
        </button>
      </div>
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
    align-items: center;
    gap: var(--space-3);
    max-width: var(--content);
    margin: 0 auto;
    padding: var(--space-3) var(--space-4);
  }

  /* « Idealan » in Montserrat 800, uppercase, glowing. */
  .brand {
    display: inline-flex;
    flex: none;
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

  .user {
    position: relative;
    min-width: 0;
    margin-left: auto;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 100%;
    min-height: var(--tap);
    padding: 0 var(--space-2) 0 var(--space-3);
    border: var(--hairline) solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: inherit;
    text-align: right;
    cursor: pointer;
    transition:
      background var(--duration-fast),
      border-color var(--duration-fast);
  }

  .toggle:hover,
  .toggle[aria-expanded="true"] {
    border-color: var(--line-strong);
    background: var(--surface-hover);
  }

  .toggle :global(.icon) {
    color: var(--dim);
    transition: transform var(--duration-fast);
  }

  .toggle[aria-expanded="true"] :global(.icon) {
    transform: rotate(180deg);
  }

  /* « admin » under the nickname, as « facultatif » under « Joueurs max ». */
  .who {
    display: grid;
    justify-items: end;
    min-width: 0;
  }

  .nick {
    overflow: hidden;
    max-width: 100%;
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role {
    color: var(--dim);
    font: var(--weight-text) var(--size-label) / var(--leading-title)
      var(--font-text);
  }

  .menu {
    position: absolute;
    z-index: var(--layer-popover);
    top: calc(100% + var(--space-1));
    right: 0;
    display: grid;
    width: max-content;
    min-width: 100%;
    padding: var(--space-1);
    border: var(--hairline) solid var(--line-strong);
    background: var(--surface-solid);
    box-shadow: var(--shadow-pop);
  }

  .menu[hidden] {
    display: none;
  }

  .item {
    display: flex;
    align-items: center;
    min-height: var(--tap);
    padding: 0 var(--space-4);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
    letter-spacing: var(--tracking-button);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }

  .item:hover {
    background: var(--surface-hover);
  }

  .item.is-danger {
    color: var(--error-text);
  }

  .item.is-danger:hover {
    background: color-mix(in srgb, var(--error) 45%, transparent);
  }

  .item.is-quiet {
    color: var(--secondary);
  }

  /* « Se déconnecter » after a line, when other items come before it. */
  .item.is-quiet:not(:first-child) {
    border-top: var(--hairline) solid var(--line);
  }

  @media (width >= 900px) {
    .inner {
      padding: var(--space-3) var(--space-8);
    }
  }
</style>
