import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), surface: v("surface"), "surface-2": v("surface-2"), line: v("line"),
        fg: v("fg"), "fg-2": v("fg-2"),
        accent: v("accent"), "accent-fg": v("accent-fg"), "accent-soft": v("accent-soft"), "accent-ink": v("accent-ink"),
        ok: v("ok"), "ok-soft": v("ok-soft"), "ok-ink": v("ok-ink"),
        warn: v("warn"), "warn-soft": v("warn-soft"), "warn-ink": v("warn-ink"),
        bad: v("bad"), "bad-soft": v("bad-soft"), "bad-ink": v("bad-ink"),
        band: v("band"), brand: v("brand"), sidebar: v("sidebar"), "sidebar-fg": v("sidebar-fg"), "sidebar-active": v("sidebar-active"),
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { card: "12px", ctl: "8px" },
    },
  },
  plugins: [],
} satisfies Config;
