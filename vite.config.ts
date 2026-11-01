import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type Plugin } from "vitest/config";
import fr from "./src/i18n/fr.json" with { type: "json" };

// Writes the title and the description of src/i18n/fr.json into index.html, so that no French
// text is written outside of it (CLAUDE.md, Language).
const htmlTexts = (): Plugin => ({
  name: "html-texts",
  transformIndexHtml: (html) =>
    html
      .replace("%APP_TITLE%", fr.app.name)
      .replace("%APP_DESCRIPTION%", fr.app.description),
});

export default defineConfig({
  plugins: [svelte(), htmlTexts()],
  test: {
    include: ["src/**/*.test.ts", "netlify/**/*.test.ts"],
  },
});
