<!-- A game of the bag (specs.md, Layout): the cover, with the cross of « Retirer » at its top
     right when allowed, the name, who added it, « Jusqu’à N joueurs » when known, and the votes in
     a column on the right: upvote, score, downvote. The whole card opens the Steam page of the
     game in a new tab: the link of the name stretched over it, under the cross and the votes. The
     score jumps when it changes, and shows who voted in a bubble under it: on a tap, or on hover
     and keyboard focus on a computer. A cover missing or that doesn't load becomes a striped block
     with the name. On a computer, the card sinks a little on the side of the pointer. -->
<script lang="ts">
  import { onMount } from "svelte";
  import fr from "../i18n/fr.json";
  import { scoreOf, type BagGame, type Vote } from "../lib/bag";
  import { signed, voteOf, votersOf } from "../lib/games";
  import { format } from "../lib/messages";
  import { steamPage } from "../lib/steam-link";
  import Icon from "./icon.svelte";

  let {
    game,
    me,
    nicknames,
    canRemove,
    removing,
    removeLocked,
    votersOpen,
    onvote,
    onremove,
    onvoters,
  }: {
    game: BagGame;
    me: string;
    nicknames: ReadonlyMap<string, string>;
    canRemove: boolean;
    // This game is being removed: its votes are locked too.
    removing: boolean;
    // A removal runs: « Retirer » waits for it to end.
    removeLocked: boolean;
    votersOpen: boolean;
    onvote: (tapped: Vote) => void;
    onremove: () => void;
    onvoters: (open: boolean) => void;
  } = $props();

  const id = $props.id();
  const titleId = `${id}-title`;
  const votersId = `${id}-voters`;

  let coverFailed = $state(false);
  let tilt = $state<{ x: number; y: number } | null>(null);

  const vote = $derived(voteOf(game, me));
  const score = $derived(scoreOf(game));
  const voters = $derived(votersOpen ? votersOf(game, nicknames) : null);
  const adder = $derived(nicknames.get(game.addedBy) ?? fr.card.formerPlayer);

  // The score jumps when it changes, not when the card first shows: only a score shown after the
  // card is mounted gets the jump. Not reactive: read when a new score shows.
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
  const bump = (node: HTMLElement) => {
    if (mounted) node.classList.add("is-bumped");
  };

  const hovers =
    typeof matchMedia === "function" && matchMedia("(hover: hover)").matches;

  // On a computer, the bubble opens with the pointer on the score, and stays open while the pointer
  // is on the votes or on the bubble itself.
  const byMouse = (event: MouseEvent) =>
    hovers && event instanceof PointerEvent && event.pointerType === "mouse";

  const canTilt =
    hovers && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lean = (event: PointerEvent) => {
    if (!canTilt || event.pointerType !== "mouse") return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    tilt = { x: -y * 5, y: x * 6 };
  };
</script>

<li
  class="card"
  style:--tilt-x={tilt ? `${tilt.x.toFixed(2)}deg` : null}
  style:--tilt-y={tilt ? `${tilt.y.toFixed(2)}deg` : null}
  onpointermove={lean}
  onpointerleave={() => (tilt = null)}
