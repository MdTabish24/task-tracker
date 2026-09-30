import { describe, expect, it } from "vitest";
import { pool } from "../src/db";
import { type Auth, api, createTask, signup } from "./helpers";

const log = (taskId: string, userId: string, startedAt: string, endedAt: string | null) =>
  pool.query("INSERT INTO time_logs (user_id, task_id, started_at, ended_at) VALUES ($1, $2, $3, $4)", [
    userId,
    taskId,
    startedAt,
    endedAt,
  ]);

const userIdOf = async (auth: Auth) =>
  (await api().get("/api/auth/me").set(auth)).body.id as string;

const summary = (auth: Auth, from: string, to: string) =>
  api().get("/api/summary").query({ from, to }).set(auth);

describe("daily summary", () => {
  it("sums seconds per task, clipped to the day in the caller's timezone", async () => {
    const { auth } = await signup();
    const userId = await userIdOf(auth);
    const [design, review] = [await createTask(auth, "Design"), await createTask(auth, "Review")];

    await log(design, userId, "2026-03-10T03:00:00Z", "2026-03-10T04:00:00Z");
    await log(design, userId, "2026-03-10T06:00:00Z", "2026-03-10T06:30:00Z");
    await log(review, userId, "2026-03-09T18:00:00Z", "2026-03-09T19:00:00Z");
    await log(review, userId, "2026-03-10T18:00:00Z", "2026-03-10T19:00:00Z");

    // The day 2026-03-10 in UTC+05:30 runs from 2026-03-09T18:30Z to 2026-03-10T18:30Z.
    const res = await summary(auth, "2026-03-10T00:00:00+05:30", "2026-03-11T00:00:00+05:30");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalSeconds: 9000,
      tasks: [
        { taskId: design, title: "Design", seconds: 5400 },
        { taskId: review, title: "Review", seconds: 3600 },
      ],
    });
  });

  it("counts a running timer up to now and ignores other users", async () => {
    const alice = await signup("alice@example.com");
    const bob = await signup("bob@example.com");
    const task = await createTask(alice.auth);
    const bobTask = await createTask(bob.auth);
    await pool.query(
      "INSERT INTO time_logs (user_id, task_id, started_at) VALUES ($1, $2, now() - interval '5 minutes')",
      [await userIdOf(alice.auth), task],
    );
    await log(bobTask, await userIdOf(bob.auth), "2026-03-10T03:00:00Z", "2026-03-10T04:00:00Z");

    const from = new Date(Date.now() - 864e5).toISOString();
    const to = new Date(Date.now() + 864e5).toISOString();
    const res = await summary(alice.auth, from, to);

    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.totalSeconds).toBeGreaterThanOrEqual(300);
    expect(res.body.totalSeconds).toBeLessThan(310);
  });

  it("rejects a missing or inverted range", async () => {
    const { auth } = await signup();
    expect((await api().get("/api/summary").set(auth)).status).toBe(400);
    expect((await summary(auth, "2026-03-11T00:00:00Z", "2026-03-10T00:00:00Z")).status).toBe(400);
  });
});
