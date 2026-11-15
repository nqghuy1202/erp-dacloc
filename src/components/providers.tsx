"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import viVN from "@astryxdesign/core/locales/vi-VN.generated.js";
import { themes, defaultThemeSlug } from "@/astryx-themes";
import type { ThemeMode } from "@/lib/session";
import { ModeCtx } from "./theme-mode";

/** Gốc giao diện: theme Astryx `dacloc` + link Next. Chế độ sáng/tối lưu ở cookie `theme` (server đọc lại khi render). */
export function Providers({ initialMode, locale, children }: { initialMode: ThemeMode; locale: "vi" | "en"; children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    // 1 năm; "system" xoá lựa chọn
    document.cookie = m === "system" ? "theme=; path=/; max-age=0; samesite=lax" : `theme=${m}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  // Nút sáng/tối của PWA hiện trường phát sự kiện thay vì dùng ngữ cảnh (giữ bundle hiện trường nhẹ — field/client.tsx)
  useEffect(() => {
    const on = (e: Event) => { const m = (e as CustomEvent).detail; if (m === "light" || m === "dark") setMode(m); };
    window.addEventListener("dacloc:theme", on);
    return () => window.removeEventListener("dacloc:theme", on);
  }, [setMode]);
  return (
    <ModeCtx.Provider value={{ mode, setMode }}>
      <Theme theme={themes[defaultThemeSlug]} mode={mode}>
        <InternationalizationProvider locale={locale === "vi" ? "vi-VN" : "en"} messages={{ "vi-VN": viVN }}>
          <LinkProvider component={Link}>{children}</LinkProvider>
        </InternationalizationProvider>
      </Theme>
    </ModeCtx.Provider>
  );
}
