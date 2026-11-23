import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/{features,components,providers,lib}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/app", "@/app/**", "**/app/**"], message: "Routes compose modules; shared modules must not import from app." }],
      }],
    },
  },
  {
    files: ["src/{components,providers,lib}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/app", "@/app/**", "**/app/**", "@/features", "@/features/**", "**/features/**"], message: "Shared infrastructure and UI must not depend on route or feature modules." }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
