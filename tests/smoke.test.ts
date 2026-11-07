import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { makeWorld } from "./helpers";

describe("schema + RLS", () => {
  it("migration chạy và mọi bảng public bật RLS", async () => {
    const w = await makeWorld();
    const r = await w.db.execute(sql`select count(*)::int as n from pg_tables where schemaname='public' and rowsecurity = false`);
    const rows = (r as unknown as { rows: { n: number }[] }).rows;
    expect(rows[0].n).toBe(0);
    expect(w.tanks.length).toBe(9);
  });
});
