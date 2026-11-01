<!-- The confirmation before what can't be undone (specs.md, Confirmation): a question, the name on
     one line, the numbers at stake, « Annuler » or the action. The action fills in blue for 2
     seconds before it can be clicked, so that a quick double tap never confirms. A sheet from the
     bottom of the screen on a phone, a window in the middle on a PC, over the dimmed bag; « Annuler »,
     « Échap » or a click on the dimmed bag closes it. A native <dialog>: it keeps the keyboard focus
     inside it, and gives it back to the button that opened it. -->
<script lang="ts">
  import fr from "../i18n/fr.json";

  let {
    title,
    name = "",
    text,
    action,
    onconfirm,
    onclose,
  }: {
    title: string;
    name?: string;
    text: string;
    action: string;
    onconfirm: () => void;
    onclose: () => void;
  } = $props();

  // The time before the action can be clicked, given to the CSS for the fill of the button.
  const ARM_MS = 2000;

  const id = $props.id();
  const titleId = `${id}-title`;
  const textId = `${id}-text`;

  let dialog: HTMLDialogElement;
  let armed = $state(false);

  $effect(() => {
    dialog.showModal();
    const timer = setTimeout(() => (armed = true), ARM_MS);
    return () => clearTimeout(timer);
  });

  const confirm = () => {
    if (!armed) return;
    onconfirm();
    dialog.close();
  };
</script>

<!-- A click on the dimmed bag lands on the <dialog> itself, outside its content; « Échap » is
     handled by the browser. -->
<dialog
  bind:this={dialog}
  class="panel"
  aria-labelledby={titleId}
  aria-describedby={textId}
  style:--duration-arm={`${ARM_MS}ms`}
  {onclose}
  onclick={(event) => {
    if (event.target === dialog) dialog.close();
  }}
>
  <div class="content">
    <span class="handle" aria-hidden="true"></span>
    <h2 id={titleId} class="title">{title}</h2>
    <div id={textId}>
      {#if name !== ""}
        <p class="name">{name}</p>
      {/if}
      <p class="text">{text}</p>
    </div>
    <div class="actions">
      <button type="button" class="button" onclick={() => dialog.close()}>
        {fr.confirm.cancel}
      </button>
      <button
        type="button"
        class="button is-primary"
        class:is-arming={!armed}
        aria-disabled={!armed}
        onclick={confirm}
      >
        {action}
      </button>
    </div>
  </div>
</dialog>

<style>
  .panel {
    width: 100%;
    max-width: none;
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

  .content {
    padding: var(--space-3) var(--space-4) var(--space-6);
  }

  .handle {
    display: block;
    width: var(--handle-width);
    height: var(--handle-height);
    margin: 0 auto var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--line-strong);
  }

  .title {
    margin: 0 0 var(--space-3);
    font: var(--weight-bold) var(--size-title) / var(--leading-title)
      var(--font-title);
    letter-spacing: var(--tracking-title);
  }

  .name {
    overflow: hidden;
    margin: 0;
    font: var(--weight-bold) var(--size-body) / var(--leading-snug)
      var(--font-title);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text {
    margin: var(--space-1) 0 var(--space-6);
    color: var(--secondary);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  /* The action fills in blue before it can be clicked. */
  .button.is-arming {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-color: var(--signal);
    background: transparent;
    color: var(--on-signal);
    filter: none;
    cursor: wait;
    opacity: 1;
  }

  .button.is-arming::before {
    content: "";
    position: absolute;
    z-index: var(--layer-behind);
    inset: 0;
    background: var(--signal);
    transform: scaleX(0);
    transform-origin: left;
    animation: arm var(--duration-arm) linear forwards;
  }

  @keyframes arm {
    to {
      transform: scaleX(1);
    }
  }

  @media (width >= 900px) {
    .panel {
      width: var(--width-dialog);
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

    .actions {
      grid-template-columns: auto auto;
      justify-content: end;
    }
  }
</style>
