import { pool } from "../db";

export interface TimeLog {
  id: string;
  taskId: string;
  startedAt: Date;
  endedAt: Date | null;
}

const COLUMNS = 'id, task_id AS "taskId", started_at AS "startedAt", ended_at AS "endedAt"';

export async function start(userId: string, taskId: string) {
  const { rows } = await pool.query<TimeLog>(
    `INSERT INTO time_logs (user_id, task_id)
     SELECT $1, id FROM tasks WHERE id = $2 AND user_id = $1
     RETURNING ${COLUMNS}`,
    [userId, taskId],
  );
  return rows[0];
}

export async function stopActive(userId: string) {
  const { rows } = await pool.query<TimeLog>(
    `UPDATE time_logs SET ended_at = now() WHERE user_id = $1 AND ended_at IS NULL RETURNING ${COLUMNS}`,
    [userId],
  );
  return rows[0];
}

// now() comes from the DB so elapsed time uses the same clock as started_at.
export async function findActive(userId: string) {
  const { rows } = await pool.query<TimeLog & { now: Date }>(
    `SELECT ${COLUMNS}, now() FROM time_logs WHERE user_id = $1 AND ended_at IS NULL`,
    [userId],
  );
  return rows[0];
}
