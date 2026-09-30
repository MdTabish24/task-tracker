import { pool } from "../db";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/task";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  createdAt: Date;
  updatedAt: Date;
}

const COLUMNS = 'id, title, description, status, created_at AS "createdAt", updated_at AS "updatedAt"';

export async function create(userId: string, { title, description }: CreateTaskInput): Promise<Task> {
  const { rows } = await pool.query<Task>(
    `INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
    [userId, title, description],
  );
  return rows[0]!;
}

export async function findAll(userId: string) {
  const { rows } = await pool.query<Task>(
    `SELECT ${COLUMNS} FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function findById(userId: string, id: string) {
  const { rows } = await pool.query<Task>(`SELECT ${COLUMNS} FROM tasks WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return rows[0];
}

export async function update(userId: string, id: string, { title, description, status }: UpdateTaskInput) {
  const { rows } = await pool.query<Task>(
    `UPDATE tasks
        SET title = COALESCE($3, title),
            description = COALESCE($4, description),
            status = COALESCE($5, status),
            updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING ${COLUMNS}`,
    [id, userId, title, description, status],
  );
  return rows[0];
}

export async function remove(userId: string, id: string) {
  const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount === 1;
}
