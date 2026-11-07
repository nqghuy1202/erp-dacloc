"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-ctl border border-accent bg-accent px-4 font-medium text-accent-fg hover:brightness-110 print:hidden">
      <Printer size={16} aria-hidden />In
    </button>
  );
}
