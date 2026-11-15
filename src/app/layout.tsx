import type { Metadata, Viewport } from "next";
import "./layers.css"; // đầu tiên: khai thứ tự cascade layer
import "./globals.css";
import { Toaster } from "@/components/ui/client";
import { getLocale, getThemeMode } from "@/lib/session";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "Đắc Lộc ERP", template: "%s · Đắc Lộc ERP" },
  description: "Quản lý sản xuất giống thủy sản và kho — Đắc Lộc",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Đắc Lộc", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#108040" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, mode] = await Promise.all([getLocale(), getThemeMode()]);
  return (
    <html lang={locale} data-theme={mode === "system" ? undefined : mode} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <Providers initialMode={mode} locale={locale}>
          {children}
          <Toaster />
        </Providers>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}` }} />
      </body>
    </html>
  );
}
