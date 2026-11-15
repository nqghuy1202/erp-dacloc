import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [{ ignores: ["docs/**", ".next/**", "public/sw.js", "themes/**", "src/themes/**", "src/astryx-themes.ts"] }, ...compat.extends("next/core-web-vitals", "next/typescript")];
