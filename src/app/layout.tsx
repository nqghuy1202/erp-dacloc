import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/client";
import { getLocale } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Đắc Lộc ERP", template: "%s · Đắc Lộc ERP" },
  description: "Quản lý sản xuất giống thủy sản và kho — Đắc Lộc",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Đắc Lộc", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0f766e" };

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}` }} />
      </body>
    </html>
  );
}
