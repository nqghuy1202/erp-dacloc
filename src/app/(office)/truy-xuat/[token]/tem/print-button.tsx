"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton() {
  return <Button variant="primary" onClick={() => window.print()} className="print:hidden"><Printer size={16} aria-hidden />In</Button>;
}
