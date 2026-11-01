import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  preprocess: vitePreprocess(),
  // Svelte 5 with the runes only: the syntax of Svelte 4 (`export let`, `$:`) is refused.
  compilerOptions: { runes: true },
};
