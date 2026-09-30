import { describe, expect, it } from "vitest";
import { type Auth, api, createTask, signup } from "./helpers";

const start = (auth: Auth, taskId: string) =>
  api().post(`/api/tasks/${taskId}/timer/start`).set(auth);

describe("timer", () => {
  it("runs one active timer per user, even under concurrent starts", async () => {
    const { auth } = await signup();
    const [a, b] = [await createTask(auth, "A"), await createTask(auth, "B")];

    const statuses = (await Promise.all([start(auth, a), start(auth, b)])).map((res) => res.status);
    expect(statuses.sort()).toEqual([201, 409]);
    expect((await start(auth, a)).status).toBe(409);
  });

  it("reports the active timer, then stops it exactly once", async () => {
    const { auth } = await signup();
    const taskId = await createTask(auth);
    await start(auth, taskId);

    const active = await api().get("/api/timer/active").set(auth);
    expect(active.body.timeLog).toMatchObject({ taskId, endedAt: null });
    expect(Date.parse(active.body.now)).toBeGreaterThanOrEqual(Date.parse(active.body.timeLog.startedAt));

    const stopped = await api().post("/api/timer/stop").set(auth);
    expect(stopped.status).toBe(200);
    expect(stopped.body.endedAt).not.toBeNull();

    expect((await api().post("/api/timer/stop").set(auth)).status).toBe(404);
    expect((await api().get("/api/timer/active").set(auth)).body.timeLog).toBeNull();
    expect((await start(auth, taskId)).status).toBe(201);
  });

  it("keeps timers private to their owner", async () => {
    const alice = await signup("alice@example.com");
    const bob = await signup("bob@example.com");
    const taskId = await createTask(alice.auth);

    expect((await start(bob.auth, taskId)).status).toBe(404);
    await start(alice.auth, taskId);
    expect((await api().get("/api/timer/active").set(bob.auth)).body.timeLog).toBeNull();
    expect((await api().post("/api/timer/stop").set(bob.auth)).status).toBe(404);
  });

  it("drops a running timer when its task is deleted", async () => {
    const { auth } = await signup();
    const taskId = await createTask(auth);
    await start(auth, taskId);

    await api().delete(`/api/tasks/${taskId}`).set(auth);
    expect((await api().get("/api/timer/active").set(auth)).body.timeLog).toBeNull();
  });
});
