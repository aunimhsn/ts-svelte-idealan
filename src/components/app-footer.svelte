<!-- The footer of every screen: the Steam notice, and the signature, the wordmark of Sylent over
     a large faint watermark of its mark (docs/branding.md, Logo). -->
<script lang="ts">
  import fr from "../i18n/fr.json";
</script>

<footer class="footer">
  <span class="watermark" aria-hidden="true">
    <svg class="mark" viewBox="0 0 908 2000.3" fill="currentColor">
      <rect
        x="8.8"
        y="218.2"
        transform="matrix(0.6503 -0.7597 0.7597 0.6503 -171.45 428.7256)"
        width="742.3"
        height="364.9"
      />
      <rect
        x="156.9"
        y="1417.3"
        transform="matrix(0.6503 -0.7597 0.7597 0.6503 -1030.6389 960.5798)"
        width="742.3"
        height="364.9"
      />
      <rect
        x="82.9"
        y="818.4"
        transform="matrix(0.6503 -0.7597 0.7597 0.6503 -601.5629 694.9067)"
        width="742.3"
        height="364.9"
      />
    </svg>
  </span>
  <!-- Each sentence on a line of its own on a phone, so that « Valve. » never stays alone on the
       second one; on one line from the breakpoint. -->
  <p>
    <span data-one-line>{fr.footer.steamData}</span>
    <span data-one-line>{fr.footer.steamAffiliation}</span>
  </p>
  <a
    class="signature"
    href="https://sylent.art"
    aria-label={fr.footer.signature}
  >
    <span class="wordmark" aria-hidden="true"></span>
  </a>
</footer>

<style>
  .footer {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    min-height: var(--footer-height);
    padding: var(--space-10) var(--space-4) var(--space-8);
    color: var(--dim);
    font-size: var(--size-caption);
    text-align: center;
  }

  p {
    margin: 0;
  }

  p span {
    display: block;
  }

  @media (width >= 900px) {
    p span {
      display: inline;
    }
  }

  .signature {
    display: inline-flex;
    align-items: center;
    color: var(--secondary);
  }

  .signature:hover {
    color: var(--text);
  }

  /* The wordmark of Sylent (sylent-courses), as a mask so that it takes the color of the text;
     the width keeps the ratio of the image (418 × 96). */
  .wordmark {
    display: block;
    width: calc(var(--wordmark) * 418 / 96);
    height: var(--wordmark);
    background: currentcolor;
    mask: url("../assets/sylent-wordmark.png") center / contain no-repeat;
  }

  .watermark {
    position: absolute;
    z-index: var(--layer-behind);
    top: 50%;
    left: 50%;
    color: var(--text);
    opacity: var(--watermark-opacity);
    transform: translate(-50%, calc(-50% + var(--watermark-shift)));
    pointer-events: none;
  }

  .mark {
    display: block;
    width: auto;
    height: var(--watermark);
  }
</style>
