import { DatabaseError, Pool, PoolClient } from "pg";
import { config } from "../config";

export const pool = new Pool({ connectionString: config.DATABASE_URL });

const UNIQUE_VIOLATION = "23505";

export const isUniqueViolation = (err: unknown) =>
  err instanceof DatabaseError && err.code === UNIQUE_VIOLATION;

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
