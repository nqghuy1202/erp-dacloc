import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [{ ignores: ["docs/**", ".next/**", "public/sw.js"] }, ...compat.extends("next/core-web-vitals", "next/typescript")];
