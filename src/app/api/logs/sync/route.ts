import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getActor } from "@/lib/session";
import { syncLogs } from "@/server/logs";

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const items = (body as { items?: unknown[] })?.items;
  if (!Array.isArray(items) || items.length > 500) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const results = await syncLogs(db, actor, items as never[]);
  return NextResponse.json({ results });
}
