// @ts-check
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

export default defineConfig([
  globalIgnores(["dist/", ".netlify/", "docs/mockups/", ".claude/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  svelte.configs.recommended,
  {
    // The interface runs in the browser.
    files: ["src/**/*.{ts,svelte}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, svelteConfig },
    },
  },
  {
    // The configuration files, the check scripts and the functions run in Node.js.
    files: ["*.{js,ts}", "scripts/**/*.mjs", "netlify/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
]);
