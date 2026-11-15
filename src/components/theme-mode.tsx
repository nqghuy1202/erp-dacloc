"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/session";

// Ngữ cảnh sáng/tối — file riêng, KHÔNG import Astryx, để màn hiện trường dùng được mà không kéo theo Theme/i18n Astryx.

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void };
export const ModeCtx = createContext<Ctx>({ mode: "system", setMode: () => {} });
export const useThemeMode = () => useContext(ModeCtx);

/** Chế độ đang hiển thị (system → đọc hệ điều hành sau khi mount). */
export function useEffectiveDark() {
  const { mode } = useThemeMode();
  const [osDark, setOsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setOsDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setOsDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mode === "dark" || (mode === "system" && osDark);
}


