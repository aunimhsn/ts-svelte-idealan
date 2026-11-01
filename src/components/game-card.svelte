<!-- A game of the bag (specs.md, Layout): the cover chamfered at its top right corner, the name,
     the tags, « Jusqu’à N joueurs » when known, who added it, and the score in a column on the
     right (the votes come with step 6c). A cover missing or that doesn't load becomes a striped
     block with the name. On a computer, the card sinks a little on the side of the pointer. -->
<script lang="ts">
  import fr from "../i18n/fr.json";
  import { scoreOf, type BagGame } from "../lib/bag";
  import { signed, tagsOf, voteOf } from "../lib/games";
  import { format } from "../lib/messages";
  import Icon from "./icon.svelte";

  let { game, me, adder }: { game: BagGame; me: string; adder: string | null } =
    $props();

  let coverFailed = $state(false);
  let tilt = $state<{ x: number; y: number } | null>(null);

  const vote = $derived(voteOf(game, me));
  const tags = $derived(tagsOf(game));

  const canTilt =
    typeof matchMedia === "function" &&
    matchMedia("(hover: hover)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  <div class="body">
    <div class="info">
      <h2 class="title">{game.name}</h2>
      {#if tags.length > 0}
        <p class="tags">{tags.join(" · ")}</p>
      {/if}
      {#if game.maxPlayers !== null}
        <p class="players">
          <Icon name="people" size={15} />{game.maxPlayers === 1
            ? fr.card.maxPlayersOne
            : format(fr.card.maxPlayers, { count: game.maxPlayers })}
        </p>
      {/if}
      <p class="by">
        {vote === "own"
          ? fr.card.addedByMe
          : format(fr.card.addedBy, {
              nickname: adder ?? fr.card.formerPlayer,
            })}
      </p>
    </div>
    <p class="score" class:is-mine={vote === "up" || vote === "own"}>
      <span class="visually-hidden">{fr.card.score}</span>
      {signed(scoreOf(game))}
    </p>
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

  .cover {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius) var(--radius) 0 0;
    aspect-ratio: 460 / 215;
    background: var(--surface-solid);
    clip-path: polygon(
      0 0,
      calc(100% - var(--chamfer)) 0,
      100% var(--chamfer),
      100% 100%,
      0 100%
    );
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
    background:
      repeating-linear-gradient(
        135deg,
        transparent 0 var(--stripe-width),
        var(--stripe) var(--stripe-width) calc(2 * var(--stripe-width))
      ),
      var(--surface-solid);
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

  .tags,
  .by,
  .players {
    max-width: 100%;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: var(--size-small);
    line-height: var(--leading-snug);
  }

  .tags {
    color: var(--dim);
  }

  .players {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text);
  }

  .by {
    color: var(--secondary);
  }

  /* The score, in the blue when the friend voted for the game. */
  .score {
    min-width: var(--tap);
    margin: 0;
    padding: var(--space-1) 0;
    color: var(--text);
    font: var(--weight-black) var(--size-score) / var(--leading-none)
      var(--font-title);
    text-align: center;
  }

  .score.is-mine {
    color: var(--signal-text);
  }

  @media (width >= 900px) {
    .tags,
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
