<!-- The logo « Bloc évidé » (docs/branding.md, Logo), on a 32 px grid: an RJ45 jack cut out of a
     square in the color of the text, its four contacts in the blue signal; it glows like the name. -->
<script lang="ts">
  let { size }: { size: number } = $props();
</script>

<svg
  class="logo"
  width={size}
  height={size}
  viewBox="0 0 32 32"
  fill="none"
  stroke="currentColor"
  stroke-linecap="square"
  stroke-linejoin="miter"
  aria-hidden="true"
>
  <path
    class="body"
    fill-rule="evenodd"
    d="M3 3h26v26H3zM8 9v11h4v4h8v-4h4V9z"
  />
  <path
    class="accent"
    d="M11.5 9v4.5M14.5 9v4.5M17.5 9v4.5M20.5 9v4.5"
    stroke-width="1.8"
  />
</svg>

<style>
  .logo {
    flex: none;
    overflow: visible;
    filter: var(--glow-logo);
  }

  .body {
    stroke: none;
    fill: currentcolor;
  }

  .accent {
    stroke: var(--signal);
  }
</style>
