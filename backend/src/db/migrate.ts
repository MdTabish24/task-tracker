import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pool, withTransaction } from "./index";

const dir = path.join(__dirname, "../../migrations");

export async function migrate(): Promise<void> {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)");
  const { rows } = await pool.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(file)) continue;
    await withTransaction(async (client) => {
      await client.query(readFileSync(path.join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });
    process.stdout.write(`Applied ${file}\n`);
  }
}

if (require.main === module) {
  migrate().finally(() => pool.end());
}
