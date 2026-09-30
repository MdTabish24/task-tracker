import { pool } from "../db";
import type { ListTimeLogsQuery } from "../schemas/timeLog";

interface TimeLog {
  id: string;
  taskId: string;
  startedAt: Date;
  endedAt: Date | null;
}

interface TimeLogEntry extends TimeLog {
  taskTitle: string;
  durationSeconds: number;
}

const COLUMNS = 'id, task_id AS "taskId", started_at AS "startedAt", ended_at AS "endedAt"';

export async function list(userId: string, { from, to, taskId, limit, offset }: ListTimeLogsQuery) {
  const { rows } = await pool.query<TimeLogEntry>(
    `SELECT l.id, l.task_id AS "taskId", t.title AS "taskTitle",
            l.started_at AS "startedAt", l.ended_at AS "endedAt",
            round(extract(epoch FROM coalesce(l.ended_at, now()) - l.started_at))::int AS "durationSeconds"
       FROM time_logs l
       JOIN tasks t ON t.id = l.task_id
      WHERE l.user_id = $1
        AND ($2::timestamptz IS NULL OR l.started_at >= $2)
        AND ($3::timestamptz IS NULL OR l.started_at < $3)
        AND ($4::uuid IS NULL OR l.task_id = $4)
      ORDER BY l.started_at DESC
      LIMIT $5 OFFSET $6`,
    [userId, from, to, taskId, limit, offset],
  );
  return rows;
}

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

// Logs are clipped to [from, to]; a running timer counts up to now().
export async function sumSecondsByTask(userId: string, from: string, to: string) {
  const { rows } = await pool.query<{ taskId: string; title: string; seconds: number }>(
    `SELECT t.id AS "taskId", t.title,
            round(sum(extract(epoch FROM
              least(coalesce(l.ended_at, now()), $3::timestamptz) - greatest(l.started_at, $2::timestamptz)
            )))::int AS seconds
       FROM time_logs l
       JOIN tasks t ON t.id = l.task_id
      WHERE l.user_id = $1
        AND l.started_at < $3::timestamptz
        AND coalesce(l.ended_at, now()) > $2::timestamptz
      GROUP BY t.id, t.title
      ORDER BY seconds DESC`,
    [userId, from, to],
  );
  return rows;
}

// now() comes from the DB so elapsed time uses the same clock as started_at.
export async function findActive(userId: string) {
  const { rows } = await pool.query<TimeLog & { now: Date }>(
    `SELECT ${COLUMNS}, now() FROM time_logs WHERE user_id = $1 AND ended_at IS NULL`,
    [userId],
  );
  return rows[0];
}
