import request from "supertest";
import { app } from "../src/app";

export const api = () => request(app);

export type Auth = { Authorization: string };

export async function createTask(auth: Auth, title = "Task"): Promise<string> {
  const res = await api().post("/api/tasks").set(auth).send({ title });
  return res.body.id;
}

export async function signup(email = "user@example.com") {
  const res = await api().post("/api/auth/signup").send({ name: "User", email, password: "password123" });
  return { token: res.body.token as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}
