"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { receiveBroodstock } from "@/server/production";

export async function receiveBroodstockAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const b = await receiveBroodstock(db, actor, {
      farmId: num(f, "farmId") ?? 0, speciesId: num(f, "speciesId") ?? 0, source: str(f, "source"), origin: str(f, "origin"),
      line: str(f, "line"), males: num(f, "males") ?? 0, females: num(f, "females") ?? 0, quarantineDoc: str(f, "quarantineDoc"),
    });
    revalidatePath("/san-xuat/bo-me");
    revalidatePath("/xet-nghiem");
    return `Đã tiếp nhận ${b.code} · đã gửi mẫu xét nghiệm`;
  });
}
