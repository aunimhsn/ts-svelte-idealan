<!-- The filters of the bag (specs.md, The bag and Layout): « Jouable à N » first, then the tags of
     the games of the bag, one row that scrolls sideways on a phone and wraps on a computer. The
     chip « Jouable à N » opens a small window under the filters, with − and +, the number of
     players of the bag and « Retirer ce filtre »; « Échap », a tap outside it or the keyboard
     focus leaving it closes it. N follows the number of players of the bag until the friend
     changes it. -->
<script lang="ts">
  import { tick } from "svelte";
  import fr from "../i18n/fr.json";
  import { MAX_PLAYERS, MIN_PLAYERS } from "../lib/field-rules";
  import { clampPlayers } from "../lib/filters";
  import { format } from "../lib/messages";
  import Icon from "./icon.svelte";

  let {
    choices,
    bagPlayers,
    players,
    tags = $bindable(),
    playersOn = $bindable(),
    onplayers,
  }: {
    // The tags offered, those of at least one game of the bag.
    choices: readonly string[];
    // The number of players of the bag.
    bagPlayers: number;
    // N of « Jouable à N » (playersOf).
    players: number;
    tags: string[];
    playersOn: boolean;
    // The friend chose N with − or +.
    onplayers: (players: number) => void;
  } = $props();

  const id = $props.id();
  const popoverId = `${id}-players`;
  const titleId = `${id}-players-title`;

  let open = $state(false);
  let chip = $state<HTMLButtonElement>();
  let popover = $state<HTMLElement>();

  const openPopover = async () => {
    playersOn = true;
    open = true;
    await tick();
    popover?.querySelector("button")?.focus();
  };

  const close = (refocus: boolean) => {
    open = false;
    if (refocus) chip?.focus();
  };

  // At 1 or 99, a tap changes nothing, and N keeps following the bag.
  const step = (by: number) => {
    const next = clampPlayers(players + by);
    if (next !== players) onplayers(next);
  };

  const toggle = (tag: string) => {
    tags = tags.includes(tag)
      ? tags.filter((pressed) => pressed !== tag)
      : [...tags, tag];
  };

  // A tap outside the window and its chip closes it.
  const onWindowClick = (event: MouseEvent) => {
    if (!open) return;
    const target = event.target;
    if (
      target instanceof Node &&
      (popover?.contains(target) || chip?.contains(target))
    )
      return;
    close(false);
  };

  const onWindowKey = (event: KeyboardEvent) => {
    if (open && event.key === "Escape") close(true);
  };

  // The keyboard focus leaving the window closes it, unless it goes back to its chip.
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      (popover?.contains(next) || chip?.contains(next))
    )
      return;
    if (next !== null) close(false);
  };
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="chips" role="group" aria-label={fr.filters.label}>
  <button
    type="button"
    class="chip is-players"
    class:is-on={playersOn}
    aria-expanded={open}
    aria-controls={popoverId}
    bind:this={chip}
    onclick={() => (open ? close(false) : void openPopover())}
  >
    <Icon name="people" size={16} />
    {fr.filters.players}
    <span class="players-count">{players}</span>
    {#if playersOn}<span class="visually-hidden">({fr.filters.playersOn})</span
      >{/if}
    <Icon name="chevron" size={14} />
  </button>
  <!-- Right after its chip, so that the keyboard goes from one to the other; placed against the
       bar, it is neither clipped nor scrolled with the row of the chips. -->
  <div
    class="popover"
    id={popoverId}
    role="group"
    aria-labelledby={titleId}
    hidden={!open}
    bind:this={popover}
    onfocusout={onFocusOut}
  >
    <p class="popover-title" id={titleId}>{fr.filters.players}</p>
    <div class="stepper">
      <button
        type="button"
        class="button"
        aria-label={fr.filters.fewer}
        aria-disabled={players <= MIN_PLAYERS}
        onclick={() => step(-1)}>−</button
      >
      <output class="stepper-value" aria-live="polite">{players}</output>
      <button
        type="button"
        class="button"
        aria-label={fr.filters.more}
        aria-disabled={players >= MAX_PLAYERS}
        onclick={() => step(1)}>+</button
      >
    </div>
    <p class="popover-note">
      {bagPlayers === 1
        ? fr.filters.inBagOne
        : format(fr.filters.inBag, { count: bagPlayers })}
    </p>
    <button
      type="button"
      class="button is-small"
      onclick={() => {
        playersOn = false;
        close(true);
      }}
    >
      {fr.filters.clear}
    </button>
  </div>
  {#each choices as tag (tag)}
    <button
      type="button"
      class="chip"
      aria-pressed={tags.includes(tag)}
      onclick={() => toggle(tag)}
    >
      {tag}
    </button>
  {/each}
</div>

<style>
  /* The space under the chips, as under the row that scrolls on a phone, keeps a small gap
     between « Jouable à N » and its window (chosen by the owner on 2026-11-01). */
  .chips {
    display: flex;
    gap: var(--space-2);
    width: calc(100% + 2 * var(--space-4));
    margin: calc(-1 * var(--space-1)) calc(-1 * var(--space-4)) 0;
    padding: var(--space-1) var(--space-4);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .chip {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: var(--space-1);
    min-height: var(--tap-small);
    padding: 0 var(--space-3);
    border: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--secondary);
    font: var(--weight-semibold) var(--size-caption) / var(--leading-none)
      var(--font-title);
    cursor: pointer;
  }

  .chip.is-players {
    margin-right: var(--space-3);
    color: var(--text);
  }

  .chip[aria-pressed="true"],
  .chip.is-on {
    border-color: var(--signal);
    background: var(--signal-tint);
    color: var(--signal-text);
  }

  .popover {
    position: absolute;
    z-index: var(--layer-popover);
    top: 100%;
    left: 0;
    display: grid;
    gap: var(--space-3);
    width: var(--width-bubble);
    padding: var(--space-4);
    border: var(--hairline) solid var(--line-strong);
    background: var(--surface-solid);
    box-shadow: var(--shadow-pop);
    animation: popover-in var(--duration) ease-out;
  }

  /* The window fades in as it comes down from its chip (asked by the owner on 2026-11-01). */
  @keyframes popover-in {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--space-2)));
    }
  }

  .popover[hidden] {
    display: none;
  }

  .popover p {
    margin: 0;
  }

  .popover-title {
    font: var(--weight-bold) var(--size-small) / var(--leading-none)
      var(--font-title);
  }

  .popover-note {
    color: var(--dim);
    font-size: var(--size-caption);
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .stepper .button {
    width: var(--tap);
    padding: 0;
    font-size: var(--size-title);
  }

  /* At 1 or 99: nothing to wait for, unlike a busy button. */
  .stepper .button[aria-disabled="true"] {
    cursor: default;
  }

  .stepper-value {
    min-width: 2ch;
    font: var(--weight-bold) var(--size-number) / var(--leading-none)
      var(--font-title);
    text-align: center;
  }

  @media (width >= 900px) {
    .chips {
      flex-wrap: wrap;
      width: 100%;
      margin: 0;
      padding: 0 0 var(--space-1);
      overflow: visible;
    }
  }
</style>
