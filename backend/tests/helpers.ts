import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db";

export const api = () => request(app);

export type Auth = { Authorization: string };

export async function createTask(auth: Auth, title = "Task"): Promise<string> {
  const res = await api().post("/api/tasks").set(auth).send({ title });
  return res.body.id;
}

export async function signup(email = "user@example.com") {
  await api().post("/api/auth/signup").send({ name: "User", email, password: "password123" });
  const res = await api().post("/api/auth/verify").send({ email, code: process.env.TEST_VERIFICATION_CODE });
  return { token: res.body.token as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}

export const userIdOf = async (auth: Auth) => (await api().get("/api/auth/me").set(auth)).body.id as string;

export const log = (taskId: string, userId: string, startedAt: string, endedAt: string | null) =>
  pool.query("INSERT INTO time_logs (user_id, task_id, started_at, ended_at) VALUES ($1, $2, $3, $4)", [
    userId,
    taskId,
    startedAt,
    endedAt,
  ]);
