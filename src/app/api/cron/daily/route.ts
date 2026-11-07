import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { runEscalation } from "@/server/alerts";
import { generateDailyTasks } from "@/server/planning";

/** Vercel Cron (vercel.json). Bảo vệ bằng CRON_SECRET; idempotent nên gọi lặp an toàn. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tasks = await generateDailyTasks(db);
  const escalated = await runEscalation(db);
  return NextResponse.json({ tasks, escalated });
}
