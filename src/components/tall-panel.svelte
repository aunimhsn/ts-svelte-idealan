<!-- A tall panel of the admin (specs.md, Layout): the settings and emptying the bag. A sheet from
     the bottom on a phone, a window as wide as `--width-dialog-tall` on a PC, over the dimmed bag;
     its title with « Fermer », then its content, whose list scrolls. A native <dialog>, closed with
     « Fermer », « Échap » or a click on the dimmed bag: it keeps the keyboard focus inside it, and
     gives it back to the button that opened it. `close()` closes it from its content. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import fr from "../i18n/fr.json";

  let {
    title,
    onclose,
    children,
  }: { title: string; onclose: () => void; children: Snippet } = $props();

  const id = $props.id();
  const titleId = `${id}-title`;

  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
  });

  export const close = () => dialog.close();
</script>

<dialog
  bind:this={dialog}
  class="panel"
  aria-labelledby={titleId}
  {onclose}
  onclick={(event) => {
    if (event.target === dialog) dialog.close();
  }}
>
  <div class="content">
    <span class="handle" aria-hidden="true"></span>
    <div class="head">
      <h2 id={titleId} class="title">{title}</h2>
      <button type="button" class="button is-small" onclick={close}>
        {fr.panel.close}
      </button>
    </div>
    {@render children()}
  </div>
</dialog>

<style>
  .panel {
    width: 100%;
    max-width: none;
    max-height: var(--height-sheet);
    margin: auto 0 0;
    padding: 0;
    border: 0;
    border-top: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--surface-solid);
    color: var(--text);
  }

  .panel::backdrop {
    background: var(--overlay);
  }

  /* A column whose list takes the room left and scrolls (`flex: 1; min-height: 0`). */
  .content {
    display: flex;
    flex-direction: column;
    max-height: inherit;
    padding: var(--space-3) var(--space-4) var(--space-6);
  }

  .handle {
    display: block;
    flex: none;
    width: var(--handle-width);
    height: var(--handle-height);
    margin: 0 auto var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--line-strong);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .title {
    margin: 0;
    font: var(--weight-bold) var(--size-title) / var(--leading-title)
      var(--font-title);
    letter-spacing: var(--tracking-title);
  }

  @media (width >= 900px) {
    .panel {
      width: min(var(--width-dialog-tall), 90vw);
      max-height: var(--height-dialog);
      margin: auto;
      border: var(--hairline) solid var(--line-strong);
      border-radius: var(--radius);
    }

    .content {
      padding: var(--space-8);
    }

    .handle {
      display: none;
    }
  }
</style>
