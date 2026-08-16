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
    // Sitenin disindaki tekil alt proje: kendi package.json'i, kendi
    // tsconfig'i, kendi kurallari var. Buradan gezilirse site kurallari
    // (react-hooks, next/*) sunucu betiklerine uygulanmaya calisilir.
    "leadgen/**",
  ]),
]);

export default eslintConfig;
