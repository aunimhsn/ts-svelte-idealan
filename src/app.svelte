<!-- The application: one page (specs.md, Screens). A friend not known to the browser sees the
     welcome; otherwise, the bag. Over both, the room of a LAN at night: the grid floor that runs
     to the horizon and the scanlines (docs/branding.md, Motion). -->
<script lang="ts">
  import AppFooter from "./components/app-footer.svelte";
  import BagScreen from "./components/bag-screen.svelte";
  import WelcomeScreen from "./components/welcome-screen.svelte";
  import { createApi } from "./lib/api";
  import { AppState } from "./lib/app-state.svelte";
  import { browserStorage } from "./lib/session";

  const app = new AppState(createApi(), browserStorage());
</script>

<div class="app">
  <div class="floor" aria-hidden="true"></div>
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

  /* The grid floor that runs to the horizon. */
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

  .floor::before {
    content: "";
    position: absolute;
    top: 0;
    right: -150%;
    left: -150%;
    height: 300%;
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
    mask-image: linear-gradient(transparent, rgb(0 0 0 / 70%) 30%);
    transform: rotateX(72deg);
    transform-origin: 50% 0;
    animation: floor var(--duration-floor) linear infinite;
  }

  @keyframes floor {
    to {
      background-position:
        0 var(--floor-cell),
        50% 0;
    }
  }
</style>