>
  {#if game.cover !== null && !coverFailed}
    <div class="cover">
      <img
        src={game.cover}
        alt=""
        loading="lazy"
        width="460"
        height="215"
        onerror={() => (coverFailed = true)}
      />
    </div>
  {:else}
    <div class="cover is-missing">
      <span aria-hidden="true">{game.name}</span>
    </div>
  {/if}
  {#if canRemove}
    <button
      type="button"
      class="remove"
      aria-label={removing ? fr.card.removing : fr.card.remove}
      aria-disabled={removeLocked}
      aria-describedby={titleId}
      onclick={() => {
        if (!removeLocked) onremove();
      }}
    >
      {#if removing}
        <span class="spinner" aria-hidden="true"></span>
      {:else}
        <Icon name="close" size={18} />
      {/if}
    </button>
  {/if}
  <div class="body">
    <div class="info">
      <h3 class="title">
        <a
          class="link"
          href={steamPage(game.appid)}
          target="_blank"
          rel="noopener noreferrer"
          ><span id={titleId}>{game.name}</span>
          <span class="visually-hidden">{fr.card.steamPage}</span></a
        >
      </h3>
      <p class="by">
        {vote === "own"
          ? fr.card.addedByMe
          : format(fr.card.addedBy, { nickname: adder })}
      </p>
      {#if game.maxPlayers !== null}
        <p class="players">
          <Icon name="people" size={15} />{game.maxPlayers === 1
            ? fr.card.maxPlayersOne
            : format(fr.card.maxPlayers, { count: game.maxPlayers })}
        </p>
      {/if}
    </div>
    <div
      class="votes"
      role="group"
      aria-labelledby={titleId}
      class:is-mine={vote === "up" || vote === "own"}
      onpointerleave={(event) => {
        if (byMouse(event)) onvoters(false);
      }}
    >
      <button
        type="button"
        class="vote"
        aria-label={fr.card.up}
        aria-describedby={titleId}
        aria-pressed={vote === "up" || vote === "own"}
        disabled={vote === "own" || removing}
        onclick={() => onvote("up")}
      >
        <Icon name="up" size={22} />
      </button>
      <button
        type="button"
        class="score"
        aria-label={format(fr.card.scoreLabel, { score: signed(score) })}
        aria-describedby={titleId}
        aria-expanded={votersOpen}
        aria-controls={votersId}
        onclick={(event) => onvoters(byMouse(event) || !votersOpen)}
        onpointerenter={(event) => {
          if (byMouse(event)) onvoters(true);
        }}
        onfocus={(event) => {
          if (hovers && event.currentTarget.matches(":focus-visible")) {
            onvoters(true);
          }
        }}
        onblur={() => {
          if (hovers) onvoters(false);
        }}
      >
        {#key score}
          <span class="score-value" {@attach bump}>{signed(score)}</span>
        {/key}
      </button>
      <button
        type="button"
        class="vote is-down"
        aria-label={fr.card.down}
        aria-describedby={titleId}
        aria-pressed={vote === "down"}
        disabled={vote === "own" || removing}
        onclick={() => onvote("down")}
      >
        <Icon name="down" size={22} />
      </button>
      <div class="voters" id={votersId} hidden={voters === null}>
        {#if voters !== null}
          {#each [{ title: fr.card.up, names: voters.up }, { title: fr.card.down, names: voters.down }] as column (column.title)}
            <div>
              <p class="voters-title">
                {column.title}
                <span class="voters-count">{column.names.length}</span>
              </p>
              <ul>
                {#each column.names as nickname, index (index)}
                  <li>{nickname}</li>
                {:else}
                  <li class="is-none">{fr.card.nobody}</li>
                {/each}
              </ul>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</li>

<style>
  .card {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border: var(--hairline) solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    backdrop-filter: blur(var(--glass-blur));
    transform: perspective(var(--tilt-depth)) rotateX(var(--tilt-x, 0))
      rotateY(var(--tilt-y, 0)) scale(var(--press, 1));
    transition:
      transform var(--duration) ease-out,
      box-shadow var(--duration);
  }

  .card:hover {
    --press: 0.98;

    border-color: var(--signal);
    box-shadow: var(--glow-card);
  }

  /* The card whose bubble is open goes over the next ones. */
  .card:has(.voters:not([hidden])) {
    z-index: var(--layer-raised);
  }

  .cover {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius) var(--radius) 0 0;
    aspect-ratio: 460 / 215;
    background: var(--surface-solid);
  }

  .cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover.is-missing {
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: var(--stripes), var(--surface-solid);
    text-align: center;
  }

  .cover.is-missing span {
    overflow-wrap: anywhere;
    font: var(--weight-bold) var(--size-title) / var(--leading-title)
      var(--font-title);
    color: var(--secondary);
  }

  .body {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-3);
    flex: 1;
    padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
    min-width: 0;
  }

  .title {
    max-width: 100%;
    margin: 0 0 var(--space-1);
    overflow-wrap: anywhere;
    font: var(--weight-bold) var(--size-card-title) / var(--leading-title)
      var(--font-title);
    letter-spacing: var(--tracking-title);
  }

  /* The link of the name, stretched over the whole card; the focus ring goes around the card. */
  .link {
    color: inherit;
    text-decoration: none;
  }

  .link::after {
    content: "";
    position: absolute;
    z-index: var(--layer-above);
    inset: 0;
  }

  .link:focus-visible {
    outline: none;
  }

  .card:has(.link:focus-visible) {
    outline: var(--stroke) solid var(--focus);
    outline-offset: var(--focus-offset);
  }

  .by,
  .players {
    max-width: 100%;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: var(--size-small);
    line-height: var(--leading-snug);
  }

  .players {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text);
  }

  /* « Ajouté par » in electric blue, right under the name (step 9a). */
  .by {
    color: var(--signal);
    font-weight: var(--weight-bold);
  }

  /* « Retirer »: a square with a cross at the top right of the cover, above the link. */
  .remove {
    position: absolute;
    z-index: var(--layer-bubble);
    top: var(--space-2);
    right: var(--space-2);
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
    border: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-solid) 78%, transparent);
    backdrop-filter: blur(var(--glass-blur));
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--duration-fast),
      border-color var(--duration-fast);
  }

  .remove:hover {
    border-color: var(--error-text);
    background: var(--error);
  }

  .remove[aria-disabled="true"] {
    cursor: progress;
    opacity: 0.75;
  }

  /* The votes: upvote, score, downvote; the friend's vote fills with the blue and glows. */
  .votes {
    position: relative;
    z-index: var(--layer-bubble);
    align-self: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .vote {
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
    border: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--secondary);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--duration-fast),
      color var(--duration-fast);
  }

  .vote:disabled {
    cursor: default;
  }

  .vote:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text);
  }

  .vote[aria-pressed="true"] {
    border-color: var(--signal);
    background: var(--signal);
    color: var(--on-signal);
    box-shadow: var(--glow-vote);
  }

  .vote.is-down:disabled {
    border-style: dashed;
    opacity: 0.4;
  }

  /* The score, in the blue when the friend voted for the game. */
  .score {
    min-width: var(--tap);
    padding: var(--space-1) 0;
    border: 0;
    background: none;
    color: var(--text);
    font: var(--weight-black) var(--size-score) / var(--leading-none)
      var(--font-title);
    cursor: pointer;
  }

  .votes.is-mine .score {
    color: var(--signal-text);
  }

  .score-value {
    display: inline-block;
  }

  .score-value:global(.is-bumped) {
    animation: bump var(--duration-bump) ease-out;
  }

  @keyframes bump {
    40% {
      transform: scale(1.35);
    }
  }

  /* Who voted: a bubble under the votes, with its point under the score. */
  .voters {
    position: absolute;
    z-index: var(--layer-bubble);
    top: calc(100% + var(--space-2));
    right: 0;
    width: min(var(--width-bubble), calc(100vw - 2 * var(--space-4)));
    padding: var(--space-3) var(--space-4);
    border: var(--hairline) solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--surface-solid);
    box-shadow: var(--shadow-pop);
    font-size: var(--size-small);
  }

  /* A bridge over the gap above the bubble: the pointer crosses it without closing the bubble. */
  .voters::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 100%;
    left: 0;
    height: calc(var(--space-2) + var(--hairline));
  }

  .voters::before {
    content: "";
    position: absolute;
    top: calc(var(--arrow) / -2 - var(--hairline));
    right: calc(var(--tap) / 2 - var(--arrow) / 2);
    width: var(--arrow);
    height: var(--arrow);
    border-top: var(--hairline) solid var(--line-strong);
    border-left: var(--hairline) solid var(--line-strong);
    background: var(--surface-solid);
    transform: rotate(45deg);
  }

  .voters:not([hidden]) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .voters-title {
    margin: 0 0 var(--space-1);
    color: var(--dim);
    font: var(--weight-bold) var(--size-label) / var(--leading-title)
      var(--font-title);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .voters-count {
    color: var(--signal-text);
  }

  .voters ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .voters li {
    overflow-wrap: anywhere;
    line-height: var(--leading-body);
  }

  .voters li.is-none {
    color: var(--dim);
  }

  @media (width >= 900px) {
    .vote {
      width: var(--tap-small);
      height: var(--tap-small);
    }

    .remove {
      width: var(--tap-small);
      height: var(--tap-small);
    }

    .by,
    .players {
      font-size: var(--size-caption);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transform: none;
    }
  }
</style>
