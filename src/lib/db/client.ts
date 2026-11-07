import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { DB } from "./types";

const globalForDb = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  // prepare:false để tương thích pooler Supabase
  return postgres(url, { ssl: "require", max: 5, prepare: false, idle_timeout: 20 });
}

const client = globalForDb.__pg ?? connect();
if (process.env.NODE_ENV !== "production") globalForDb.__pg = client;

export const db: DB = drizzle(client, { schema }) as unknown as DB;
