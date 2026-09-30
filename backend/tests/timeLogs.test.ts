import { describe, expect, it } from "vitest";
import { type Auth, api, createTask, log, signup, userIdOf } from "./helpers";

const list = (auth: Auth, query: object = {}) => api().get("/api/time-logs").query(query).set(auth);

describe("time logs", () => {
  it("lists only the caller's logs, newest first, with derived durations", async () => {
    const alice = await signup("alice@example.com");
    const bob = await signup("bob@example.com");
    const [aliceId, bobId] = [await userIdOf(alice.auth), await userIdOf(bob.auth)];
    const [report, review] = [await createTask(alice.auth, "Report"), await createTask(alice.auth, "Review")];
    const bobTask = await createTask(bob.auth, "Bob's task");

    await log(report, aliceId, "2026-03-10T09:00:00Z", "2026-03-10T10:00:00Z");
    await log(review, aliceId, "2026-03-10T11:00:00Z", "2026-03-10T11:30:00Z");
    await log(bobTask, bobId, "2026-03-10T12:00:00Z", "2026-03-10T13:00:00Z");

    const res = await list(alice.auth);
    expect(res.status).toBe(200);
    expect(res.body.map((entry: { taskTitle: string }) => entry.taskTitle)).toEqual(["Review", "Report"]);
    expect(res.body.map((entry: { durationSeconds: number }) => entry.durationSeconds)).toEqual([1800, 3600]);

    expect((await list(bob.auth)).body).toHaveLength(1);
    expect((await list(bob.auth, { taskId: report })).body).toEqual([]);
  });

  it("returns a running timer with endedAt null and filters by range and page", async () => {
    const { auth } = await signup();
    const userId = await userIdOf(auth);
    const task = await createTask(auth);
    await log(task, userId, "2026-03-09T09:00:00Z", "2026-03-09T10:00:00Z");
    await log(task, userId, "2026-03-10T09:00:00Z", "2026-03-10T10:00:00Z");
    await api().post(`/api/tasks/${task}/timer/start`).set(auth);

    const all = (await list(auth)).body;
    expect(all).toHaveLength(3);
    expect(all[0]).toMatchObject({ endedAt: null, taskId: task });
    expect(all[0].durationSeconds).toBeGreaterThanOrEqual(0);

    const day = await list(auth, { from: "2026-03-10T00:00:00Z", to: "2026-03-11T00:00:00Z" });
    expect(day.body).toHaveLength(1);
    expect((await list(auth, { limit: 1, offset: 1 })).body[0].id).toBe(all[1].id);
  });

  it("rejects invalid query parameters", async () => {
    const { auth } = await signup();
    expect((await list(auth, { limit: 500 })).status).toBe(400);
    expect((await list(auth, { taskId: "nope" })).status).toBe(400);
    expect((await api().get("/api/time-logs")).status).toBe(401);
  });
});
