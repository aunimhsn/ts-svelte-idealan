<!-- The application: one page (specs.md, Screens). A friend not known to the browser sees the
     welcome; otherwise, the bag. Over both, the room of a LAN at night: the grid floor that runs
     to the horizon and the scanlines (docs/branding.md, Motion). -->
<script lang="ts">
  import AppFooter from "./components/app-footer.svelte";
  import BagScreen from "./components/bag-screen.svelte";
  import WelcomeScreen from "./components/welcome-screen.svelte";
  import { createApi } from "./lib/api";
  import { AppState } from "./lib/app-state.svelte";
  import { browserStorage, KEPT_KEY } from "./lib/session";

  const app = new AppState(createApi(), browserStorage());

  // Another tab of the browser changed what is kept: this one follows.
  $effect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEPT_KEY || event.key === null) app.syncKept();
    };
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  });
</script>

<div class="app">
  <div class="floor" aria-hidden="true">
    <div class="plane"><div class="grid"></div></div>
  </div>
  {#if app.session === null}
    <WelcomeScreen {app} />
  {:else}
    <BagScreen {app} />
  {/if}
  <AppFooter />
</div>

<style>
  .app {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: clip;
  }

  /* The scanlines over the whole page. */
  .app::after {
    content: "";
    position: fixed;
    z-index: var(--layer-scanlines);
    inset: 0;
    background: repeating-linear-gradient(
      transparent 0 calc(var(--scanline-pitch) - var(--hairline)),
      var(--scanline) calc(var(--scanline-pitch) - var(--hairline))
        var(--scanline-pitch)
    );
    pointer-events: none;
  }

  /* The grid floor that runs to the horizon: a plane tilted away, faded toward the horizon, and
     its grid that slides by one cell, moved by a transform rather than by its background, so
     that the browser doesn't paint the whole floor again at each frame. */
  .floor {
    position: fixed;
    z-index: var(--layer-floor);
    right: 0;
    bottom: 0;
    left: 0;
    height: 46vh;
    overflow: hidden;
    perspective: var(--floor-depth);
    perspective-origin: 50% 0;
    pointer-events: none;
  }

  .plane {
    position: absolute;
    top: 0;
    right: -150%;
    left: -150%;
    height: 300%;
    overflow: hidden;
    mask-image: linear-gradient(transparent, rgb(0 0 0 / 70%) 30%);
    transform: rotateX(72deg);
    transform-origin: 50% 0;
  }

  .grid {
    position: absolute;
    inset: calc(-1 * var(--floor-cell)) 0 0;
    background:
      linear-gradient(
          var(--floor-line) var(--stroke),
          transparent var(--stroke)
        )
        0 0 / 100% var(--floor-cell),
      linear-gradient(
          90deg,
          var(--floor-line) var(--stroke),
          transparent var(--stroke)
        )
        50% 0 / var(--floor-cell) 100%;
    animation: floor var(--duration-floor) linear infinite;
    will-change: transform;
  }

  @keyframes floor {
    to {
      transform: translateY(var(--floor-cell));
    }
  }
</style>
