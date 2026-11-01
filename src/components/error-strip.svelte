<!-- The errors of the bag (specs.md, Error handling): a strip of translucent red under the
     header, over the page, with white text and a cross to close it; the bag keeps what it showed. -->
<script lang="ts" module>
  // The id of the message, for the field at fault to point to it (aria-describedby).
  export const ERROR_STRIP_ID = "bag-error";
</script>

<script lang="ts">
  import fr from "../i18n/fr.json";
  import Icon from "./icon.svelte";

  let { message, onclose }: { message: string; onclose: () => void } = $props();
</script>

<div class="strip" role="alert">
  <div class="inner">
    <p id={ERROR_STRIP_ID}>{message}</p>
    <button
      type="button"
      class="close"
      aria-label={fr.toast.close}
      onclick={onclose}
    >
      <Icon name="close" size={18} />
    </button>
  </div>
</div>

<style>
  .strip {
    position: absolute;
    z-index: var(--layer-toast);
    top: 100%;
    right: 0;
    left: 0;
    border-bottom: var(--hairline) solid var(--on-error-line);
    background: var(--error-bg);
    color: var(--on-error);
    box-shadow: var(--glow-error);
    backdrop-filter: blur(var(--glass-blur));
    animation: strip-in var(--duration) ease-out;
  }

  @keyframes strip-in {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--space-2)));
    }
  }

  .inner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: var(--content);
    margin: 0 auto;
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  }

  p {
    flex: 1;
    margin: 0;
    font: var(--weight-semibold) var(--size-small) / var(--leading-snug)
      var(--font-text);
  }

  .close {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--on-error);
    cursor: pointer;
  }

  .close:hover {
    background: var(--on-error-hover);
  }

  .close:focus-visible {
    outline-color: var(--on-error);
  }

  @media (width >= 900px) {
    .inner {
      padding-right: var(--space-6);
      padding-left: var(--space-8);
    }
  }
</style>
