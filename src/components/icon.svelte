<!-- An icon as SVG lines in the color of the text, drawn in the mock-up (ICON of app.js). -->
<script lang="ts" module>
  const ICONS = {
    refresh: {
      width: 2,
      paths: ["M20 12a8 8 0 1 1-2.34-5.66", "M20 4v4.5h-4.5"],
    },
    close: { width: 2.4, paths: ["M6 6l12 12M18 6L6 18"] },
    up: { width: 2.4, paths: ["M6 15l6-6 6 6"] },
    chevron: { width: 2, paths: ["M7 10l5 5 5-5"] },
    lock: {
      width: 2.2,
      paths: [
        "M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z",
        "M8 11V8a4 4 0 0 1 8 0v3",
      ],
    },
    people: {
      width: 1.8,
      paths: [
        "M5.8 8a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0",
        "M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8",
        "M14.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
        "M16.5 14.3c2.2.2 3.7 1.8 4.1 4.2",
      ],
    },
  } as const;

  export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
  let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={ICONS[name].width}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#each ICONS[name].paths as path (path)}
    <path d={path} />
  {/each}
</svg>

<style>
  .icon {
    flex: none;
  }
</style>
