// Áp migration drizzle lên DATABASE_URL (YELLOW: chỉ thêm bảng/cột; không DROP)
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Thiếu DATABASE_URL"); process.exit(1); }
const sql = postgres(url, { ssl: "require", max: 1, prepare: false });
try {
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("migrate: xong");
} catch (e) {
  console.error("migrate: lỗi", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
