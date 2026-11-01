import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type Plugin } from "vitest/config";
import fr from "./src/i18n/fr.json" with { type: "json" };

// The text, with the characters that would break an element or an attribute escaped.
const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Writes the title and the description of src/i18n/fr.json into index.html, so that no French
// text is written outside of it (CLAUDE.md, Language). A marker missing from index.html fails the
// build rather than leaving the page without its title.
const htmlTexts = (): Plugin => ({
  name: "html-texts",
  transformIndexHtml: (html) =>
    Object.entries({
      "%APP_TITLE%": fr.app.name,
      "%APP_DESCRIPTION%": fr.app.description,
    }).reduce((page, [marker, text]) => {
      if (!page.includes(marker)) {
        throw new Error(`${marker} is missing from index.html.`);
      }
      return page.replaceAll(marker, () => escapeHtml(text));
    }, html),
});

export default defineConfig({
  plugins: [svelte(), htmlTexts()],
  // No file is inlined as a data: address (Vite inlines those under 4 KB): the Content Security
  // Policy of netlify.toml allows the fonts and the images from the site itself only.
  build: { assetsInlineLimit: 0 },
  test: {
    include: ["src/**/*.test.ts", "netlify/**/*.test.ts"],
  },
});
