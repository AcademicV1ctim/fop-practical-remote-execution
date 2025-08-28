import js from "@eslint/js";
import jsonPlugin from "@eslint/json";
import cssPlugin from "@eslint/css";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [".vscode/**", "node_modules/**", "package-lock.json", "package.json" , "pgdb.js", "app.js", "evaluate.test.js", "judge0"],
  },

  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      js,
    },
    rules: js.configs.recommended.rules,
  },

  {
    files: ["**/*.json"],
    ...jsonPlugin.configs.recommended,
  },

  {
    files: ["**/*.css"],
    ...cssPlugin.configs.recommended,
  },
]);