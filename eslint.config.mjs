import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Python virtual environment (third-party, not app code)
    ".venv/**",
    "**/.venv/**",
    // One-off recovery scripts (not part of the app)
    "extract-transcript.mjs",
    "fix-spaces.mjs",
    "restore-from-history.mjs",
  ]),
]);

export default eslintConfig;
