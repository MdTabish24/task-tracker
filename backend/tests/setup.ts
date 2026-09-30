import { afterAll, beforeAll, beforeEach } from "vitest";
import { pool } from "../src/db";
import { migrate } from "../src/db/migrate";

beforeAll(migrate);
beforeEach(async () => {
  await pool.query("TRUNCATE users CASCADE");
});
afterAll(() => pool.end());
