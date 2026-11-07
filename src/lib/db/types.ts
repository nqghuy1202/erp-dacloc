import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/** Kiểu DB dùng chung cho postgres-js (prod) và PGlite (test) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = PgDatabase<PgQueryResultHKT, typeof schema, any>;
