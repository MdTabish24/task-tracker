import { pool, withTransaction } from "../db";

export async function save(name: string, email: string, passwordHash: string, codeHash: string) {
  const { rowCount } = await pool.query(
    `INSERT INTO pending_signups (name, email, password_hash, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, now() + interval '10 minutes')
     ON CONFLICT (email) DO UPDATE SET name = $1, password_hash = $3, code_hash = $4,
       expires_at = now() + interval '10 minutes', sent_at = now(), attempts = 0
     WHERE pending_signups.sent_at < now() - interval '60 seconds'
     RETURNING email`,
    [name, email, passwordHash, codeHash],
  );
  return rowCount === 1;
}

export async function clear(email: string, codeHash: string) {
  await pool.query("DELETE FROM pending_signups WHERE email = $1 AND code_hash = $2", [email, codeHash]);
}

export async function refreshCode(email: string, codeHash: string) {
  const { rowCount } = await pool.query(
    `UPDATE pending_signups SET code_hash = $2, expires_at = now() + interval '10 minutes',
       sent_at = now(), attempts = 0
     WHERE email = $1 AND sent_at < now() - interval '60 seconds' RETURNING email`,
    [email, codeHash],
  );
  return rowCount === 1;
}

export async function consume(email: string, codeHash: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ name: string; passwordHash: string }>(
      `DELETE FROM pending_signups WHERE email = $1 AND code_hash = $2
       AND expires_at > now() AND attempts < 5
       RETURNING name, password_hash AS "passwordHash"`,
      [email, codeHash],
    );
    if (!rows[0]) return null;
    const created = await client.query<{ id: string; name: string; email: string }>(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [rows[0].name, email, rows[0].passwordHash],
    );
    return created.rows[0]!;
  });
}

export async function recordFailedAttempt(email: string) {
  await pool.query(
    "UPDATE pending_signups SET attempts = attempts + 1 WHERE email = $1 AND expires_at > now() AND attempts < 5",
    [email],
  );
}
