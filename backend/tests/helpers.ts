import request from "supertest";
import { app } from "../src/app";

export const api = () => request(app);

export async function signup(email = "user@example.com") {
  const res = await api().post("/api/auth/signup").send({ name: "User", email, password: "password123" });
  return { token: res.body.token as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}
