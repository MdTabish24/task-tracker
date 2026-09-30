import { describe, expect, it } from "vitest";
import { api, signup } from "./helpers";

const credentials = { email: "user@example.com", password: "password123" };

describe("auth", () => {
  it("signs up, then logs in with the same credentials", async () => {
    const created = await api().post("/api/auth/signup").send({ name: "User", ...credentials });
    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({ name: "User", email: credentials.email });
    expect(created.body.user.passwordHash).toBeUndefined();

    const login = await api().post("/api/auth/login").send(credentials);
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  it("rejects a duplicate email with 409", async () => {
    await signup();
    const res = await api().post("/api/auth/signup").send({ name: "Other", ...credentials });
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400 and wrong credentials with 401", async () => {
    await signup();
    const invalid = await api().post("/api/auth/signup").send({ name: "", email: "nope", password: "short" });
    expect(invalid.status).toBe(400);
    expect(Object.keys(invalid.body.error.details)).toEqual(["name", "email", "password"]);

    const wrong = await api().post("/api/auth/login").send({ ...credentials, password: "wrong-password" });
    expect(wrong.status).toBe(401);
  });

  it("protects /me with a valid bearer token", async () => {
    const { auth } = await signup();
    const ok = await api().get("/api/auth/me").set(auth);
    expect(ok.status).toBe(200);
    expect(ok.body.email).toBe(credentials.email);

    expect((await api().get("/api/auth/me")).status).toBe(401);
    expect((await api().get("/api/auth/me").set("Authorization", "Bearer garbage")).status).toBe(401);
  });
});
