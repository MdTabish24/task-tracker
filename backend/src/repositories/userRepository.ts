import { pool } from "../db";

interface User {
  id: string;
  name: string;
  email: string;
}

export async function findByEmail(email: string) {
  const { rows } = await pool.query<User & { passwordHash: string }>(
    'SELECT id, name, email, password_hash AS "passwordHash" FROM users WHERE email = $1',
    [email],
  );
  return rows[0];
}

export async function findById(id: string) {
  const { rows } = await pool.query<User>("SELECT id, name, email FROM users WHERE id = $1", [id]);
  return rows[0];
}
